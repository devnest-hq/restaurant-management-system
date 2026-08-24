import logging
import time
import requests
from django.conf import settings

logger = logging.getLogger('payments')


class NotificationService:
    """Handles notifications to the Node.js backend with retry logic."""

    MAX_RETRIES = 3
    RETRY_DELAY = 2  # seconds between retries

    def __init__(self):
        self.base_url = settings.NODE_BACKEND_URL.rstrip('/')
        self.api_key = settings.NODE_BACKEND_API_KEY

    def notify_payment_status(self, order_id, payment_status, payment_data):
        """
        Notify Node.js backend about payment status change.
        Retries up to MAX_RETRIES times with exponential backoff.
        Returns True if notification succeeded, False otherwise.
        """
        url = f"{self.base_url}/api/orders/{order_id}/payment-confirmed"
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f"Bearer {self.api_key}",
        }
        payload = {
            'orderId': order_id,
            'paymentStatus': payment_status,
            'paymentData': payment_data,
        }

        for attempt in range(1, self.MAX_RETRIES + 1):
            try:
                response = requests.post(url, json=payload, headers=headers, timeout=10)
                response.raise_for_status()

                logger.info(
                    f"Node.js notified successfully for order {order_id} "
                    f"(attempt {attempt}/{self.MAX_RETRIES})"
                )
                return True

            except requests.exceptions.Timeout:
                logger.warning(
                    f"Timeout notifying Node.js for order {order_id} "
                    f"(attempt {attempt}/{self.MAX_RETRIES})"
                )

            except requests.exceptions.ConnectionError:
                logger.warning(
                    f"Connection error notifying Node.js for order {order_id} "
                    f"(attempt {attempt}/{self.MAX_RETRIES})"
                )

            except requests.exceptions.RequestException as e:
                logger.warning(
                    f"Request error notifying Node.js for order {order_id} "
                    f"(attempt {attempt}/{self.MAX_RETRIES}): {str(e)}"
                )

            # Don't wait after the last attempt
            if attempt < self.MAX_RETRIES:
                wait_time = self.RETRY_DELAY * attempt  # Exponential backoff
                logger.info(f"Retrying in {wait_time} seconds...")
                time.sleep(wait_time)

        logger.error(
            f"Failed to notify Node.js for order {order_id} "
            f"after {self.MAX_RETRIES} attempts"
        )
        return False