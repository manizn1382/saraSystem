"""
URL configuration for dormitory_service project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.urls import path
from maintenance_service.views import MaintenanceHistoryView, commentUpdateView, assignUpdateView, StatusUpdateView, MaintenanceUpdateView, MaintenanceCreateView, MaintenanceDetailView


urlpatterns = [
    path('/create', MaintenanceCreateView.as_view(), name="createMaintenance"),
    path('/detail', MaintenanceDetailView.as_view(), name="detailMaintenance"),
    path('/history', MaintenanceHistoryView.as_view(), name="detailMaintenance"),
    path('/update', MaintenanceUpdateView.as_view(), name="updateMaintenance"),
    path('/update/status', StatusUpdateView.as_view(), name="updateStatusMaintenance"),
    path('/update/assign', assignUpdateView.as_view(), name="updateAssignMaintenance"),
    path('/update/comments', commentUpdateView.as_view(), name="updateCommentMaintenance"),


]
