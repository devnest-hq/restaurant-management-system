import logging
import stripe
import razorpay
from django.conf import settings
from django.utils import timezone

from ..models import Payment
from ..utils import notify_node_backend, log_payment_event

logger = logging.getLogger('payments')


class RefundService:
    def process_refund(self, payment, refund_amount=None):
        """
        Process a refund for the given payment.
        If refund_amount is None, full refund is processed.
        Returns refund details or raises exception.
        """
        amount_to_refund = refund_amount if refund_amount else payment.amount

        if payment.method == Payment.PaymentMethod.STRIPE:
            return self._refund_stripe(payment, amount_to_refund)
        elif payment.method == Payment.PaymentMethod.RAZORPAY:
            return self._refund_razorpay(payment, amount_to_refund)
        else:
            raise ValueError(f"Unsupported payment method: {payment.method}")

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