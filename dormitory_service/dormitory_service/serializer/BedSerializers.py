# dormitories/serializer/DormSerializers.py
from rest_framework import serializers
from dormitory_service.models import Bed


class BedSerializer(serializers.ModelSerializer):

    class Meta:
        model = Bed
        fields = ['id', 'bedNumber', 'status', 'description', 'room']
        read_only_fields = ['id']

    def validate(self, attrs):
        room = attrs.get('room', self.instance.room if self.instance else None)
        if room is None:
            return attrs

        beds_in_room = room.beds.exclude(pk=self.instance.pk if self.instance else None).count()
        if beds_in_room >= room.capacity:
            raise serializers.ValidationError({
                'room': 'The room already has beds for its configured capacity.'
            })
        return attrs
