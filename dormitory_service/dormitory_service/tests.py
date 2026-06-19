from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import AccessToken

from .models import Dormitory, Room


class DormitoryApiTests(APITestCase):
    def authenticate(self, roles, is_staff=False):
        token = AccessToken()
        token['user_id'] = 1
        token['roles'] = roles
        token['is_staff'] = is_staff
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    def create_dormitory(self):
        return Dormitory.objects.create(
            name='North Dormitory',
            dorm_type='b',
            gender='m',
            totalRoom=1,
        )

    def test_student_can_read_but_cannot_create_dormitory_data(self):
        self.create_dormitory()
        self.authenticate(['student'])

        listing = self.client.get('/api/dormitory/listAll/')
        creation = self.client.post(
            '/api/dormitory/createDorm/',
            {'name': 'West Dormitory', 'totalRoom': 2, 'gender': 'm'},
            format='json',
        )

        self.assertEqual(listing.status_code, status.HTTP_200_OK)
        self.assertEqual(creation.status_code, status.HTTP_403_FORBIDDEN)

    def test_dormitory_admin_can_manage_room_and_bed_and_capacity_updates(self):
        self.authenticate(['dormitory_admin'])

        dormitory_response = self.client.post(
            '/api/dormitory/createDorm/',
            {'name': 'North Dormitory', 'dorm_type': 'b', 'gender': 'm', 'totalRoom': 99},
            format='json',
        )
        self.assertEqual(dormitory_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(dormitory_response.data['data']['totalRoom'], 0)
        dormitory = Dormitory.objects.get(pk=dormitory_response.data['data']['id'])

        room_response = self.client.post(
            '/api/rooms/createRoom/',
            {
                'dormitory': dormitory.id,
                'roomNumber': 101,
                'floorNumber': 1,
                'capacity': 2,
                'status': 'available',
            },
            format='json',
        )
        self.assertEqual(room_response.status_code, status.HTTP_201_CREATED)
        room = Room.objects.get(pk=room_response.data['id'])

        bed_response = self.client.post(
            '/api/beds/createBed/',
            {'room': room.id, 'bedNumber': '1', 'status': 'occupied'},
            format='json',
        )
        self.assertEqual(bed_response.status_code, status.HTTP_201_CREATED)

        room.refresh_from_db()
        self.assertEqual(room.currentOccupancy, 1)
        self.assertEqual(room.status, 'available')

        listing = self.client.get('/api/dormitory/listAll/')
        self.assertEqual(listing.status_code, status.HTTP_200_OK)
        payload = listing.data[0]
        self.assertEqual(payload['total_beds'], 2)
        self.assertEqual(payload['occupied_beds'], 1)
        self.assertEqual(payload['available_beds'], 1)
        dormitory.refresh_from_db()
        self.assertEqual(dormitory.totalRoom, 1)
        self.assertEqual(dormitory.currentOccupancy, 1)

        deletion = self.client.delete(f'/api/rooms/deleteRoom/{room.id}/')
        self.assertEqual(deletion.status_code, status.HTTP_200_OK)
        dormitory.refresh_from_db()
        self.assertEqual(dormitory.totalRoom, 0)
        self.assertEqual(dormitory.currentOccupancy, 0)

    def test_room_and_bed_capacity_limits_are_enforced(self):
        dormitory = self.create_dormitory()
        self.authenticate(['dormitory_admin'])
        room = Room.objects.create(
            dormitory=dormitory,
            roomNumber=102,
            floorNumber=1,
            capacity=1,
        )

        first_bed = self.client.post(
            '/api/beds/createBed/',
            {'room': room.id, 'bedNumber': '1', 'status': 'available'},
            format='json',
        )
        second_bed = self.client.post(
            '/api/beds/createBed/',
            {'room': room.id, 'bedNumber': '2', 'status': 'available'},
            format='json',
        )
        invalid_room_update = self.client.patch(
            f'/api/rooms/updateRoom/{room.id}/',
            {'capacity': 0},
            format='json',
        )

        self.assertEqual(first_bed.status_code, status.HTTP_201_CREATED)
        self.assertEqual(second_bed.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('room', second_bed.data)
        self.assertEqual(invalid_room_update.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('capacity', invalid_room_update.data)

    def test_cors_preflight_allows_the_frontend_authorization_header(self):
        response = self.client.options(
            '/api/rooms/createRoom/',
            HTTP_ORIGIN='http://127.0.0.1:18080',
            HTTP_ACCESS_CONTROL_REQUEST_METHOD='POST',
            HTTP_ACCESS_CONTROL_REQUEST_HEADERS='authorization,content-type',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Access-Control-Allow-Origin'], '*')
        self.assertIn('authorization', response['Access-Control-Allow-Headers'].lower())
