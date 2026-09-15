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
            # Generate a clean tx_ref (no dashes, no uppercase)
            tx_ref = f'flw-{str(payment.id).replace("-", "")[:16]}'

            payload = {
                'tx_ref': tx_ref,
                'amount': str(payment.amount),
                'currency': payment.currency.upper(),
                'redirect_url': 'https://example.com/payment/callback',
                'payment_options': 'card',
                'customer': {
                    'email': 'customer@example.com',
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

            # Log for debugging
            logger.info(f"Flutterwave response status: {response.status_code}")
            logger.info(f"Flutterwave response body: {response.text}")

            data = response.json()

            if data.get('status') != 'success':
                error_msg = data.get('message', 'Flutterwave initialization failed')
                logger.error(f"Flutterwave API error: {error_msg}")
                raise Exception(error_msg)

            # Safely extract fields
            response_data = data.get('data', {})
            tx_ref_response = response_data.get('tx_ref', tx_ref)
            payment_link = response_data.get('link')

            if not payment_link:
                raise Exception('Flutterwave did not return a payment link')

            logger.info(f"Flutterwave session created for order {payment.order_id}: {tx_ref_response}")

            return {
                'session_id': tx_ref_response,
                'client_secret': None,
                'payment_link': payment_link,
            }

        except requests.exceptions.RequestException as e:
            logger.error(f"Flutterwave request error for order {payment.order_id}: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Flutterwave error for order {payment.order_id}: {str(e)}")
            raise