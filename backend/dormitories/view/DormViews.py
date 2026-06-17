from rest_framework import generics, permissions, status
from dormitories.models import Dormitory
from dormitories.serializer.DormSerializers import DormitoriesInfoSerializer, DormitoryWithRoomsSerializer
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.response import Response


class DormitoryListView(generics.ListAPIView):
    queryset = Dormitory.objects.all()
    serializer_class = DormitoriesInfoSerializer
    # permission_classes = [permissions.IsAuthenticated]
    permission_classes = [permissions.AllowAny]


class DormitoryBedsListView(generics.ListAPIView):
    queryset = Dormitory.objects.all()

    serializer_class = DormitoriesInfoSerializer
    # permission_classes = [permissions.IsAuthenticated]
    permission_classes = [permissions.AllowAny]


class DormitoryWithRoomsView(generics.ListAPIView):
    queryset = Dormitory.objects.prefetch_related('rooms').all()
    serializer_class = DormitoryWithRoomsSerializer
    permission_classes = [permissions.AllowAny]


@method_decorator(csrf_exempt, name='dispatch')
class DormCreateView(generics.CreateAPIView):
    serializer_class = DormitoriesInfoSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        return Response({
            'status': 'success',
            'message': 'room created successfully',
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)


class DormUpdateView(generics.UpdateAPIView):
    """
    GET /api/beds/{id}/
    """
    permission_classes = [permissions.AllowAny]
    queryset = Dormitory.objects.all()
    serializer_class = DormitoriesInfoSerializer
    lookup_field = 'id'
