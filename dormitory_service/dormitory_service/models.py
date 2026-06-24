from django.db import models


class Dormitory(models.Model):
    DORM_TYPE_CHOICES = (
        ('b', 'Boys'),
        ('g', 'Girls'),
    )
    GENDER_CHOICES = (
        ('m', 'male'),
        ('f', 'female'),
    )

    name = models.CharField(max_length=200)
    dorm_type = models.CharField(max_length=1, choices=DORM_TYPE_CHOICES, default='b')
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, default='m')
    address = models.TextField(blank=True, null=True)
    totalRoom = models.IntegerField(default=0)
    description = models.TextField(blank=True, default='')
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
    currentOccupancy = models.IntegerField(default=0)

    class Meta:
        db_table = "dormitory"
        ordering = ['createdAt']

    def __str__(self):
        return f"{self.name} ({self.get_dorm_type_display()})"

    @property
    def available_capacity(self):
        return sum(
            max(room.capacity - room.currentOccupancy, 0)
            for room in self.rooms.all()
        )

    @property
    def total_beds(self):
        return sum(room.capacity for room in self.rooms.all())

    @property
    def occupied_beds(self):
        return sum(room.currentOccupancy for room in self.rooms.all())

    @property
    def occupancy_percentage(self):
        if self.total_beds > 0:
            return (self.occupied_beds / self.total_beds) * 100
        return 0


class Room(models.Model):
    STATUS_CHOICES = (
        ('available', 'AVAILABLE'),
        ('full', 'FULL'),
        ('maintenance', 'MAINTENANCE'),
        ('closed', 'CLOSED'),
    )

    dormitory = models.ForeignKey(Dormitory, on_delete=models.CASCADE, related_name='rooms')
    roomNumber = models.IntegerField()
    floorNumber = models.IntegerField()
    capacity = models.IntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    description = models.TextField(blank=True, default='')
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
    currentOccupancy = models.IntegerField(default=0)

    class Meta:
        db_table = "room"
        ordering = ['roomNumber']
        constraints = [
            models.UniqueConstraint(
                fields=['dormitory', 'roomNumber'],
                name='unique_room_number_per_dormitory',
            )
        ]

    def __str__(self):
        return f"Room {self.roomNumber} - Floor {self.floorNumber}"


class Bed(models.Model):
    STATUS_CHOICES = (
        ('available', 'AVAILABLE'),
        ('occupied', 'OCCUPIED'),
        ('reserved', 'RESERVED'),
        ('maintenance', 'MAINTENANCE'),
    )

    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='beds')
    bedNumber = models.CharField(max_length=30)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    description = models.TextField(blank=True, default='')
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'bed'
        ordering = ['createdAt']
        constraints = [
            models.UniqueConstraint(
                fields=['room', 'bedNumber'],
                name='unique_bed_number_per_room',
            )
        ]

    def __str__(self):
        return f"{self.room} - {self.bedNumber}"
