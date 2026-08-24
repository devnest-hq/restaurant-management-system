import logging
from django.db import IntegrityError
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Payment
from .serializers import CreatePaymentSerializer, PaymentResponseSerializer, PaymentStatusSerializer
from .authentication import PaymentServiceAuthentication
from .utils import log_payment_event
from .services.notification_service import NotificationService
from .services.stripe_service import StripeService
from .services.razorpay_service import RazorpayService
from .serializers_refund import RefundRequestSerializer
from .services.refund_service import RefundService
from .utils import notify_node_backend

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

class PaymentStatusView(APIView):
    """
    GET /api/payments/status/<order_id>/
    Allows Node.js backend to query payment status by order ID.
    """
    authentication_classes = [PaymentServiceAuthentication]

    def get(self, request, order_id):
        try:
            payment = Payment.objects.filter(order_id=order_id).first()

            if not payment:
                return Response(
                    {
                        'success': False,
                        'error': {
                            'code': 404,
                            'message': f'No payment found for order {order_id}.',
                        }
                    },
                    status=status.HTTP_404_NOT_FOUND
                )

            log_payment_event(
                payment,
                'STATUS_QUERIED',
                {'order_id': order_id, 'status': payment.status}
            )

            return Response(
                {
                    'success': True,
                    'message': 'Payment status retrieved successfully.',
                    'payment': PaymentStatusSerializer(payment).data,
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:
            logger.error(f"Failed to retrieve payment status for order {order_id}: {str(e)}")
            return Response(
                {
                    'success': False,
                    'error': {
                        'code': 500,
                        'message': 'Failed to retrieve payment status.',
                    }
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class RefundPaymentView(APIView):
    """
    POST /api/payments/refund/
    Processes a refund for a completed payment.
    """
    authentication_classes = [PaymentServiceAuthentication]

    def post(self, request):
        serializer = RefundRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order_id = serializer.validated_data['order_id']
        refund_amount = serializer.validated_data.get('refund_amount')

        try:
            payment = Payment.objects.filter(
                order_id=order_id,
                status=Payment.PaymentStatus.COMPLETED,
            ).first()

            if not payment:
                return Response(
                    {
                        'success': False,
                        'error': {
                            'code': 404,
                            'message': f'No completed payment found for order {order_id}.',
                        }
                    },
                    status=status.HTTP_404_NOT_FOUND
                )

            # Process refund
            refund_service = RefundService()
            refund_data = refund_service.process_refund(payment, refund_amount)

            # Update payment record
            if refund_amount and refund_amount < payment.amount:
                payment.status = Payment.PaymentStatus.PARTIALLY_REFUNDED
            else:
                payment.status = Payment.PaymentStatus.REFUNDED

            payment.refund_id = refund_data['refund_id']
            payment.refund_amount = refund_data['refund_amount']
            payment.save()

            log_payment_event(
                payment,
                'REFUND_PROCESSED',
                {
                    'order_id': order_id,
                    'refund_id': refund_data['refund_id'],
                    'refund_amount': str(refund_data['refund_amount']),
                    'status': payment.status,
                }
            )

            # Notify Node.js backend
            notified = notify_node_backend(
                order_id=order_id,
                payment_status=payment.status,
                payment_data={
                    'refund_id': refund_data['refund_id'],
                    'refund_amount': str(refund_data['refund_amount']),
                }
            )
            payment.node_notified_at = timezone.now() if notified else None
            payment.save()

            return Response(
                {
                    'success': True,
                    'message': 'Refund processed successfully.',
                    'payment': {
                        'order_id': payment.order_id,
                        'status': payment.status,
                        'refund_id': payment.refund_id,
                        'refund_amount': str(payment.refund_amount),
                    },
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:
            logger.error(f"Refund failed for order {order_id}: {str(e)}")
            return Response(
                {
                    'success': False,
                    'error': {
                        'code': 502,
                        'message': 'Failed to process refund.',
                    }
                },
                status=status.HTTP_502_BAD_GATEWAY
            )

class RefundPaymentView(APIView):
    """
    POST /api/payments/refund/
    Processes a refund for a completed payment.
    """
    authentication_classes = [PaymentServiceAuthentication]

    def post(self, request):
        serializer = RefundRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order_id = serializer.validated_data['order_id']
        refund_amount = serializer.validated_data.get('refund_amount')

        try:
            payment = Payment.objects.filter(
                order_id=order_id,
                status=Payment.PaymentStatus.COMPLETED,
            ).first()

            if not payment:
                return Response(
                    {
                        'success': False,
                        'error': {
                            'code': 404,
                            'message': f'No completed payment found for order {order_id}.',
                        }
                    },
                    status=status.HTTP_404_NOT_FOUND
                )

            # Process refund
            refund_service = RefundService()
            refund_data = refund_service.process_refund(payment, refund_amount)

            # Update payment record
            if refund_amount and refund_amount < payment.amount:
                payment.status = Payment.PaymentStatus.PARTIALLY_REFUNDED
            else:
                payment.status = Payment.PaymentStatus.REFUNDED

            payment.refund_id = refund_data['refund_id']
            payment.refund_amount = refund_data['refund_amount']
            payment.save()

            log_payment_event(
                payment,
                'REFUND_PROCESSED',
                {
                    'order_id': order_id,
                    'refund_id': refund_data['refund_id'],
                    'refund_amount': str(refund_data['refund_amount']),
                    'status': payment.status,
                }
            )

            # Notify Node.js backend with retry logic
            notification_service = NotificationService()
            notified = notification_service.notify_payment_status(
              order_id=order_id,
              payment_status=payment.status,
              payment_data={
                'refund_id': refund_data['refund_id'],
                'refund_amount': str(refund_data['refund_amount']),
                }
            )           
            payment.node_notified_at = timezone.now() if notified else None
            payment.save()

            return Response(
                {
                    'success': True,
                    'message': 'Refund processed successfully.',
                    'payment': {
                        'order_id': payment.order_id,
                        'status': payment.status,
                        'refund_id': payment.refund_id,
                        'refund_amount': str(payment.refund_amount),
                    },
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:
            logger.error(f"Refund failed for order {order_id}: {str(e)}")
            return Response(
                {
                    'success': False,
                    'error': {
                        'code': 502,
                        'message': 'Failed to process refund.',
                    }
                },
                status=status.HTTP_502_BAD_GATEWAY
            )
    