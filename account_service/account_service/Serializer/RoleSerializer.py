from rest_framework import serializers
from account_service.models import Role, RolePermission, Permission



class CreateRoleSerializer(serializers.ModelSerializer):

    class Meta:
        model = Role
        fields = ['name', 'description']


class ListRoleSerializer(serializers.ModelSerializer):

    class Meta:
        model = Role
        fields = ['name', 'description']


class RoleDeleteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id']


class RoleUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name', 'description']


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
