import json
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.conf import settings
from decimal import Decimal
from payments.models import Payment


class PaymentViewTest(TestCase):
    """Tests for payment API endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.api_key = settings.PAYMENT_SERVICE_API_KEY
        self.auth_header = {'HTTP_X_PAYMENT_SERVICE_KEY': self.api_key}

    def test_health_check(self):
        """Test that health check returns 200."""
        url = reverse('payments:health-check')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'healthy')

    def test_create_payment_requires_api_key(self):
        """Test that payment creation requires API key."""
        url = reverse('payments:create-payment')
        response = self.client.post(url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_payment_validates_amount(self):
        """Test that amount must be positive."""
        url = reverse('payments:create-payment')
        data = {
            'order_id': 'ORD-TEST-003',
            'amount': -10.00,
            'currency': 'USD',
            'method': 'STRIPE',
        }
        response = self.client.post(
            url,
            json.dumps(data),
            content_type='application/json',
            **self.auth_header
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_payment_validates_method(self):
        """Test that method must be STRIPE or RAZORPAY."""
        url = reverse('payments:create-payment')
        data = {
            'order_id': 'ORD-TEST-004',
            'amount': 50.00,
            'currency': 'USD',
            'method': 'INVALID_METHOD',
        }
        response = self.client.post(
            url,
            json.dumps(data),
            content_type='application/json',
            **self.auth_header
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_payment_status_not_found(self):
        """Test that status query returns 404 for non-existent order."""
        url = reverse('payments:payment-status', kwargs={'order_id': 'ORD-NOT-EXIST'})
        response = self.client.get(url, **self.auth_header)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_refund_requires_completed_payment(self):
        """Test that refund only works for completed payments."""
        url = reverse('payments:refund-payment')
        data = {
            'order_id': 'ORD-NOT-EXIST',
            'refund_amount': None,
        }
        response = self.client.post(
            url,
            json.dumps(data),
            content_type='application/json',
            **self.auth_header
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)