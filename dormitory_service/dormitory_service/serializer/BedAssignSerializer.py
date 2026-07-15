from rest_framework import serializers
from dormitory_service.models.BedAssignModel import BedAssign


class BedAssignSerializer(serializers.ModelSerializer):
    active_only = serializers.ReadOnlyField()

    class Meta:
        model = BedAssign
        fields = ['user_id', "bed", "status", "active_only", "request", "assigned_by", "start_date", "end_date"]


class BedAssignDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = BedAssign
        fields = "__all__"


class BedAssignUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BedAssign
        fields = "__all__"
        read_only_fields = ['id', 'user_id']
