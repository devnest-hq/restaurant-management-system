import logging
import stripe
import razorpay
from django.conf import settings
from django.utils import timezone

from ..models import Payment, Refund
from ..utils import notify_node_backend, log_payment_event

logger = logging.getLogger('payments')


class RefundService:
    """Handles refund operations for Stripe and Razorpay."""

    def process_refund(self, payment, refund_amount=None, reason=None):
        """
        Process a refund for the given payment.
        If refund_amount is None, full refund is processed.
        Returns refund details or raises exception.
        """
        amount_to_refund = refund_amount if refund_amount else payment.amount

        # Create refund record
        refund = Refund.objects.create(
            payment=payment,
            refund_amount=amount_to_refund,
            currency=payment.currency,
            status=Refund.RefundStatus.PROCESSING,
            reason=reason,
        )

        try:
            if payment.method == Payment.PaymentMethod.STRIPE:
                refund_data = self._refund_stripe(payment, amount_to_refund)
            elif payment.method == Payment.PaymentMethod.RAZORPAY:
                refund_data = self._refund_razorpay(payment, amount_to_refund)
            else:
                raise ValueError(f"Unsupported payment method: {payment.method}")

            # Update refund record on success
            refund.gateway_refund_id = refund_data['refund_id']
            refund.status = Refund.RefundStatus.COMPLETED
            refund.save()

            # Update payment record
            if amount_to_refund < payment.amount:
                payment.status = Payment.PaymentStatus.PARTIALLY_REFUNDED
            else:
                payment.status = Payment.PaymentStatus.REFUNDED

            payment.refund_id = refund_data['refund_id']
            payment.refund_amount = amount_to_refund
            payment.save()

            log_payment_event(
                payment,
                'REFUND_PROCESSED',
                {
                    'order_id': payment.order_id,
                    'refund_id': refund_data['refund_id'],
                    'refund_amount': str(amount_to_refund),
                    'status': payment.status,
                }
            )

            return refund_data

        except Exception as e:
            # Mark refund as failed
            refund.status = Refund.RefundStatus.FAILED
            refund.error_message = str(e)
            refund.save()

            logger.error(f"Refund failed for order {payment.order_id}: {str(e)}")
            raise

    def _refund_stripe(self, payment, amount_to_refund):
        """Process refund via Stripe."""
        try:
            stripe.api_key = settings.STRIPE_SECRET_KEY

            refund = stripe.Refund.create(
                payment_intent=payment.gateway_payment_id,
                amount=int(amount_to_refund * 100),  # Convert to cents
            )

            logger.info(f"Stripe refund created for order {payment.order_id}: {refund.id}")

            return {
                'refund_id': refund.id,
                'refund_amount': amount_to_refund,
                'status': refund.status,
            }

        except stripe.error.StripeError as e:
            logger.error(f"Stripe refund error for order {payment.order_id}: {str(e)}")
            raise

    def _refund_razorpay(self, payment, amount_to_refund):
        """Process refund via Razorpay."""
        try:
            client = razorpay.Client(
                auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
            )

            refund = client.payment.refund(
                payment.gateway_payment_id,
                {
                    'amount': int(amount_to_refund * 100),  # Convert to paise
                }
            )

            logger.info(f"Razorpay refund created for order {payment.order_id}: {refund['id']}")

            return {
                'refund_id': refund['id'],
                'refund_amount': amount_to_refund,
                'status': refund.get('status', 'processed'),
            }

        except Exception as e:
            logger.error(f"Razorpay refund error for order {payment.order_id}: {str(e)}")
            raise