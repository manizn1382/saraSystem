# dormitory_service/db_router.py

class DormitoryRouter:
    """
    Router برای سرویس خوابگاه
    """

    def db_for_read(self, model, **hints):
        """تعیین دیتابیس برای عملیات خواندن (SELECT)"""
        if model._meta.app_label == 'dormitories':  # اسم اپ خودت را چک کن
            return 'dormitory_db'
        return None

    def db_for_write(self, model, **hints):
        """تعیین دیتابیس برای عملیات نوشتن (INSERT, UPDATE, DELETE)"""
        if model._meta.app_label == 'dormitories':  # اسم اپ خودت را چک کن
            return 'dormitory_db'
        return None

    def allow_relation(self, obj1, obj2, **hints):
        """آیا دو مدل می‌توانند با هم رابطه داشته باشند؟"""
        # فقط مدل‌هایی که در یک دیتابیس هستند
        if obj1._state.db == obj2._state.db:
            return True
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """کنترل migrationها"""
        if app_label == 'dormitories':  # اسم اپ خودت را چک کن
            return db == 'dormitory_db'
        return None