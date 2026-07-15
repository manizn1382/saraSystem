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
from django.contrib import admin
from django.urls import path, include
from dormitory_service.api import dormUrl, roomUrl, bedUrl, bedAssign
from accomodation_service import urls as accUrl


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/dormitory/', include(dormUrl)),
    path('api/rooms/', include(roomUrl)),
    path('api/beds/', include(bedUrl)),
    path('api/accommodation', include(accUrl)),
    path('api/bedAssign', include(bedAssign))
]
