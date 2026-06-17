from rest_framework import serializers
from dormitories.models import Dormitory
from dormitories.serializer.RoomSerializers import RoomsDormDropDownSerializer


class DormitoriesInfoSerializer(serializers.ModelSerializer):
    gender_display = serializers.CharField(source='get_gender_display', required=False)
    available_capacity = serializers.ReadOnlyField()
    occupancy_percentage = serializers.ReadOnlyField()

    class Meta:
        model = Dormitory
        fields = [
            'id', 'name', 'address', 'totalRoom', 'currentOccupancy',
            'available_capacity', 'occupancy_percentage', 'gender_display'
        ]


class DormitoryWithRoomsSerializer(serializers.ModelSerializer):
    rooms = RoomsDormDropDownSerializer(many=True, read_only=True)

    class Meta:
        model = Dormitory
        fields = ['id', 'name', 'rooms']
