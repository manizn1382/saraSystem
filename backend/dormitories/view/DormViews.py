from rest_framework import generics, permissions, status
from dormitories.models import Dormitory
from dormitories.serializer.DormSerializers import DormitoriesInfoSerializer, DormitoryWithRoomsSerializer
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTStatelessUserAuthentication


class DormitoryListView(generics.ListAPIView):
    queryset = Dormitory.objects.all()
    serializer_class = DormitoriesInfoSerializer
    authentication_classes = [JWTStatelessUserAuthentication]
    permission_classes = [permissions.IsAuthenticated]



class DormitoryWithRoomsView(generics.ListAPIView):
    queryset = Dormitory.objects.prefetch_related('rooms').all()
    serializer_class = DormitoryWithRoomsSerializer
    authentication_classes = [JWTStatelessUserAuthentication]
    permission_classes = [permissions.IsAuthenticated]


@method_decorator(csrf_exempt, name='dispatch')
class DormCreateView(generics.CreateAPIView):
    serializer_class = DormitoriesInfoSerializer
    authentication_classes = [JWTStatelessUserAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):

        if not request.auth.get('is_staff', False):
            return Response(
                {'detail': 'Only admins can create dormitories'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        return Response({
            'status': 'success',
            'message': 'Dorm created successfully',
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)


class DormUpdateView(generics.UpdateAPIView):
    """
    GET /api/beds/{id}/
    """
    authentication_classes = [JWTStatelessUserAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    queryset = Dormitory.objects.all()
    serializer_class = DormitoriesInfoSerializer
    lookup_field = 'id'

    def update(self, request, *args, **kwargs):
        if not request.auth.get('is_staff', False):
            return Response(
                {'detail': 'Only admins can update dormitories'},
                status=status.HTTP_403_FORBIDDEN
            )

        return super().update(request, *args, **kwargs)
