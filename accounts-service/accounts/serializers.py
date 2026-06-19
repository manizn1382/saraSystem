from rest_framework import serializers
from .models import User, Role


class UserSerializer(serializers.ModelSerializer):
    roles = serializers.StringRelatedField(many=True, read_only=True)
    password = serializers.CharField(write_only=True, required=False, min_length=8)

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'national_id',
                  'student_id', 'phone', 'gender', 'is_active', 'is_verified',
                  'is_staff', 'roles', 'password']
        read_only_fields = ['id', 'is_active', 'is_verified', 'is_staff', 'roles']

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attribute, value in validated_data.items():
            setattr(instance, attribute, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class RegistrationSerializer(UserSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)

    class Meta(UserSerializer.Meta):
        fields = [
            'id', 'email', 'first_name', 'last_name', 'national_id', 'student_id',
            'phone', 'gender', 'password', 'password_confirm'
        ]
        read_only_fields = ['id']

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})
        attrs.pop('password_confirm')
        return attrs


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone', 'gender']


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = '__all__'
