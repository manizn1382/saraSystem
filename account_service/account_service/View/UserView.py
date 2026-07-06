# views.py
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from django.utils import timezone
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, update_session_auth_hash
from account_service.models import userProfile, UserRole
from account_service.Serializer.UserSerializer import UserCreateSerializer, UserLoginSerializer, \
    UserRoleCreateSerializer, ChangePassSerializer, EditProfSerializer, UserListSerializer, UserDeleteSerializer, ChangeStatusSerializer
from account_service.Serializer.TokenSerializer import CustomTokenObtainPairSerializer
from rest_framework.views import APIView


class UserCreateView(generics.CreateAPIView):
    serializer_class = UserCreateSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        validated_data = serializer.validated_data

        profile_data = validated_data.pop('profile', None)
        user = User.objects.create_user(**validated_data)

        userProfile.objects.create(user=user, **profile_data)

        return Response(
            {
                'success': True,
                'message': 'User created successfully',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                }
            },
            status=status.HTTP_201_CREATED
        )



class UserDetailView(APIView):

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = User.objects.get(id=request.user.id)

        if not user:
            return Response({
                'success': False,
                'message': 'Invalid username or password'
            }, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({
                'success': False,
                'message': 'User account is disabled'
            }, status=status.HTTP_403_FORBIDDEN)

        refresh = CustomTokenObtainPairSerializer.get_token(user)

        return Response({
            'success': True,
            'message': 'Login successful',
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
        }, status=status.HTTP_200_OK)



class UserLoginView(APIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = UserLoginSerializer

    def post(self, request):

        username = request.data.get('username')
        password = request.data.get('password')

        user = authenticate(username=username, password=password)

        if not user:
            return Response({
                'success': False,
                'message': 'Invalid username or password'
            }, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({
                'success': False,
                'message': 'User account is disabled'
            }, status=status.HTTP_403_FORBIDDEN)

        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])

        refresh = CustomTokenObtainPairSerializer.get_token(user)

        return Response({
            'success': True,
            'message': 'Login successful',
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
        }, status=status.HTTP_200_OK)


class UserRoleCreateView(generics.CreateAPIView):
    serializer_class = UserRoleCreateSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        validated_data = serializer.validated_data

        userRole = UserRole.objects.create(**validated_data)

        return Response(
            {
                'success': True,
                'message': 'userRole created successfully',
                'userRole': {
                    'userName': userRole.user.username,
                    'roleName': userRole.role.name,
                }
            },
            status=status.HTTP_201_CREATED
        )


class ChangePasswordView(generics.UpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ChangePassSerializer

    def patch(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={"req": request})
        serializer.is_valid(raise_exception=True)
        validate_data = serializer.validated_data
        user = request.user
        user.set_password(validate_data['new_password'])
        user.save()
        update_session_auth_hash(request, user)
        return Response({
            "success": True,
            "message": "Password updated successfully",
            "data": {
                "user_id": request.user.id,
                "username": request.user.username
            }
        })


class EditProfileView(generics.UpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = EditProfSerializer

    def put(self, request, *args, **kwargs):

        profile_data = request.data.pop('profile', {})
        user = request.user

        for field, value in request.data.items():
            setattr(user, field, value)
        user.save()

        profile = userProfile.objects.get(user=user)

        for field, value in profile_data.items():
            setattr(profile, field, value)
        profile.save()

        return Response({
            "success": True,
            "message": "profile updated successfully"
        })


class ListUserView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    serializer_class = UserListSerializer
    queryset = User.objects.all()


class UserDeleteView(generics.DestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserDeleteSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def destroy(self, request, *args, **kwargs):

        user_id = self.kwargs.get('pk')
        user = User.objects.get(id=user_id)
        user.delete()
        return Response({
            'success': True,
            'message': 'user deleted successfully',
            'deleted_by': {
                'id': request.user.id,
                'username': request.user.username,
            }
        }, status=status.HTTP_200_OK)


class ChangeStatusView(generics.UpdateAPIView):
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    serializer_class = ChangeStatusSerializer

    def patch(self, request, *args, **kwargs):
        user = User.objects.get(id=request.data.get('id'))
        userStatus = request.data.get('is_active')
        user.is_active = userStatus
        user.save()
        return Response({
            'success': True,
            'message': 'user status changed successfully',
            'changed_by': {
                'id': request.user.id,
                'username': request.user.username,
            }
        }, status=status.HTTP_200_OK)



class AdminEditView(generics.UpdateAPIView):
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    serializer_class = EditProfSerializer

    def put(self, request, *args, **kwargs):

        profile_data = request.data.pop('profile', {})
        user = User.objects.get(id=request.data.get('id'))

        for field, value in request.data.items():
            setattr(user, field, value)
        user.save()

        profile = userProfile.objects.get(user=user)

        for field, value in profile_data.items():
            setattr(profile, field, value)
        profile.save()

        return Response({
            "success": True,
            "message": "user profile updated successfully",
            "update_By": {
                "user_id": request.user.id,
                "username": request.user.username,
            }
        })