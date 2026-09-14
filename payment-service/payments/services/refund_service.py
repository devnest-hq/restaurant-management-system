import logging
import stripe
import requests
from django.conf import settings
from django.utils import timezone

from ..models import Payment, Refund
from ..utils import log_payment_event

logger = logging.getLogger('payments')


class RefundService:
    """Handles refund operations for Stripe, Paystack, and Flutterwave."""

    def process_refund(self, payment, refund_amount=None, reason=None):
        """
        Process a refund for the given payment.
        If refund_amount is None, full refund is processed.
        Returns refund details or raises exception.
        """
        amount_to_refund = refund_amount if refund_amount else payment.amount

        # Create refund record
        refund = Refund.objects.create(
            payment=payment,
            refund_amount=amount_to_refund,
            currency=payment.currency,
            status=Refund.RefundStatus.PROCESSING,
            reason=reason,
        )

        try:
            if payment.method == Payment.PaymentMethod.STRIPE:
                refund_data = self._refund_stripe(payment, amount_to_refund)
            elif payment.method == Payment.PaymentMethod.PAYSTACK:
                refund_data = self._refund_paystack(payment, amount_to_refund)
            elif payment.method == Payment.PaymentMethod.FLUTTERWAVE:
                refund_data = self._refund_flutterwave(payment, amount_to_refund)
            else:
                raise ValueError(f"Unsupported payment method: {payment.method}")

            # Update refund record on success
            refund.gateway_refund_id = refund_data['refund_id']
            refund.status = Refund.RefundStatus.COMPLETED
            refund.save()

            # Update payment record
            if amount_to_refund < payment.amount:
                payment.status = Payment.PaymentStatus.PARTIALLY_REFUNDED
            else:
                payment.status = Payment.PaymentStatus.REFUNDED

            payment.refund_id = refund_data['refund_id']
            payment.refund_amount = amount_to_refund
            payment.save()

            log_payment_event(
                payment,
                'REFUND_PROCESSED',
                {
                    'order_id': payment.order_id,
                    'refund_id': refund_data['refund_id'],
                    'refund_amount': str(amount_to_refund),
                    'status': payment.status,
                }
            )

            return refund_data

        except Exception as e:
            refund.status = Refund.RefundStatus.FAILED
            refund.error_message = str(e)
            refund.save()

            logger.error(f"Refund failed for order {payment.order_id}: {str(e)}")
            raise

    def _refund_stripe(self, payment, amount_to_refund):
        """Process refund via Stripe."""
        try:
            stripe.api_key = settings.STRIPE_SECRET_KEY

            refund = stripe.Refund.create(
                payment_intent=payment.gateway_payment_id,
                amount=int(amount_to_refund * 100),
            )

            logger.info(f"Stripe refund created for order {payment.order_id}: {refund.id}")

            return {
                'refund_id': refund.id,
                'refund_amount': amount_to_refund,
                'status': refund.status,
            }

        except stripe.error.StripeError as e:
            logger.error(f"Stripe refund error for order {payment.order_id}: {str(e)}")
            raise

    def _refund_paystack(self, payment, amount_to_refund):
        """Process refund via Paystack."""
        try:
            headers = {
                'Authorization': f'Bearer {settings.PAYSTACK_SECRET_KEY}',
                'Content-Type': 'application/json',
            }
            payload = {
                'transaction': payment.gateway_payment_id,
                'amount': int(amount_to_refund * 100),  # Convert to kobo
            }

            response = requests.post(
                'https://api.paystack.co/refund',
                json=payload,
                headers=headers,
                timeout=10,
            )
            response.raise_for_status()
            data = response.json()

            if not data.get('status'):
                raise Exception(data.get('message', 'Paystack refund failed'))

            logger.info(f"Paystack refund created for order {payment.order_id}: {data['data']['id']}")

            return {
                'refund_id': str(data['data']['id']),
                'refund_amount': amount_to_refund,
                'status': data['data'].get('status', 'processed'),
            }

        except requests.exceptions.RequestException as e:
            logger.error(f"Paystack refund error for order {payment.order_id}: {str(e)}")
            raise

    def _refund_flutterwave(self, payment, amount_to_refund):
        """Process refund via Flutterwave."""
        try:
            headers = {
                'Authorization': f'Bearer {settings.FLUTTERWAVE_SECRET_KEY}',
                'Content-Type': 'application/json',
            }
            payload = {
                'amount': float(amount_to_refund),
            }

            response = requests.post(
                f'https://api.flutterwave.com/v3/transactions/{payment.gateway_payment_id}/refund',
                json=payload,
                headers=headers,
                timeout=10,
            )
            response.raise_for_status()
            data = response.json()

            if data.get('status') != 'success':
                raise Exception(data.get('message', 'Flutterwave refund failed'))

            logger.info(f"Flutterwave refund created for order {payment.order_id}")

            return {
                'refund_id': str(data.get('data', {}).get('id', payment.gateway_payment_id)),
                'refund_amount': amount_to_refund,
                'status': 'processed',
            }

        except requests.exceptions.RequestException as e:
            logger.error(f"Flutterwave refund error for order {payment.order_id}: {str(e)}")
            raise