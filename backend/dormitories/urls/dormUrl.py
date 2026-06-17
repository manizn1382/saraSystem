from django.urls import path
from dormitories.view.DormViews import DormitoryListView, DormitoryWithRoomsView

urlpatterns = [

    path('listAll/', DormitoryListView.as_view(), name='Dormitory-list'),
    path('withRooms/', DormitoryWithRoomsView.as_view(), name='Dormitory-list-with-rooms'),

]