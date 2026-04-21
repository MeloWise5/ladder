from django.contrib.auth.models import User
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from .models import Profile, APICredentials, Transactions, MonthlyLadderSnapshot
import pytz
from datetime import datetime

# signal to update the username to be the email before saving the user
@receiver(pre_save, sender=User)
def updateUser(sender, instance, **kwargs):
    user = instance
    if user.email:
        user.username = user.email

# when a new user is created the profile for that user is automatically created
@receiver(post_save, sender=User)
def create_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)


def _parse_ts(value):
    """Return an Eastern-aware datetime from a Unix timestamp string, or None."""
    if not value or value == '0':
        return None
    eastern = pytz.timezone('America/New_York')
    try:
        return datetime.fromtimestamp(float(value), tz=eastern)
    except (ValueError, TypeError, OSError):
        return None


def _recalc_month(ladder, year, month):
    """
    Recalculate and upsert a MonthlyLadderSnapshot row for the given ladder/year/month.
    Marks is_closed=True when the calendar month is in the past AND every transaction
    opened that month has been closed.
    """
    eastern = pytz.timezone('America/New_York')
    now = datetime.now(eastern)

    all_txns = ladder.transactions_set.all()
    profit = 0.0
    debt = 0.0
    buy_count = 0
    sell_count = 0

    for txn in all_txns:
        # Buy count — keyed on buy_placed month
        buy_dt = _parse_ts(txn.buy_placed)
        if buy_dt and buy_dt.year == year and buy_dt.month == month:
            buy_count += 1
            # Debt: open positions still deployed from that month's buys
            if txn.status != 'CLOSED' and txn.buy_total:
                debt += float(txn.buy_total)

        # Sell count + profit — keyed on sell_date month
        if txn.status == 'CLOSED':
            sell_dt = _parse_ts(txn.sell_date)
            if sell_dt and sell_dt.year == year and sell_dt.month == month:
                sell_count += 1
                if txn.profit:
                    profit += float(txn.profit)

    # A month is fully closed when it's in the past and no open buys remain from it
    month_is_past = (year, month) < (now.year, now.month)
    is_closed = month_is_past and (debt == 0.0)

    MonthlyLadderSnapshot.objects.update_or_create(
        ladder=ladder,
        year=year,
        month=month,
        defaults={
            'profit': round(profit, 2),
            'debt': round(debt, 2),
            'buy_count': buy_count,
            'sell_count': sell_count,
            'is_closed': is_closed,
        }
    )


@receiver(post_save, sender=Transactions)
def update_monthly_snapshot(sender, instance, **kwargs):
    """Recalculate the monthly snapshot row(s) affected by this transaction save."""
    if not instance.ladder:
        return

    months_to_update = set()

    buy_dt = _parse_ts(instance.buy_placed)
    if buy_dt:
        months_to_update.add((buy_dt.year, buy_dt.month))

    sell_dt = _parse_ts(instance.sell_date)
    if sell_dt:
        months_to_update.add((sell_dt.year, sell_dt.month))

    for year, month in months_to_update:
        _recalc_month(instance.ladder, year, month)
