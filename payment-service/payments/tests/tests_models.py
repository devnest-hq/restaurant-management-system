from django.test import TestCase
from decimal import Decimal
from payments.models import Payment, Refund


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
        self.assertEqual(self.payment.order_id, 'ORD-TEST-001')
        self.assertEqual(self.payment.amount, Decimal('100.00'))
        self.assertEqual(self.payment.currency, 'USD')
        self.assertEqual(self.payment.method, Payment.PaymentMethod.STRIPE)
        self.assertEqual(self.payment.status, Payment.PaymentStatus.PENDING)

    def test_payment_str_method(self):
        expected = f"Payment {self.payment.id} - ORD-TEST-001 - PENDING"
        self.assertEqual(str(self.payment), expected)

    def test_default_status_is_pending(self):
        self.assertEqual(self.payment.status, Payment.PaymentStatus.PENDING)

    def test_idempotency_key_unique(self):
        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            Payment.objects.create(
                order_id='ORD-TEST-002',
                amount=Decimal('50.00'),
                currency='USD',
                method=Payment.PaymentMethod.STRIPE,
                idempotency_key='test-key-001',
            )

    def test_paystack_method_exists(self):
        """Test that PAYSTACK is a valid payment method."""
        payment = Payment.objects.create(
            order_id='ORD-TEST-PAYSTACK',
            amount=Decimal('200.00'),
            currency='NGN',
            method=Payment.PaymentMethod.PAYSTACK,
            idempotency_key='test-key-paystack',
        )
        self.assertEqual(payment.method, 'PAYSTACK')

    def test_flutterwave_method_exists(self):
        """Test that FLUTTERWAVE is a valid payment method."""
        payment = Payment.objects.create(
            order_id='ORD-TEST-FLW',
            amount=Decimal('300.00'),
            currency='NGN',
            method=Payment.PaymentMethod.FLUTTERWAVE,
            idempotency_key='test-key-flutterwave',
        )
        self.assertEqual(payment.method, 'FLUTTERWAVE')

    def test_razorpay_method_removed(self):
        """Test that RAZORPAY is no longer a valid choice."""
        valid_methods = [choice[0] for choice in Payment.PaymentMethod.choices]
        self.assertNotIn('RAZORPAY', valid_methods)
        self.assertIn('STRIPE', valid_methods)
        self.assertIn('PAYSTACK', valid_methods)
        self.assertIn('FLUTTERWAVE', valid_methods)


class RefundModelTest(TestCase):
    """Tests for the Refund model."""

    def setUp(self):
        self.payment = Payment.objects.create(
            order_id='ORD-REFUND-001',
            amount=Decimal('100.00'),
            currency='USD',
            method=Payment.PaymentMethod.STRIPE,
            idempotency_key='refund-test-key-001',
            status=Payment.PaymentStatus.COMPLETED,
        )
        self.refund = Refund.objects.create(
            payment=self.payment,
            refund_amount=Decimal('50.00'),
            currency='USD',
            status=Refund.RefundStatus.PROCESSING,
        )

    def test_refund_creation(self):
        self.assertEqual(self.refund.payment, self.payment)
        self.assertEqual(self.refund.refund_amount, Decimal('50.00'))
        self.assertEqual(self.refund.status, Refund.RefundStatus.PROCESSING)

    def test_refund_str_method(self):
        expected = f"Refund {self.refund.id} - ORD-REFUND-001 - PROCESSING"
        self.assertEqual(str(self.refund), expected)

    def test_multiple_refunds_per_payment(self):
        """Test that a payment can have multiple refunds."""
        second_refund = Refund.objects.create(
            payment=self.payment,
            refund_amount=Decimal('30.00'),
            currency='USD',
            status=Refund.RefundStatus.COMPLETED,
        )
        self.assertEqual(self.payment.refunds.count(), 2)
        self.assertIn(self.refund, self.payment.refunds.all())
        self.assertIn(second_refund, self.payment.refunds.all())