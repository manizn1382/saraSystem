from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from account_service.models import UserRole, userProfile, RolePermission


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        roles = list(
            UserRole.objects.filter(user=user)
            .values_list("role__name", flat=True)
        )

        permissions = list(
            RolePermission.objects.filter(role__userrole__user=user)
            .values_list("permission__code", flat=True)
            .distinct()
        )
        profile = userProfile.objects.get(user=user)

        token['user_id'] = user.id
        token['username'] = user.username
        token['email'] = user.email
        token['roles'] = roles
        token['permissions'] = permissions
        token['is_staff'] = user.is_staff
        token['is_superuser'] = user.is_superuser
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        token['is_active'] = user.is_active

        token['profile'] = {
            'nationalId': profile.nationalId,
            'studentId': profile.studentId,
            'gender': profile.gender,
            'isVerified': profile.isVerified,
            'phone': profile.phone,
            'profileImage': profile.profileImage,
        }

        return token