from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.hashers import make_password
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, Role
from .serializers import UserSerializer, RoleSerializer


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        data['roles'] = [role.name for role in self.user.roles.all()]
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action == 'list':
            self.permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['update', 'partial_update', 'destroy']:
            self.permission_classes = [permissions.IsAdminUser]
        elif self.action == 'me':
            self.permission_classes = [permissions.IsAuthenticated]
        elif self.action == 'update_profile':
            self.permission_classes = [permissions.IsAuthenticated]
        elif self.action == 'change_password':
            self.permission_classes = [permissions.IsAuthenticated]
        else:
            self.permission_classes = [permissions.AllowAny]
        return super().get_permissions()

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            if user.roles.filter(name='system_admin').exists():
                return User.objects.all()
            if user.roles.filter(name='dormitory_admin').exists():
                return User.objects.all()
        return User.objects.none()

    @action(detail=False, methods=['get'])
    def me(self, request):
        if not request.user.is_authenticated:
            return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['put', 'patch'])
    def update_profile(self, request):
        user = request.user
        serializer = self.get_serializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def change_password(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not user.check_password(old_password):
            return Response({'error': 'Wrong password'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({'message': 'Password changed successfully'})

    @action(detail=False, methods=['post'])
    def register(self, request):
        data = request.data.copy()
        data['password'] = make_password(data.get('password'))
        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            user = serializer.save()
            try:
                student_role = Role.objects.get(name='student')
                user.roles.add(student_role)
            except Role.DoesNotExist:
                pass
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer

    def get_permissions(self):
        if self.action in ['list', 'create']:
            self.permission_classes = [permissions.IsAdminUser]
        else:
            self.permission_classes = [permissions.IsAdminUser]
        return super().get_permissions()

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.roles.filter(name='system_admin').exists():
            return Role.objects.all()
        return Role.objects.none()