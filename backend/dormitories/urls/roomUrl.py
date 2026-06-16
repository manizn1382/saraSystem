from django.urls import path
from dormitories.view.RoomViews import RoomListView, RoomCreateView
from dormitories.view.BedViews import RoomBedsListView

urlpatterns = [

    path('listAllRoom/<str:status>', RoomListView.as_view(), name='Room-list'),
    path('listAllRoomBeds/<int:room_id>', RoomBedsListView.as_view(), name='Room-list'),
    path('createRoom/', RoomCreateView.as_view(), name='Room-Add'),
    # delete-room
    # update-room

]