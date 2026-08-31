import logging
import stripe
from django.conf import settings
from django.utils import timezone

from ..models import Payment

logger = logging.getLogger('payments')


class ReconciliationService:
    """Handles payment reconciliation between our database and gateways."""

    def reconcile_stripe(self, days_back=1):
        """
        Check Stripe for payments that may have been missed.
        Returns summary of reconciliation results.
        """
        try:
            stripe.api_key = settings.STRIPE_SECRET_KEY

            # Get all processing payments older than specified days
            cutoff_time = timezone.now() - timezone.timedelta(days=days_back)

            stuck_payments = Payment.objects.filter(
                method=Payment.PaymentMethod.STRIPE,
                status=Payment.PaymentStatus.PROCESSING,
                updated_at__lt=cutoff_time,
            )

            reconciled_count = 0
            still_pending = []

            for payment in stuck_payments:
                if payment.gateway_session_id:
                    try:
                        session = stripe.checkout.Session.retrieve(
                            payment.gateway_session_id
                        )

                        if session.payment_status == 'paid':
                            payment.status = Payment.PaymentStatus.COMPLETED
                            payment.gateway_payment_id = session.payment_intent
                            payment.webhook_received_at = timezone.now()
                            payment.save()
                            reconciled_count += 1
                            logger.info(f"Reconciled Stripe payment for order {payment.order_id}")
                        elif session.payment_status == 'unpaid':
                            still_pending.append(payment.order_id)
                        elif session.payment_status == 'expired':
                            payment.status = Payment.PaymentStatus.FAILED
                            payment.save()
                            reconciled_count += 1

                    except stripe.error.StripeError as e:
                        logger.error(f"Stripe reconciliation error for order {payment.order_id}: {str(e)}")
                        still_pending.append(payment.order_id)

            return {
                'total_checked': stuck_payments.count(),
                'reconciled': reconciled_count,
                'still_pending': still_pending,
            }

        except Exception as e:
            logger.error(f"Stripe reconciliation failed: {str(e)}")
            raise

    def reconcile_razorpay(self, days_back=1):
        """
        Check Razorpay for payments that may have been missed.
        Returns summary of reconciliation results.
        """
        try:
            cutoff_time = timezone.now() - timezone.timedelta(days=days_back)

            stuck_payments = Payment.objects.filter(
                method=Payment.PaymentMethod.RAZORPAY,
                status=Payment.PaymentStatus.PROCESSING,
                updated_at__lt=cutoff_time,
            )

            reconciled_count = 0
            still_pending = []

            # For Razorpay, we can only check if we have the order ID
            # In production, you'd use Razorpay's Order API to verify status
            # For now, we log that these need manual review

            for payment in stuck_payments:
                still_pending.append(payment.order_id)
                logger.warning(
                    f"Razorpay payment for order {payment.order_id} "
                    f"has been processing for over {days_back} day(s) - manual review needed"
                )

            return {
                'total_checked': stuck_payments.count(),
                'reconciled': reconciled_count,
                'still_pending': still_pending,
            }

        except Exception as e:
            logger.error(f"Razorpay reconciliation failed: {str(e)}")
            raise