from rest_framework import generics, permissions, status
from dormitory_service.models import Dormitory
from dormitory_service.serializer.DormSerializers import DormitoriesInfoSerializer, DormitoryWithRoomsSerializer
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTStatelessUserAuthentication


class DormitoryListView(generics.ListAPIView):
    queryset = Dormitory.objects.all()
    serializer_class = DormitoriesInfoSerializer
    authentication_classes = [JWTStatelessUserAuthentication]
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]


class DormitoryWithRoomsView(generics.ListAPIView):
    queryset = Dormitory.objects.prefetch_related('rooms').all()
    serializer_class = DormitoryWithRoomsSerializer
    authentication_classes = [JWTStatelessUserAuthentication]
    permission_classes = [permissions.IsAuthenticated]


@method_decorator(csrf_exempt, name='dispatch')
class DormCreateView(generics.CreateAPIView):
    serializer_class = DormitoriesInfoSerializer
    authentication_classes = [JWTStatelessUserAuthentication]
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def create(self, request, *args, **kwargs):

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        return Response({
            'status': 'success',
            'message': 'Dorm created successfully',
            'data': serializer.data,
        }, status=status.HTTP_201_CREATED)


class DormUpdateView(generics.UpdateAPIView):
    authentication_classes = [JWTStatelessUserAuthentication]
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    queryset = Dormitory.objects.all()
    serializer_class = DormitoriesInfoSerializer
    lookup_field = 'id'

    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
