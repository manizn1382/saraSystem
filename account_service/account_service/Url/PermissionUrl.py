"""
URL configuration for account_service project.

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
from account_service.View.RoleView import PermissionDeleteView, PermissionCreateView, PermissionListView, PermissionUpdateView

urlpatterns = [
    path('/create', PermissionCreateView.as_view(), name="createPermission"),
    path('/list', PermissionListView.as_view(), name="listPermission"),
    path('/update', PermissionUpdateView.as_view(), name="PermissionUpdate"),
    path('/delete/<int:id>', PermissionDeleteView.as_view(), name="PermissionDelete")
]
