import requests
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework_simplejwt.authentication import JWTStatelessUserAuthentication
from .Serializer import AccommodationCreate, AccommodationList, UpdateAccommodation, UpdateReview
from .models import Accommodation
from dormitory_service.models.DormModel import Dormitory
import requests
from django.utils import timezone


@method_decorator(csrf_exempt, name='dispatch')
class AccommodationCreateView(generics.CreateAPIView):
    serializer_class = AccommodationCreate
    authentication_classes = [JWTStatelessUserAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):

        if request.user.is_staff:
            return Response({
                'status': False,
                'message': 'Only students can create accommodation request',
            }, status=status.HTTP_403_FORBIDDEN)


        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            dormitory = Dormitory.objects.get(id=request.data.get("requested_dorm"))
        except Dormitory.DoesNotExist:
            return Response({
                "success": False,
                "message": "dormitory with this id doesn't exist"
            }, status.HTTP_404_NOT_FOUND)

        semester = request.data.get("semester")

        accommodation = Accommodation.objects.filter(user_id=request.user.id, semester=semester).first()

        if accommodation:
            return Response({
                'status': False,
                'message': f'Accommodation for this user in this semester exist with status: {accommodation.status}',
            }, status=status.HTTP_403_FORBIDDEN)

        Accommodation.objects.create(
            semester=semester,
            user_id=request.user.id,
            preferred_room=request.data.get("preferred_room"),
            requested_dorm=dormitory
        )

        return Response({
            'status': 'success',
            'message': 'Accommodation created successfully',
            'data': serializer.data,
        }, status=status.HTTP_201_CREATED)


class ListAccommodationView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AccommodationList
    authentication_classes = [JWTStatelessUserAuthentication]

    def get_queryset(self):
        queryset = Accommodation.objects.all()

        userData = self.request.auth.payload

        status = self.request.query_params.get("status")
        semester = self.request.query_params.get("semester")
        requested_dorm = self.request.query_params.get("requested_dorm")
        userId = self.request.query_params.get("user_id")
        studentId = self.request.query_params.get("studentId")

        if status:
            queryset = queryset.filter(status__exact=status)

        if semester:
            queryset = queryset.filter(semester__exact=semester)

        if requested_dorm:
            queryset = queryset.filter(requested_dorm_id=requested_dorm)

        if userId:
            queryset = queryset.filter(user_id=userId)

        if studentId:


            token = self.request.headers.get("Authorization")


            response = requests.get(
                "http://127.0.0.1:8001/api/v1/users/current/studentId",
                headers={
                    'Authorization': token,
                    'Content-Type': 'application/json'
                },
                params={
                    "studentId": studentId
                },
                verify=False,
                timeout=5
            )
            if response.status_code == 200:
                userId = response.json()["userId"]
                queryset = queryset.filter(user_id=userId)
            else:
                queryset = None

        if "student" in userData.get('roles'):
            queryset = queryset.filter(user_id=userData.get('user_id'))

        if "dorm-admin" in userData.get('roles'):
            queryset = queryset.filter(status__exact="assigned")

        return queryset


class UpdateAccInfo(generics.UpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UpdateAccommodation
    authentication_classes = [JWTStatelessUserAuthentication]

    def put(self, request, *args, **kwargs):

        try:
            accommodation = Accommodation.objects.get(id=self.request.query_params.get("id"))
        except Accommodation.DoesNotExist:
            return Response({
                "success": False,
                "message": "can't find accommodation with this id"
            }, status=status.HTTP_404_NOT_FOUND)

        if accommodation.user_id != request.user.id and not request.user.is_staff:
            return Response({
                "success": False,
                "message": "you can only edit your accommodation info"
            }, status=status.HTTP_403_FORBIDDEN)

        if accommodation.status != "pending":
            return Response({
                "success": False,
                "message": "you can only edit pending accommodations"
            }, status=status.HTTP_403_FORBIDDEN)



        for field, value in request.data.items():
            print(f'{field}:{value}')
            setattr(accommodation, field, value)
        accommodation.save()

        return Response({
            "success": True,
            "message": "accommodation updated successfully",
            "update_By": {
                "user_id": request.user.id,
                "username": request.user.username,
            }
        })



class UpdateReviewInfo(generics.UpdateAPIView):
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    serializer_class = UpdateReview
    authentication_classes = [JWTStatelessUserAuthentication]

    def put(self, request, *args, **kwargs):

        try:
            accommodation = Accommodation.objects.get(id=self.request.query_params.get("id"))
        except Accommodation.DoesNotExist:
            return Response({
                "success": False,
                "message": "can't find accommodation with this id"
            }, status=status.HTTP_404_NOT_FOUND)

        if not request.user.is_staff:
            return Response({
                "success": False,
                "message": "only admins can edit accommodation info"
            }, status=status.HTTP_403_FORBIDDEN)

        if accommodation.status == "pending":
            return Response({
                "success": False,
                "message": "you can't edit pending accommodations"
            }, status=status.HTTP_403_FORBIDDEN)



        for field, value in request.data.items():
            setattr(accommodation, field, value)

        accommodation.reviewed_by = request.user.id
        accommodation.reviewed_at = timezone.now()
        accommodation.save()

        return Response({
            "success": True,
            "message": "accommodation updated successfully",
            "update_By": {
                "user_id": request.user.id,
                "username": request.user.username,
            }
        })

    class ListAccommodationView(generics.ListAPIView):
        permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
        serializer_class = AccommodationList
        authentication_classes = [JWTStatelessUserAuthentication]

        def get_queryset(self):
            queryset = Accommodation.objects.all()

            status = self.request.query_params.get("status")
            semester = self.request.query_params.get("semester")
            requested_dorm = self.request.query_params.get("requested_dorm")
            userId = self.request.query_params.get("user_id")
            studentId = self.request.query_params.get("studentId")

            if status:
                queryset = queryset.filter(status__exact=status)

            if semester:
                queryset = queryset.filter(semester__exact=semester)

            if requested_dorm:
                queryset = queryset.filter(requested_dorm_id=requested_dorm)

            if userId:
                queryset = queryset.filter(user_id=userId)

            if studentId:

                token = self.request.headers.get("Authorization")

                response = requests.get(
                    "http://127.0.0.1:8001/api/v1/users/current/studentId",
                    headers={
                        'Authorization': token,
                        'Content-Type': 'application/json'
                    },
                    params={
                        "studentId": studentId
                    },
                    verify=False,
                    timeout=5
                )
                if response.status_code == 200:
                    userId = response.json()["userId"]
                    queryset = queryset.filter(user_id=userId)
                else:
                    queryset = None

            return queryset
