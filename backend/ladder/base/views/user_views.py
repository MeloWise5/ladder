from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.contrib.auth.models import User
from base.models import Ladders, APICredentials, Profile
from base.serializers import LadderSerializer, UserSerializer, UserListSerializer, UserSerializerWithToken, APICredentialsSerializer, ProfileSerializer
from django.contrib.auth.hashers import make_password
from rest_framework import status


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