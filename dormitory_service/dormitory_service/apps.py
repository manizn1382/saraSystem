from django.apps import AppConfig


class DormitoriesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'dormitory_service'

    def ready(self):
        import dormitory_service.models
