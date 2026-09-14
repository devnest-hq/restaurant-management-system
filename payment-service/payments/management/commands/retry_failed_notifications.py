from django.core.management.base import BaseCommand
from django.utils import timezone

from payments.models import Payment
from payments.services.notification_service import NotificationService

class Command(BaseCommand):
    help = "Retry notifications to Node.js for payments that were not successfully notified."

    def add_arguments(self, parser):
        parser.add_argument(
            '--limit',
            type=int,
            default=50,
            help = 'Maximum number of payments to retry (default: 50)',
        )

    def handle(self, *args, **options):
        limit = options['limit']
        notification_service = NotificationService()

        retryable_statuses = [
            Payment.PaymentStatus.COMPLETED,
            Payment.PaymentStatus.FAILED,
            Payment.PaymentStatus.REFUNDED,
            Payment.PaymentStatus.PARTIALLY_REFUNDED,
        ]

        payments_to_retry = Payment.objects.filter(
            status__in=retryable_statuses,
            node_notified_at__isnull=True,
        ).order_by('-created_at')[:limit]

        if not payments_to_retry .exists():
            self.stdout.write(self.style.SUCCESS('No payments needs notification retry.'))
            return

        success_count = 0
        fail_count = 0

        for payment in payments_to_retry:
            status_string = payment.status
            payment_data = {}
            if payment.status == Payment.PaymentStatus.COMPLETED:
                payment_data['gateway_payment_id'] = payment.gateway_payment_id
            elif payment.status in [Payment.PaymentStatus.REFUNDED, Payment.PaymentStatus.PARTIALLY_REFUNDED]:
                payment_data['refund_id'] = payment.refund_id
                payment_data['refund_amount'] = str(payment.refund_amount) if payment.refund_amount else None

                notified = notification_service.notify_payment_status(
                    order_id = payment.order_id,
                    payment_status = status_string,
                    payment_data = payment_data
                )

                if notified:
                    payment.node_notified_at = timezone.now()
                    payment.save(update_fields=['node_notified_at'])
                    success_count += 1
                    self.stdout.write(self.style.SUCCESS(
                        f'Successfully notified Node.js for order {payment.order_id}'
                    ))
                else:
                    fail_count += 1
                    self.stdout.write(self.style.WARNING(
                        f'Failed to notify Node.js for order {payment.order_id} after retries.'
                    ))

        self.stdout.write(self.style.SUCCESS(
            f"Retry complete: {success_count} succeeded, {fail_count} failed."
        ))