from django.contrib import admin
from .models import Payment, Refund


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = [
        'order_id', 'amount', 'currency', 'method',
        'status', 'gateway_payment_id', 'created_at'
    ]
    list_filter = ['status', 'method', 'currency', 'created_at']
    search_fields = ['order_id', 'gateway_payment_id', 'idempotency_key']
    readonly_fields = ['id', 'created_at', 'updated_at', 'webhook_received_at']
    ordering = ['-created_at']


@admin.register(Refund)
class RefundAdmin(admin.ModelAdmin):
    list_display = [
        'payment', 'refund_amount', 'currency', 'status',
        'gateway_refund_id', 'created_at'
    ]
    list_filter = ['status', 'currency', 'created_at']
    search_fields = ['payment__order_id', 'gateway_refund_id']
    readonly_fields = ['id', 'created_at', 'updated_at', 'webhook_received_at']
    ordering = ['-created_at']