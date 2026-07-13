from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import AccessToken

from .models import Announcement, AnnouncementRead


class AnnouncementApiTests(APITestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username="announcement_admin",
            password="StrongTestPassword123!",
            is_staff=True,
        )

        self.student_user = User.objects.create_user(
            username="student_test",
            password="StrongTestPassword123!",
        )

    def authenticate(self, user):
        token = AccessToken.for_user(user)

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

    def test_admin_can_create_announcement(self):
        self.authenticate(self.admin_user)

        response = self.client.post(
            reverse("announcements:announcement-list-create"),
            {
                "title": "Dormitory notice",
                "content": "The dormitory will close at 11 PM.",
                "is_active": True,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertEqual(
            Announcement.objects.count(),
            1,
        )

        announcement = Announcement.objects.first()

        self.assertEqual(
            announcement.created_by,
            self.admin_user,
        )

    def test_normal_user_cannot_create_announcement(self):
        self.authenticate(self.student_user)

        response = self.client.post(
            reverse("announcements:announcement-list-create"),
            {
                "title": "Unauthorized notice",
                "content": "This must not be created.",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

        self.assertEqual(
            Announcement.objects.count(),
            0,
        )

    def test_user_can_mark_announcement_as_read_once(self):
        announcement = Announcement.objects.create(
            title="Test announcement",
            content="Test content",
            created_by=self.admin_user,
        )

        self.authenticate(self.student_user)

        url = reverse(
            "announcements:announcement-mark-read",
            kwargs={"announcement_id": announcement.id},
        )

        first_response = self.client.post(url)
        second_response = self.client.post(url)

        self.assertEqual(
            first_response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertEqual(
            second_response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            AnnouncementRead.objects.filter(
                announcement=announcement,
                user=self.student_user,
            ).count(),
            1,
        )