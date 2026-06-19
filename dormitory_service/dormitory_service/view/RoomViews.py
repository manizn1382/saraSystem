from rest_framework import generics, permissions
from dormitory_service.models import Room
from dormitory_service.serializer.RoomSerializers import RoomsInfoSerializer
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTStatelessUserAuthentication


class RoomListView(APIView):
    authentication_classes = [JWTStatelessUserAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, status=None):
        queryset = Room.objects.all()

        if status:
            queryset = queryset.filter(status=status)

        serializer = RoomsInfoSerializer(queryset, many=True)
        return Response({
            'status': 'success',
            'count': queryset.count(),
            'data': serializer.data
        })


@method_decorator(csrf_exempt, name='dispatch')
class RoomCreateView(generics.CreateAPIView):
    serializer_class = RoomsInfoSerializer
    authentication_classes = [JWTStatelessUserAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        if not request.auth.get('is_staff', False):
            return Response(
                {'detail': 'Only admins can create rooms'},
                status=status.HTTP_403_FORBIDDEN
            )

        return Response({
            'status': 'success',
            'message': 'room created successfully',
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)


@method_decorator(csrf_exempt, name='dispatch')
class RoomDeleteView(generics.DestroyAPIView):
    authentication_classes = [JWTStatelessUserAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    queryset = Room.objects.all()
    serializer_class = RoomsInfoSerializer
    lookup_field = 'id'

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        room_number = instance.roomNumber
        dorm_name = instance.dormitory.name

        if not request.auth.get('is_staff', False):
            return Response(
                {'detail': 'Only admins can delete rooms'},
                status=status.HTTP_403_FORBIDDEN
            )

        self.perform_destroy(instance)

        return Response({
            "message": f"Room {room_number} in {dorm_name} deleted successfully"
        }, status=status.HTTP_200_OK)


class RoomUpdateView(generics.UpdateAPIView):
    """
    GET /api/beds/{id}/
    """
    permission_classes = [permissions.AllowAny]
    queryset = Room.objects.all()
    serializer_class = RoomsInfoSerializer
    lookup_field = 'id'

    def update(self, request, *args, **kwargs):
        if not request.auth.get('is_staff', False):
            return Response(
                {'detail': 'Only admins can update rooms'},
                status=status.HTTP_403_FORBIDDEN
            )

        return super().update(request, *args, **kwargs)
