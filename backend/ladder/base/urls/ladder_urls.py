from django.urls import path
from base.views import ladder_views as views

urlpatterns = [
    # Original function-based views
    path('admin/',views.getLadders, name="ladders"), 
    path('user/',views.getUsersLadders, name="ladders"),
    path('user/list/',views.getUsersLadderList, name="user ladder list"),
    path('lookupt/<str:symbol>/',views.lookupStock, name="lookup stock"),
    path('lookupc/<str:symbol>/',views.lookupCrypto, name="lookup crypto"),
    path('<str:pk>/',views.getLadder, name="ladder"),
    path('create',views.createLadder, name="create ladder"),
    path('bulk-create',views.bulkCreateLadders, name="bulk create ladders"),
    
    path('update/<str:pk>/',views.updateLadder, name="update ladder"),
    path('delete/<str:pk>/',views.deleteLadder, name="delete ladder"),
    path('updateenabled/<str:pk>/',views.updateEnabledLadder, name="update enabled ladder"),
    
]