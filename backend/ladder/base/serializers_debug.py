# Temporary debug script to diagnose the daily count issue
# Run this to see what values are actually in the database

from datetime import datetime, date
import pytz

# Paste the values of buy_placed from one of your open orders here for testing
test_timestamps = [
    # Example: 1738800000,  # Add actual values from your database
]

eastern = pytz.timezone('America/New_York')
today_eastern = datetime.now(eastern).date()

print(f"Today's date in Eastern time: {today_eastern}")
print(f"Today's date in UTC: {datetime.utcnow().date()}")
print(f"Today's date in Server time: {date.today()}")
print("\n" + "="*50 + "\n")

for ts in test_timestamps:
    try:
        if isinstance(ts, str):
            timestamp = float(ts)
        else:
            timestamp = float(ts)
        
        # Convert to Eastern
        utc_dt = datetime.utcfromtimestamp(timestamp).replace(tzinfo=pytz.UTC)
        eastern_dt = utc_dt.astimezone(eastern)
        eastern_date = eastern_dt.date()
        
        print(f"Timestamp: {ts}")
        print(f"  UTC datetime: {utc_dt}")
        print(f"  Eastern datetime: {eastern_dt}")
        print(f"  Eastern date: {eastern_date}")
        print(f"  Matches today? {eastern_date == today_eastern}")
        print()
    except Exception as e:
        print(f"Error parsing {ts}: {e}")
        print()
