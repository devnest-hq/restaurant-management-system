import logging
from django.db import IntegrityError
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Payment
from .serializers import CreatePaymentSerializer, PaymentResponseSerializer
from .authentication import PaymentServiceAuthentication
from .utils import log_payment_event
from .services.stripe_service import StripeService
from .services.razorpay_service import RazorpayService

logger = logging.getLogger('payments')


class CreatePaymentView(APIView):
    """
    POST /api/payments/create-payment/
    Receives order details from Node.js and creates a payment session.
    """
    authentication_classes = [PaymentServiceAuthentication]

    def post(self, request):
        serializer = CreatePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        validated_data = serializer.validated_data
        order_id = validated_data['order_id']
        method = validated_data['method']

        # Check if a payment already exists for this idempotency key
        existing_payment = Payment.objects.filter(
            idempotency_key=validated_data['idempotency_key']
        ).first()

        if existing_payment:
            log_payment_event(
                existing_payment,
                'DUPLICATE_REQUEST',
                {'message': 'Returning existing payment session'}
            )
            return Response(
                {
                    'success': True,
                    'message': 'Payment already created for this order.',
                    'payment': PaymentResponseSerializer(existing_payment).data,
                },
                status=status.HTTP_200_OK
            )

        try:
            # Create payment record
            payment = Payment.objects.create(
                order_id=order_id,
                amount=validated_data['amount'],
                currency=validated_data.get('currency', 'USD'),
                method=method,
                idempotency_key=validated_data['idempotency_key'],
                status=Payment.PaymentStatus.PENDING,
            )

            # Create payment session based on method
            session_data = None

            if method == Payment.PaymentMethod.STRIPE:
                try:
                    stripe_service = StripeService()
                    session_data = stripe_service.create_payment_session(payment)
                except Exception as stripe_error:
                    payment.status = Payment.PaymentStatus.FAILED
                    payment.error_message = str(stripe_error)
                    payment.save()
                    return Response(
                        {
                            'success': False,
                            'error': {
                                'code': 502,
                                'message': 'Failed to create Stripe payment session.',
                            }
                        },
                        status=status.HTTP_502_BAD_GATEWAY
                    )

            elif method == Payment.PaymentMethod.RAZORPAY:
                try:
                    razorpay_service = RazorpayService()
                    session_data = razorpay_service.create_payment_session(payment)
                except Exception as razorpay_error:
                    payment.status = Payment.PaymentStatus.FAILED
                    payment.error_message = str(razorpay_error)
                    payment.save()
                    return Response(
                        {
                            'success': False,
                            'error': {
                                'code': 502,
                                'message': 'Failed to create Razorpay payment session.',
                            }
                        },
                        status=status.HTTP_502_BAD_GATEWAY
                    )

            # Update payment with session data
            if session_data:
                payment.gateway_session_id = session_data['session_id']
                payment.client_secret = session_data['client_secret']
                payment.payment_link = session_data['payment_link']
                payment.status = Payment.PaymentStatus.PROCESSING
                payment.save()

            log_payment_event(
                payment,
                'PAYMENT_CREATED',
                {
                    'order_id': order_id,
                    'amount': str(validated_data['amount']),
                    'method': method,
                    'status': payment.status,
                }
            )

            return Response(
                {
                    'success': True,
                    'message': 'Payment session created successfully.',
                    'payment': PaymentResponseSerializer(payment).data,
                },
                status=status.HTTP_201_CREATED
            )

        except IntegrityError:
            existing_payment = Payment.objects.filter(
                idempotency_key=validated_data['idempotency_key']
            ).first()
            if existing_payment:
                return Response(
                    {
                        'success': True,
                        'message': 'Payment already created for this order.',
                        'payment': PaymentResponseSerializer(existing_payment).data,
                    },
                    status=status.HTTP_200_OK
                )
            raise

        except Exception as e:
            logger.error(f"Failed to create payment for order {order_id}: {str(e)}")
            return Response(
                {
                    'success': False,
                    'error': {
                        'code': 500,
                        'message': 'Failed to create payment.',
                    }
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class HealthCheckView(APIView):
    """
    GET /api/payments/health/
    Simple health check endpoint for orchestration and monitoring.
    """
    authentication_classes = []

    def get(self, request):
        return Response(
            {
                'success': True,
                'message': 'Payment service is running.',
                'status': 'healthy',
            },
            status=status.HTTP_200_OK
        )