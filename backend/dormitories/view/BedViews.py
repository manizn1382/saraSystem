from rest_framework import generics, permissions, status
from dormitories.models import Bed
from dormitories.serializer.BedSerializers import BedSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework_simplejwt.authentication import JWTStatelessUserAuthentication


class RoomBedsListView(generics.ListAPIView):
    serializer_class = BedSerializer
    authentication_classes = [JWTStatelessUserAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        room_id = self.kwargs.get('room_id')
        return Bed.objects.filter(room_id=room_id)


class BedListView(APIView):
    authentication_classes = [JWTStatelessUserAuthentication]
    permission_classes = [permissions.IsAuthenticated]

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
    authentication_classes = [JWTStatelessUserAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        if not request.auth.get('is_staff', False):
            return Response(
                {'detail': 'Only admins can create beds'},
                status=status.HTTP_403_FORBIDDEN
            )

        return Response({
            'status': 'success',
            'message': 'Bed created successfully',
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)


class BedDetailView(generics.RetrieveAPIView):
    authentication_classes = [JWTStatelessUserAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    queryset = Bed.objects.all()
    serializer_class = BedSerializer
    lookup_field = 'id'


class BedUpdateView(generics.UpdateAPIView):
    authentication_classes = [JWTStatelessUserAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    queryset = Bed.objects.all()
    serializer_class = BedSerializer
    lookup_field = 'id'

    def update(self, request, *args, **kwargs):
        if not request.auth.get('is_staff', False):
            return Response(
                {'detail': 'Only admins can update beds'},
                status=status.HTTP_403_FORBIDDEN
            )

        return super().update(request, *args, **kwargs)