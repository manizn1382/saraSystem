# dormitories/serializer/DormSerializers.py
from rest_framework import serializers
from dormitory_service.models import Bed


class BedSerializer(serializers.ModelSerializer):

    class Meta:
        model = Bed
        fields = ['id', 'bedNumber', 'status', 'room']