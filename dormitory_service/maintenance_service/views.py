
from rest_framework import generics, permissions, status
from rest_framework_simplejwt.authentication import JWTStatelessUserAuthentication
from maintenance_service.Serializer import MaintenanceCommentUpdate, MaintenanceAssignUpdate, MaintenanceStatusUpdate, MaintenanceCreate, MaintenanceDetail, MaintenanceUpdate
from rest_framework.response import Response
from dormitory_service.models.RoomModel import Room
from dormitory_service.models.BedModel import Bed
from .models import Maintenance


class MaintenanceCreateView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [JWTStatelessUserAuthentication]
    serializer_class = MaintenanceCreate
    

    def post(self, request, *args, **kwargs):

        maintainData = self.get_serializer(data=request.data)
        maintainData.is_valid(raise_exception=True)

        try:
            roomInfo = Room.objects.get(id=request.data.get("room"))
        except Room.DoesNotExist:
            return Response({
                "success": False,
                "message": f"Room doesn't exist with id:{request.data.get('room')}"
            }, status=status.HTTP_404_NOT_FOUND)

        try:
            bedInfo = Bed.objects.get(id=request.data.get("bed"), room_id=request.data.get("room"))
        except Bed.DoesNotExist:
            return Response({
                "success": False,
                "message": f"Bed doesn't exist with id:{request.data.get('bed')} for room with id: {request.data.get('room')}"
            }, status=status.HTTP_404_NOT_FOUND)

        try:
            dormRoomInfo = Room.objects.get(id=request.data.get("room"), dormitory_id=request.data.get("dorm"))
        except Room.DoesNotExist:
            return Response({
                "success": False,
                "message": f"dorm doesn't exist with id:{request.data.get('dorm')} for room with id: {request.data.get('room')}"
            }, status=status.HTTP_404_NOT_FOUND)

        maintainData.save(requester_id=request.user.id)

        return Response({
            "success": True,
            "message": "maintenance created successfully"
        }, status=status.HTTP_201_CREATED)


class MaintenanceHistoryView(generics.ListAPIView):
    serializer_class = MaintenanceDetail
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    authentication_classes = [JWTStatelessUserAuthentication]
    queryset = Maintenance.objects.all()




class MaintenanceDetailView(generics.ListAPIView):
    serializer_class = MaintenanceDetail
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [JWTStatelessUserAuthentication]

    def get_queryset(self):
        queryset = Maintenance.objects.all()
        user = self.request.user
        params = self.request.query_params

        if "student" in self.request.auth.payload.get("roles"):
            queryset = queryset.filter(requester_id=user.id)

        if params.get('priority'):
            queryset = queryset.filter(priority=params.get('priority'))

        if params.get('status'):
            queryset = queryset.filter(status=params.get('status'))

        if params.get('assigned_to'):
            queryset = queryset.filter(assigned_to=params.get("assigned_to"))

        if params.get('assigned_to_me') == True:
            queryset = queryset.filter(requester_id=user.id)

        if params.get('created_before'):
            queryset = queryset.filter(createAt__lt=params.get('created_before'))

        if params.get('created_after'):
            queryset = queryset.filter(createAt__gt=params.get('created_after'))

        if params.get('room_id'):
            queryset = queryset.filter(room_id=params.get('room_id'))

        if params.get('dorm_id'):
            queryset = queryset.filter(dorm_id=params.get('dorm_id'))

        return queryset


class MaintenanceUpdateView(generics.UpdateAPIView):
    serializer_class = MaintenanceUpdate
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    authentication_classes = [JWTStatelessUserAuthentication]

    def patch(self, request, *args, **kwargs):
        maintain_id = request.query_params.get("maintain_id")

        if not maintain_id:
            return Response({
                "success": False,
                "message": "maintain id is mandatory"
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            maintain = Maintenance.objects.get(id=maintain_id)
        except Maintenance.DoesNotExist:
            return Response({
                "success": False,
                "message": f"maintenance not found for id: {maintain_id}"
            }, status=status.HTTP_404_NOT_FOUND)

        if maintain.requester_id != request.user.id and not request.user.is_staff:
            return Response({
                "success": False,
                "message": "You don't have permission to update this maintenance"
            }, status=status.HTTP_403_FORBIDDEN)

        serializer = MaintenanceUpdate(maintain, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "message": "maintenance updated successfully",
                "data": serializer.data
            }, status=status.HTTP_200_OK)

        return Response({
            "success": False,
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)



class StatusUpdateView(generics.UpdateAPIView):
    serializer_class = MaintenanceStatusUpdate
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    authentication_classes = [JWTStatelessUserAuthentication]

    def patch(self, request, *args, **kwargs):
        maintain_id = request.query_params.get("maintain_id")

        if not maintain_id:
            return Response({
                "success": False,
                "message": "maintain id is mandatory"
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            maintain = Maintenance.objects.get(id=maintain_id)
        except Maintenance.DoesNotExist:
            return Response({
                "success": False,
                "message": f"maintenance not found for id: {maintain_id}"
            }, status=status.HTTP_404_NOT_FOUND)

        if maintain.requester_id != request.user.id and not request.user.is_staff:
            return Response({
                "success": False,
                "message": "You don't have permission to update status of this maintenance"
            }, status=status.HTTP_403_FORBIDDEN)

        serializer = MaintenanceStatusUpdate(maintain, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "message": "maintenance status updated successfully",
                "data": serializer.data
            }, status=status.HTTP_200_OK)

        return Response({
            "success": False,
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class assignUpdateView(generics.UpdateAPIView):
    serializer_class = MaintenanceAssignUpdate
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    authentication_classes = [JWTStatelessUserAuthentication]

    def patch(self, request, *args, **kwargs):
        maintain_id = request.query_params.get("maintain_id")

        if not maintain_id:
            return Response({
                "success": False,
                "message": "maintain id is mandatory"
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            maintain = Maintenance.objects.get(id=maintain_id)
        except Maintenance.DoesNotExist:
            return Response({
                "success": False,
                "message": f"maintenance not found for id: {maintain_id}"
            }, status=status.HTTP_404_NOT_FOUND)

        if maintain.requester_id != request.user.id and not request.user.is_staff:
            return Response({
                "success": False,
                "message": "You don't have permission to update assigned person of this maintenance"
            }, status=status.HTTP_403_FORBIDDEN)

        serializer = MaintenanceAssignUpdate(maintain, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "message": "maintenance assigned person updated successfully",
                "data": serializer.data
            }, status=status.HTTP_200_OK)

        return Response({
            "success": False,
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class commentUpdateView(generics.UpdateAPIView):
    serializer_class = MaintenanceCommentUpdate
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    authentication_classes = [JWTStatelessUserAuthentication]

    def patch(self, request, *args, **kwargs):
        maintain_id = request.query_params.get("maintain_id")

        if not maintain_id:
            return Response({
                "success": False,
                "message": "maintain id is mandatory"
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            maintain = Maintenance.objects.get(id=maintain_id)
        except Maintenance.DoesNotExist:
            return Response({
                "success": False,
                "message": f"maintenance not found for id: {maintain_id}"
            }, status=status.HTTP_404_NOT_FOUND)

        if maintain.requester_id != request.user.id and not request.user.is_staff:
            return Response({
                "success": False,
                "message": "You don't have permission to update comment of this maintenance"
            }, status=status.HTTP_403_FORBIDDEN)

        serializer = MaintenanceCommentUpdate(maintain, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "message": "maintenance comment updated successfully",
                "data": serializer.data
            }, status=status.HTTP_200_OK)

        return Response({
            "success": False,
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)