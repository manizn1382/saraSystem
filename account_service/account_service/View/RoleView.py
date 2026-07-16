from rest_framework import generics, status, permissions
from rest_framework.response import Response
from account_service.models import Role, Permission, RolePermission
from account_service.Serializer.RoleSerializer import RolePermissionDelete, PermissionUpdate, PermissionDelete, RolePermissionDetail, RoleUpdateSerializer, RoleDeleteSerializer, \
    CreateRoleSerializer, CreatePermissionSerializer, CreateRolePermissionSerializer, ListRoleSerializer, \
    ListPermissionSerializer

from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator


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


class RolePermissionDeleteView(generics.DestroyAPIView):
    queryset = RolePermission.objects.all()
    serializer_class = RolePermissionDelete
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def destroy(self, request, *args, **kwargs):
        rolePerm_id = self.kwargs.get('pk')
        role = Role.objects.get(id=rolePerm_id)
        role.delete()
        return Response({
            'success': True,
            'message': 'role permission deleted successfully',
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

        role_id = self.request.query_params.get("role_id")

        if not role_id:
            return Response({
                "success": False,
                "message": "role id is mandatory"
            }, status=status.HTTP_400_BAD_REQUEST)

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


class RolePermissionDetailView(generics.ListAPIView):
    serializer_class = RolePermissionDetail
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def get_queryset(self):
        queryset = RolePermission.objects.all()
        params = self.request.query_params

        if params.get('role_id'):
            queryset = queryset.filter(role_id=params.get('role_id'))

        if params.get('permission_id'):
            queryset = queryset.filter(permission_id=params.get('permission_id'))

        return queryset


@method_decorator(csrf_exempt, name='dispatch')
class PermissionDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    queryset = Permission.objects.all()
    serializer_class = PermissionDelete
    lookup_field = 'id'

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        permission_id = instance.permission_id

        self.perform_destroy(instance)

        return Response({
            "message": f"Permission with id: {permission_id} deleted successfully"
        }, status=status.HTTP_200_OK)


class PermissionUpdateView(generics.UpdateAPIView):
    serializer_class = PermissionUpdate
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def patch(self, request, *args, **kwargs):
        perm_id = request.query_params.get("permission_id")

        if not perm_id:
            return Response({
                "success": False,
                "message": "permission id is mandatory"
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            permission = Permission.objects.get(id=perm_id)
        except Permission.DoesNotExist:
            return Response({
                "success": False,
                "message": "Permission not found"
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = PermissionUpdate(permission, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "message": "Permission updated successfully",
                "data": serializer.data
            }, status=status.HTTP_200_OK)

        return Response({
            "success": False,
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
