# """
# URL configuration for backend project.
#
# The `urlpatterns` list routes URLs to views. For more information please see:
#     https://docs.djangoproject.com/en/5.2/topics/http/urls/
# Examples:
# Function views
#     1. Add an import:  from my_app import views
#     2. Add a URL to urlpatterns:  path('', views.home, name='home')
# Class-based views
#     1. Add an import:  from other_app.views import Home
#     2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
# Including another URLconf
#     1. Import the include() function: from django.url import include, path
#     2. Add a URL to urlpatterns:  path('blog/', include('blog.url'))
# """
# from django.contrib import admin
# from django.url import path, include
#
# from .url import dormUrl, roomUrl
#
# urlpatterns = [
#     path('admin/', admin.site.url),
#     path('url/dormitory/listAll/', include('dormitories.url.dormUrl')),
#     path('url/rooms/', include('dormitories.url.roomUrl')),
# ]

# dormitories/url.py
from django.contrib import admin
from django.urls import path, include
from view.RoomViews import RoomListView, RoomDeleteView, RoomCreateView
from view.DormViews import DormitoryListView, DormitoryWithRoomsView
from view.BedViews import RoomBedsListView


dormitory_patterns = [
    path('listAll/', DormitoryListView.as_view(), name='Dormitory-list'),
    path('withRooms/', DormitoryWithRoomsView.as_view(), name='Dormitory-list-with-rooms'),
]


room_patterns = [
    path('listAllRoom/<str:status>', RoomListView.as_view(), name='Room-list-by-status'),
    path('listAllRoom/', RoomListView.as_view(), name='list-all-rooms'),
    path('listAllRoomBeds/<int:room_id>', RoomBedsListView.as_view(), name='Room-list'),
    path('createRoom/', RoomCreateView.as_view(), name='Room-Add'),
    path('deleteRoom/<int:id>', RoomDeleteView.as_view(), name='Room-Delete'),
]

urlpatterns = [
    path('admin/', admin.site.urls),
    path('url/dormitory/', include(dormitory_patterns)),
    path('url/rooms/', include(room_patterns)),
]