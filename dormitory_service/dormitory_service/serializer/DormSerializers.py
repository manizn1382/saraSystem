from rest_framework import serializers
from dormitory_service.models import Dormitory
from dormitory_service.serializer.RoomSerializers import RoomsDormDropDownSerializer


class DormitoriesInfoSerializer(serializers.ModelSerializer):
    available_capacity = serializers.ReadOnlyField()
    occupancy_percentage = serializers.ReadOnlyField()
    total_beds = serializers.ReadOnlyField()
    occupied_beds = serializers.ReadOnlyField()
    available_beds = serializers.ReadOnlyField(source='available_capacity')
    total_rooms = serializers.ReadOnlyField(source='totalRoom')

    class Meta:
        model = Dormitory
        fields = [
            'id', 'name', 'address', 'totalRoom',
            'currentOccupancy', 'dorm_type', 'gender', 'description',
            'total_rooms', 'total_beds', 'occupied_beds', 'available_beds',
            'occupancy_percentage', 'available_capacity'
        ]
        read_only_fields = [
            'totalRoom', 'currentOccupancy', 'total_rooms', 'total_beds',
            'occupied_beds', 'available_beds', 'occupancy_percentage',
            'available_capacity',
        ]


class DormitoryWithRoomsSerializer(serializers.ModelSerializer):
    rooms = RoomsDormDropDownSerializer(many=True, read_only=True)

    class Meta:
        model = Dormitory
        fields = ['id', 'name', 'rooms']
