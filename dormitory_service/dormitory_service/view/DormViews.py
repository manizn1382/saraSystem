from rest_framework import generics, permissions, status
from rest_framework.response import Response

from dormitory_service.models import Dormitory
from dormitory_service.permissions import IsDormitoryAdministrator
from dormitory_service.serializer.DormSerializers import (
    DormitoriesInfoSerializer,
    DormitoryWithRoomsSerializer,
)
from dormitory_service.services import sync_dormitory_metrics


class DormitoryListView(generics.ListAPIView):
    queryset = Dormitory.objects.prefetch_related('rooms').all()
    serializer_class = DormitoriesInfoSerializer
    permission_classes = [permissions.IsAuthenticated]


class DormitoryWithRoomsView(generics.ListAPIView):
    queryset = Dormitory.objects.prefetch_related('rooms').all()
    serializer_class = DormitoryWithRoomsSerializer
    permission_classes = [permissions.IsAuthenticated]


class DormCreateView(generics.CreateAPIView):
    serializer_class = DormitoriesInfoSerializer
    permission_classes = [IsDormitoryAdministrator]

    def perform_create(self, serializer):
        dormitory = serializer.save()
        sync_dormitory_metrics(dormitory.id)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            {
                'status': 'success',
                'message': 'Dorm created successfully.',
                'data': serializer.data,
            },
            status=status.HTTP_201_CREATED,
            headers=headers,
        )


class DormUpdateView(generics.UpdateAPIView):
    queryset = Dormitory.objects.all()
    serializer_class = DormitoriesInfoSerializer
    permission_classes = [IsDormitoryAdministrator]
    lookup_field = 'id'
