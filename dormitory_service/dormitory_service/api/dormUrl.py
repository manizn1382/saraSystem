from django.urls import path
from dormitory_service.view.DormViews import DormitoryListView, DormitoryWithRoomsView, DormCreateView, DormUpdateView
urlpatterns = [

    path('listAll/', DormitoryListView.as_view(), name='Dormitory-list'),
    path('withRooms/', DormitoryWithRoomsView.as_view(), name='Dormitory-list-with-rooms'),
    path('createDorm/', DormCreateView.as_view(), name="Dorm-create"),
    path('updateDorm/<int:id>', DormUpdateView.as_view(), name="Dorm-update"),

]