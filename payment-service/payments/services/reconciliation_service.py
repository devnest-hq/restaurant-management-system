import logging
import stripe
from django.conf import settings
from django.utils import timezone

from ..models import Payment

logger = logging.getLogger('payments')


class ReconciliationService:
    """Handles payment reconciliation between our database and gateways."""

    def reconcile_stripe(self, days_back=1):
        """Check Stripe for payments that may have been missed."""
        try:
            stripe.api_key = settings.STRIPE_SECRET_KEY
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
                        session = stripe.checkout.Session.retrieve(payment.gateway_session_id)
                        if session.payment_status == 'paid':
                            payment.status = Payment.PaymentStatus.COMPLETED
                            payment.gateway_payment_id = session.payment_intent
                            payment.webhook_received_at = timezone.now()
                            payment.save()
                            reconciled_count += 1
                        elif session.payment_status == 'expired':
                            payment.status = Payment.PaymentStatus.FAILED
                            payment.save()
                            reconciled_count += 1
                        else:
                            still_pending.append(payment.order_id)
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

    def reconcile_paystack(self, days_back=1):
        """Check Paystack for payments that may have been missed."""
        try:
            cutoff_time = timezone.now() - timezone.timedelta(days=days_back)

            stuck_payments = Payment.objects.filter(
                method=Payment.PaymentMethod.PAYSTACK,
                status=Payment.PaymentStatus.PROCESSING,
                updated_at__lt=cutoff_time,
            )

            still_pending = [p.order_id for p in stuck_payments]

            for order_id in still_pending:
                logger.warning(
                    f"Paystack payment for order {order_id} has been processing "
                    f"for over {days_back} day(s) - manual review needed"
                )

            return {
                'total_checked': stuck_payments.count(),
                'reconciled': 0,
                'still_pending': still_pending,
            }

        except Exception as e:
            logger.error(f"Paystack reconciliation failed: {str(e)}")
            raise

    def reconcile_flutterwave(self, days_back=1):
        """Check Flutterwave for payments that may have been missed."""
        try:
            cutoff_time = timezone.now() - timezone.timedelta(days=days_back)

            stuck_payments = Payment.objects.filter(
                method=Payment.PaymentMethod.FLUTTERWAVE,
                status=Payment.PaymentStatus.PROCESSING,
                updated_at__lt=cutoff_time,
            )

            still_pending = [p.order_id for p in stuck_payments]

            for order_id in still_pending:
                logger.warning(
                    f"Flutterwave payment for order {order_id} has been processing "
                    f"over {days_back} day(s) - manual review needed"
                )

            return {
                'total_checked': stuck_payments.count(),
                'reconciled': 0,
                'still_pending': still_pending,
            }

        except Exception as e:
            logger.error(f"Flutterwave reconciliation failed: {str(e)}")
            raise