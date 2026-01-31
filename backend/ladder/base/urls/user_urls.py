from django.urls import path
from base.views import user_views as views


urlpatterns = [
    path('login/',views.MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('register/',views.registerUser, name="user_register"),

    path('profile/',views.getUserProfile, name="user_profile"),
    path('profile/update/',views.updateUserProfile, name="user_profile_update"),
    path('profile/paid/<str:pk>/',views.enableUserProfile, name="user_profile_enable"),

    path('credentials/',views.createAPICredentials, name="create_api_credentials"),
    path('credentials/get/',views.getCredentials, name="get_api_credentials"),
    path('credentials/update/',views.updateAPICredentials, name="update_api_credentials"),
    path('credentials/<str:pk>/',views.getAPICredentialsByID, name="get_api_credentials_id"),
    path('credentials/delete/<str:pk>/',views.deleteAPICredentials, name="delete_api_credentials"), 
    path('credentials/enable/<str:pk>/',views.updateEnabledCredentials, name="enable_api_credentials"), 

    path('',views.getUsers, name="users"),
    path('<str:pk>/',views.getUserByID, name="user_id"),
    path('update/<str:pk>/',views.updateUser, name="user_update"),
    path('delete/<str:pk>/',views.deleteUser, name="user_delete"),
    

]