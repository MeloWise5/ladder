from rest_framework import serializers
from django.contrib.auth.models import User
from django.db.models import F, Avg, Sum, Count, Q
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Ladders, Steps, Transactions, APICredentials, Snapshot, Historical, Profile
from datetime import datetime, timedelta, date
import pytz
# Helper function to parse timestamps
def parse_timestamp(timestamp_value):
    """Parse timestamp from Unix timestamp (int/string) or ISO format - ALWAYS returns timezone-aware datetime"""
    if not timestamp_value or timestamp_value == '0' or timestamp_value == 0:
        return None
    
    eastern = pytz.timezone('America/New_York')
    
    try:
        if isinstance(timestamp_value, datetime):
            # If already a datetime, ensure it's timezone-aware
            if timestamp_value.tzinfo is None:
                return eastern.localize(timestamp_value)
            return timestamp_value
        
        if isinstance(timestamp_value, (int, float)):
            # Convert Unix timestamp to timezone-aware datetime
            return datetime.fromtimestamp(timestamp_value, tz=eastern)
        
        if isinstance(timestamp_value, str):
            try:
                # Try Unix timestamp string first
                return datetime.fromtimestamp(float(timestamp_value), tz=eastern)
            except (ValueError, TypeError):
                pass
            
            try:
                # Try ISO format
                return datetime.fromisoformat(timestamp_value.replace('Z', '+00:00'))
            except (ValueError, TypeError):
                pass
    except Exception:
        pass
    
    return None


class UserListSerializer(serializers.ModelSerializer):
    _id = serializers.SerializerMethodField(read_only=True)
    name = serializers.SerializerMethodField(read_only=True)
    isAdmin = serializers.SerializerMethodField(read_only=True)
    isPaid = serializers.SerializerMethodField(read_only=True)


    class Meta:
        model = User
        fields = ['id','_id', 'username', 'email', 'name', 'isAdmin', 'isPaid']
    # this is a way to make custom fields in serializer
    # the other way would be in teh databse. but this is easier
    def get__id(self, obj):
        return obj.id
    def get_isAdmin(self, obj):
        return obj.is_staff
    def get_name(self, obj):
        name = obj.first_name
        if name == '':
            name = obj.email
        return name
    def get_isPaid(self, obj):
        isPaid = Profile.objects.get(user=obj).paid
        return isPaid
    
    
    def get_top_5_steps_by_profit(self, obj):
        """Get top 5 steps with the most profit from closed transactions"""
        from collections import defaultdict
        
        ladders = obj.ladders_set.all()
        closed_transactions = Transactions.objects.filter(ladder__in=ladders, status='CLOSED')
        step_profit = defaultdict(float)
        step_info = {}
        
        for trans in closed_transactions:
            if trans.step and trans.profit:
                # Extract the step ID properly
                step_id = trans.step._id if hasattr(trans.step, '_id') else (trans.step.id if hasattr(trans.step, 'id') else trans.step)
                step_profit[step_id] += float(trans.profit)
                
                # Store step details for reference - get from transaction's step directly
                if step_id not in step_info:
                    step_info[step_id] = {
                        'step_code': trans.step.step_code,
                        'price': float(trans.step.price) if trans.step.price else 0,
                        'ladder_name': trans.ladder.name if trans.ladder else 'Unknown'
                    }
        
        # Sort by profit descending and take top 5
        top_5 = sorted(step_profit.items(), key=lambda x: x[1], reverse=True)[:5]
        return [{
            'step_id': int(step_id),  # Ensure it's an integer
            'step_code': step_info.get(step_id, {}).get('step_code', 'Unknown'),
            'price': step_info.get(step_id, {}).get('price', 0),
            'ladder_name': step_info.get(step_id, {}).get('ladder_name', 'Unknown'),
            'profit': round(profit, 2)
        } for step_id, profit in top_5]
       
