from django.urls import path
from . import views, views_webhooks

app_name = 'payments'

urlpatterns = [
    path('create-payment/', views.CreatePaymentView.as_view(), name='create-payment'),
    path('health/', views.HealthCheckView.as_view(), name='health-check'),
    path('webhooks/stripe/', views_webhooks.stripe_webhook, name='stripe-webhook'),
    path('webhooks/razorpay/', views_webhooks.RazorpayWebhookView.as_view(), name='razorpay-webhook'),
]