from rest_framework import serializers
from accomodation_service.models import Accommodation


class AccommodationCreate(serializers.ModelSerializer):

    class Meta:
        model = Accommodation
        fields = ["requested_dorm", "preferred_room", "semester", "req_date", "description"]


class AccommodationList(serializers.ModelSerializer):

    class Meta:
        model = Accommodation
        fields = "__all__"
