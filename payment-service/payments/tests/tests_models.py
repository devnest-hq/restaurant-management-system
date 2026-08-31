from django.test import TestCase
from decimal import Decimal
from payments.models import Payment


class PaymentModelTest(TestCase):
    """Tests for the Payment model."""

    def setUp(self):
        self.payment = Payment.objects.create(
            order_id='ORD-TEST-001',
            amount=Decimal('100.00'),
            currency='USD',
            method=Payment.PaymentMethod.STRIPE,
            idempotency_key='test-key-001',
        )

    def test_payment_creation(self):
        """Test that a payment can be created."""
        self.assertEqual(self.payment.order_id, 'ORD-TEST-001')
        self.assertEqual(self.payment.amount, Decimal('100.00'))
        self.assertEqual(self.payment.currency, 'USD')
        self.assertEqual(self.payment.method, Payment.PaymentMethod.STRIPE)
        self.assertEqual(self.payment.status, Payment.PaymentStatus.PENDING)

    def test_payment_str_method(self):
        """Test the string representation."""
        expected = f"Payment {self.payment.id} - ORD-TEST-001 - PENDING"
        self.assertEqual(str(self.payment), expected)

    def test_default_status_is_pending(self):
        """Test that new payments start as PENDING."""
        self.assertEqual(self.payment.status, Payment.PaymentStatus.PENDING)

    def test_idempotency_key_unique(self):
        """Test that idempotency keys are unique."""
        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            Payment.objects.create(
                order_id='ORD-TEST-002',
                amount=Decimal('50.00'),
                currency='USD',
                method=Payment.PaymentMethod.STRIPE,
                idempotency_key='test-key-001',  # Same key
            )