import logging
import requests
from django.conf import settings

logger = logging.getLogger('payments')


class FlutterwaveService:
    """Handles Flutterwave payment operations."""

    BASE_URL = 'https://api.flutterwave.com/v3'

    def __init__(self):
        self.secret_key = settings.FLUTTERWAVE_SECRET_KEY
        self.headers = {
            'Authorization': f'Bearer {self.secret_key}',
            'Content-Type': 'application/json',
        }

    def create_payment_session(self, payment):
        """
        Create a Flutterwave payment link.
        Returns (session_id, client_secret, payment_link) or raises exception.
        """
        try:
            payload = {
                'tx_ref': str(payment.id),
                'amount': str(payment.amount),
                'currency': payment.currency.upper(),
                'redirect_url': f'{settings.NODE_BACKEND_URL}/payment/callback',
                'customer': {
                    'email': f'customer@order-{payment.order_id}.com',
                    'name': f'Order {payment.order_id}',
                },
                'customizations': {
                    'title': f'Order {payment.order_id}',
                    'description': f'Payment for order {payment.order_id}',
                },
                'meta': {
                    'order_id': payment.order_id,
                    'payment_id': str(payment.id),
                },
            }

            response = requests.post(
                f'{self.BASE_URL}/payments',
                json=payload,
                headers=self.headers,
                timeout=10,
            )
            response.raise_for_status()
            data = response.json()

            if data.get('status') != 'success':
                raise Exception(data.get('message', 'Flutterwave initialization failed'))

            logger.info(f"Flutterwave session created for order {payment.order_id}: {data['data']['tx_ref']}")

            return {
                'session_id': data['data']['tx_ref'],
                'client_secret': None,
                'payment_link': data['data']['link'],
            }

        except requests.exceptions.RequestException as e:
            logger.error(f"Flutterwave request error for order {payment.order_id}: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Flutterwave error for order {payment.order_id}: {str(e)}")
            raise