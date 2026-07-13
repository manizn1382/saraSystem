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


class UpdateAccommodation(serializers.ModelSerializer):

    class Meta:
        model = Accommodation
        fields = ["id", "requested_dorm", "preferred_room", "semester", "req_date", "status", "description"]
        read_only_fields = ["id"]


class UpdateReview(serializers.ModelSerializer):

    class Meta:
        model = Accommodation
        fields = ["id", "status", "review_note"]
        read_only_fields = ["id"]
