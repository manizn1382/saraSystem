# dormitories/urls.py
from django.urls import path
from dormitories.view.DormViews import DormitoryListView

urlpatterns = [

    path('dormitories/', DormitoryListView.as_view(), name='dormitory-list'),


    #path('dormitories/<int:pk>/', views.DormitoryDetailView.as_view(), name='dormitory-detail'),
]