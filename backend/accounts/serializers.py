from rest_framework import serializers
from .models import User, Role, Permission


class UserSerializer(serializers.ModelSerializer):
    roles = serializers.StringRelatedField(many=True, read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'national_id',
                  'student_id', 'phone', 'gender', 'is_active', 'is_verified',
                  'roles', 'password']
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'password': {'write_only': True}
        }


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = '__all__'