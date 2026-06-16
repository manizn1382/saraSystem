from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AccommodationRequestViewSet, BedAssignmentViewSet

router = DefaultRouter()
router.register(r'requests', AccommodationRequestViewSet)
router.register(r'assignments', BedAssignmentViewSet)

urlpatterns = [
    path('', include(router.urls)),
]