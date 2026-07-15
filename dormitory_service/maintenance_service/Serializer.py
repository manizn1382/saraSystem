from rest_framework import serializers
from maintenance_service.models import Maintenance


class MaintenanceCreate(serializers.ModelSerializer):
    class Meta:
        model = Maintenance
        fields = ["room", "bed", "priority", "status", "description", "dorm"]


class MaintenanceDetail(serializers.ModelSerializer):
    class Meta:
        model = Maintenance
        fields = "__all__"


class MaintenanceUpdate(serializers.ModelSerializer):
    class Meta:
        model = Maintenance
        fields = "__all__"
        read_only_fields = ['id', 'requester_id']


class MaintenanceStatusUpdate(serializers.ModelSerializer):
    class Meta:
        model = Maintenance
        fields = ["status", "requester_id", "id"]
        read_only_fields = ['id', 'requester_id']


class MaintenanceAssignUpdate(serializers.ModelSerializer):
    class Meta:
        model = Maintenance
        fields = ["assigned_to", "requester_id", "id"]
        read_only_fields = ['id', 'requester_id']


class MaintenanceCommentUpdate(serializers.ModelSerializer):
    class Meta:
        model = Maintenance
        fields = ["description", "requester_id", "id"]
        read_only_fields = ['id', 'requester_id']