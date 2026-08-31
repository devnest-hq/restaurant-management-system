from django.urls import path
from . import views, views_webhooks

app_name = 'payments'

urlpatterns = [
    path('create-payment/', views.CreatePaymentView.as_view(), name='create-payment'),
    path('health/', views.HealthCheckView.as_view(), name='health-check'),
    path('status/<str:order_id>/', views.PaymentStatusView.as_view(), name='payment-status'),
    path('refund/', views.RefundPaymentView.as_view(), name='refund-payment'),
    path('reconcile/', views.ReconciliationView.as_view(), name='reconcile-payments'),
    path('webhooks/stripe/', views_webhooks.stripe_webhook, name='stripe-webhook'),
    path('webhooks/razorpay/', views_webhooks.RazorpayWebhookView.as_view(), name='razorpay-webhook'),
]