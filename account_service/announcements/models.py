from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone

from account_service.models import Role


class Announcement(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()

    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="created_announcements",
    )

    target_role = models.ForeignKey(
        Role,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="announcements",
    )

    # Dormitory belongs to a separate Django service, so for now we store its ID.
    target_dormitory_id = models.BigIntegerField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    expires_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "Announcement"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["target_dormitory_id"]),
            models.Index(fields=["is_active", "expires_at"]),
        ]

    def __str__(self):
        return self.title

    @property
    def is_expired(self):
        return (
            self.expires_at is not None
            and self.expires_at <= timezone.now()
        )


class AnnouncementRead(models.Model):
    announcement = models.ForeignKey(
        Announcement,
        on_delete=models.CASCADE,
        related_name="read_records",
    )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="announcement_reads",
    )

    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "AnnouncementRead"
        ordering = ["-read_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["announcement", "user"],
                name="unique_announcement_read_per_user",
            )
        ]

    def __str__(self):
        return (
            f"Announcement {self.announcement_id} "
            f"read by user {self.user_id}"
        )