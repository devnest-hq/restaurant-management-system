import logging
import razorpay
from django.conf import settings

logger = logging.getLogger('payments')


class RazorpayService:
    """Handles Razorpay payment operations."""

    def __init__(self):
        self.client = razorpay.Client(
            auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
        )

    def create_payment_session(self, payment):
        try:
            # Razorpay requires amount in paise (smallest currency unit)
            amount_in_paise = int(payment.amount * 100)

            razorpay_order = self.client.order.create({
                'amount': amount_in_paise,
                'currency': payment.currency.upper(),
                'receipt': f"order_{payment.order_id}",
                'notes': {
                    'order_id': payment.order_id,
                    'payment_id': str(payment.id),
                },
            })

            logger.info(f"Razorpay order created for order {payment.order_id}: {razorpay_order['id']}")

            return {
                'session_id': razorpay_order['id'],
                'client_secret': None,
                'payment_link': None,  # Razorpay uses client-side checkout, not a link
            }

        except Exception as e:
            logger.error(f"Razorpay error for order {payment.order_id}: {str(e)}")
            raise