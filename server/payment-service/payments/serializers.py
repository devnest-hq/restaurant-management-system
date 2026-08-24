import uuid
from rest_framework import serializers
from .models import Payment

class CreatePaymentSerializer(serializers.Serializer):
    order_id = serializers.CharField(max_length=100)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    currency = serializers.CharField(max_length=3, default='NGN')
    method = serializers.ChoiceField(choices=Payment.PaymentMethod.choices)
    idempotency_key = serializers.CharField(max_length=255, required=False)

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value

    def validate(self, attrs):
        if not attrs.get('idempotency_key'):
            attrs['idempotency_key'] = (
                f"{attrs['order_id']}-{attrs['method']}-{attrs['amount']}"
            )
        return attrs

class PaymentResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            'id', 
            'order_id', 
            'amount', 
            'currency', 
            'method',
            'status',
            'gateway_session_id',
            'client_secret',
            'payment_link',
            'idempotency_key', 
            'created_at',
            'updated_at',
        ]    

class PaymentStatusSerializer(serializers.ModelSerializer):
    """Returns only essential payment status information."""
    class Meta:
        model = Payment
        fields = [
            'order_id',
            'amount',
            'currency',
            'method',
            'status',
            'gateway_payment_id',
            'refund_id',
            'refund_amount',
            'error_message',
            'created_at',
            'updated_at',
        ]        