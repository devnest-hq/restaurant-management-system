from decimal import Decimal
from unittest.mock import patch, MagicMock
from django.test import TestCase, override_settings
from django.conf import settings

from payments.models import Payment
from payments.services.paystack_service import PaystackService
from payments.services.flutterwave_service import FlutterwaveService


class PaystackServiceTest(TestCase):
    """Tests for PaystackService."""

    def setUp(self):
        self.payment = Payment.objects.create(
            order_id='ORD-PS-001',
            amount=Decimal('5000.00'),
            currency='NGN',
            method=Payment.PaymentMethod.PAYSTACK,
            idempotency_key='paystack-test-key-001',
        )
        self.service = PaystackService()

    @patch('payments.services.paystack_service.requests.post')
    def test_create_payment_session_success(self, mock_post):
        """Test successful Paystack session creation."""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            'status': True,
            'data': {
                'reference': 'PS_REF_123',
                'authorization_url': 'https://checkout.paystack.com/abc123',
            }
        }
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response

        result = self.service.create_payment_session(self.payment)

        self.assertEqual(result['session_id'], 'PS_REF_123')
        self.assertEqual(result['payment_link'], 'https://checkout.paystack.com/abc123')
        mock_post.assert_called_once()

    @patch('payments.services.paystack_service.requests.post')
    def test_create_payment_session_failure(self, mock_post):
        """Test Paystack session creation failure."""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            'status': False,
            'message': 'Invalid amount',
        }
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response

        with self.assertRaises(Exception):
            self.service.create_payment_session(self.payment)


class FlutterwaveServiceTest(TestCase):
    """Tests for FlutterwaveService."""

    def setUp(self):
        self.payment = Payment.objects.create(
            order_id='ORD-FLW-001',
            amount=Decimal('10000.00'),
            currency='NGN',
            method=Payment.PaymentMethod.FLUTTERWAVE,
            idempotency_key='flutterwave-test-key-001',
        )
        self.service = FlutterwaveService()

    @patch('payments.services.flutterwave_service.requests.post')
    def test_create_payment_session_success(self, mock_post):
        """Test successful Flutterwave session creation."""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            'status': 'success',
            'data': {
                'tx_ref': 'FLW_REF_456',
                'link': 'https://checkout.flutterwave.com/xyz789',
            }
        }
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response

        result = self.service.create_payment_session(self.payment)

        self.assertEqual(result['session_id'], 'FLW_REF_456')
        self.assertEqual(result['payment_link'], 'https://checkout.flutterwave.com/xyz789')
        mock_post.assert_called_once()

    @patch('payments.services.flutterwave_service.requests.post')
    def test_create_payment_session_failure(self, mock_post):
        """Test Flutterwave session creation failure."""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            'status': 'error',
            'message': 'Invalid currency',
        }
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response

        with self.assertRaises(Exception):
            self.service.create_payment_session(self.payment)