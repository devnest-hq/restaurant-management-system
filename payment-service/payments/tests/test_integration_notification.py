import json
from decimal import Decimal
from django.test import TestCase
from django.conf import settings
from django.utils import timezone
from unittest.mock import patch

from payments.models import Payment
from payments.services.notification_service import NotificationService
from payments.services.webhook_service import WebhookService
from .mock_node_server import MockNodeServer


class NotificationIntegrationTest(TestCase):
    """Integration tests for notifying the Node.js backend."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.mock_server = MockNodeServer(port=8765)
        cls.mock_url = cls.mock_server.start()
        cls.original_node_url = settings.NODE_BACKEND_URL
        cls.original_node_key = settings.NODE_BACKEND_API_KEY
        # Override settings for tests
        settings.NODE_BACKEND_URL = cls.mock_url
        settings.NODE_BACKEND_API_KEY = 'test-api-key'

    @classmethod
    def tearDownClass(cls):
        cls.mock_server.stop()
        settings.NODE_BACKEND_URL = cls.original_node_url
        settings.NODE_BACKEND_API_KEY = cls.original_node_key
        super().tearDownClass()

    def setUp(self):
        self.mock_server.clear_requests()
        self.payment = Payment.objects.create(
            order_id='ORD-INT-001',
            amount=Decimal('100.00'),
            currency='USD',
            method=Payment.PaymentMethod.STRIPE,
            idempotency_key='integration-test-key-001',
            status=Payment.PaymentStatus.PROCESSING,
        )

    def test_notification_service_sends_success(self):
        """Test that NotificationService sends a success notification to Node.js."""
        service = NotificationService()
        result = service.notify_payment_status(
            order_id='ORD-INT-001',
            payment_status='COMPLETED',
            payment_data={'gateway_payment_id': 'pi_test_123'},
        )

        self.assertTrue(result)
        requests = self.mock_server.get_requests()
        self.assertEqual(len(requests), 1)
        
        # Verify request details
        req = requests[0]
        self.assertEqual(req['path'], '/api/orders/ORD-INT-001/payment-confirmed')
        self.assertEqual(req['headers'].get('Authorization'), 'Bearer test-api-key')
        self.assertEqual(req['body']['orderId'], 'ORD-INT-001')
        self.assertEqual(req['body']['paymentStatus'], 'COMPLETED')
        self.assertEqual(req['body']['paymentData']['gateway_payment_id'], 'pi_test_123')

    def test_webhook_success_notifies_node(self):
        """Test that a success webhook triggers notification to Node.js."""
        webhook_service = WebhookService()
        result = webhook_service.handle_stripe_event(
            'checkout.session.completed',
            {
                'order_id': 'ORD-INT-001',
                'gateway_payment_id': 'pi_test_456',
            }
        )

        self.assertEqual(result['success'], True)
        requests = self.mock_server.get_requests()
        self.assertEqual(len(requests), 1)
        
        req = requests[0]
        self.assertEqual(req['body']['paymentStatus'], 'COMPLETED')
        self.assertEqual(req['body']['paymentData']['gateway_payment_id'], 'pi_test_456')

        # Verify payment was updated
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, Payment.PaymentStatus.COMPLETED)
        self.assertEqual(self.payment.gateway_payment_id, 'pi_test_456')
        self.assertIsNotNone(self.payment.node_notified_at)

    def test_webhook_failure_notifies_node(self):
        """Test that a failure webhook triggers notification to Node.js."""
        webhook_service = WebhookService()
        result = webhook_service.handle_stripe_event(
            'checkout.session.expired',
            {
                'order_id': 'ORD-INT-001',
            }
        )

        self.assertEqual(result['success'], True)
        requests = self.mock_server.get_requests()
        self.assertEqual(len(requests), 1)
        
        req = requests[0]
        self.assertEqual(req['body']['paymentStatus'], 'FAILED')

        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, Payment.PaymentStatus.FAILED)

    def test_notification_retry_on_failure(self):
        """Test that notification retries when Node.js returns an error."""
        # Temporarily make the mock server return 500
        original_handler = self.mock_server.server.RequestHandlerClass
        
        class FailingHandler(original_handler):
            def do_POST(self):
                content_length = int(self.headers.get('Content-Length', 0))
                self.rfile.read(content_length)
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': False}).encode('utf-8'))
        
        self.mock_server.server.RequestHandlerClass = FailingHandler
        
        try:
            service = NotificationService()
            result = service.notify_payment_status(
                order_id='ORD-INT-001',
                payment_status='COMPLETED',
                payment_data={},
            )
        finally:
            # Restore original handler
            self.mock_server.server.RequestHandlerClass = original_handler
        
        # Should fail after retries
        self.assertFalse(result)