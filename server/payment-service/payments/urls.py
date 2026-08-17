from django.urls import path
from . import views

app_name = 'payments'

urlpatterns = [
    path('create-payment/', views.CreatePaymentView.as_view(), name='create-payment'),
    path('health/', views.HealthCheckView.as_view(), name='health-check'),
]