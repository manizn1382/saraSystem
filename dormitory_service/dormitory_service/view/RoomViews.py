from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from dormitory_service.models import Room
from dormitory_service.permissions import IsDormitoryAdministrator
from dormitory_service.serializer.RoomSerializers import RoomsInfoSerializer
from dormitory_service.services import sync_dormitory_metrics, sync_room_occupancy


class RoomListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, room_status=None):
        queryset = Room.objects.select_related('dormitory').all()
        if room_status:
            queryset = queryset.filter(status=room_status)

        serializer = RoomsInfoSerializer(queryset, many=True)
        return Response({
            'status': 'success',
            'count': queryset.count(),
            'data': serializer.data,
        })


class RoomCreateView(generics.CreateAPIView):
    serializer_class = RoomsInfoSerializer
    permission_classes = [IsDormitoryAdministrator]

    def perform_create(self, serializer):
        room = serializer.save()
        sync_dormitory_metrics(room.dormitory_id)


class RoomDeleteView(generics.DestroyAPIView):
    queryset = Room.objects.all()
    serializer_class = RoomsInfoSerializer
    permission_classes = [IsDormitoryAdministrator]
    lookup_field = 'id'

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        room_number = instance.roomNumber
        dorm_name = instance.dormitory.name
        dormitory_id = instance.dormitory_id
        self.perform_destroy(instance)
        sync_dormitory_metrics(dormitory_id)
        return Response(
            {'message': f'Room {room_number} in {dorm_name} deleted successfully.'},
            status=status.HTTP_200_OK,
        )


class RoomUpdateView(generics.UpdateAPIView):
    queryset = Room.objects.all()
    serializer_class = RoomsInfoSerializer
    permission_classes = [IsDormitoryAdministrator]
    lookup_field = 'id'

    def perform_update(self, serializer):
        previous_dormitory_id = serializer.instance.dormitory_id
        room = serializer.save()
        sync_room_occupancy(room.id)
        if room.dormitory_id != previous_dormitory_id:
            sync_dormitory_metrics(previous_dormitory_id)
