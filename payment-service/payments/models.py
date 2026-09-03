import uuid
from django.db import models


class TimeStampedModel(models.Model):
    """Abstract base model with timestamp fields."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ['-created_at']


class Payment(TimeStampedModel):
    """Tracks all payment attempts and their status."""

    class PaymentMethod(models.TextChoices):
        STRIPE = 'STRIPE', 'Stripe'
        RAZORPAY = 'RAZORPAY', 'Razorpay'

    class PaymentStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        PROCESSING = 'PROCESSING', 'Processing'
        COMPLETED = 'COMPLETED', 'Completed'
        FAILED = 'FAILED', 'Failed'
        REFUNDED = 'REFUNDED', 'Refunded'
        PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED', 'Partially Refunded'

    order_id = models.CharField(max_length=100, db_index=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    method = models.CharField(max_length=20, choices=PaymentMethod.choices)
    status = models.CharField(
        max_length=30,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
    )
    gateway_payment_id = models.CharField(max_length=255, blank=True, null=True)
    gateway_session_id = models.CharField(max_length=255, blank=True, null=True)
    idempotency_key = models.CharField(max_length=255, unique=True, db_index=True)
    client_secret = models.CharField(max_length=255, blank=True, null=True)
    payment_link = models.URLField(blank=True, null=True)
    refund_id = models.CharField(max_length=255, blank=True, null=True)
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    error_message = models.TextField(blank=True, null=True)
    webhook_received_at = models.DateTimeField(blank=True, null=True)
    node_notified_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['order_id']),
            models.Index(fields=['status']),
            models.Index(fields=['idempotency_key']),
        ]

    def __str__(self):
        return f"Payment {self.id} - {self.order_id} - {self.status}"

class Refund(TimeStampedModel):
    """Tracks refunds associated with payments."""

    class RefundStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        PROCESSING = 'PROCESSING', 'Processing'
        COMPLETED = 'COMPLETED', 'Completed'
        FAILED = 'FAILED', 'Failed'

    payment = models.ForeignKey(
        Payment,
        on_delete=models.CASCADE,
        related_name='refunds',
    )
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    gateway_refund_id = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=RefundStatus.choices,
        default=RefundStatus.PENDING,
    )
    reason = models.TextField(blank=True, null=True)
    error_message = models.TextField(blank=True, null=True)
    webhook_received_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['payment']),
            models.Index(fields=['status']),
            models.Index(fields=['gateway_refund_id']),
        ]

    def __str__(self):
        return f"Refund {self.id} - {self.payment.order_id} - {self.status}"