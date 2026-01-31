from django.contrib import admin
from .models import Ladders, Steps, Transactions, Profile, APICredentials, Snapshot, Historical

# Register your models here.
admin.site.register(Ladders)
admin.site.register(Steps)
admin.site.register(Transactions)
admin.site.register(Profile)
admin.site.register(APICredentials)
admin.site.register(Snapshot)
admin.site.register(Historical)