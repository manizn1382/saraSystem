from .base import *


DEBUG = True


ALLOWED_HOSTS = ['localhost', '127.0.0.1']


ROOT_URLCONF = 'dormitories.urls'
WSGI_APPLICATION = 'dormitories.wsgi.application'


INSTALLED_APPS += [
    'dormitories',
]

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'dormitory_database',
        'USER': 'dorm_user',
        'PASSWORD': 'dorm_password',
        'HOST': 'localhost',
        'PORT': '3306',
    }
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}