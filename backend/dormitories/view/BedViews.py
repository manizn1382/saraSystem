# dormitories/views.py
from rest_framework import generics, permissions
from dormitories.models import Bed
from dormitories.serializer.BedSerializers import BedSerializer
from django.views.decorators.csrf import csrf_exempt



class RoomBedsListView(generics.ListAPIView):
    """
    GET /api/rooms/{room_id}/beds/
    """
    serializer_class = BedSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        room_id = self.kwargs.get('room_id')
        return Bed.objects.filter(room_id=room_id)
