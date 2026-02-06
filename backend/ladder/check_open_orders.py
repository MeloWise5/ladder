#!/usr/bin/env python
"""
Diagnostic script to check open order timestamps
Run with: python manage.py shell < check_open_orders.py
"""

from base.models import Transactions
from datetime import datetime
import pytz

eastern = pytz.timezone('America/New_York')
today_eastern = datetime.now(eastern).date()

print(f"\n{'='*70}")
print(f"Today's date in Eastern time: {today_eastern}")
print(f"{'='*70}\n")

# Get all open transactions
open_trans = Transactions.objects.exclude(status='CLOSED')

print(f"Total open transactions: {open_trans.count()}")
print(f"\nFirst 5 open transactions:\n")

for trans in open_trans[:5]:
    print(f"Transaction ID: {trans._id}")
    print(f"  Ladder: {trans.ladder.name if trans.ladder else 'None'}")
    print(f"  buy_placed: {repr(trans.buy_placed)}")
    print(f"  buy_placed type: {type(trans.buy_placed)}")
    
    if trans.buy_placed and trans.buy_placed != '0':
        try:
            if isinstance(trans.buy_placed, str):
                timestamp = float(trans.buy_placed)
            else:
                timestamp = float(trans.buy_placed)
            
            utc_dt = datetime.utcfromtimestamp(timestamp).replace(tzinfo=pytz.UTC)
            eastern_dt = utc_dt.astimezone(eastern)
            eastern_date = eastern_dt.date()
            
            print(f"  Parsed Eastern datetime: {eastern_dt}")
            print(f"  Parsed Eastern date: {eastern_date}")
            print(f"  Is today? {eastern_date == today_eastern}")
        except Exception as e:
            print(f"  ERROR parsing: {e}")
    else:
        print(f"  (buy_placed is empty or '0')")
    
    print()

# Count how many were placed today using our logic
count_today = 0
for trans in open_trans:
    if trans.buy_placed and trans.buy_placed != '0':
        try:
            if isinstance(trans.buy_placed, str):
                timestamp = float(trans.buy_placed)
            else:
                timestamp = float(trans.buy_placed)
            
            utc_dt = datetime.utcfromtimestamp(timestamp).replace(tzinfo=pytz.UTC)
            eastern_dt = utc_dt.astimezone(eastern)
            eastern_date = eastern_dt.date()
            
            if eastern_date == today_eastern:
                count_today += 1
        except:
            pass

print(f"\n{'='*70}")
print(f"Open transactions placed TODAY (Eastern): {count_today}")
print(f"{'='*70}\n")
