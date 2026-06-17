# dormitories/serializer/DormSerializers.py
from rest_framework import serializers
from dormitories.models import Bed


class BedSerializer(serializers.ModelSerializer):

    class Meta:
        model = Bed
        fields = ['id', 'bedNumber', 'status', 'room']