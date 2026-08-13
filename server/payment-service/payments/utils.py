import logging
import json
import requests
from django.conf import settings
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger('payments')


def custom_exception_handler(exc, context):
    """Custom exception handler for consistent error responses."""
    response = exception_handler(exc, context)

    if response is None:
        return None

    if isinstance(response.data, dict):
        error_detail = response.data.get('detail', 'An error occurred')
    elif isinstance(response.data, list):
        error_detail = response.data[0] if response.data else 'An error occurred'
    else:
        error_detail = str(response.data)

    return Response(
        {
            'success': False,
            'error': {
                'code': response.status_code,
                'message': error_detail,
            }
        },
        status=response.status_code
    )


def notify_node_backend(order_id, payment_status, payment_data):
    """Notify the Node.js backend about payment status changes."""
    url = f"{settings.NODE_BACKEND_URL}/api/orders/{order_id}/payment-confirmed"
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f"Bearer {settings.NODE_BACKEND_API_KEY}",
    }
    payload = {
        'orderId': order_id,
        'paymentStatus': payment_status,
        'paymentData': payment_data,
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        logger.info(f"Node.js notified for order {order_id}: {payment_status}")
        return True
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to notify Node.js for order {order_id}: {str(e)}")
        return False


def log_payment_event(payment, event_type, event_data):
    """Log payment events for audit trail."""
    logger.info(
        f"Payment Event | Type: {event_type} | "
        f"Order: {payment.order_id} | "
        f"Data: {json.dumps(event_data, default=str)}"
    )
