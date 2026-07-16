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
from account_service.View.UserView import UserRoleCreateView, userRoleDetailView, userRoleDeleteView

urlpatterns = [
    path('/create', UserRoleCreateView.as_view(), name="userRoleCreate"),
    path('/detail', userRoleDetailView.as_view(), name="userRoleDetail"),
    path('delete/<int:id>', userRoleDeleteView.as_view(), name='userRoleDelete'),

]
