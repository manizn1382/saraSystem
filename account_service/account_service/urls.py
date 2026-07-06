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
from django.contrib import admin
from django.urls import path
from account_service.View.UserView import UserCreateView, UserLoginView, UserRoleCreateView, ChangePasswordView, EditProfileView, ListUserView
from account_service.View.RoleView import RoleCreateView, PermissionCreateView, RolePermissionCreateView


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/users/create', UserCreateView.as_view(), name="cerateUser"),
    path('api/v1/users/login', UserLoginView.as_view(), name="loginUser"),
    path('api/v1/role/create', RoleCreateView.as_view(), name="createRole"),
    path('api/v1/permission/create', PermissionCreateView.as_view(), name="createPermission"),
    path('api/v1/rolePermission/create', RolePermissionCreateView.as_view(), name="rolePermCreate"),
    path('api/v1/userRole/create', UserRoleCreateView.as_view(), name="userRoleCreate"),
    path('api/v1/users/changePassword', ChangePasswordView.as_view(), name="changePass"),
    path('api/v1/users/editProfile', EditProfileView.as_view(), name="EditProfile"),
    path('api/v1/users/list', ListUserView.as_view(), name="listUsers"),
]
