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
from django.urls import path, include
from announcements import urls as annUrl

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/users', include('account_service.Url.userUrl')),
    path('api/v1/permission', include('account_service.Url.PermissionUrl')),
    path('api/v1/role', include('account_service.Url.RoleUrl')),
    path('api/v1/userRole', include('account_service.Url.userRoleUrl')),
    path('api/v1/rolePermission', include('account_service.Url.RolePermissionUrl')),
    path('api/v1/announcements', include(annUrl))

]
