from rest_framework import serializers
from dormitories.models import Room


class RoomsInfoSerializer(serializers.ModelSerializer):

    class Meta:
        model = Room
        fields = ['roomNumber', 'dormitory', 'floorNumber', 'capacity', 'status', 'currentOccupancy', 'id']


class RoomsDormDropDownSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ['roomNumber', 'id', 'capacity']
