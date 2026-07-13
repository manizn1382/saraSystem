from rest_framework import serializers

from .models import Announcement, AnnouncementRead


class AnnouncementSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(
        source="created_by.username",
        read_only=True,
    )

    target_role_name = serializers.CharField(
        source="target_role.name",
        read_only=True,
    )

    is_expired = serializers.BooleanField(read_only=True)

    class Meta:
        model = Announcement
        fields = [
            "id",
            "title",
            "content",
            "created_by",
            "created_by_username",
            "target_role",
            "target_role_name",
            "target_dormitory_id",
            "created_at",
            "expires_at",
            "is_active",
            "is_expired",
        ]

        read_only_fields = [
            "id",
            "created_by",
            "created_at",
            "is_expired",
        ]


class AnnouncementReadSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        source="user.username",
        read_only=True,
    )

    announcement_title = serializers.CharField(
        source="announcement.title",
        read_only=True,
    )

    class Meta:
        model = AnnouncementRead
        fields = [
            "id",
            "announcement",
            "announcement_title",
            "user",
            "username",
            "read_at",
        ]

        read_only_fields = [
            "id",
            "user",
            "read_at",
        ]