from rest_framework import generics, status, permissions
from rest_framework.response import Response
from account_service.models import Role, Permission, RolePermission
from account_service.Serializer.RoleSerializer import RoleUpdateSerializer, RoleDeleteSerializer, CreateRoleSerializer, CreatePermissionSerializer, CreateRolePermissionSerializer, ListRoleSerializer, ListPermissionSerializer




class RoleListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    serializer_class = ListRoleSerializer
    queryset = Role.objects.all()


class PermissionListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    serializer_class = ListPermissionSerializer
    queryset = Permission.objects.all()


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
                    'id': permission.id,
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


class RoleDeleteView(generics.DestroyAPIView):
    queryset = Role.objects.all()
    serializer_class = RoleDeleteSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def destroy(self, request, *args, **kwargs):

        role_id = self.kwargs.get('pk')
        role = Role.objects.get(id=role_id)
        role.delete()
        return Response({
            'success': True,
            'message': 'role deleted successfully',
            'deleted_by': {
                'id': request.user.id,
                'username': request.user.username,
            }
        }, status=status.HTTP_200_OK)


class UpdateRoleView(generics.UpdateAPIView):
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    serializer_class = RoleUpdateSerializer
    queryset = Role.objects.all()

    def patch(self, request, *args, **kwargs):

        role = self.get_object()


        if 'name' in request.data:
            role.name = request.data['name']

        if 'description' in request.data:
            role.description = request.data['description']


        role.save()

        return Response({
            'success': True,
            'message': 'role updated successfully',
            'updated_fields': list(request.data.keys()),
            'role': {
                'id': role.id,
                'name': role.name,
                'description': role.description,
            }
        }, status=status.HTTP_200_OK)
