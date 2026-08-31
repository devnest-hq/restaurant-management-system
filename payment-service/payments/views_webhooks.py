import json
import logging
import stripe
import razorpay
from django.conf import settings
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Payment
from .services.webhook_service import WebhookService

logger = logging.getLogger('payments')


@csrf_exempt
@require_POST
def stripe_webhook(request):
    """
    Webhook endpoint for Stripe events.
    Stripe sends POST requests with a JSON payload.
    """
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

    # Extract relevant data
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
            'refund_amount': charge.get('amount_refunded', 0) / 100,  # Convert cents to dollars
        }
    elif event_type == 'charge.dispute.created':
        dispute = event['data']['object']
        event_data = {
            'order_id': dispute.get('metadata', {}).get('order_id'),
            'dispute_id': dispute.get('id'),
        }

    # Process the event
    webhook_service = WebhookService()
    webhook_service.handle_stripe_event(event_type, event_data)

    return HttpResponse(status=200)


class RazorpayWebhookView(APIView):
    """
    Webhook endpoint for Razorpay events.
    Razorpay sends POST requests with a JSON payload.
    """
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        payload = request.body
        signature = request.headers.get('X-Razorpay-Signature')

        try:
            client = razorpay.Client(
                auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
            )
            client.utility.verify_webhook_signature(
                payload.decode('utf-8'),
                signature,
                settings.RAZORPAY_WEBHOOK_SECRET
            )
        except Exception as e:
            logger.error(f"Razorpay webhook signature verification failed: {str(e)}")
            return Response(
                {'success': False, 'error': 'Invalid signature'},
                status=status.HTTP_400_BAD_REQUEST
            )

        event = json.loads(payload)
        event_type = event.get('event')
        event_data = {}

        if event_type == 'payment.captured':
            payment_entity = event.get('payload', {}).get('payment', {}).get('entity', {})
            event_data = {
                'order_id': payment_entity.get('notes', {}).get('order_id'),
                'gateway_payment_id': payment_entity.get('id'),
            }
        elif event_type == 'payment.failed':
            payment_entity = event.get('payload', {}).get('payment', {}).get('entity', {})
            event_data = {
                'order_id': payment_entity.get('notes', {}).get('order_id'),
            }
        elif event_type == 'refund.processed':
            refund_entity = event.get('payload', {}).get('refund', {}).get('entity', {})
            event_data = {
                'order_id': refund_entity.get('notes', {}).get('order_id'),
                'refund_id': refund_entity.get('id'),
                'refund_amount': refund_entity.get('amount', 0) / 100,  # Convert paise to rupees
            }
        elif event_type == 'refund.failed':
            refund_entity = event.get('payload', {}).get('refund', {}).get('entity', {})
            event_data = {
                'order_id': refund_entity.get('notes', {}).get('order_id'),
            }

        # Process the event
        webhook_service = WebhookService()
        webhook_service.handle_razorpay_event(event_type, event_data)

        return Response({'success': True}, status=status.HTTP_200_OK)