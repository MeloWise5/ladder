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
def getLadderSnapshotsBreakdown(request, pk):
    """Return per-ladder profit/debt series for a stacked breakdown chart."""
    from datetime import datetime, timedelta
    from collections import defaultdict

    date_method = request.GET.get('date_method', 'all')
    now = timezone.now()
    if date_method == 'week':
        start_date = now - timedelta(weeks=1)
    elif date_method == 'month':
        start_date = now - timedelta(days=30)
    elif date_method == 'year':
        start_date = now - timedelta(days=365)
    else:
        start_date = None

    user_ladders = Ladders.objects.filter(user=request.user)

    if start_date:
        snapshot_qs = Snapshot.objects.filter(
            ladder__in=user_ladders,
            date__gte=start_date.strftime('%Y-%m-%d')
        ).order_by('date').select_related('ladder')
    else:
        snapshot_qs = Snapshot.objects.filter(
            ladder__in=user_ladders
        ).order_by('date').select_related('ladder')

    # Collect all dates (sorted unique) and per-ladder data
    all_dates = sorted(set(str(s.date) for s in snapshot_qs))

    # Build { ladder_id: { date: {profit, debt} } }
    ladder_map = {}   # id -> {name, by_date}
    for snap in snapshot_qs:
        lid = snap.ladder._id
        lname = snap.ladder.name
        date_key = str(snap.date)
        if lid not in ladder_map:
            ladder_map[lid] = {'id': lid, 'name': lname, 'by_date': {}}
        ladder_map[lid]['by_date'][date_key] = {
            'profit': round(float(snap.profit) if snap.profit else 0.0, 2),
            'debt': round(float(snap.debt) if snap.debt else 0.0, 2),
        }

    # Build aligned arrays (None = no data for that date)
    ladders_out = []
    for lid, ldata in ladder_map.items():
        profit_arr = []
        debt_arr = []
        for d in all_dates:
            entry = ldata['by_date'].get(d)
            profit_arr.append(entry['profit'] if entry else None)
            debt_arr.append(entry['debt'] if entry else None)
        ladders_out.append({
            'id': lid,
            'name': ldata['name'],
            'profit': profit_arr,
            'debt': debt_arr,
        })

    return Response({'dates': all_dates, 'ladders': ladders_out})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getHistoricalChart(request, symbol):
    from datetime import datetime, timedelta

    date_method = request.GET.get('date_method', 'all')

    # Calculate the start date based on date_method
    now = timezone.now()
    if date_method == 'day':
        start_date = now - timedelta(days=2)
        start_tran_ts = (now - timedelta(days=1)).timestamp()
    elif date_method == 'week':
        start_date = now - timedelta(days=8)
        start_tran_ts = (now - timedelta(days=7)).timestamp()
    elif date_method == 'month':
        start_date = now - timedelta(days=31)
        start_tran_ts = (now - timedelta(days=30)).timestamp()
    elif date_method == 'year':
        start_date = now - timedelta(days=366)
        start_tran_ts = (now - timedelta(days=365)).timestamp()
    else:  # 'all'
        start_date = None
        start_tran_ts = None

    # --- Historical data: use .values() to skip ORM object instantiation ---
    hist_qs = Historical.objects.filter(symbol=symbol)
    if start_date:
        hist_qs = hist_qs.filter(date__gte=start_date.strftime('%Y-%m-%d'))
    historicalChartData = list(hist_qs.order_by('date').values(
        'date', 'close', 'open', 'high', 'low', 'volume', '_id'
    ))
    # Ensure zero fallback for null fields
    for item in historicalChartData:
        for field in ('close', 'open', 'high', 'low', 'volume'):
            if item[field] is None:
                item[field] = 0

    # --- Transactions: select_related to avoid N+1 on step/ladder lookups ---
    transactions = (
        Transactions.objects
        .filter(symbol=symbol, ladder__user=request.user)
        .select_related('step', 'ladder')
        .values(
            '_id', 'profit', 'shares_per_trade',
            'buy_date', 'buy_price',
            'sell_date', 'sell_price',
            'step___id',
        )
    )

    def ts_in_range(raw_val):
        """Return True if this raw timestamp value is >= start_tran_ts (or no filter)."""
        if start_tran_ts is None:
            return True
        if not raw_val or raw_val == '0':
            return False
        try:
            return float(raw_val) >= start_tran_ts
        except (TypeError, ValueError):
            return False

    transactionData = []
    for t in transactions:
        shared = {
            'transaction_id': t['_id'],
            'step_id': t['step___id'],
            'profit': float(t['profit']) if t['profit'] else None,
            'shares': float(t['shares_per_trade']) if t['shares_per_trade'] else None,
        }
        if t['buy_date'] and ts_in_range(t['buy_date']):
            transactionData.append({
                **shared,
                'date': t['buy_date'],
                'price': float(t['buy_price']) if t['buy_price'] else 0,
                'side': 'buy',
            })
        if t['sell_date'] and ts_in_range(t['sell_date']):
            transactionData.append({
                **shared,
                'date': t['sell_date'],
                'price': float(t['sell_price']) if t['sell_price'] else 0,
                'side': 'sell',
            })

    return Response({'historical': historicalChartData, 'transactions': transactionData})