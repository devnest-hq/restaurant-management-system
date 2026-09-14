import json
import hmac
import hashlib
import logging
import stripe
from django.conf import settings
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response

from .services.webhook_service import WebhookService

logger = logging.getLogger('payments')


@csrf_exempt
@require_POST
def stripe_webhook(request):
    """Webhook endpoint for Stripe events."""
    payload = request.body
    sig_header = request.headers.get('Stripe-Signature')

    try:
        stripe.api_key = settings.STRIPE_SECRET_KEY
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        logger.error("Invalid Stripe webhook payload")
        return HttpResponse(status=400)
    except stripe.error.SignatureVerificationError:
        logger.error("Invalid Stripe webhook signature")
        return HttpResponse(status=400)

    event_type = event['type']
    event_data = {}

    if event_type == 'checkout.session.completed':
        session = event['data']['object']
        event_data = {
            'order_id': session.get('metadata', {}).get('order_id'),
            'gateway_payment_id': session.get('payment_intent'),
        }
    elif event_type == 'checkout.session.expired':
        session = event['data']['object']
        event_data = {
            'order_id': session.get('metadata', {}).get('order_id'),
        }
    elif event_type == 'charge.refunded':
        charge = event['data']['object']
        event_data = {
            'order_id': charge.get('metadata', {}).get('order_id'),
            'refund_id': charge.get('id'),
            'refund_amount': charge.get('amount_refunded', 0) / 100,
        }
    elif event_type == 'charge.dispute.created':
        dispute = event['data']['object']
        event_data = {
            'order_id': dispute.get('metadata', {}).get('order_id'),
            'dispute_id': dispute.get('id'),
        }

    webhook_service = WebhookService()
    webhook_service.handle_stripe_event(event_type, event_data)

    return HttpResponse(status=200)


class PaystackWebhookView(APIView):
    """Webhook endpoint for Paystack events."""
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        payload = request.body
        signature = request.headers.get('X-Paystack-Signature')

        # Verify signature
        computed_signature = hmac.new(
            settings.PAYSTACK_SECRET_KEY.encode('utf-8'),
            payload,
            hashlib.sha512,
        ).hexdigest()

        if signature != computed_signature:
            logger.error("Paystack webhook signature verification failed")
            return Response(
                {'success': False, 'error': 'Invalid signature'},
                status=status.HTTP_400_BAD_REQUEST
            )

        event = json.loads(payload)
        event_type = event.get('event')
        event_data_raw = event.get('data', {})
        metadata = event_data_raw.get('metadata', {})

        event_data = {
            'order_id': metadata.get('order_id'),
            'gateway_payment_id': event_data_raw.get('reference'),
        }

        if event_type == 'refund.processed':
            event_data['refund_id'] = str(event_data_raw.get('id'))
            event_data['refund_amount'] = event_data_raw.get('amount', 0) / 100

        webhook_service = WebhookService()
        webhook_service.handle_paystack_event(event_type, event_data)

        return Response({'success': True}, status=status.HTTP_200_OK)


class FlutterwaveWebhookView(APIView):
    """Webhook endpoint for Flutterwave events."""
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        signature = request.headers.get('verif-hash')

        if signature != settings.FLUTTERWAVE_WEBHOOK_SECRET:
            logger.error("Flutterwave webhook signature verification failed")
            return Response(
                {'success': False, 'error': 'Invalid signature'},
                status=status.HTTP_400_BAD_REQUEST
            )

        event = request.data
        event_type = event.get('event')
        event_data_raw = event.get('data', {})
        meta = event_data_raw.get('meta', {})

        event_data = {
            'order_id': meta.get('order_id'),
            'gateway_payment_id': str(event_data_raw.get('id')),
        }

        if event_type == 'refund.completed':
            event_data['refund_id'] = str(event_data_raw.get('id'))
            event_data['refund_amount'] = event_data_raw.get('amount', 0)

        webhook_service = WebhookService()
        webhook_service.handle_flutterwave_event(event_type, event_data)

        return Response({'success': True}, status=status.HTTP_200_OK)