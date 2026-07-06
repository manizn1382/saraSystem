from django.utils import timezone
from rest_framework import serializers
from django.contrib.auth.models import User
from account_service.models import userProfile, UserRole, Role, Permission


class UserProfileInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = userProfile
        fields = ['nationalId', 'studentId', 'phone', 'gender', 'profileImage']


class UserCreateSerializer(serializers.ModelSerializer):
    confirm_password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    profile = UserProfileInfoSerializer()

    class Meta:
        model = User
        fields = [
            'username',
            'email',
            'password',
            'confirm_password',
            'first_name',
            'last_name',
            'profile'
        ]

    def validate(self, data):
        password = data.get('password')
        confirm_password = data.get('confirm_password')

        if password != confirm_password:
            raise serializers.ValidationError({
                'confirm_password': 'password and confirm_password does not equal'
            })

        if data.get("last_login"):
            data['last_login'] = timezone.now()

        data.pop('confirm_password', None)
        return data


class UserLoginSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'password']

    def validate(self, attrs):
        if not attrs.get("username") or not attrs.get("password"):
            raise serializers.ValidationError({
                'error': 'username and password are mandatory field'
            })


class UserRoleCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserRole
        fields = ['role', 'user']


class ChangePassSerializer(serializers.ModelSerializer):
    confirm_password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    new_password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    current_password = serializers.CharField(
        write_only=True,
        required=False,
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = ['confirm_password', 'new_password', 'current_password']

    def validate(self, data):
        new_password = data.get('new_password')
        confirm_password = data.get('confirm_password')

        if new_password != confirm_password:
            raise serializers.ValidationError({
                'error': 'new_password and confirm_password does not equal'
            })
        if data.get("current_password"):
            if not self.context["req"].user.check_password(data["current_password"]):
                raise serializers.ValidationError({
                    'error': 'current_password is not valid'
                })

        data.pop('confirm_password', None)
        data.pop('current_password', None)
        return data


class EditProfSerializer(serializers.ModelSerializer):
    profile = UserProfileInfoSerializer()

    class Meta:
        model = User
        fields = [
            'profile',
            'email',
            'first_name',
            'last_name', ]


class UserListSerializer(serializers.ModelSerializer):

    profile = UserProfileInfoSerializer(source="userprofile")
    roles = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()


    class Meta:
        model = User
        fields = [
            "email",
            "first_name",
            "is_active",
            "profile",
            "roles",
            "permissions",
        ]

    def get_roles(self, obj):
        roles = Role.objects.filter(userrole__user=obj).distinct()
        return [r.name for r in roles]


    def get_permissions(self, obj):
        permissions = Permission.objects.filter(
            rolepermission__role__userrole__user=obj
        ).distinct()

        return [p.name for p in permissions]
