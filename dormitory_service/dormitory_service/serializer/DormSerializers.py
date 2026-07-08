from rest_framework import serializers
from dormitory_service.models import Dormitory
from dormitory_service.serializer.RoomSerializers import RoomsDormDropDownSerializer


class DormitoriesInfoSerializer(serializers.ModelSerializer):
    available_capacity = serializers.ReadOnlyField()
    occupancy_percentage = serializers.ReadOnlyField()

    class Meta:
        model = Dormitory
        fields = [
            'id', 'name', 'address', 'totalRoom',
            'gender', 'occupancy_percentage', 'available_capacity', 'currentOccupancy'
        ]
        read_only_fields = ['occupancy_percentage', 'available_capacity']


class DormitoryWithRoomsSerializer(serializers.ModelSerializer):
    rooms = RoomsDormDropDownSerializer(many=True, read_only=True)

    class Meta:
        model = Dormitory
        fields = ['id', 'name', 'rooms']