class UserSerializer(serializers.ModelSerializer):
    _id = serializers.SerializerMethodField(read_only=True)
    name = serializers.SerializerMethodField(read_only=True)
    isAdmin = serializers.SerializerMethodField(read_only=True)
    profile = serializers.SerializerMethodField(read_only=True)
    open_transactions = serializers.SerializerMethodField(read_only=True)
    avg_transaction_profit = serializers.SerializerMethodField(read_only=True)
    closed_transaction_count = serializers.SerializerMethodField(read_only=True)
    open_transaction_count = serializers.SerializerMethodField(read_only=True)
    avg_buy_days = serializers.SerializerMethodField(read_only=True)
    avg_sell_days = serializers.SerializerMethodField(read_only=True)
    avg_trades_per_day = serializers.SerializerMethodField(read_only=True)
    avg_profit_per_day = serializers.SerializerMethodField(read_only=True)
    top_5_days_by_profit = serializers.SerializerMethodField(read_only=True)
    top_5_steps_by_profit = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = ['id','_id', 'username', 'email', 'name', 'isAdmin', 'profile',
                  'open_transactions',
                  'avg_transaction_profit', 'closed_transaction_count',
                  'open_transaction_count', 'avg_buy_days', 'avg_sell_days',
                  'avg_trades_per_day', 'avg_profit_per_day',
                  'top_5_days_by_profit', 'top_5_steps_by_profit']
    # this is a way to make custom fields in serializer
    # the other way would be in teh databse. but this is easier
    def get__id(self, obj):
        return obj.id
    def get_isAdmin(self, obj):
        return obj.is_staff
    def get_name(self, obj):
        name = obj.first_name
        if name == '':
            name = obj.email
        return name
    def get_profile(self, obj):
        try:
            profile = obj.profile
            serializer = ProfileSerializer(profile, many=False)
            return serializer.data
        except Profile.DoesNotExist:
            return None
        
    def get_open_transactions(self, obj):
        # Get all ladders for this user
        ladders = obj.ladders_set.all()
        # Get all transactions from all ladders, excluding closed ones
        transactions = Transactions.objects.filter(
            ladder__in=ladders
        ).exclude(status='CLOSED').order_by(F('sell_price').asc(nulls_last=True))
        serializer = TransactionsSerializer(transactions, many=True)
        return serializer.data
    
    
    def get_avg_transaction_profit(self, obj):
        ladders = obj.ladders_set.all()
        transactions = Transactions.objects.filter(ladder__in=ladders, status='CLOSED')
        result = transactions.aggregate(avg=Avg('profit'))
        return float(result['avg']) if result['avg'] else 0.0
    
    def get_closed_transaction_count(self, obj):
        ladders = obj.ladders_set.all()
        return Transactions.objects.filter(ladder__in=ladders, status='CLOSED').count()
    
    def get_open_transaction_count(self, obj):
        ladders = obj.ladders_set.all()
        return Transactions.objects.filter(ladder__in=ladders).exclude(status='CLOSED').count()
    
    def get_avg_buy_days(self, obj):
        """Calculate average days between buy_placed and buy_date for closed transactions"""
        ladders = obj.ladders_set.all()
        closed_transactions = Transactions.objects.filter(ladder__in=ladders, status='CLOSED')
        total_days = 0
        count = 0
        
        for trans in closed_transactions:
            if trans.buy_placed and trans.buy_date and trans.buy_placed != '0' and trans.buy_date != '0':
                buy_placed = parse_timestamp(trans.buy_placed)
                buy_date = parse_timestamp(trans.buy_date)
                
                if buy_placed and buy_date:
                    days = (buy_date - buy_placed).days
                    total_days += days
                    count += 1
        
        return round(total_days / count, 2) if count > 0 else 0.0
    
    def get_avg_sell_days(self, obj):
        """Calculate average days between sell_placed and sell_date for closed transactions"""
        ladders = obj.ladders_set.all()
        closed_transactions = Transactions.objects.filter(ladder__in=ladders, status='CLOSED')
        total_days = 0
        count = 0
        
        for trans in closed_transactions:
            if trans.sell_placed and trans.sell_date and trans.sell_placed != '0' and trans.sell_date != '0':
                sell_placed = parse_timestamp(trans.sell_placed)
                sell_date = parse_timestamp(trans.sell_date)
                
                if sell_placed and sell_date:
                    days = (sell_date - sell_placed).days
                    total_days += days
                    count += 1
        
        return round(total_days / count, 2) if count > 0 else 0.0
    
    def get_avg_trades_per_day(self, obj):
        """Calculate average number of closed trades per day"""
        ladders = obj.ladders_set.all()
        closed_transactions = Transactions.objects.filter(ladder__in=ladders, status='CLOSED')
        count = closed_transactions.count()
        
        if count == 0:
            return 0.0
        
        dates = []
        for trans in closed_transactions:
            if trans.sell_date and trans.sell_date != '0':
                sell_date = parse_timestamp(trans.sell_date)
                if sell_date:
                    # DEBUG: Log datetime info to identify naive datetimes
                    if sell_date.tzinfo is None:
                        print(f"[DEBUG] NAIVE datetime found! Transaction ID: {trans.id}, sell_date raw: {trans.sell_date}, parsed: {sell_date}")
                    dates.append(sell_date)
        
        if len(dates) < 2:
            return 0.0
        
        # Calculate days between earliest and latest transaction
        try:
            earliest = min(dates)
            latest = max(dates)
        except TypeError as e:
            # If comparison fails, log all dates for debugging
            print(f"[ERROR] DateTime comparison failed in get_avg_trades_per_day for user {obj.id}")
            for i, dt in enumerate(dates):
                print(f"  Date {i}: {dt} | Type: {type(dt)} | TZ: {dt.tzinfo}")
            raise
        
        total_days = (latest - earliest).days + 1  # +1 to include both start and end day
        
        return round(count / total_days, 2) if total_days > 0 else 0.0
    
    def get_avg_profit_per_day(self, obj):
        """Calculate average profit per day for closed transactions"""
        ladders = obj.ladders_set.all()
        closed_transactions = Transactions.objects.filter(ladder__in=ladders, status='CLOSED')
        total_profit = sum(float(t.profit) for t in closed_transactions if t.profit)
        
        if total_profit == 0:
            return 0.0
        
        dates = []
        for trans in closed_transactions:
            if trans.sell_date and trans.sell_date != '0':
                sell_date = parse_timestamp(trans.sell_date)
                if sell_date:
                    dates.append(sell_date)
        
        if len(dates) < 2:
            return 0.0
        
        # Calculate days between earliest and latest transaction
        try:
            earliest = min(dates)
            latest = max(dates)
        except TypeError as e:
            print(f"[ERROR] DateTime comparison failed in get_avg_profit_per_day for user {obj.id}")
            for i, dt in enumerate(dates):
                print(f"  Date {i}: {dt} | Type: {type(dt)} | TZ: {dt.tzinfo}")
            raise
        
        total_days = (latest - earliest).days + 1  # +1 to include both start and end day
        
        return round(total_profit / total_days, 2) if total_days > 0 else 0.0
    
    def get_top_5_days_by_profit(self, obj):
        """Get top 5 days with the most profit from closed transactions"""
        from collections import defaultdict
        
        ladders = obj.ladders_set.all()
        closed_transactions = Transactions.objects.filter(ladder__in=ladders, status='CLOSED')
        daily_profit = defaultdict(float)
        
        for trans in closed_transactions:
            if trans.sell_date and trans.sell_date != '0' and trans.profit:
                sell_date = parse_timestamp(trans.sell_date)
                if sell_date:
                    date_key = sell_date.strftime('%Y-%m-%d')
                    daily_profit[date_key] += float(trans.profit)
        
        # Sort by profit descending and take top 5
        top_5 = sorted(daily_profit.items(), key=lambda x: x[1], reverse=True)[:5]
        return [{'date': date, 'profit': round(profit, 2)} for date, profit in top_5]
    
    def get_top_5_steps_by_profit(self, obj):
        """Get top 5 steps with the most profit from closed transactions"""
        from collections import defaultdict
        
        ladders = obj.ladders_set.all()
        closed_transactions = Transactions.objects.filter(ladder__in=ladders, status='CLOSED')
        step_profit = defaultdict(float)
        step_info = {}
        
        for trans in closed_transactions:
            if trans.step and trans.profit:
                # Extract the step ID properly
                step_id = trans.step._id if hasattr(trans.step, '_id') else (trans.step.id if hasattr(trans.step, 'id') else trans.step)
                step_profit[step_id] += float(trans.profit)
                
                # Store step details for reference - get from transaction's step directly
                if step_id not in step_info:
                    step_info[step_id] = {
                        'step_code': trans.step.step_code,
                        'price': float(trans.step.price) if trans.step.price else 0,
                        'ladder_name': trans.ladder.name if trans.ladder else 'Unknown'
                    }
        
        # Sort by profit descending and take top 5
        top_5 = sorted(step_profit.items(), key=lambda x: x[1], reverse=True)[:5]
        return [{
            'step_id': int(step_id),  # Ensure it's an integer
            'step_code': step_info.get(step_id, {}).get('step_code', 'Unknown'),
            'price': step_info.get(step_id, {}).get('price', 0),
            'ladder_name': step_info.get(step_id, {}).get('ladder_name', 'Unknown'),
            'profit': round(profit, 2)
        } for step_id, profit in top_5]
    
    def to_representation(self, instance):
        """Calculate and update profit field before serializing"""
        # Calculate total closed profit across all user's ladders
        ladders = instance.ladders_set.all()
        result = Transactions.objects.filter(ladder__in=ladders, status='CLOSED').aggregate(total=Sum('profit'))
        calculated_profit = float(result['total']) if result['total'] else 0.0
        
        # Note: User model doesn't have a profit field
        # This logic might be intended for a different serializer
        
        return super().to_representation(instance)
    
