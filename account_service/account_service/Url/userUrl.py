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
from account_service.View.UserView import UserByStudentId, ResetPasswordView, LogoutView, AdminEditView, UserCreateView, UserLoginView, ChangePasswordView, EditProfileView, ListUserView, UserDetailView, UserDeleteView, ChangeStatusView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('/create', UserCreateView.as_view(), name="cerateUser"),
    path('/token/refresh', TokenRefreshView.as_view(), name="refreshToken"),
    path('/login', UserLoginView.as_view(), name="loginUser"),
    path('/password/change', ChangePasswordView.as_view(), name="changePass"),
    path('/editProfile', EditProfileView.as_view(), name="EditProfile"),
    path('/list', ListUserView.as_view(), name="listUsers"),
    path('/current', UserDetailView.as_view(), name="UserDetail"),
    path('/delete/<int:pk>', UserDeleteView.as_view(), name="UserDelete"),
    path('/status/change', ChangeStatusView.as_view(), name="statusUpdate"),
    path('/adminUpdate', AdminEditView.as_view(), name="adminUpdate"),
    path('/logout', LogoutView.as_view(), name="logoutUser"),
    path('/password/reset', ResetPasswordView.as_view(), name="resetPass"),
    path('/current/studentId', UserByStudentId.as_view(), name="UserByStudent"),
]
