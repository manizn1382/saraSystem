from django.urls import path

from .views import (
    AnnouncementDetailView,
    AnnouncementListCreateView,
    MarkAnnouncementReadView,
    MyAnnouncementReadsView,
)


app_name = "announcements"


urlpatterns = [
    path(
        "",
        AnnouncementListCreateView.as_view(),
        name="announcement-list-create",
    ),
    path(
        "<int:pk>/",
        AnnouncementDetailView.as_view(),
        name="announcement-detail",
    ),
    path(
        "<int:announcement_id>/read/",
        MarkAnnouncementReadView.as_view(),
        name="announcement-mark-read",
    ),
    path(
        "reads/me/",
        MyAnnouncementReadsView.as_view(),
        name="my-announcement-reads",
    ),
]