class UserSerializerWithToken(UserSerializer):

    token = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = ['id','_id', 'username', 'email', 'name', 'isAdmin', 'token']
    # when we login we want to return the token along with the user data
    # this is why we extended the UserSerializer
    def get_token(self, obj):
        token = RefreshToken.for_user(obj)
        return str(token.access_token)

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = '__all__'
    # this is a way to make custom fields in serializer
    # the other way would be in teh databse. but this is easier
    def get__id(self, obj):
        return obj.id
    def get_isPaid(self, obj):
        return obj.is_paid

# Lightweight serializer for ladder lists (navigation)
class LadderListSerializer(serializers.ModelSerializer):
    closed_daily_transaction_count = serializers.SerializerMethodField(read_only=True)
    open_daily_transaction_count = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Ladders
        fields = ['_id', 'name', 'symbol', 'enable', 'profit', 'budget', 'debt', 'last','percent_change_24h', 'closed_daily_transaction_count', 'open_daily_transaction_count']

    def _get_eastern_today_date(self):
        """Get today's date in Eastern timezone"""
        eastern = pytz.timezone('America/New_York')
        now_eastern = datetime.now(eastern)
        return now_eastern.date()
    
    def _parse_timestamp_to_eastern_date(self, timestamp_value):
        """Parse timestamp and convert to Eastern timezone date"""
        if not timestamp_value or timestamp_value == '0':
            return None
        
        try:
            eastern = pytz.timezone('America/New_York')
            
            # Try Unix timestamp first
            try:
                if isinstance(timestamp_value, str):
                    timestamp = float(timestamp_value)
                else:
                    timestamp = float(timestamp_value)
                
                utc_dt = datetime.utcfromtimestamp(timestamp).replace(tzinfo=pytz.UTC)
                eastern_dt = utc_dt.astimezone(eastern)
                return eastern_dt.date()
            except ValueError:
                # Not a Unix timestamp, try ISO format
                if isinstance(timestamp_value, str):
                    utc_dt = datetime.fromisoformat(timestamp_value.replace('Z', '+00:00'))
                    if utc_dt.tzinfo is None:
                        utc_dt = utc_dt.replace(tzinfo=pytz.UTC)
                    eastern_dt = utc_dt.astimezone(eastern)
                    return eastern_dt.date()
                
        except (ValueError, TypeError, OSError):
            return None
        
        return None

    def get_closed_daily_transaction_count(self, obj):
        """Count closed transactions from today (Eastern time)"""
        transactions = obj.transactions_set.filter(status='CLOSED')
        today_eastern = self._get_eastern_today_date()
        count = 0
        
        for trans in transactions:
            if trans.sell_date and trans.sell_date != '0':
                trans_date = self._parse_timestamp_to_eastern_date(trans.sell_date)
                if trans_date and trans_date == today_eastern:
                    count += 1
        
        return count
    
    def get_open_daily_transaction_count(self, obj):
        """Count open transactions placed today (Eastern time)"""
        transactions = obj.transactions_set.exclude(status='CLOSED')
        today_eastern = self._get_eastern_today_date()
        count = 0
        
        for trans in transactions:
            if trans.buy_placed and trans.buy_placed != '0':
                trans_date = self._parse_timestamp_to_eastern_date(trans.buy_placed)
                if trans_date and trans_date == today_eastern:
                    count += 1
        
        return count

class LadderListAdminSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Ladders
        fields = ['_id', 'name','user_name', 'enable', 'symbol','symbol_name', 'market']
    
    def get_user_name(self, obj):
        user_name = User.objects.get(id=obj.user.id).username
        return user_name

    
class LadderSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField(read_only=True)
    steps = serializers.SerializerMethodField(read_only=True)
    transactions = serializers.SerializerMethodField(read_only=True)
    snapshot = serializers.SerializerMethodField(read_only=True)
    avg_transaction_profit = serializers.SerializerMethodField(read_only=True)
    closed_transaction_count = serializers.SerializerMethodField(read_only=True)
    open_transaction_count = serializers.SerializerMethodField(read_only=True)
    avg_buy_days = serializers.SerializerMethodField(read_only=True)
    avg_sell_days = serializers.SerializerMethodField(read_only=True)
    avg_trades_per_day = serializers.SerializerMethodField(read_only=True)
    avg_profit_per_day = serializers.SerializerMethodField(read_only=True)
    top_5_days_by_profit = serializers.SerializerMethodField(read_only=True)
    top_5_steps_by_profit = serializers.SerializerMethodField(read_only=True)

    
    class Meta:
        model = Ladders
        fields = '__all__'

    def get_steps(self, obj):
        steps = obj.steps_set.all().order_by('step_code')
        serializer = StepSerializer(steps, many=True)
        return serializer.data
    
    def get_user(self, obj):
        user = obj.user
        serializer = UserListSerializer(user, many=False)
        return serializer.data
    def get_transactions(self, obj):
        transactions = obj.transactions_set.all().exclude(status='CLOSED').order_by(F('sell_price').asc(nulls_last=True))
        serializer = TransactionsSerializer(transactions, many=True)
        return serializer.data

    
    def get_snapshot(self, obj):
        """Get today's snapshot for this ladder (Eastern time)"""
        try:
            eastern = pytz.timezone('America/New_York')
            now_eastern = datetime.now(eastern)
            today_eastern = now_eastern.date()
            
            # Filter for today's snapshot (Eastern time zone)
            snapshot = obj.snapshot_set.filter(date=today_eastern).latest('date')
            serializer = SnapshotSerializer(snapshot, many=False)
            return serializer.data
        except Snapshot.DoesNotExist:
            return None
    
    def get_avg_transaction_profit(self, obj):
        result = obj.transactions_set.filter(status='CLOSED').aggregate(avg=Avg('profit'))
        return float(result['avg']) if result['avg'] else 0.0
    
    def get_closed_transaction_count(self, obj):
        return obj.transactions_set.filter(status='CLOSED').count()
    
    def get_open_transaction_count(self, obj):
        return obj.transactions_set.exclude(status='CLOSED').count()
    
    def get_avg_buy_days(self, obj):
        """Calculate average days between buy_placed and buy_date for closed transactions"""
        closed_transactions = obj.transactions_set.filter(status='CLOSED')
        total_days = 0
        count = 0
        
        for trans in closed_transactions:
            if trans.buy_placed and trans.buy_date and trans.buy_placed != '0' and trans.buy_date != '0':
                buy_placed = parse_timestamp(trans.buy_placed)
                buy_date = parse_timestamp(trans.buy_date)
                
                if buy_placed and buy_date:
                    days = (buy_date - buy_placed).days
                    total_days += days
                    count += 1
        
        return round(total_days / count, 2) if count > 0 else 0.0
    
    def get_avg_sell_days(self, obj):
        """Calculate average days between sell_placed and sell_date for closed transactions"""
        closed_transactions = obj.transactions_set.filter(status='CLOSED')
        total_days = 0
        count = 0
        
        for trans in closed_transactions:
            if trans.sell_placed and trans.sell_date and trans.sell_placed != '0' and trans.sell_date != '0':
                sell_placed = parse_timestamp(trans.sell_placed)
                sell_date = parse_timestamp(trans.sell_date)
                
                if sell_placed and sell_date:
                    days = (sell_date - sell_placed).days
                    total_days += days
                    count += 1
        
        return round(total_days / count, 2) if count > 0 else 0.0
    
    def get_avg_trades_per_day(self, obj):
        """Calculate average number of closed trades per day"""
        closed_transactions = obj.transactions_set.filter(status='CLOSED')
        count = closed_transactions.count()
        
        if count == 0:
            return 0.0
        
        dates = []
        for trans in closed_transactions:
            if trans.sell_date and trans.sell_date != '0':
                sell_date = parse_timestamp(trans.sell_date)
                if sell_date:
                    # DEBUG: Log datetime info to identify naive datetimes
                    if sell_date.tzinfo is None:
                        print(f"[DEBUG] NAIVE datetime found! Transaction ID: {trans.id}, sell_date raw: {trans.sell_date}, parsed: {sell_date}")
                    dates.append(sell_date)
        
        if len(dates) < 2:
            return 0.0
        
        # Calculate days between earliest and latest transaction
        try:
            earliest = min(dates)
            latest = max(dates)
        except TypeError as e:
            # If comparison fails, log all dates for debugging
            print(f"[ERROR] DateTime comparison failed in get_avg_trades_per_day for ladder {obj.id}")
            for i, dt in enumerate(dates):
                print(f"  Date {i}: {dt} | Type: {type(dt)} | TZ: {dt.tzinfo}")
            raise
        
        total_days = (latest - earliest).days + 1  # +1 to include both start and end day
        
        return round(count / total_days, 2) if total_days > 0 else 0.0
    
    def get_avg_profit_per_day(self, obj):
        """Calculate average profit per day for closed transactions"""
        closed_transactions = obj.transactions_set.filter(status='CLOSED')
        total_profit = sum(float(t.profit) for t in closed_transactions if t.profit)
        
        if total_profit == 0:
            return 0.0
        
        dates = []
        for trans in closed_transactions:
            if trans.sell_date and trans.sell_date != '0':
                sell_date = parse_timestamp(trans.sell_date)
                if sell_date:
                    dates.append(sell_date)
        
        if len(dates) < 2:
            return 0.0
        
        # Calculate days between earliest and latest transaction
        try:
            earliest = min(dates)
            latest = max(dates)
        except TypeError as e:
            print(f"[ERROR] DateTime comparison failed in get_avg_profit_per_day for ladder {obj.id}")
            for i, dt in enumerate(dates):
                print(f"  Date {i}: {dt} | Type: {type(dt)} | TZ: {dt.tzinfo}")
            raise
        
        total_days = (latest - earliest).days + 1  # +1 to include both start and end day
        
        return round(total_profit / total_days, 2) if total_days > 0 else 0.0
    
    def get_top_5_days_by_profit(self, obj):
        """Get top 5 days with the most profit from closed transactions"""
        from collections import defaultdict
        
        closed_transactions = obj.transactions_set.filter(status='CLOSED')
        daily_profit = defaultdict(float)
        
        for trans in closed_transactions:
            if trans.sell_date and trans.sell_date != '0' and trans.profit:
                sell_date = parse_timestamp(trans.sell_date)
                
                if sell_date:
                    date_key = sell_date.strftime('%Y-%m-%d')
                    daily_profit[date_key] += float(trans.profit)
        
        # Sort by profit descending and take top 5
        top_5 = sorted(daily_profit.items(), key=lambda x: x[1], reverse=True)[:5]
        return [{'date': date, 'profit': round(profit, 2)} for date, profit in top_5]
    
    def get_top_5_steps_by_profit(self, obj):
        """Get top 5 steps with the most profit from closed transactions"""
        from collections import defaultdict
        
        closed_transactions = obj.transactions_set.filter(status='CLOSED')
        step_profit = defaultdict(float)
        step_info = {}
        
        for trans in closed_transactions:
            if trans.step and trans.profit:
                # Extract the step ID properly
                step_id = trans.step._id if hasattr(trans.step, '_id') else (trans.step.id if hasattr(trans.step, 'id') else trans.step)
                step_profit[step_id] += float(trans.profit)
                
                # Store step details for reference
                if step_id not in step_info:
                    try:
                        step_obj = obj.steps_set.get(_id=step_id)
                        step_info[step_id] = {
                            'step_code': step_obj.step_code,
                            'price': float(step_obj.price) if step_obj.price else 0
                        }
                    except:
                        step_info[step_id] = {'step_code': 'Unknown', 'price': 0}
        
        # Sort by profit descending and take top 5
        top_5 = sorted(step_profit.items(), key=lambda x: x[1], reverse=True)[:5]
        return [{
            'step_id': int(step_id),  # Ensure it's an integer
            'step_code': step_info.get(step_id, {}).get('step_code', 'Unknown'),
            'price': step_info.get(step_id, {}).get('price', 0),
            'profit': round(profit, 2)
        } for step_id, profit in top_5]
    
    def to_representation(self, instance):
        """Calculate and update profit field before serializing"""
        # Calculate total closed profit
        result = instance.transactions_set.filter(status='CLOSED').aggregate(total=Sum('profit'))
        calculated_profit = float(result['total']) if result['total'] else 0.0
        
        # Update the profit field if it's different
        if instance.profit != calculated_profit:
            instance.profit = calculated_profit
            instance.save(update_fields=['profit'])
        
        return super().to_representation(instance)

