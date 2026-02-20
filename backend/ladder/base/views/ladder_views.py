from urllib import response
from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import viewsets, status
from django.db.models import Avg, Sum, Count, Q
from base.models import Ladders, APICredentials
from base.serializers import LadderSerializer, LadderListAdminSerializer, LadderListSerializer
from django.utils import timezone
import requests
import os
from dotenv import load_dotenv


@api_view(['GET'])
def getLadders(request):
    ladders = Ladders.objects.all().order_by('_id')
    serializer = LadderListAdminSerializer(ladders, many=True)
    return Response(serializer.data)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getUsersLadders(request):
    ladders = Ladders.objects.filter(user=request.user).prefetch_related(
        'steps_set',
        'transactions_set'
    ).order_by('_id')
    serializer = LadderSerializer(ladders, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getUsersLadderList(request):
    ladders = Ladders.objects.filter(user=request.user).order_by('name')
    serializer = LadderListSerializer(ladders, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def getLadder(request, pk):
    ladder = Ladders.objects.get(_id=pk)
    serializer = LadderSerializer(ladder, many=False)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def createLadder(request):
    current_timestamp = int(timezone.now().timestamp())
    # the idea is to pre fill the eniter ladder so when the page shows 
    # up you techinally are just ediitting the dummy data. 
    ladder = Ladders.objects.create(
        user=request.user,
        name = 'Sample Name',
        budget = 0,
        cap =  10,
        cover =  0,
        debt =  0,
        direction = 'Both',
        enable = False,
        gap =  0,
        highest =  0,
        last =  0,
        lcd = str(current_timestamp),
        limit_price_in_percentage = 0,
        lowest =  0,
        market = '',
        profit_per_trade = 0,
        profit = 0,
        shares_per_trade = 0,
        stop_price_in_percentage = 0,
        symbol_name = '',
        symbol = '',
        createdAt = str(current_timestamp),
    )
    serializer = LadderSerializer(ladder, many=False)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bulkCreateLadders(request):
    ladders_data = request.data.get('ladders', [])
    results = {'success': [], 'failed': []}
    current_timestamp = int(timezone.now().timestamp())
    
    for ladder_data in ladders_data:
        try:
            ladder = Ladders.objects.create(
                user=request.user,
                name=ladder_data.get('name', ladder_data.get('symbol', 'Unnamed')),
                symbol=ladder_data.get('symbol', ''),
                symbol_name=ladder_data.get('symbol', ''),
                type=ladder_data.get('type', ''),
                gap=float(ladder_data.get('gap', 0)),
                shares_per_trade=float(ladder_data.get('shares_per_trade', 0)),
                profit_per_trade=float(ladder_data.get('profit_per_trade', 0)),
                market=ladder_data.get('market', ''),
                direction=ladder_data.get('direction', 'Both'),
                budget=float(ladder_data.get('budget', 0)),
                cap=float(ladder_data.get('cap', 10)),
                amount_per_trade=float(ladder_data.get('amount_per_trade', 0)),
                percent_per_trade=float(ladder_data.get('percent_per_trade', 0)),
                limit_price_in_percentage=float(ladder_data.get('limit_price_in_percentage', 0)),
                stop_price_in_percentage=float(ladder_data.get('stop_price_in_percentage', 0)),
                enable=False,
                cover=0,
                debt=0,
                highest=0,
                last=0,
                lowest=0,
                profit=0,
                lcd=str(current_timestamp),
                createdAt=str(current_timestamp),
            )
            results['success'].append({
                'symbol': ladder_data.get('symbol'),
                'id': ladder._id
            })
        except Exception as e:
            results['failed'].append({
                'symbol': ladder_data.get('symbol', 'Unknown'),
                'error': str(e)
            })
    
    return Response(results, status=status.HTTP_201_CREATED)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def updateLadder(request, pk):
    data = request.data
    ladder = Ladders.objects.get(_id=pk)
    ladder.name = data['name']
    ladder.amount_per_trade = float(data['amount_per_trade'])
    ladder.budget = float(data['budget'])
    ladder.buffer_52_week = float(data['buffer_52_week'])
    ladder.cap = float(data['cap'])
    ladder.direction = data['direction']
    ladder.enable = data['enable']
    ladder.gap = float(data['gap'])
    ladder.limit_price_in_percentage = float(data['limit_price_in_percentage'])
    ladder.market = data['market']
    ladder.profit_per_trade = float(data['profit_per_trade'])
    ladder.percent_per_trade = float(data['percent_per_trade'])
    ladder.shares_per_trade = float(data['shares_per_trade'])
    ladder.stop_price_in_percentage = float(data['stop_price_in_percentage'])
    ladder.symbol = data['symbol']
    ladder.symbol_name = data['symbol_name']
    ladder.type = data['type']

    ladder.save()

    serializer = LadderSerializer(ladder, many=False)
    return Response(serializer.data)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def updateEnabledLadder(request, pk):
    try:
        data = request.data
        ladder = Ladders.objects.get(_id=pk)
        ladder.enable = data['enable']
        ladder.save()

        serializer = LadderSerializer(ladder, many=False)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': 'API call failed', 'details': str(e)}, status=500)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def updateAlertLadder(request, pk):
    try:
        data = request.data
        ladder = Ladders.objects.get(_id=pk)
        ladder.alert = data.get('alert', '')
        ladder.save()

        serializer = LadderSerializer(ladder, many=False)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': 'API call failed', 'details': str(e)}, status=500)

@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def deleteLadder(request, pk):
    ladder = Ladders.objects.get(_id=pk)
    ladder.delete()
    return Response('Ladder Deleted')

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def lookupStock(request, symbol):
    try:
        load_dotenv()
        TRADIER_TOKEN = os.getenv("TRADIER_TOKEN")
        TRADIER_ACCOUNT_ID = os.getenv("TRADIER_ACCOUNT_ID")

        url = f"https://api.tradier.com/v1/markets/lookup"
        params = {'q': symbol, 'type': 'stock'}
        headers = {
            'Authorization': f'Bearer {TRADIER_TOKEN}',
            'Accept': 'application/json'
        }
        
        response = requests.get(url, params=params, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            
            # Check if securities key exists
            if 'securities' not in data or data['securities'] is None:
                print(f"\n=== TRADIER LOOKUP: '{symbol}' - NO RESULTS ===\n")
                return Response({'securities': {'security': []}})
            
            # Safely get the list (Tradier wraps single results differently sometimes)
            securities = data.get('securities', {}).get('security', [])
            
            # Handle None or empty response
            if securities is None:
                print(f"\n=== TRADIER LOOKUP: '{symbol}' - NONE RETURNED ===\n")
                return Response({'securities': {'security': []}})
            
            # Handle case where there's only one result (not in a list)
            if not isinstance(securities, list):
                securities = [securities] if securities else []
            
            # Debug logging
            print(f"\n=== TRADIER LOOKUP for '{symbol}' ===")
            print(f"Total results: {len(securities)}")
            print(f"First 5 symbols: {[s.get('symbol', 'N/A') for s in securities[:5]]}")
            
            # Check if RR is in the results
            if symbol.upper() == 'RR':
                rr_results = [s for s in securities if s.get('symbol') == 'RR']
                if rr_results:
                    print(f"✓ FOUND RR: {rr_results[0].get('description', 'N/A')}")
                else:
                    print(f"✗ RR NOT FOUND in {len(securities)} results")
            print("=" * 50 + "\n")
            
            # Sort by symbol length (shortest first) so exact matches appear at top
            securities_sorted = sorted(securities, key=lambda x: len(x.get('symbol', '')))
            
            # Take top 200 for better search results
            top_200 = securities_sorted[:200]
            
            # Return in the same structure Tradier uses
            return Response({'securities': {'security': top_200}})
        else:
            return Response({'error': 'API call failed', 'details': response.text}, status=500)
    except Exception as e:
        import traceback
        return Response({
            'error': 'Internal server error', 
            'details': str(e),
            'traceback': traceback.format_exc()
        }, status=500)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def lookupCrypto(request, symbol):

    url = "https://api.exchange.coinbase.com/products"
    response = requests.get(url)
    
    if response.status_code == 200:
        response.raise_for_status()  # raises if not 200
        products = response.json()
        # Filter online USDC pairs and get unique base currencies
        usdc_pairs = [
            p for p in products 
            if p.get('quote_currency') == 'USD' and p.get('status') == 'online'
        ]
        
        # Get unique symbols
        all_symbols = sorted(set(p['base_currency'].lower() + '|' + p['display_name'].lower() for p in usdc_pairs))
        # Filter by the user's input if provided
        if symbol:
            
            filtered = [{'symbol':s.split('|')[0].upper(),
                         "description": s.split('|')[1].upper()} for s in all_symbols if s.startswith(symbol)]
        else:
            filtered = all_symbols
        
        # Limit to top 10 (or whatever) for autocomplete
        top_10 = filtered[:10]
        # Return in the same structure Tradier uses
        return Response({'securities': {'security': top_10}})
    else:
        return Response({'error': 'API call failed', 'details': response.text}, status=500)
    
