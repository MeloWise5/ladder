from django.shortcuts import render
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.sites.shortcuts import get_current_site
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from django.contrib.auth.models import User
from base.models import Ladders, APICredentials, Profile
from base.serializers import LadderSerializer, UserSerializer, UserListSerializer, UserSerializerWithToken, APICredentialsSerializer, ProfileSerializer
from django.contrib.auth.hashers import make_password
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


########################################################################
# this allows us to customize the token data 
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token['username'] = user.username
        token['email'] = user.email
        return token
    def validate(self, attrs):
        data = super().validate(attrs)
        # we are just chaning the data we output for this JWT token. 
        # this loops over all the user attributes and outputs them as an dictionary
        # this makes it easier to grab infromation without having to decode the JWT everytime after login
        serializer = UserSerializerWithToken(self.user).data
        for k, v in serializer.items():
            data[k] = v 
        return data
# now update the main view with the update serializer
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
########################################################################


@api_view(['POST'])
def registerUser(request):
    data = request.data
    try:
        # we are creating a new user here
        # this is the django User model
        user = User.objects.create(
            first_name=data['name'],
            username=data['email'],
            email=data['email'],
            password=make_password(data['password'])# this hashes the passwrod to be secure
        )
        serializer = UserSerializerWithToken(user, many=False)# this is why we create the UserSerializerWithToken so we can get the token right after registering
        return Response(serializer.data)
    except:
        # this is demostrating how to send custom error messages
        # whenever we get a bad request this will be triggered
        message = {'detail': 'User with this email already exists'}
        return Response(message, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def resetUser(request):
    email = (request.data.get('email') or '').strip().lower()

    # Always return same response shape (prevents email enumeration)
    generic_response = {
        'detail': 'If an account exists for that email, a reset link has been sent.'
    }

    if not email:
        return Response(generic_response, status=status.HTTP_200_OK)

    try:
        user = User.objects.filter(email__iexact=email).first()

        if user and user.is_active:
            uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)

            # If you have FRONTEND_URL in settings, use it; fallback to current domain
            frontend_base = getattr(settings, 'FRONTEND_URL', '').rstrip('/')
            if frontend_base:
                reset_url = f"{frontend_base}/#/reset-password/{uidb64}/{token}"
            else:
                domain = get_current_site(request).domain
                reset_url = f"http://{domain}/#/reset-password/{uidb64}/{token}"

            subject = "Reset your password"
            message = (
                f"Hi {user.first_name or user.username},\n\n"
                f"Use the link below to reset your password:\n{reset_url}\n\n"
                "If you did not request this, you can ignore this email."
            )

            send_mail(
                subject=subject,
                message=message,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None),
                recipient_list=[user.email],
                fail_silently=False,
            )

        return Response(generic_response, status=status.HTTP_200_OK)

    except Exception:
        logger.exception("resetUser: failed to process reset request for email=%s", email)
        # Keep external response generic
        return Response(generic_response, status=status.HTTP_200_OK)


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def resetPassword(request):
    uidb64 = request.data.get('uidb64')
    token = request.data.get('token')
    new_password = request.data.get('password')

    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)

        if user and default_token_generator.check_token(user, token):
            user.password = make_password(new_password)
            user.save()
            return Response({'detail': 'Password reset successful'}, status=status.HTTP_200_OK)
        else:
            return Response({'detail': 'Invalid reset link'}, status=status.HTTP_400_BAD_REQUEST)

    except Exception:
        logger.exception("resetPassword: invalid reset attempt")
        return Response({'detail': 'Invalid reset link'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def updateUserProfile(request):
    user = request.user # access token user data
    serializer = UserSerializerWithToken(user, many=False)
    data = request.data # data past by form
    user.first_name = data['name']
    user.username = data['email']
    user.email = data['email']
    if data['password'] != '':
        user.password = make_password(data['password'])
    user.save()
    profile = user.profile
    profile.phone_number = data.get('phone_number', profile.phone_number)
    profile.carrier = data.get('carrier', profile.carrier)
    profile.save()
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def getUsers(request):
    # path: /api/users/
    # super powerfull. does left joins to get related profile data in one query
    users = User.objects.select_related('profile').all().order_by('id')
    serializer = UserListSerializer(users, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def getUserByID(request, pk):
    users = User.objects.get(id=pk)
    serializer = UserSerializer(users, many=False)
    return Response(serializer.data)

@api_view(['PUT'])
@permission_classes([IsAdminUser])
def updateUser(request, pk):
    user = User.objects.get(id=pk)
    
    data = request.data # data past by form
    user.first_name = data['name']
    user.username = data['email']
    user.email = data['email']
    user.is_staff = data['isAdmin']
    user.save()
    serializer = UserSerializer(user, many=False)
    
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getUserProfile(request):
    user = request.user # token user data
    serializer = UserSerializer(user, many=False)
    return Response(serializer.data)

@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def deleteUser(request, pk):
    user = User.objects.get(id=pk)
    user.delete()
    return Response('User Deleted')

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def enableUserProfile(request,pk):
    data = request.data # data past by form
    user = User.objects.get(id=pk)
    profile = user.profile
    profile.paid = data['paid']
    profile.save()
    serializer = ProfileSerializer(profile, many=False)
    return Response(serializer.data)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def updateProfileNotifications(request):
    user = request.user
    data = request.data
    profile = user.profile
    profile.weekly_report  = data.get('weekly_report',  profile.weekly_report)
    profile.monthly_report = data.get('monthly_report', profile.monthly_report)
    profile.notify_email   = data.get('notify_email',   profile.notify_email)
    profile.notify_sms     = data.get('notify_sms',     profile.notify_sms)
    profile.save()
    serializer = ProfileSerializer(profile, many=False)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def createAPICredentials(request):
    try:
        platform = 'ADEFAULT'
        credentials = {'default_key': '123'}  # Must be a dict for encryption
        
        # Check if credentials for this user and platform already exist
        if APICredentials.objects.filter(user=request.user, platform=platform).exists():
            return Response(
                {'error': 'Credentials for this platform already exist'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create new API credentials
        api_credentials = APICredentials.objects.create(
            user=request.user,
            platform=platform
        )
        
        # Encrypt and save credentials
        api_credentials.set_credentials(credentials)
        api_credentials.is_active = False
        api_credentials.save()
        
        serializer = APICredentialsSerializer(api_credentials, many=False)
        return Response({
            'message': 'Credentials created successfully',
            'data': serializer.data
        })
        
    except Exception as e:
        print(f"Error in createAPICredentials: {str(e)}")  # Debug logging
        import traceback
        traceback.print_exc()  # Print full traceback
        return Response(
            {'error': 'Failed to create credentials', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getCredentials(request):
    try:    
        # Get all credentials for this user (could have TRADIER and COINBASE)
        api_credentials = APICredentials.objects.filter(user=request.user).order_by('platform')
        
        # If user has no credentials, return empty array
        if not api_credentials.exists():
            return Response([])
        
        # Return list of all platforms with masked credentials status
        credentials_list = []
        for cred in api_credentials:
            if cred.platform == 'ADEFAULT':
                has_credentials = False  # Default credentials always exist
            elif cred.platform == 'TRADIER' or cred.platform == 'COINBASE':
                has_credentials = True
            credentials_list.append({
                '_id': cred._id,
                'platform': cred.platform,
                'is_active': cred.is_active,
                'has_credentials': has_credentials  # Don't send actual credentials to React
            })
        
        return Response(credentials_list)
        
    except Exception as e:
        print(f"Error in getCredentials: {str(e)}")  # Debug logging
        import traceback
        traceback.print_exc()  # Print full traceback
        return Response(
            {'error': 'Failed to retrieve credentials', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def updateAPICredentials(request):
    try:
        data = request.data
        _id = data.get('cred_id')
        api_cred = APICredentials.objects.get(_id=_id, user=request.user)
        api_cred.platform = data['platform']
        api_cred.set_credentials(data['credentials'])
        api_cred.save()

        serializer = APICredentialsSerializer(api_cred, many=False)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': 'API call failed', 'details': str(e)}, status=500)
    
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def deleteAPICredentials(request, pk):
    api_cred = APICredentials.objects.get(_id=pk, user=request.user)
    api_cred.delete()
    return Response('Credentials Deleted')

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getAPICredentialsByID(request, pk):
    api_cred = APICredentials.objects.get(_id=pk, user=request.user)
    serializer = APICredentialsSerializer(api_cred, many=False)
    return Response(serializer.data)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def updateEnabledCredentials(request, pk):
    try:
        data = request.data
        credentials = APICredentials.objects.get(_id=pk, user=request.user)
        credentials.is_active = data['is_active']
        credentials.save()

        serializer = APICredentialsSerializer(credentials, many=False)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': 'API call failed', 'details': str(e)}, status=500)