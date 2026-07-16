from rest_framework import serializers
from account_service.models import Role, RolePermission, Permission, UserRole


class CreateRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['name', 'description']


class ListRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['name', 'description', 'id']


class RoleDeleteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id']


class RoleUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = "__all__"


class CreatePermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ['name', 'code', 'description']


class ListPermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ['name', 'code', 'description', 'id']


class CreateRolePermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RolePermission
        fields = ['permission', 'role']


class UserRoleDetail(serializers.ModelSerializer):
    class Meta:
        model = UserRole
        fields = "__all__"


class UserRoleDelete(serializers.ModelSerializer):
    class Meta:
        model = UserRole
        fields = "__all__"


class RolePermissionDelete(serializers.ModelSerializer):
    class Meta:
        model = RolePermission
        fields = "__all__"


class RolePermissionDetail(serializers.ModelSerializer):
    class Meta:
        model = RolePermission
        fields = "__all__"


class RolePermissionDelete(serializers.ModelSerializer):
    class Meta:
        model = RolePermission
        fields = "__all__"


class PermissionUpdate(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = "__all__"
        read_only_fields = ['id']


class PermissionDelete(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = "__all__"
