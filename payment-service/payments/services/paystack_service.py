import logging
import requests
from django.conf import settings

logger = logging.getLogger('payments')


class PaystackService:
    """Handles Paystack payment operations."""

    BASE_URL = 'https://api.paystack.co'

    def __init__(self):
        self.secret_key = settings.PAYSTACK_SECRET_KEY
        self.headers = {
            'Authorization': f'Bearer {self.secret_key}',
            'Content-Type': 'application/json',
        }

    def create_payment_session(self, payment):
        """
        Create a Paystack transaction.
        Returns (session_id, client_secret, payment_link) or raises exception.
        """
        try:
            # Paystack requires amount in kobo (smallest currency unit)
            amount_in_kobo = int(payment.amount * 100)

            payload = {
                'email': f'customer@order-{payment.order_id}.com',  # Required by Paystack
                'amount': amount_in_kobo,
                'currency': payment.currency.upper(),
                'reference': str(payment.id),
                'callback_url': f'{settings.NODE_BACKEND_URL}/payment/callback',
                'metadata': {
                    'order_id': payment.order_id,
                    'payment_id': str(payment.id),
                },
            }

            response = requests.post(
                f'{self.BASE_URL}/transaction/initialize',
                json=payload,
                headers=self.headers,
                timeout=10,
            )
            response.raise_for_status()
            data = response.json()

            if not data.get('status'):
                raise Exception(data.get('message', 'Paystack initialization failed'))

            logger.info(f"Paystack session created for order {payment.order_id}: {data['data']['reference']}")

            return {
                'session_id': data['data']['reference'],
                'client_secret': None,
                'payment_link': data['data']['authorization_url'],
            }

        except requests.exceptions.RequestException as e:
            logger.error(f"Paystack request error for order {payment.order_id}: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Paystack error for order {payment.order_id}: {str(e)}")
            raise