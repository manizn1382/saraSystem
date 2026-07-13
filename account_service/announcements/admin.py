from django.contrib import admin

from .models import Announcement, AnnouncementRead


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "title",
        "created_by",
        "target_role",
        "target_dormitory_id",
        "is_active",
        "created_at",
        "expires_at",
    )

    list_filter = (
        "is_active",
        "created_at",
        "expires_at",
    )

    search_fields = (
        "title",
        "content",
        "created_by__username",
    )


@admin.register(AnnouncementRead)
class AnnouncementReadAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "announcement",
        "user",
        "read_at",
    )

    search_fields = (
        "announcement__title",
        "user__username",
    )