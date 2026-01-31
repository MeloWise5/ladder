from django.urls import path
from base.views import trade_views as views


urlpatterns = [

    #path('crypto/',views.getLadders, name="ladders"), 
    path('suggestions/',views.get_trade_suggestions, name="get_trade_suggestions"),
    path('suggestions/<str:symbol>/',views.get_trade_suggestions, name="get_trade_suggestions_with_symbol"),
    path('crypto/delete/<str:order_id>/',views.crypto_delete_trade, name="crypto_delete_trade"), 
    path('stocks/delete/<str:order_id>/',views.stocks_delete_trade, name="stocks_delete_trade"), 
    
    path('transactions/delete/<str:pk>/',views.delete_transaction, name="transactions_delete_trade"), 
    
    #path('stock/',views.getUsersLadders, name="ladders"),
]