from django.core.management.base import BaseCommand
from django.db.models import Count, Sum, Q
from django.utils import timezone
from datetime import timedelta

from payments.models import Payment, Refund


class Command(BaseCommand):
    help = 'Display payment statistics and health summary.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=7,
            help='Number of days to look back (default: 7)',
        )

    def handle(self, *args, **options):
        days = options['days']
        cutoff = timezone.now() - timedelta(days=days)

        self.stdout.write(self.style.MIGRATE_HEADING(
            f'\n===== Payment Service Stats (Last {days} days) =====\n'
        ))

        # Total payments
        total_payments = Payment.objects.filter(created_at__gte=cutoff).count()
        self.stdout.write(f'Total payments created: {total_payments}')

        # Breakdown by status
        self.stdout.write('\n--- By Status ---')
        status_counts = (
            Payment.objects
            .filter(created_at__gte=cutoff)
            .values('status')
            .annotate(count=Count('id'))
        )
        for entry in status_counts:
            self.stdout.write(f"  {entry['status']}: {entry['count']}")

        # Breakdown by method
        self.stdout.write('\n--- By Payment Method ---')
        method_counts = (
            Payment.objects
            .filter(created_at__gte=cutoff)
            .values('method')
            .annotate(count=Count('id'))
        )
        for entry in method_counts:
            self.stdout.write(f"  {entry['method']}: {entry['count']}")

        # Total revenue (completed payments)
        self.stdout.write('\n--- Revenue ---')
        revenue = (
            Payment.objects
            .filter(
                created_at__gte=cutoff,
                status=Payment.PaymentStatus.COMPLETED,
            )
            .aggregate(total=Sum('amount'))
        )
        self.stdout.write(f"  Total completed revenue: {revenue['total'] or 0}")

        # Stuck payments (PROCESSING for more than 30 min)
        stuck_cutoff = timezone.now() - timedelta(minutes=30)
        stuck_count = Payment.objects.filter(
            status=Payment.PaymentStatus.PROCESSING,
            updated_at__lt=stuck_cutoff,
        ).count()
        self.stdout.write(f'\n--- Health ---')
        self.stdout.write(f'  Stuck payments (PROCESSING > 30 min): {stuck_count}')

        # Notifications not sent to Node.js
        unnotified_count = Payment.objects.filter(
            status__in=[
                Payment.PaymentStatus.COMPLETED,
                Payment.PaymentStatus.FAILED,
                Payment.PaymentStatus.REFUNDED,
                Payment.PaymentStatus.PARTIALLY_REFUNDED,
            ],
            node_notified_at__isnull=True,
        ).count()
        self.stdout.write(f'  Payments not yet notified to Node.js: {unnotified_count}')

        # Total refunds
        refund_count = Refund.objects.filter(created_at__gte=cutoff).count()
        refund_total = (
            Refund.objects
            .filter(
                created_at__gte=cutoff,
                status=Refund.RefundStatus.COMPLETED,
            )
            .aggregate(total=Sum('refund_amount'))
        )
        self.stdout.write(f'\n--- Refunds ---')
        self.stdout.write(f'  Total refunds created: {refund_count}')
        self.stdout.write(f"  Total refunded amount: {refund_total['total'] or 0}")

        self.stdout.write(self.style.SUCCESS('\n===== End =====\n'))