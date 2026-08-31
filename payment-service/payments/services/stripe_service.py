import logging
import stripe
from django.conf import settings

logger = logging.getLogger('payments')


class StripeService:
    """Handles Stripe payment operations."""

    def __init__(self):
        stripe.api_key = settings.STRIPE_SECRET_KEY

    def create_payment_session(self, payment):
        """
        Create a Stripe checkout session for the given payment.
        Returns (session_id, client_secret, payment_link) or raises exception.
        """
        try:
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[
                    {
                        'price_data': {
                            'currency': payment.currency.lower(),
                            'product_data': {
                                'name': f"Order {payment.order_id}",
                            },
                            'unit_amount': int(payment.amount * 100),  # Convert to cents
                        },
                        'quantity': 1,
                    }
                ],
                mode='payment',
                client_reference_id=str(payment.id),
                metadata={
                    'order_id': payment.order_id,
                    'payment_id': str(payment.id),
                },
                success_url=f"{settings.NODE_BACKEND_URL}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=f"{settings.NODE_BACKEND_URL}/payment/cancel?session_id={{CHECKOUT_SESSION_ID}}",
            )

            logger.info(f"Stripe session created for order {payment.order_id}: {session.id}")

            return {
                'session_id': session.id,
                'client_secret': None,  # Stripe Checkout doesn't use client_secret
                'payment_link': session.url,
            }

        except stripe.error.StripeError as e:
            logger.error(f"Stripe error for order {payment.order_id}: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error creating Stripe session: {str(e)}")
            raise