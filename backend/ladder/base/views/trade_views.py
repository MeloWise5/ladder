from openai import OpenAI
from urllib import response
from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from base.models import Ladders, Snapshot, APICredentials, Transactions, Steps
from base.serializers import LadderSerializer, SnapshotSerializer
from django.utils import timezone
from rest_framework import status
import os
import requests
import os
import httpx
from dotenv import load_dotenv
from coinbase.rest import RESTClient
import traceback



def load_exchange(user_data,EXCHANGE_NAME):
    
    # Use filter to find credentials - more flexible than get
    creds = APICredentials.objects.filter(
        user=user_data, 
        is_paid=True # t'aint nothing free
    )
    
    # Try to find by platform name (case-insensitive)
    exhange_cred = None
    for cred in creds:
        if cred.platform.upper() == EXCHANGE_NAME.upper():
            exhange_cred = cred
            break
    
    if not exhange_cred:
        return f'No active EXCHANGE: {EXCHANGE_NAME} credentials found. Available platforms: {[c.platform for c in creds]}'
    
    cred = exhange_cred
    
    # Decrypt credentials
    decrypted = cred.get_credentials()
    #print(f'Decrypted credentials for {EXCHANGE_NAME}: {decrypted}')
    # Extract credential fields
    if EXCHANGE_NAME.upper() == "COINBASE":
        api_key = decrypted.get('api_key')
        private_key = decrypted.get('private_key')
    else:
        api_key = decrypted.get('tradier_account_id')
        private_key = decrypted.get('tradier_token')
    
    if not api_key or not private_key:
        print('Invalid credential format')
        return False
    
    api_data = {
        'api_key': api_key,
        'private_key': private_key
    }
    return api_data



       



