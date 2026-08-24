from rest_framework import serializers


class RefundRequestSerializer(serializers.Serializer):
    """Validates incoming refund request from Node.js."""
    order_id = serializers.CharField(max_length=100)
    refund_amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False,
        allow_null=True,
    )

    def validate_refund_amount(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError("Refund amount must be greater than zero.")
        return value