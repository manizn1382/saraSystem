from django.urls import path
from dormitories.view.RoomViews import RoomListView, RoomCreateView, RoomDeleteView
from dormitories.view.BedViews import RoomBedsListView

urlpatterns = [

    path('listAllRoom/<str:status>', RoomListView.as_view(), name='Room-list-by-status'),
    path('listAllRoom/', RoomListView.as_view(), name='list-all-rooms'),
    path('listAllRoomBeds/<int:room_id>', RoomBedsListView.as_view(), name='Room-list'),
    path('createRoom/', RoomCreateView.as_view(), name='Room-Add'),
    path('deleteRoom/<int:id>', RoomDeleteView.as_view(), name='Room-Delete'),

]