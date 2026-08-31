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
            elif event_type == 'charge.refunded':
                return self._handle_refund(event_data)
            elif event_type == 'charge.dispute.created':
                return self._handle_dispute(event_data)
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
            elif event_type == 'refund.processed':
                return self._handle_refund(event_data)
            elif event_type == 'refund.failed':
                return self._handle_refund_failure(event_data)
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

    def _handle_refund(self, event_data):
        """Handle refund event from gateway."""
        order_id = event_data.get('order_id')
        refund_id = event_data.get('refund_id')
        refund_amount = event_data.get('refund_amount')

        try:
            payment = Payment.objects.get(order_id=order_id)

            payment.refund_id = refund_id
            if refund_amount:
                payment.refund_amount = refund_amount
                if refund_amount < payment.amount:
                    payment.status = Payment.PaymentStatus.PARTIALLY_REFUNDED
                else:
                    payment.status = Payment.PaymentStatus.REFUNDED
            else:
                payment.status = Payment.PaymentStatus.REFUNDED

            payment.save()

            log_payment_event(
                payment,
                'REFUND_WEBHOOK_RECEIVED',
                {
                    'order_id': order_id,
                    'refund_id': refund_id,
                    'status': payment.status,
                }
            )

            # Notify Node.js backend
            notified = self.notification_service.notify_payment_status(
                order_id=order_id,
                payment_status=payment.status,
                payment_data={
                    'refund_id': refund_id,
                    'refund_amount': str(payment.refund_amount) if payment.refund_amount else None,
                }
            )
            payment.node_notified_at = timezone.now() if notified else None
            payment.save()

            return {'success': True, 'message': f'Refund processed for order {order_id}.'}

        except Payment.DoesNotExist:
            logger.warning(f"No payment found for order {order_id} during refund webhook")
            return {'success': False, 'message': 'Payment not found.'}
        except Exception as e:
            logger.error(f"Error processing refund webhook: {str(e)}")
            raise

    def _handle_refund_failure(self, event_data):
        """Handle failed refund event from gateway."""
        order_id = event_data.get('order_id')

        try:
            payment = Payment.objects.get(order_id=order_id)

            log_payment_event(
                payment,
                'REFUND_FAILED',
                {
                    'order_id': order_id,
                    'message': 'Refund failed at gateway',
                }
            )

            # Notify Node.js backend about refund failure
            notified = self.notification_service.notify_payment_status(
                order_id=order_id,
                payment_status='REFUND_FAILED',
                payment_data={}
            )
            payment.node_notified_at = timezone.now() if notified else None
            payment.save()

            return {'success': True, 'message': f'Refund failure recorded for order {order_id}.'}

        except Payment.DoesNotExist:
            logger.warning(f"No payment found for order {order_id} during refund failure webhook")
            return {'success': False, 'message': 'Payment not found.'}
        except Exception as e:
            logger.error(f"Error processing refund failure webhook: {str(e)}")
            raise

    def _handle_dispute(self, event_data):
        """Handle dispute/chargeback event from gateway."""
        order_id = event_data.get('order_id')
        dispute_id = event_data.get('dispute_id')

        try:
            payment = Payment.objects.get(order_id=order_id)

            log_payment_event(
                payment,
                'DISPUTE_CREATED',
                {
                    'order_id': order_id,
                    'dispute_id': dispute_id,
                    'message': 'Dispute/chargeback created',
                }
            )

            # Notify Node.js backend about dispute
            notified = self.notification_service.notify_payment_status(
                order_id=order_id,
                payment_status='DISPUTED',
                payment_data={'dispute_id': dispute_id}
            )
            payment.node_notified_at = timezone.now() if notified else None
            payment.save()

            return {'success': True, 'message': f'Dispute recorded for order {order_id}.'}

        except Payment.DoesNotExist:
            logger.warning(f"No payment found for order {order_id} during dispute webhook")
            return {'success': False, 'message': 'Payment not found.'}
        except Exception as e:
            logger.error(f"Error processing dispute webhook: {str(e)}")
            raise