from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from dormitory_service.models import Bed
from dormitory_service.permissions import IsDormitoryAdministrator
from dormitory_service.serializer.BedSerializers import BedSerializer
from dormitory_service.services import sync_room_occupancy


class RoomBedsListView(generics.ListAPIView):
    serializer_class = BedSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Bed.objects.filter(room_id=self.kwargs['room_id'])


class BedListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, bed_status=None):
        queryset = Bed.objects.select_related('room').all()
        if bed_status:
            queryset = queryset.filter(status=bed_status)

        serializer = BedSerializer(queryset, many=True)
        return Response({
            'status': 'success',
            'count': queryset.count(),
            'data': serializer.data,
        })


class BedCreateView(generics.CreateAPIView):
    serializer_class = BedSerializer
    permission_classes = [IsDormitoryAdministrator]

    def perform_create(self, serializer):
        bed = serializer.save()
        sync_room_occupancy(bed.room_id)


class BedDetailView(generics.RetrieveAPIView):
    queryset = Bed.objects.all()
    serializer_class = BedSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'


class BedUpdateView(generics.UpdateAPIView):
    queryset = Bed.objects.all()
    serializer_class = BedSerializer
    permission_classes = [IsDormitoryAdministrator]
    lookup_field = 'id'

    def perform_update(self, serializer):
        previous_room_id = serializer.instance.room_id
        bed = serializer.save()
        sync_room_occupancy(previous_room_id)
        if bed.room_id != previous_room_id:
            sync_room_occupancy(bed.room_id)
