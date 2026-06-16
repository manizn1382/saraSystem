from rest_framework import serializers
from dormitories.models import Room


class RoomsInfoSerializer(serializers.ModelSerializer):
    dorm_name = serializers.ReadOnlyField(source="dormitory.name")

    class Meta:
        model = Room
        fields = ['roomNumber', 'dorm_name', 'floorNumber', 'capacity', 'status', 'currentOccupancy', 'id']
        read_only_fields = (
            'id', 'current_occupancy', 'roomNumber', 'dorm_name', 'floorNumber', 'capacity', 'status'
        )


class RoomsDormDropDownSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ['roomNumber', 'id', 'capacity']
        read_only_fields = (
            'roomNumber', 'id', 'capacity'
        )
