from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from collections import defaultdict
from base.models import Ladders, Transactions, MonthlyLadderSnapshot
from base.signals import _parse_ts
import pytz
from datetime import datetime


class Command(BaseCommand):
    help = 'Backfill MonthlyLadderSnapshot from all existing transactions'

    def handle(self, *args, **options):
        eastern = pytz.timezone('America/New_York')
        now = datetime.now(eastern)

        ladders = Ladders.objects.all()
        self.stdout.write(f'Processing {ladders.count()} ladder(s)...')

        total_rows = 0

        for ladder in ladders:
            all_txns    = ladder.transactions_set.all()
            closed_txns = all_txns.filter(status='CLOSED')
            open_txns   = all_txns.exclude(status='CLOSED')

            monthly = defaultdict(lambda: {'profit': 0.0, 'debt': 0.0, 'buy_count': 0, 'sell_count': 0})

            # Profit + sell count — keyed on sell_date month
            for txn in closed_txns:
                sell_dt = _parse_ts(txn.sell_date)
                if sell_dt:
                    et = sell_dt.astimezone(eastern)
                    key = (et.year, et.month)
                    if txn.profit:
                        monthly[key]['profit'] += float(txn.profit)
                    monthly[key]['sell_count'] += 1

            # Buy count — keyed on buy_placed month
            for txn in all_txns:
                buy_dt = _parse_ts(txn.buy_placed)
                if buy_dt:
                    et = buy_dt.astimezone(eastern)
                    key = (et.year, et.month)
                    monthly[key]['buy_count'] += 1

            # Debt — open positions deployed from that month's buys
            for txn in open_txns:
                if txn.buy_total:
                    buy_dt = _parse_ts(txn.buy_placed)
                    if buy_dt:
                        et = buy_dt.astimezone(eastern)
                        key = (et.year, et.month)
                        monthly[key]['debt'] += float(txn.buy_total)

            for (year, month), data in monthly.items():
                month_is_past = (year, month) < (now.year, now.month)
                is_closed = month_is_past and (data['debt'] == 0.0)

                MonthlyLadderSnapshot.objects.update_or_create(
                    ladder=ladder,
                    year=year,
                    month=month,
                    defaults={
                        'profit':     round(data['profit'], 2),
                        'debt':       round(data['debt'], 2),
                        'buy_count':  data['buy_count'],
                        'sell_count': data['sell_count'],
                        'is_closed':  is_closed,
                    }
                )
                total_rows += 1
                self.stdout.write(
                    f'  [{ladder.name}] {year}/{month:02d} — '
                    f'profit=${data["profit"]:.2f}  debt=${data["debt"]:.2f}  '
                    f'buys={data["buy_count"]}  sells={data["sell_count"]}  '
                    f'closed={is_closed}'
                )

        self.stdout.write(self.style.SUCCESS(f'\nDone. {total_rows} row(s) written to MonthlyLadderSnapshot.'))