@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def crypto_delete_trade(request, order_id):
    print(f'crypto_delete_trade called with order_id: {order_id}')
    """
    Cancel a Coinbase order using the authenticated user's decrypted credentials.
    Requires user to have active Coinbase credentials in the database.
    """
    try:
        # Get user's Coinbase credentials from database
        user = request.user
        data = request.data
        api_data = load_exchange(user, "COINBASE")
        if not api_data:
            return Response({
                'error': 'No active Coinbase credentials found for user.'
            }, status=status.HTTP_400_BAD_REQUEST)
        # Initialize Coinbase REST Client with proper authentication
        
        coinbase_client = RESTClient(api_data['api_key'], api_data['private_key'])
        
        print(f'RESTClient initialized, canceling order: {order_id}')
        
        # Cancel order using SDK (handles JWT signing automatically)
        # order_ids expects a list
        cancel_response = coinbase_client.cancel_orders(order_ids=[order_id])
        
        print(f'Cancel response: {cancel_response}')
        transaction_id = data.get('transaction_id')
        side = data.get('side')
        step_id = data.get('step_id')
        
        if side == 'BUY':
            from base.models import Transactions
            transaction = Transactions.objects.get(_id=transaction_id)
            transaction.delete()
            from base.models import Steps
            step_obj = Steps.objects.get(_id=step_id)
            step_obj.status = 'OPEN'
            step_obj.transaction = None
            step_obj.save()
        elif side == 'SELL':
            from base.models import Transactions
            transaction = Transactions.objects.get(_id=transaction_id)
            transaction.sell_id = 0
            transaction.sell_placed = 0
            transaction.save()
            from base.models import Steps
            step_obj = Steps.objects.get(_id=step_id)
            step_obj.status = 'BUY'
            step_obj.save()
        

        return Response({
            'message': 'Order cancelled successfully',
            'order_id': order_id,
            'success': True
        }, status=status.HTTP_200_OK)
            
    except Exception as e:
        print(f'Exception in crypto_delete_trade: {str(e)}')
        import traceback
        print(traceback.format_exc())
        return Response({
            'error': 'Failed to cancel order', 
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def stocks_delete_trade(request, order_id):
    print(f'stocks_delete_trade called with order_id: {order_id}')
    """
    Cancel a Stocks order using the authenticated user's decrypted credentials.
    Requires user to have active Stocks credentials in the database.

    Cancel response: {'order': {'id': 109531659, 'status': 'ok'}}
    """
    try:
        # Get user's Stocks credentials from database
        user = request.user
        data = request.data
        api_data = load_exchange(user, "TRADIER")
        
        if not api_data:
            return Response({
                'error': 'No active Stocks credentials found for user.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Construct headers directly
        headers = {
            'Authorization': f"Bearer {api_data['private_key']}", 
            'Accept': 'application/json'
        }
        
        resp = requests.delete(
            f'https://api.tradier.com/v1/accounts/{api_data["api_key"]}/orders/{order_id}', 
            headers=headers
        )
        resp.raise_for_status()
        
        print(f'Cancel response: {resp.json()}')
        
        # Update transaction and step status based on side
        transaction_id = data.get('transaction_id')
        side = data.get('side')
        step_id = data.get('step_id')
        
        from base.models import Steps, Transactions
        
        if side == 'BUY':
            # Update step status FIRST before removing transaction
            step_obj = Steps.objects.get(_id=step_id)
            step_obj.status = 'OPEN'
            step_obj.save()
            
            # Then update transaction
            transaction = Transactions.objects.get(_id=transaction_id)
            transaction.delete()
            
            # Finally remove transaction reference from step
            step_obj.transaction = None
            step_obj.save()
            
        elif side == 'SELL':
            # Update step status FIRST before removing transaction
            step_obj = Steps.objects.get(_id=step_id)
            step_obj.status = 'BUY'
            step_obj.save()
            
            # Then update transaction
            transaction = Transactions.objects.get(_id=transaction_id)
            transaction.sell_id = 0
            transaction.sell_placed = 0
            transaction.save()
        
        return Response({
            'message': 'Order cancelled successfully',
            'order_id': order_id,
            'success': True
        }, status=status.HTTP_200_OK)
            
    except Exception as e:
        print(f'Exception in stocks_delete_trade: {str(e)}')
        import traceback
        print(traceback.format_exc())
        return Response({
            'error': 'Failed to cancel order', 
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def delete_transaction(request, pk):
    transaction = Transactions.objects.get(_id=pk)
    transaction.delete()
    return Response('Transaction Deleted')  

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_trade_suggestions(request, suggestion_data=None):
    """
    Get trade suggestions for a given stock symbol using an external API.
    """

    # response from api
    '''
    [
        [
            "id",
            "ec184e03-2c92-4b1c-6367-7f04626c6b1d"
        ],
        [
            "created_at",
            1769329172
        ],
        [
            "error",
            null
        ],
        [
            "incomplete_details",
            null
        ],
        [
            "instructions",
            null
        ],
        [
            "metadata",
            {}
        ],
        [
            "model",
            "grok-4-0709"
        ],
        [
            "object",
            "response"
        ],
        [
            "output",
            [
            [
                [
                "id",
                "msg_ec184e03-2c92-4b1c-6367-7f04626c6b1d"
                ],
                [
                "content",
                [
                    [
                    [
                        "annotations",
                        []
                    ],
                    [
                        "text",
                        "[\n  {\n    \"symbol\": \"AMC\",\n    \"profit\": 450.25,\n    \"debt\": 1200.50\n  },\n  {\n    \"symbol\": \"F\",\n    \"profit\": 320.75,\n    \"debt\": 950.00\n  },\n  {\n    \"symbol\": \"NIO\",\n    \"profit\": 280.40,\n    \"debt\": 1100.20\n  },\n  {\n    \"symbol\": \"SNDL\",\n    \"profit\": 150.60,\n    \"debt\": 800.30\n  },\n  {\n    \"symbol\": \"PLTR\",\n    \"profit\": 410.90,\n    \"debt\": 1300.75\n  },\n  {\n    \"symbol\": \"SOFI\",\n    \"profit\": 290.15,\n    \"debt\": 1050.40\n  },\n  {\n    \"symbol\": \"LCID\",\n    \"profit\": 360.80,\n    \"debt\": 1150.60\n  },\n  {\n    \"symbol\": \"RIVN\",\n    \"profit\": 220.50,\n    \"debt\": 900.00\n  },\n  {\n    \"symbol\": \"CLF\",\n    \"profit\": 380.20,\n    \"debt\": 1250.80\n  },\n  {\n    \"symbol\": \"AAL\",\n    \"profit\": 310.35,\n    \"debt\": 1000.50\n  }\n]"
                    ],
                    [
                        "type",
                        "output_text"
                    ],
                    [
                        "logprobs",
                        []
                    ]
                    ]
                ]
                ],
                [
                "role",
                "assistant"
                ],
                [
                "status",
                "completed"
                ],
                [
                "type",
                "message"
                ]
            ]
            ]
        ],
        [
            "parallel_tool_calls",
            true
        ],
        [
            "temperature",
            0.7
        ],
        [
            "tool_choice",
            "auto"
        ],
        [
            "tools",
            []
        ],
        [
            "top_p",
            0.95
        ],
        [
            "background",
            false
        ],
        [
            "completed_at",
            1769329191
        ],
        [
            "conversation",
            null
        ],
        [
            "max_output_tokens",
            null
        ],
        [
            "max_tool_calls",
            null
        ],
        [
            "previous_response_id",
            null
        ],
        [
            "prompt",
            null
        ],
        [
            "prompt_cache_key",
            null
        ],
        [
            "prompt_cache_retention",
            null
        ],
        [
            "reasoning",
            [
            [
                "effort",
                "medium"
            ],
            [
                "generate_summary",
                null
            ],
            [
                "summary",
                "detailed"
            ]
            ]
        ],
        [
            "safety_identifier",
            null
        ],
        [
            "service_tier",
            "default"
        ],
        [
            "status",
            "completed"
        ],
        [
            "text",
            [
            [
                "format",
                [
                [
                    "type",
                    "text"
                ]
                ]
            ],
            [
                "verbosity",
                null
            ]
            ]
        ],
        [
            "top_logprobs",
            0
        ],
        [
            "truncation",
            "disabled"
        ],
        [
            "usage",
            [
            [
                "input_tokens",
                921
            ],
            [
                "input_tokens_details",
                [
                [
                    "cached_tokens",
                    676
                ]
                ]
            ],
            [
                "output_tokens",
                1047
            ],
            [
                "output_tokens_details",
                [
                [
                    "reasoning_tokens",
                    739
                ]
                ]
            ],
            [
                "total_tokens",
                1968
            ],
            [
                "num_sources_used",
                0
            ],
            [
                "num_server_side_tools_used",
                0
            ],
            [
                "cost_in_usd_ticks",
                169470000
            ]
            ]
        ],
        [
            "user",
            null
        ],
        [
            "store",
            true
        ],
        [
            "presence_penalty",
            0
        ],
        [
            "frequency_penalty",
            0
        ]
        ]
'''
    try:
        # Get data from request body
        suggestion_data = request.data
        
        symbol = suggestion_data.get('symbol', '')
        market = suggestion_data.get('market', '')
        ladder_type = suggestion_data.get('ladder_type', '')
        gap = suggestion_data.get('gap', 0)
        budget = suggestion_data.get('budget', 0)
        cap = suggestion_data.get('cap', 0)
        profit_per_trade = suggestion_data.get('profit_per_trade', 0)
        amount_per_trade = suggestion_data.get('amount_per_trade', 0)
        debt = suggestion_data.get('debt', 0)
        direction = suggestion_data.get('direction', 'Both')
        last = suggestion_data.get('last', 0)
        limit_price_in_percentage = suggestion_data.get('limit_price_in_percentage', 0)
        percent_per_trade = suggestion_data.get('percent_per_trade', 0)
        shares_per_trade = suggestion_data.get('shares_per_trade', 0)
        stop_price_in_percentage = suggestion_data.get('stop_price_in_percentage', 0)
        #print(ladder_type)
        if ladder_type.lower() == 'fixed':
            prompt = f"""
You are a precise stock grid trading simulator. Return ONLY a valid JSON array — no explanations, no extra text, no markdown, nothing else.

First, use web_search or browse_page tools to find the top 10 most volatile stocks under $20 and above 5$ with an upward trend over 6 months (based on recent volatility metrics like beta, ATR, or % swings, as of January 2026). Extract their symbols (US-listed, good volume >500k avg daily). from any blog posts, articles, or lists about volatile stocks. grab the first list of 10 or more you find using the keyword "most volatile stocks under $20". this should speed you up as that is not the main task finding the stocks is just a pre-step.

Then, for each of the 10, run a real simulation using actual historical minute-bar data (via Polygon in code_execution tool) from the last day of the stock market.

Grid strategy rules:
- Grid gap = ${cap}
- Buy trigger: Whenever the minute-bar close crosses or lands exactly on a new {cap} multiple that wasn't previously occupied.
- Check crossings in both directions (up or down) — if price moves from below to at/above a level, or above to at/below, trigger if level free.
- Buy exactly {shares_per_trade} shares at the triggered price level only if no open position exists at that exact level.
- No duplicate buys at the same level until sold.
- Sell: Automatically when price >= buy_level + ${cap} for that specific position → realize $0.40 profit ({shares_per_trade} shares × ${cap}), close the position, free the level.
- Track: realized_profit (cumulative from all sells), debt = sum of ({shares_per_trade} × buy_price) for all currently open positions at end of period.
- Special rule: If the overall period percent change is positive, force debt = 0.00 (assume liquidation of opens at final price, add any unrealized to profit).

bring back the year change for the time periods of week, month, six month, year from today. 
  

Output exactly this structure as a JSON array with the TOP 10 objects:
[
  {{
    "symbol": "TICKER",
    "currentPrice": number (latest close or last trade),
    "percentChange": {{
      "week": string like "+5.2%" or "-3.1%",
      "month": string,
      "sixMonth": string,
      "year": string
    }},
    "ladderData": {{
      "week": {{ "profit": number with 2 decimals, "debt": number with 2 decimals }},
    }},
    "strategyNotes": "Short one-sentence note on performance/volatility"
  }},
  ... (9 more)
]

Use real data only — no estimates. If data fetch limited for any stock, skip it and note in strategyNotes. Return ONLY the JSON array.
"""
            
        elif ladder_type.lower() == 'percentage':
            prompt = f"""You are a stock analysis assistant. Return ONLY valid JSON, no additional text or explanations.
Analyze stocks under ${amount_per_trade/2} suitable for a grid trading strategy with these parameters:
- Buy 5 shares every ${gap} price movement (up or down)
- Sell when price increases {percent_per_trade}% from buy point
- Never duplicate buys at the same price marker
- When keeping tracking of profit and debt suing simulation. remove the buy price from the debt when a sell occurs.
- Use the following ladder parameters:               
- Example stock already in use: {symbol}
- example issue - if you say the year to now price change is + any value you must also reflect that in the profit/loss data. meaning the debt should be zero. 

Return exactly 10 different stocks as a JSON array with this structure:
[
  {{
    "symbol": "TICKER",
    "currentPrice": 1.25,
    "percentChange": {{
      "week": "+5.1%",
      "month": "-2.3%",
      "sixMonth": "+12.4%",
      "year": "-15.7%"
    }},
    "ladderData": {{
      "week": {{ "profit": 45.20, "debt": 120.00 }},
      "month": {{ "profit": 210.50, "debt": 340.00 }},
      "sixMonth": {{ "profit": 890.75, "debt": 560.00 }},
      "year": {{ "profit": 1450.30, "debt": 780.00 }}
    }},
    "strategyNotes": "Brief explanation"
  }}
]

IMPORTANT: 
- Debt = current value of open orders only (fluctuates, not cumulative)
- Return ONLY the JSON array, no other text
- Use "sixMonth" not "6month" for valid JSON keys"""
        elif ladder_type.lower() == 'otoco':
            prompt = f"""You are a stock analysis assistant. Return ONLY valid JSON, no additional text or explanations.
Analyze stocks under ${amount_per_trade/2} suitable for a OTOCO conditional trading strategy with these parameters:
- Buy {shares_per_trade} shares every ${gap} price movement (up or down)
- Sell when price increases {limit_price_in_percentage}% from buy point or decreases {stop_price_in_percentage}% from buy point sell the trade
- Never duplicate buys at the same price marker
- When keeping tracking of profit and debt suing simulation. remove the buy price from the debt when a sell occurs.
- Use the following ladder parameters:               
- Example stock already in use: {symbol}
- example issue - if you say the year to now price change is + any value you must also reflect that in the profit/loss data. meaning the debt should be zero. 

Return exactly 10 different stocks as a JSON array with this structure:
[
  {{
    "symbol": "TICKER",
    "currentPrice": 1.25,
    "percentChange": {{
      "week": "+5.1%",
      "month": "-2.3%",
      "sixMonth": "+12.4%",
      "year": "-15.7%"
    }},
    "ladderData": {{
      "week": {{ "profit": 45.20, "debt": 120.00 }},
      "month": {{ "profit": 210.50, "debt": 340.00 }},
      "sixMonth": {{ "profit": 890.75, "debt": 560.00 }},
      "year": {{ "profit": 1450.30, "debt": 780.00 }}
    }},
    "strategyNotes": "Brief explanation"
  }}
]

IMPORTANT: 
- Debt = current value of open orders only (fluctuates, not cumulative)
- Return ONLY the JSON array, no other text
- Use "sixMonth" not "6month" for valid JSON keys"""
            

        client = OpenAI(
            api_key=os.getenv('GROK_API'),
            base_url="https://api.x.ai/v1",
            timeout=httpx.Timeout(3600.0), # Override default timeout with longer timeout for reasoning models
        )
        response = client.responses.create(
            model="grok-4",
            input=[
                {"role": "system", "content": prompt},
            ],
        )
        
        # Extract the actual stock data from the nested response
        import json
        try:
            # Convert response object to dict
            response_dict = response.model_dump() if hasattr(response, 'model_dump') else dict(response)
            
            print(f'Full response_dict: {response_dict}')
            
            # Navigate through the nested structure
            output = response_dict['output'][0]
            print(f'Output: {output}')
            
            content = output['content'][0]
            print(f'Content: {content}')
            
            text_data = content['text']
            print(f'Text data: {text_data}')
            print(f'Text data type: {type(text_data)}')
            
            # Parse the JSON string to get the actual stock array
            stock_suggestions = json.loads(text_data)
            
            return Response({
                'success': True,
                'suggestions': stock_suggestions,
                'response_id': response_dict['id']
            })
        except (IndexError, KeyError, json.JSONDecodeError, AttributeError) as parse_error:
            print(f'Error parsing response: {str(parse_error)}')
            print(f'Parse error type: {type(parse_error)}')
            import traceback
            print(f'Full traceback: {traceback.format_exc()}')
            
            # Fallback: return raw response if parsing fails
            try:
                response_dict = response.model_dump() if hasattr(response, 'model_dump') else dict(response)
            except:
                response_dict = str(response)
            return Response({
                'success': False,
                'raw_response': response_dict,
                'error': f'Failed to parse response structure: {str(parse_error)}'
            })
        
        # The response ID that can be used to continue the conversation later
        #print(response.id)
        
    except Exception as e:
        print(f'Exception in get_trade_suggestions: {str(e)}')
        import traceback
        print(traceback.format_exc())
        return Response({
            'error': 'Failed to retrieve trade suggestions', 
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)