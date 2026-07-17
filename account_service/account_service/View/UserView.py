# views.py
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from django.utils import timezone
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, update_session_auth_hash
from rest_framework_simplejwt.tokens import RefreshToken
from account_service.models import userProfile, UserRole, Role
from account_service.Serializer.UserSerializer import ResetPassSerializer, UserCreateSerializer, UserLoginSerializer, \
    UserRoleCreateSerializer, ChangePassSerializer, EditProfSerializer, UserListSerializer, UserDeleteSerializer, \
    ChangeStatusSerializer
from account_service.Serializer.TokenSerializer import CustomTokenObtainPairSerializer
from rest_framework.views import APIView
from account_service.models.Permission import Permission
from account_service.Serializer.RoleSerializer import UserRoleDelete, UserRoleDetail, ListRoleSerializer, \
    ListPermissionSerializer
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework_simplejwt.authentication import JWTAuthentication


@method_decorator(csrf_exempt, name='dispatch')
class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def post(self, request):
        refresh_token = request.data.get('refresh_token')

        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()

        return Response({
            "success": True,
            "message": "User logged out successfully"
        }, status=status.HTTP_200_OK)


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
        userRole = Role.objects.get(name__exact="student")

        UserRole.objects.create(user=user, role=userRole)

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


class UserByStudentId(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):

        studentId = self.request.query_params.get("studentId")

        if not studentId:
            return Response({
                'success': False,
                'message': "studentId is mandatory"
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(userprofile__studentId__exact=studentId)
        except User.DoesNotExist:
            return Response({
                'success': False,
                'message': "can't found user with this student id"
            }, status=status.HTTP_404_NOT_FOUND)

        return Response({
            'success': True,
            'userId': user.id,
        }, status=status.HTTP_200_OK)


class UserDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):

        userId = self.request.query_params.get("userId")

        user = User.objects.get(id=request.user.id)

        if userId:
            user = User.objects.get(id=userId)
            if request.user.id != userId and not request.user.is_staff:
                return Response({
                    'success': False,
                    'message': 'only admins can see other users data'
                }, status=status.HTTP_403_FORBIDDEN)

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

        roles = Role.objects.filter(userrole__user=user).distinct()
        profile = userProfile.objects.get(user=user)
        userPermission = Permission.objects.filter(
            rolepermission__role__userrole__user=user
        ).distinct()

        roles_info = ListRoleSerializer(roles, many=True).data
        permissions_info = ListPermissionSerializer(userPermission, many=True).data

        return Response({
            'success': True,
            'message': 'user info fetched successfully',
            'user': {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "is_active": user.is_active,
                "roles": roles_info,
                "permissions": permissions_info,
                "profile": {
                    "nationalId": profile.nationalId,
                    "studentId": profile.studentId,
                    "phone": profile.phone,
                    "gender": profile.gender,
                    "profileImage": profile.profileImage,
                    "isVerified": profile.isVerified
                }
            }
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
        print(request.data)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        validated_data = serializer.validated_data

        try:
            userRole = UserRole.objects.get(user_id=request.data.get('user'))
            if userRole:
                userRole.role_id = request.data.get('role')
                userRole.save()
        except UserRole.DoesNotExist:
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

    def get_queryset(self):
        queryset = User.objects.all()

        username = self.request.query_params.get("username")
        email = self.request.query_params.get("email")
        is_active = self.request.query_params.get("is_active")
        studentId = self.request.query_params.get("studentId")
        nationalId = self.request.query_params.get("nationalId")

        if username:
            queryset = queryset.filter(username__icontains=username)

        if email:
            queryset = queryset.filter(email__icontains=email)

        if studentId:
            queryset = queryset.filter(userprofile__studentId__exact=studentId)

        if nationalId:
            queryset = queryset.filter(userprofile__nationalId__exact=nationalId)

        if is_active is not None:
            queryset = queryset.filter(is_active=is_active)

        return queryset


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


class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ResetPassSerializer

    def put(self, request):

        serializer = ResetPassSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        username = serializer.validated_data['username']

        try:
            user = User.objects.get(username=username)

        except User.DoesNotExist:
            return Response({
                "success": False,
                "message": "User with this username doesn't exist"
            }, status=status.HTTP_404_NOT_FOUND)

        user.set_password(
            serializer.validated_data['new_password']
        )

        user.save()

        return Response({
            "success": True,
            "message": "Password updated successfully",
        }, status=status.HTTP_200_OK)


class userRoleDetailView(generics.ListAPIView):
    serializer_class = UserRoleDetail
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def get_queryset(self):
        queryset = UserRole.objects.all()
        params = self.request.query_params

        if params.get('user_id'):
            queryset = queryset.filter(user_id=params.get('user_id'))

        if params.get('role_id'):
            queryset = queryset.filter(role_id=params.get('role_id'))
        print(queryset.first().role.name)
        return queryset


@method_decorator(csrf_exempt, name='dispatch')
class userRoleDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    queryset = UserRole.objects.all()
    serializer_class = UserRoleDelete
    lookup_field = 'id'

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        user_id = instance.user_id
        role_id = instance.role_id

        self.perform_destroy(instance)

        return Response({
            "message": f"userRole with id: {user_id} in {role_id} deleted successfully"
        }, status=status.HTTP_200_OK)
