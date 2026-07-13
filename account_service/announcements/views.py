from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from account_service.models import UserRole

from .models import Announcement, AnnouncementRead
from .permissions import IsAdminOrReadOnly
from .serializers import (
    AnnouncementReadSerializer,
    AnnouncementSerializer,
)


class AnnouncementListCreateView(generics.ListCreateAPIView):
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        now = timezone.now()

        role_ids = UserRole.objects.filter(
            user=user
        ).values_list(
            "role_id",
            flat=True,
        )

        queryset = Announcement.objects.filter(
            is_active=True,
        ).filter(
            Q(expires_at__isnull=True)
            | Q(expires_at__gt=now)
        ).filter(
            Q(target_role__isnull=True)
            | Q(target_role_id__in=role_ids)
        )

        dormitory_id = self.request.query_params.get(
            "dormitory_id"
        )

        if dormitory_id:
            queryset = queryset.filter(
                Q(target_dormitory_id__isnull=True)
                | Q(target_dormitory_id=dormitory_id)
            )
        else:
            queryset = queryset.filter(
                target_dormitory_id__isnull=True
            )

        return queryset.select_related(
            "created_by",
            "target_role",
        )

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class AnnouncementDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    queryset = Announcement.objects.select_related(
        "created_by",
        "target_role",
    )

    serializer_class = AnnouncementSerializer
    permission_classes = [IsAdminOrReadOnly]


class MarkAnnouncementReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, announcement_id):
        try:
            announcement = Announcement.objects.get(
                id=announcement_id,
                is_active=True,
            )
        except Announcement.DoesNotExist:
            return Response(
                {
                    "detail": "Announcement not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        read_record, created = (
            AnnouncementRead.objects.get_or_create(
                announcement=announcement,
                user=request.user,
            )
        )

        serializer = AnnouncementReadSerializer(
            read_record
        )

        response_status = (
            status.HTTP_201_CREATED
            if created
            else status.HTTP_200_OK
        )

        return Response(
            serializer.data,
            status=response_status,
        )


class MyAnnouncementReadsView(
    generics.ListAPIView
):
    serializer_class = AnnouncementReadSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return AnnouncementRead.objects.filter(
            user=self.request.user
        ).select_related(
            "announcement",
            "user",
        )