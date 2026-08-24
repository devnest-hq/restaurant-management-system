import logging
from django.utils import timezone
from ..models import Payment
from ..utils import log_payment_event
from .notification_service import NotificationService

logger = logging.getLogger('payments')


class WebhookService:
    """Handles webhook events from payment gateways."""

    def __init__(self):
        self.notification_service = NotificationService()

    def handle_stripe_event(self, event_type, event_data):
        """Process Stripe webhook events."""
        try:
            if event_type == 'checkout.session.completed':
                return self._handle_success(event_data)
            elif event_type == 'checkout.session.expired':
                return self._handle_failure(event_data)
            else:
                logger.info(f"Unhandled Stripe event type: {event_type}")
                return {'success': True, 'message': f'Unhandled event: {event_type}'}

        except Exception as e:
            logger.error(f"Error handling Stripe webhook: {str(e)}")
            raise

    def handle_razorpay_event(self, event_type, event_data):
        """Process Razorpay webhook events."""
        try:
            if event_type == 'payment.captured':
                return self._handle_success(event_data)
            elif event_type == 'payment.failed':
                return self._handle_failure(event_data)
            else:
                logger.info(f"Unhandled Razorpay event type: {event_type}")
                return {'success': True, 'message': f'Unhandled event: {event_type}'}

        except Exception as e:
            logger.error(f"Error handling Razorpay webhook: {str(e)}")
            raise

    def _handle_success(self, event_data):
        """Handle successful payment event."""
        order_id = event_data.get('order_id')
        gateway_payment_id = event_data.get('gateway_payment_id')

        try:
            payment = Payment.objects.get(order_id=order_id, status=Payment.PaymentStatus.PROCESSING)

            payment.status = Payment.PaymentStatus.COMPLETED
            payment.gateway_payment_id = gateway_payment_id
            payment.webhook_received_at = timezone.now()
            payment.save()

            log_payment_event(payment, 'PAYMENT_COMPLETED', {'order_id': order_id})

            # Notify Node.js backend with retry logic
            notified = self.notification_service.notify_payment_status(
                order_id=order_id,
                payment_status='COMPLETED',
                payment_data={'gateway_payment_id': gateway_payment_id}
            )
            payment.node_notified_at = timezone.now() if notified else None
            payment.save()

            if not notified:
                logger.warning(f"Node.js notification failed for order {order_id} - will need manual retry")

            return {'success': True, 'message': 'Payment marked as completed.'}

        except Payment.DoesNotExist:
            logger.warning(f"No processing payment found for order {order_id}")
            return {'success': False, 'message': 'Payment not found.'}
        except Exception as e:
            logger.error(f"Error processing success webhook: {str(e)}")
            raise

    def _handle_failure(self, event_data):
        """Handle failed payment event."""
        order_id = event_data.get('order_id')

        try:
            payment = Payment.objects.get(order_id=order_id, status=Payment.PaymentStatus.PROCESSING)

            payment.status = Payment.PaymentStatus.FAILED
            payment.webhook_received_at = timezone.now()
            payment.save()

            log_payment_event(payment, 'PAYMENT_FAILED', {'order_id': order_id})

            # Notify Node.js backend with retry logic
            notified = self.notification_service.notify_payment_status(
                order_id=order_id,
                payment_status='FAILED',
                payment_data={}
            )
            payment.node_notified_at = timezone.now() if notified else None
            payment.save()

            if not notified:
                logger.warning(f"Node.js notification failed for order {order_id} - will need manual retry")

            return {'success': True, 'message': 'Payment marked as failed.'}

        except Payment.DoesNotExist:
            logger.warning(f"No processing payment found for order {order_id}")
            return {'success': False, 'message': 'Payment not found.'}
        except Exception as e:
            logger.error(f"Error processing failure webhook: {str(e)}")
            raise