from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, RoleViewSet, CustomTokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'roles', RoleViewSet)

urlpatterns = [
    path('getToken/', CustomTokenObtainPairView.as_view(), name='get-token'),
    path('refreshToken/', TokenRefreshView.as_view(), name='token_refresh'),
    path('', include(router.urls)),
    path('register/', UserViewSet.as_view({'post': 'register'}), name='register'),
    path('me/', UserViewSet.as_view({'get': 'me'}), name='me'),
    path('update-profile/', UserViewSet.as_view({'put': 'update_profile', 'patch': 'update_profile'}),
         name='update_profile'),
    path('change-password/', UserViewSet.as_view({'post': 'change_password'}), name='change_password'),
]
