from django.db.models import Sum

from dormitory_service.models import Dormitory, Room


def sync_dormitory_metrics(dormitory_id):
    """Keep legacy dormitory counters consistent with rooms and occupied beds."""
    rooms = Room.objects.filter(dormitory_id=dormitory_id)
    Dormitory.objects.filter(pk=dormitory_id).update(
        totalRoom=rooms.count(),
        currentOccupancy=rooms.aggregate(total=Sum('currentOccupancy'))['total'] or 0,
    )


def sync_room_occupancy(room_id):
    """Update a room's occupancy and derived availability after a bed mutation."""
    room = Room.objects.get(pk=room_id)
    occupied = room.beds.filter(status='occupied').count()
    fields = []

    if room.currentOccupancy != occupied:
        room.currentOccupancy = occupied
        fields.append('currentOccupancy')

    if room.status in {'available', 'full'}:
        expected_status = 'full' if occupied >= room.capacity else 'available'
        if room.status != expected_status:
            room.status = expected_status
            fields.append('status')

    if fields:
        room.save(update_fields=fields)

    sync_dormitory_metrics(room.dormitory_id)
