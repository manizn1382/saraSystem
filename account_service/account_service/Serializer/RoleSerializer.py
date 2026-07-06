from rest_framework import serializers
from account_service.models import Role, RolePermission, Permission



class CreateRoleSerializer(serializers.ModelSerializer):

    class Meta:
        model = Role
        fields = ['name', 'description']


class CreatePermissionSerializer(serializers.ModelSerializer):

    class Meta:
        model = Permission
        fields = ['name', 'code', 'description']


class CreateRolePermissionSerializer(serializers.ModelSerializer):

    class Meta:
        model = RolePermission
        fields = ['permission', 'role']
