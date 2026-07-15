from rest_framework import serializers
from accomodation_service.models import Accommodation
from dormitory_service.models.DormModel import Dormitory


class AccommodationCreate(serializers.ModelSerializer):

    class Meta:
        model = Accommodation
        fields = ["requested_dorm", "preferred_room", "semester", "req_date", "description"]


class AccommodationList(serializers.ModelSerializer):

    class Meta:
        model = Accommodation
        fields = "__all__"


class UpdateAccommodation(serializers.ModelSerializer):
    requested_dorm = serializers.PrimaryKeyRelatedField(
        queryset=Dormitory.objects.all(),
        allow_null=True,
        required=False
    )

    class Meta:
        model = Accommodation
        fields = ["id", "requested_dorm", "preferred_room", "semester", "req_date", "status", "description"]
        read_only_fields = ["id"]


class UpdateReview(serializers.ModelSerializer):

    class Meta:
        model = Accommodation
        fields = ["id", "status", "review_note"]
        read_only_fields = ["id"]
