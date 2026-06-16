from rest_framework import generics, permissions
from dormitories.models import Dormitory
from dormitories.serializer.DormSerializers import DormitoriesInfoSerializer, DormitoryWithRoomsSerializer



class DormitoryListView(generics.ListAPIView):
    """
    GET /api/dormitories/
    """
    queryset = Dormitory.objects.all()
    serializer_class = DormitoriesInfoSerializer
    # permission_classes = [permissions.IsAuthenticated]
    permission_classes = [permissions.AllowAny]


class DormitoryBedsListView(generics.ListAPIView):
    """
    GET /api/dormitories/
    """
    queryset = Dormitory.objects.all()

    serializer_class = DormitoriesInfoSerializer
    # permission_classes = [permissions.IsAuthenticated]
    permission_classes = [permissions.AllowAny]


class DormitoryWithRoomsView(generics.ListAPIView):
    """
    GET /api/dormitories/with-rooms/
    """
    queryset = Dormitory.objects.prefetch_related('rooms').all()
    serializer_class = DormitoryWithRoomsSerializer
    permission_classes = [permissions.AllowAny]
