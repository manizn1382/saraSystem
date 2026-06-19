from django.contrib import admin
from django.urls import path, include
from dormitories.url import roomUrl, dormUrl, bedUrl

urlpatterns = [
    path('admin/', admin.site.urls),
    path('url/dormitory/', include(dormUrl)),
    path('url/rooms/', include(roomUrl)),
    path('url/beds/', include(bedUrl)),
]