from django.db import models
from django.contrib.auth.models import User
from cryptography.fernet import Fernet
import json
import os

# Create your models here.
class Ladders(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    name = models.CharField(max_length=255, null=True, blank=True)
    alert = models.TextField(default='', blank=True)
    amount_per_trade = models.IntegerField(default=0, null=True, blank=True)
    budget = models.IntegerField(default=0, null=True, blank=True)
    buffer_52_week = models.PositiveSmallIntegerField(default=0)
    cap = models.DecimalField(default=0,max_digits=12, decimal_places=2, null=True, blank=True) 
    cover = models.DecimalField(default=0,max_digits=12, decimal_places=2, null=True, blank=True) 
    debt = models.DecimalField(default=0,max_digits=12, decimal_places=2, null=True, blank=True) 
    direction = models.CharField(max_length=10, null=True, blank=True)
    enable = models.BooleanField(default=False, null=True, blank=False)
    gap = models.DecimalField(default=0,max_digits=7, decimal_places=2, null=True, blank=True) 
    highest = models.DecimalField(default=0,max_digits=20, decimal_places=6, null=True, blank=True) 
    last = models.DecimalField(default=0,max_digits=20, decimal_places=6, null=True, blank=True) 
    percent_change_24h = models.DecimalField(default=0,max_digits=20, decimal_places=6, null=True, blank=True) 
    lcd = models.CharField(max_length=255, null=True, blank=True)
    limit_price_in_percentage = models.DecimalField(default=0,max_digits=2, decimal_places=0, null=True, blank=True)
    lowest = models.DecimalField(default=1000000,max_digits=20, decimal_places=6, null=True, blank=True) 
    market = models.CharField(max_length=255, null=True, blank=True)
    profit_per_trade = models.DecimalField(default=0,max_digits=12, decimal_places=6, null=True, blank=True)
    percent_per_trade = models.DecimalField(default=0,max_digits=2, decimal_places=0, null=True, blank=True)
    profit = models.DecimalField(default=0,max_digits=12, decimal_places=2, null=True, blank=True)
    shares_per_trade = models.DecimalField(default=0,max_digits=20, decimal_places=16, null=True, blank=True)
    stop_price_in_percentage = models.DecimalField(default=0,max_digits=2, decimal_places=0, null=True, blank=True)
    symbol_name = models.CharField(max_length=255, null=True, blank=True)
    symbol = models.CharField(max_length=10, null=True, blank=True)
    type = models.CharField(max_length=10, null=True, blank=True)
    createdAt = models.DateTimeField(auto_now_add=True) 
    _id = models.AutoField(primary_key=True, editable=False)

    def __str__(self):
        return f"{str(self._id)} - {str(self.name)} - {str(self.user)}"

class Transactions(models.Model):
    _id = models.AutoField(primary_key=True, editable=False)

    ladder = models.ForeignKey(Ladders, on_delete=models.CASCADE, null=True)
    step = models.ForeignKey('Steps', on_delete=models.CASCADE, null=True)
    
    order_id = models.CharField(max_length=255, null=True, blank=True)
    profit = models.DecimalField(default=0, max_digits=6, decimal_places=2, null=True, blank=True)
    shares_per_trade = models.DecimalField(default=0,max_digits=12, decimal_places=6, null=True, blank=True)
    symbol = models.CharField(max_length=10, null=True, blank=True)
    status = models.CharField(max_length=10, default='OPEN', help_text="Transaction status")

    buy_date = models.CharField(max_length=255, null=True, blank=True)
    buy_fee = models.DecimalField(max_digits=5, decimal_places=4, null=True, blank=True)
    buy_id = models.CharField(max_length=255, null=True, blank=True)
    buy_placed = models.CharField(max_length=255, null=True, blank=True)
    buy_price = models.DecimalField(default=0,max_digits=20, decimal_places=6, null=True, blank=True)
    buy_total = models.DecimalField(default=0,max_digits=9, decimal_places=2, null=True, blank=True)
    
    sell_date = models.CharField(max_length=255, null=True, blank=True)
    sell_fee = models.DecimalField(default=0,max_digits=5, decimal_places=4, null=True, blank=True)
    sell_id = models.CharField(max_length=255, null=True, blank=True)
    sell_placed = models.CharField(max_length=255, null=True, blank=True)
    sell_price = models.DecimalField(default=0,max_digits=12, decimal_places=6, null=True, blank=True)
    sell_total = models.DecimalField(default=0,max_digits=5, decimal_places=2, null=True, blank=True)
    
    def __str__(self):
        return f"{str(self._id)} - {str(self.status)} - {str(self.ladder.name)}"
    
class Steps(models.Model):
    ladder = models.ForeignKey(Ladders, on_delete=models.CASCADE, null=True)
    transaction = models.ForeignKey(Transactions, on_delete=models.SET_NULL, null=True,blank=True)
    step_code = models.CharField(max_length=255, null=True, blank=True, unique=False)
    price = models.DecimalField(default=0, max_digits=20, decimal_places=6, null=True, blank=True)
    status = models.TextField(null=True, blank=True)
    _id = models.AutoField(primary_key=True, editable=False)
    
    class Meta:
        unique_together = ('ladder', 'step_code')

    def __str__(self):
        return f"{str(self._id)} {str(self.step_code)}"
    
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, related_name='profile')
    paid = models.BooleanField(default=False)
    percentage = models.IntegerField(default=0)
    _id = models.AutoField(primary_key=True, editable=False)

    def __str__(self):
        return f"Profile of {self.user.username}"

