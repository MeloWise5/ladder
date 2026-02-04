from django.contrib.auth.models import User
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from .models import Profile, APICredentials

# signal to update the username to be the email before saving the user
# signals are the push nitification system in django
# they allow certain senders to notify a set of receivers that some action has taken place
@receiver(pre_save, sender=User)
def updateUser(sender, instance, **kwargs):
    user = instance
    if user.email:
        user.username = user.email

# when a new user is created the profile for that user is automatically created
@receiver(post_save, sender=User)
def create_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)
