from rest_framework import generics, status, permissions
from rest_framework.response import Response
from account_service.models import Role, Permission, RolePermission
from account_service.Serializer.RoleSerializer import CreateRoleSerializer, CreatePermissionSerializer, CreateRolePermissionSerializer


class RoleCreateView(generics.CreateAPIView):
    serializer_class = CreateRoleSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]


    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        validated_data = serializer.validated_data

        role = Role.objects.create(**validated_data)

        return Response(
            {
                'success': True,
                'message': 'Role created successfully',
                'role': {
                    'id': role.id,
                    'name': role.name,
                    'description': role.description,
                }
            },
            status=status.HTTP_201_CREATED
        )


class PermissionCreateView(generics.CreateAPIView):
    serializer_class = CreatePermissionSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]


    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        validated_data = serializer.validated_data

        permission = Permission.objects.create(**validated_data)

        return Response(
            {
                'success': True,
                'message': 'permission created successfully',
                'permission': {
                    'code': permission.code,
                    'name': permission.name,
                    'description': permission.description,
                }
            },
            status=status.HTTP_201_CREATED
        )


class RolePermissionCreateView(generics.CreateAPIView):
    serializer_class = CreateRolePermissionSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]


    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        validated_data = serializer.validated_data

        rolePermission = RolePermission.objects.create(**validated_data)

        return Response(
            {
                'success': True,
                'message': 'rolePermission created successfully',
                'rolePermission': {
                    'permissionName': rolePermission.permission.name,
                    'roleName': rolePermission.role.name,
                }
            },
            status=status.HTTP_201_CREATED
        )