# dormitories/views.py
from rest_framework import generics, permissions, status
from ..models import Bed
from ..serializer.BedSerializers import BedSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt


class RoomBedsListView(generics.ListAPIView):
    """
    GET /url/rooms/{room_id}/beds/
    """
    serializer_class = BedSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        room_id = self.kwargs.get('room_id')
        return Bed.objects.filter(room_id=room_id)


class BedListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, status=None):
        queryset = Bed.objects.all()

        if status:
            queryset = queryset.filter(status=status)

        serializer = BedSerializer(queryset, many=True)
        return Response({
            'status': 'success',
            'count': queryset.count(),
            'data': serializer.data
        })


@method_decorator(csrf_exempt, name='dispatch')
class BedCreateView(generics.CreateAPIView):
    serializer_class = BedSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        return Response({
            'status': 'success',
            'message': 'Bed created successfully',
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)


class BedDetailView(generics.RetrieveAPIView):
    """
    GET /api/beds/{id}/
    """
    permission_classes = [permissions.AllowAny]
    queryset = Bed.objects.all()
    serializer_class = BedSerializer
    lookup_field = 'id'


class BedUpdateView(generics.UpdateAPIView):
    """
    GET /api/beds/{id}/
    """
    permission_classes = [permissions.AllowAny]
    queryset = Bed.objects.all()
    serializer_class = BedSerializer
    lookup_field = 'id'