class StepSerializer(serializers.ModelSerializer):
    transaction = serializers.SerializerMethodField(read_only=True)
    class Meta:
        model = Steps
        fields = '__all__'
    def get_transaction(self, obj):
        transaction = obj.transaction
        serializer = TransactionsSerializer(transaction, many=False)
        return serializer.data
    
class TransactionsSerializer(serializers.ModelSerializer):
    step_details = serializers.SerializerMethodField(read_only=True)
    ladder_type = serializers.SerializerMethodField(read_only=True)
    ladder_market = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Transactions
        fields = '__all__'
    def get_ladder_type(self, obj):
        """Include ladder type for reference"""
        if obj.ladder:
            return obj.ladder.type
        return None
    def get_ladder_market(self, obj):
        """Include ladder market for reference"""
        if obj.ladder:
            return obj.ladder.market
        return None
    
    def get_step_details(self, obj):
        """Include step details without circular reference"""
        if obj.step:
            return {
                '_id': obj.step._id,
                'step_code': obj.step.step_code,
                'price': float(obj.step.price) if obj.step.price else 0.0,
            }
        return None

class APICredentialsSerializer(serializers.ModelSerializer):
    class Meta:
        model = APICredentials
        fields = '__all__'

class SnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = Snapshot
        fields = '__all__'

class HistoricalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Historical
        fields = '__all__'

