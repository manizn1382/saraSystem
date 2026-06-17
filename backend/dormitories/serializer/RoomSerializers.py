from rest_framework import serializers
from dormitories.models import Room


class RoomsInfoSerializer(serializers.ModelSerializer):

    class Meta:
        model = Room
        fields = ['roomNumber', 'dormitory', 'floorNumber', 'capacity', 'status', 'currentOccupancy', 'id']
        read_only_fields = (
            'current_occupancy', 'status'
        )


class RoomsDormDropDownSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ['roomNumber', 'id', 'capacity']
        read_only_fields = (
            'roomNumber', 'id', 'capacity'
        )
