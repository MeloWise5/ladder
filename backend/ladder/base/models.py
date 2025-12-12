from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class Ladders(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    name = models.CharField(max_length=255, null=True, blank=True)
    budget = models.IntegerField(default=0, null=True, blank=True)
    cap = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True) 
    cover = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True) 
    debt = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True) 
    direction = models.CharField(max_length=10, null=True, blank=True)
    enable = models.BooleanField(default=False, null=True, blank=False)
    gap = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True) 
    highest = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True) 
    last = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True) 
    lcd = models.CharField(max_length=255, null=True, blank=True)
    limit_price_in_percentage = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    lowest = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True) 
    market = models.CharField(max_length=255, null=True, blank=True)
    profit_per_trade = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    profit = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    shares_per_trade = models.DecimalField(max_digits=16, decimal_places=16, null=True, blank=True)
    stop_price_in_percentage = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    symbol_name = models.CharField(max_length=255, null=True, blank=True)
    symbol = models.CharField(max_length=10, null=True, blank=True)
    createdAt = models.DateTimeField(auto_now_add=True) 
    _id = models.AutoField(primary_key=True, editable=False)

    def __str__(self):
        return self.name
class Steps(models.Model):
    ladder = models.ForeignKey(Ladders, on_delete=models.CASCADE, null=True)
    step_code = models.CharField(max_length=255, null=True, blank=True)
    price = models.IntegerField(default=0, null=True, blank=True)
    status = models.TextField(null=True, blank=True)
    _id = models.AutoField(primary_key=True, editable=False)

    def __str__(self):
        return str(self.rating)