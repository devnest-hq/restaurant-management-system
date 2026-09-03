# Payment Service API Contract

## Overview
The Payment Service is an isolated microservice built with Django. It handles all payment processing via Stripe and Razorpay and notifies the main backend (Node.js) of payment status changes.

**Base URL:** `http://localhost:8000` (development)

## Authentication
All endpoints (except health check and webhooks) require an API key sent via the `X-Payment-Service-Key` header.

```
X-Payment-Service-Key: <shared-secret-key>
```

## Endpoints

### 1. Health Check
- **GET** `/api/payments/health/`
- **Auth:** None
- **Response:**
```json
{
  "success": true,
  "message": "Payment service is running.",
  "status": "healthy"
}
```

### 2. Create Payment
- **POST** `/api/payments/create-payment/`
- **Auth:** API Key
- **Request Body:**
```json
{
  "order_id": "ORD-123",
  "amount": 100.00,
  "currency": "USD",
  "method": "STRIPE",
  "idempotency_key": "optional-custom-key"
}
```
- `method`: `"STRIPE"` or `"RAZORPAY"`
- `idempotency_key`: Optional. If not provided, the service generates one based on `order_id + method + amount`.
- **Response (201 Created):**
```json
{
  "success": true,
  "message": "Payment session created successfully.",
  "payment": {
    "id": "uuid",
    "order_id": "ORD-123",
    "amount": "100.00",
    "currency": "USD",
    "method": "STRIPE",
    "status": "PROCESSING",
    "gateway_session_id": "cs_test_...",
    "client_secret": null,
    "payment_link": "https://checkout.stripe.com/...",
    "idempotency_key": "ORD-123-STRIPE-100.00",
    "created_at": "2026-01-01T12:00:00Z",
    "updated_at": "2026-01-01T12:00:00Z"
  }
}
```
- **Duplicate Request (200 OK):** If same `idempotency_key` used, returns existing payment.

### 3. Payment Status Query
- **GET** `/api/payments/status/{order_id}/`
- **Auth:** API Key
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Payment status retrieved successfully.",
  "payment": {
    "order_id": "ORD-123",
    "amount": "100.00",
    "currency": "USD",
    "method": "STRIPE",
    "status": "COMPLETED",
    "gateway_payment_id": "pi_123...",
    "refund_id": null,
    "refund_amount": null,
    "error_message": null,
    "created_at": "2026-01-01T12:00:00Z",
    "updated_at": "2026-01-01T12:05:00Z"
  }
}
```
- **404** if no payment found for that `order_id`.

### 4. Refund
- **POST** `/api/payments/refund/`
- **Auth:** API Key
- **Request Body:**
```json
{
  "order_id": "ORD-123",
  "refund_amount": 50.00
}
```
- `refund_amount` optional: if omitted or `null`, full amount is refunded.
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Refund processed successfully.",
  "payment": {
    "order_id": "ORD-123",
    "status": "PARTIALLY_REFUNDED",
    "refund_id": "re_123...",
    "refund_amount": "50.00"
  }
}
```
- **404** if no `COMPLETED` payment exists for that order.

### 5. Reconciliation
- **POST** `/api/payments/reconcile/`
- **Auth:** API Key
- **Request Body (optional):**
```json
{
  "days_back": 1
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Reconciliation completed.",
  "data": {
    "stripe": {
      "total_checked": 0,
      "reconciled": 0,
      "still_pending": []
    },
    "razorpay": {
      "total_checked": 0,
      "reconciled": 0,
      "still_pending": []
    }
  }
}
```

## Payment Status Workflow
```
PENDING → PROCESSING → COMPLETED → REFUNDED
                   ↓           ↓
                FAILED    PARTIALLY_REFUNDED
```

| Status | Description |
|--------|-------------|
| PENDING | Payment record created, no gateway session yet |
| PROCESSING | Gateway session created, awaiting customer payment |
| COMPLETED | Payment confirmed by gateway |
| FAILED | Payment failed or expired |
| REFUNDED | Full amount refunded |
| PARTIALLY_REFUNDED | Partial amount refunded |

## Webhook Endpoints
These are called by Stripe/Razorpay, not by Node.js.

### Stripe Webhook
- **POST** `/api/payments/webhooks/stripe/`
- **Headers:** `Stripe-Signature`
- **Events handled:** `checkout.session.completed`, `checkout.session.expired`, `charge.refunded`, `charge.dispute.created`

### Razorpay Webhook
- **POST** `/api/payments/webhooks/razorpay/`
- **Headers:** `X-Razorpay-Signature`
- **Events handled:** `payment.captured`, `payment.failed`, `refund.processed`, `refund.failed`

## Notification to Node.js Backend
After a payment status changes, the Payment Service will call the Node.js backend to update order status.

### Endpoint Node.js Must Implement
- **POST** `/api/orders/{orderId}/payment-confirmed`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer {shared-api-key}`
- **Request Body:**
```json
{
  "orderId": "ORD-123",
  "paymentStatus": "COMPLETED",
  "paymentData": {
    "gateway_payment_id": "pi_123...",
    "refund_id": null,
    "refund_amount": null
  }
}
```
- **Expected Response:** `200 OK` with `{"success": true}`.
- **Retry Policy:** The Payment Service will retry up to 3 times with exponential backoff (2s, 4s).

## Error Codes

| HTTP Status | Meaning |
|-------------|---------|
| 400 | Bad request (invalid input, webhook signature) |
| 401 | Missing or invalid API key |
| 404 | Payment not found |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
| 502 | Gateway error (Stripe/Razorpay failure) |

## Rate Limits (Development)
- Payment creation: 10/min
- Payment status query: 20/min
- Refund: 5/min

## Contact
For questions, contact Abdulmalik (Payment Service developer).