from rest_framework import serializers
from dormitory_service.models import Room


class RoomsInfoSerializer(serializers.ModelSerializer):
    dormitory_name = serializers.CharField(source='dormitory.name', read_only=True)

    class Meta:
        model = Room
        fields = [
            'id', 'dormitory', 'dormitory_name', 'roomNumber', 'floorNumber',
            'capacity', 'status', 'description', 'currentOccupancy'
        ]
        read_only_fields = ['id', 'dormitory_name', 'currentOccupancy']

    def validate(self, attrs):
        capacity = attrs.get('capacity', self.instance.capacity if self.instance else None)
        current_occupancy = self.instance.currentOccupancy if self.instance else 0

        if capacity is not None and capacity < 1:
            raise serializers.ValidationError({'capacity': 'Room capacity must be at least one.'})
        if capacity is not None and current_occupancy > capacity:
            raise serializers.ValidationError({
                'capacity': 'Room capacity cannot be lower than the current occupancy.'
            })
        return attrs


class RoomsDormDropDownSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ['roomNumber', 'id', 'capacity']
