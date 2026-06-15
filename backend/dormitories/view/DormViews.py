from rest_framework import generics, permissions
from dormitories.models import Dormitory
from dormitories.serializer.DormSerializers import DormitoriesInfoSerializer


class DormitoryListView(generics.ListAPIView):
    """
    GET /api/dormitories/
    """
    queryset = Dormitory.objects.all()
    serializer_class = DormitoriesInfoSerializer
    # permission_classes = [permissions.IsAuthenticated]
    permission_classes = [permissions.AllowAny]
