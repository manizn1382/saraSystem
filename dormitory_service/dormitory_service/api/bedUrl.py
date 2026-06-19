from django.urls import path
from dormitory_service.view.BedViews import BedListView, BedCreateView, BedDetailView, BedUpdateView

urlpatterns = [

    path('listAll/', BedListView.as_view(), name='Bed-list'),
    path('listAll/<str:bed_status>/', BedListView.as_view(), name='Bed-list-by-status'),
    path('createBed/', BedCreateView.as_view(), name="Create-bed"),
    path('getBedById/<int:id>/', BedDetailView.as_view(), name="get-Bed"),
    path('updateBed/<int:id>/', BedUpdateView.as_view(), name="update-bed"),


]