class APICredentials(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='api_credentials')
    platform = models.CharField(max_length=200, default='ADefaultPlatform')
    encrypted_credentials = models.TextField(default='123')
    is_active = models.BooleanField(default=True)
    _id = models.AutoField(primary_key=True, editable=False)
    
    class Meta:
        unique_together = ('user', 'platform')
        verbose_name_plural = 'API Credentials'
    
    def __str__(self):
        return f"{self.user.username} - {self.platform}"
    
    @staticmethod
    def get_cipher():
        """Get Fernet cipher using encryption key from environment"""
        key = os.getenv('ENCRYPTION_KEY').encode()
        return Fernet(key)
    
    def set_credentials(self, credentials_dict):
        """Encrypt and store credentials as JSON"""
        cipher = self.get_cipher()
        json_data = json.dumps(credentials_dict)
        encrypted = cipher.encrypt(json_data.encode())
        self.encrypted_credentials = encrypted.decode()
    
    def get_credentials(self):
        """Decrypt and return credentials as dictionary"""
        cipher = self.get_cipher()
        decrypted = cipher.decrypt(self.encrypted_credentials.encode())
        return json.loads(decrypted.decode())

class Snapshot(models.Model):
    ladder = models.ForeignKey(Ladders, on_delete=models.CASCADE, null=True)
    date = models.TextField(null=True, blank=True)
    debt = models.DecimalField(default=0, max_digits=20, decimal_places=6, null=True, blank=True)
    profit = models.DecimalField(default=0, max_digits=20, decimal_places=6, null=True, blank=True)
    daily_debt = models.DecimalField(default=0, max_digits=20, decimal_places=6, null=True, blank=True)
    daily_profit = models.DecimalField(default=0, max_digits=20, decimal_places=6, null=True, blank=True)
    _id = models.AutoField(primary_key=True, editable=False)

    def __str__(self):
        return f'Snapshot - {str(self.date)} - {str(self.ladder)}'

class Historical(models.Model):
    symbol_name = models.TextField(null=True, blank=True)
    symbol = models.TextField(null=True, blank=True)
    date = models.TextField(null=True, blank=True)
    close = models.DecimalField(default=0, max_digits=20, decimal_places=6, null=True, blank=True)
    open = models.DecimalField(default=0, max_digits=20, decimal_places=6, null=True, blank=True)
    high = models.DecimalField(default=0, max_digits=20, decimal_places=6, null=True, blank=True)
    low = models.DecimalField(default=0, max_digits=20, decimal_places=6, null=True, blank=True)
    volume = models.DecimalField(default=0, max_digits=20, decimal_places=6, null=True, blank=True)
    _id = models.AutoField(primary_key=True, editable=False)

    def __str__(self):
        return f'Historical - {str(self.date)} - {str(self.symbol)}'
   