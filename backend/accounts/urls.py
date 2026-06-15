from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, RoleViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'roles', RoleViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('register/', UserViewSet.as_view({'post': 'register'}), name='register'),
    path('me/', UserViewSet.as_view({'get': 'me'}), name='me'),
    path('update-profile/', UserViewSet.as_view({'put': 'update_profile', 'patch': 'update_profile'}), name='update_profile'),
    path('change-password/', UserViewSet.as_view({'post': 'change_password'}), name='change_password'),
]