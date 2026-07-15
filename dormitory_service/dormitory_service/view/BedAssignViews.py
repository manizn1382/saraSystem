from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework_simplejwt.authentication import JWTStatelessUserAuthentication
from dormitory_service.serializer.BedAssignSerializer import BedAssignUpdateSerializer, BedAssignSerializer, \
    BedAssignDetailSerializer
from accomodation_service.models import Accommodation
from dormitory_service.models.BedModel import Bed
from dormitory_service.models.BedAssignModel import BedAssign


@method_decorator(csrf_exempt, name='dispatch')
class BedAssignCreateView(generics.CreateAPIView):
    serializer_class = BedAssignSerializer
    authentication_classes = [JWTStatelessUserAuthentication]
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def create(self, request, *args, **kwargs):

        data = request.data.copy()

        data['assigned_by'] = request.user.id

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)

        req_id = request.data.get("request")
        bed_id = request.data.get("bed")
        user_id = request.data.get("user_id")

        try:
            AccommodationInfo = Accommodation.objects.get(id=req_id)
        except Accommodation.DoesNotExist:
            return Response({
                "success": False,
                "message": f'there is not accommodation with req_id: {req_id}'
            }, status=status.HTTP_404_NOT_FOUND)

        if AccommodationInfo.status != "approved":
            return Response({
                "success": False,
                "message": "Active assignment conflict",
                "errors": {
                    "accommodation_status": ["accommodation has not been approved."]
                }
            }, status=status.HTTP_409_CONFLICT)

        try:
            BedInfo = Bed.objects.get(id=bed_id)
        except Bed.DoesNotExist:
            return Response({
                "success": False,
                "message": f'there is not Bed with Bed_id: {bed_id}'
            })

        if BedInfo.status != "available":
            return Response({
                "success": False,
                "message": "Active assignment conflict",
                "error": {
                    "Bed_status": ["Bed isn't available"]
                }
            }, status=status.HTTP_409_CONFLICT)

        try:
            userAssignInfo = BedAssign.objects.get(user_id=user_id, status="active")
        except BedAssign.DoesNotExist:
            pass

        try:
            bedAssignInfo = BedAssign.objects.get(bed_id=bed_id, status="active")
        except BedAssign.DoesNotExist:
            pass

        self.perform_create(serializer)

        return Response({
            'success': True,
            'message': 'Bed Assigned to User successfully',
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)


class BedAssignDetail(generics.ListAPIView):
    serializer_class = BedAssignDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [JWTStatelessUserAuthentication]

    def get_queryset(self):
        queryset = BedAssign.objects.all()
        user = self.request.user
        params = self.request.query_params

        if not user.is_staff:
            queryset = queryset.filter(user_id=user.id)

        if params.get('assign_id'):
            queryset = queryset.filter(id=params.get('assign_id'))

        if params.get('bed_id'):
            queryset = queryset.filter(bed_id=params.get('bed_id'))

        if params.get('user_id') and user.is_staff:
            queryset = queryset.filter(user_id=params.get('user_id'))

        if params.get('room_id'):
            queryset = queryset.filter(room_id=params.get('room_id'))


        if params.get('active_only'):
            queryset = queryset.filter(status__exact=params.get('active_only'))

        if params.get('status'):
            queryset = queryset.filter(status=params.get('status'))

        return queryset


class BedAssignUpdate(generics.UpdateAPIView):
    serializer_class = BedAssignUpdateSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    authentication_classes = [JWTStatelessUserAuthentication]

    def patch(self, request, *args, **kwargs):
        assign_id = request.query_params.get("assign_id")

        if not assign_id:
            return Response({
                "success": False,
                "message": "assignment id is mandatory"
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            assignment = BedAssign.objects.get(id=assign_id)
        except BedAssign.DoesNotExist:
            return Response({
                "success": False,
                "message": "Assignment not found"
            }, status=status.HTTP_404_NOT_FOUND)

        if assignment.user_id != request.user.id and not request.user.is_staff:
            return Response({
                "success": False,
                "message": "You don't have permission to update this assignment"
            }, status=status.HTTP_403_FORBIDDEN)

        serializer = BedAssignUpdateSerializer(assignment, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "message": "Assignment updated successfully",
                "data": serializer.data
            }, status=status.HTTP_200_OK)

        return Response({
            "success": False,
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class BedAssignCurrent(generics.RetrieveAPIView):
    serializer_class = BedAssignDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [JWTStatelessUserAuthentication]

    def get(self, request, *args, **kwargs):

        try:
            assignmentInfo = BedAssign.objects.get(user_id=request.user.id)
        except BedAssign.DoesNotExist:
            return Response({
                "success": False,
                "message": "there is not assignment for you."
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(assignmentInfo)
        return Response({
            "success": True,
            "data": serializer.data
        }, status=status.HTTP_200_OK)
