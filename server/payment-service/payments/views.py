import logging
import uuid
from django.conf import settings
from django.db import IntegrityError
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Payment
from .serializers import CreatePaymentSerializer, PaymentResponseSerializer
from .authentication import PaymentServiceAuthentication
from .utils import log_payment_event

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

            log_payment_event(
                payment,
                'PAYMENT_CREATED',
                {
                    'order_id': order_id,
                    'amount': str(validated_data['amount']),
                    'method': method,
                }
            )

            return Response(
                {
                    'success': True,
                    'message': 'Payment record created successfully.',
                    'payment': PaymentResponseSerializer(payment).data,
                },
                status=status.HTTP_201_CREATED
            )

        except IntegrityError:
            # Handle race condition where duplicate arrives simultaneously
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