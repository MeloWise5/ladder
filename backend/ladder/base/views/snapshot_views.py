from urllib import response
from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from base.models import Ladders, Snapshot, Historical, Transactions
from base.serializers import LadderSerializer, SnapshotSerializer, HistoricalSerializer
from django.utils import timezone
from rest_framework import status
import requests
import os
from dotenv import load_dotenv


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getLadderSnapshots(request, pk):
    snapshot = Snapshot.objects.filter(ladder=pk)
    serializer = SnapshotSerializer(snapshot, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getLadderSnapshotsChart(request, pk):
    from datetime import datetime, timedelta
    from collections import defaultdict

    date_method = request.GET.get('date_method', 'all')
    print("Fetching snapshot chart data for ladder:", pk, "from date:", date_method)
    # Calculate the start date based on date_method
    now = timezone.now()
    if date_method == 'day':
        start_date = now - timedelta(days=1)
    elif date_method == 'week':
        start_date = now - timedelta(weeks=1)
    elif date_method == 'month':
        start_date = now - timedelta(days=30)
    elif date_method == 'year':
        start_date = now - timedelta(days=365)
    else:  # 'all' or any other value
        start_date = None
    
    # Check if we need to aggregate all ladders for this user
    if pk == 'all':
        # Get all ladders for the user
        user_ladders = Ladders.objects.filter(user=request.user)
        
        # Filter Snapshot data for all user's ladders
        if start_date:
            snapshot_data = Snapshot.objects.filter(
                ladder__in=user_ladders,
                date__gte=start_date.strftime('%Y-%m-%d')
            ).order_by('date')
        else:
            snapshot_data = Snapshot.objects.filter(ladder__in=user_ladders).order_by('date')
        
        # Aggregate by date - sum debt and profit for each day across all ladders
        daily_totals = defaultdict(lambda: {'debt': 0.0, 'profit': 0.0})
        
        for snapshot in snapshot_data:
            date_key = snapshot.date
            daily_totals[date_key]['debt'] += float(snapshot.debt) if snapshot.debt else 0.0
            daily_totals[date_key]['profit'] += float(snapshot.profit) if snapshot.profit else 0.0
        
        # Build response data sorted by date
        snapshotChartData = []
        for date, totals in sorted(daily_totals.items()):
            snapshotChartData.append({
                'date': date,
                'debt': round(totals['debt'], 2),
                'profit': round(totals['profit'], 2),
                '_id': None  # No single ID for aggregated data
            })
    else:
        # Single ladder - existing logic
        if start_date:
            snapshot_data = Snapshot.objects.filter(
                ladder=pk,
                date__gte=start_date.strftime('%Y-%m-%d')
            ).order_by('date')
        else:
            snapshot_data = Snapshot.objects.filter(ladder=pk).order_by('date')
        
        # Build custom data structure
        snapshotChartData = []
        if snapshot_data.exists():
            for snapshot in snapshot_data:
                snapshotChartData.append({
                    'date': snapshot.date,
                    'debt': snapshot.debt,
                    'profit': snapshot.profit,
                    '_id': snapshot._id
                })
    
    return Response(snapshotChartData)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getHistoricalChart(request, symbol):
    from datetime import datetime, timedelta
    
    date_method = request.GET.get('date_method', 'all')
    
    # Calculate the start date based on date_method
    now = timezone.now()
    if date_method == 'day':
        start_date = now - timedelta(days=2)
        start_tran_date = now - timedelta(days=1)
    elif date_method == 'week':
        start_date = now - timedelta(days=8)
        start_tran_date = now - timedelta(days=7)
    elif date_method == 'month':
        start_date = now - timedelta(days=31)
        start_tran_date = now - timedelta(days=30)
    elif date_method == 'year':
        start_date = now - timedelta(days=366)
        start_tran_date = now - timedelta(days=365)
    else:  # 'all' or any other value
        start_date = None
        start_tran_date = None

    def parse_mixed_datetime(value):
        if value is None:
            return None

        if isinstance(value, datetime):
            return value

        if isinstance(value, (int, float)):
            timestamp = float(value)
            if abs(timestamp) < 1000000000000:
                timestamp *= 1000
            try:
                return datetime.fromtimestamp(timestamp / 1000)
            except (OSError, OverflowError, ValueError):
                return None

        if isinstance(value, str):
            raw_value = value.strip()
            if not raw_value:
                return None

            try:
                numeric_value = float(raw_value)
                timestamp = numeric_value
                if abs(timestamp) < 1000000000000:
                    timestamp *= 1000
                return datetime.fromtimestamp(timestamp / 1000)
            except ValueError:
                pass

            normalized_value = raw_value.replace('Z', '+00:00')
            try:
                return datetime.fromisoformat(normalized_value)
            except ValueError:
                pass

            for fmt in ('%Y-%m-%d %H:%M:%S', '%Y-%m-%d'):
                try:
                    return datetime.strptime(raw_value, fmt)
                except ValueError:
                    continue

        return None
    
    # Filter historical data
    if start_date:
        historical_data = Historical.objects.filter(
            symbol=symbol,
            date__gte=start_date.strftime('%Y-%m-%d')
        ).order_by('date')
        transactions = Transactions.objects.filter(
            symbol=symbol,
            ladder__user=request.user
        )
    else:
        historical_data = Historical.objects.filter(symbol=symbol).order_by('date')
        # Get transactions for this symbol (only for the requesting user)
        transactions = Transactions.objects.filter(symbol=symbol, ladder__user=request.user)
    
    
    
    # Build custom data structure
    historicalChartData = []
    if historical_data.exists():
        for historical_item in historical_data:
            historicalChartData.append({
                'date': historical_item.date,
                'close': historical_item.close if historical_item.close else 0,
                'open': historical_item.open if historical_item.open else 0,
                'high': historical_item.high if historical_item.high else 0,
                'low': historical_item.low if historical_item.low else 0,
                'volume': historical_item.volume if historical_item.volume else 0,
                '_id': historical_item._id
            })
    
    # Add transaction data
    transactionData = []
    start_tran_day = start_tran_date.date() if start_tran_date else None

    def include_transaction_side(side_date):
        if not start_tran_day:
            return True
        parsed_date = parse_mixed_datetime(side_date)
        if not parsed_date:
            return False
        return parsed_date.date() >= start_tran_day

    for transaction in transactions:
        # Add buy transaction if buy_date exists
        if transaction.buy_date and include_transaction_side(transaction.buy_date):
            transactionData.append({
                'date': transaction.buy_date,
                'price': float(transaction.buy_price) if transaction.buy_price else 0,
                'side': 'buy',
                'transaction_id': transaction._id
            })
        
        # Add sell transaction if sell_date exists
        if transaction.sell_date and include_transaction_side(transaction.sell_date):
            transactionData.append({
                'date': transaction.sell_date,
                'price': float(transaction.sell_price) if transaction.sell_price else 0,
                'side': 'sell',
                'transaction_id': transaction._id
            })
    
    # Return both historical and transaction data
    response_data = {
        'historical': historicalChartData,
        'transactions': transactionData
    }
    
    #print("Fetching historical data for symbol:", symbol, response_data)
    return Response(response_data)