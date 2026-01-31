from django.urls import path
from base.views import snapshot_views as views

urlpatterns = [
    path('<str:pk>/',views.getLadderSnapshots, name="ladder"),
    path('chart/profit/<str:pk>/',views.getLadderSnapshotsChart, name="snapshot-ladder-profit"),
    path('chart/historical/<str:symbol>/',views.getHistoricalChart, name="historical"),

    
]