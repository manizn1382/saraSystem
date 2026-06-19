from django.conf import settings
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.backends import TokenBackend

from .models import Role, User, UserRole


class AccountApiTests(APITestCase):
    def user_payload(self, **overrides):
        payload = {
            'email': 'student@example.edu',
            'first_name': 'Sara',
            'last_name': 'Student',
            'national_id': '1234567890',
            'student_id': '401123456',
            'phone': '09120000000',
            'gender': 'female',
            'password': 'StrongPass123!',
            'password_confirm': 'StrongPass123!',
        }
        payload.update(overrides)
        return payload

    def authenticate(self, user):
        response = self.client.post(
            '/api/accounts/getToken/',
            {'email': user.email, 'password': 'StrongPass123!'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
        return response.data

    def test_register_hashes_password_assigns_student_role_and_login_returns_role_claims(self):
        response = self.client.post('/api/accounts/register/', self.user_payload(), format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(email='student@example.edu')
        self.assertTrue(user.check_password('StrongPass123!'))
        self.assertFalse(user.password == 'StrongPass123!')
        self.assertTrue(user.roles.filter(name='student').exists())

        login = self.authenticate(user)
        self.assertEqual(login['user']['roles'], ['student'])
        self.assertEqual(login['roles'], ['student'])
        token_data = TokenBackend(
            algorithm='HS256',
            signing_key=settings.SIMPLE_JWT['SIGNING_KEY'],
        ).decode(login['access'], verify=True)
        self.assertEqual(token_data['roles'], ['student'])
        self.assertFalse(token_data['is_staff'])

    def test_profile_endpoint_cannot_change_password_and_change_password_validates_old_password(self):
        user = User.objects.create_user(
            email='profile@example.edu',
            password='StrongPass123!',
            first_name='Profile',
            last_name='User',
            national_id='2345678901',
            phone='09120000001',
            gender='male',
        )
        self.authenticate(user)

        profile = self.client.patch(
            '/api/accounts/update-profile/',
            {'first_name': 'Updated', 'password': 'AnotherStrongPass123!'},
            format='json',
        )
        self.assertEqual(profile.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertEqual(user.first_name, 'Updated')
        self.assertTrue(user.check_password('StrongPass123!'))

        invalid_change = self.client.post(
            '/api/accounts/change-password/',
            {'old_password': 'wrong-password', 'new_password': 'AnotherStrongPass123!'},
            format='json',
        )
        self.assertEqual(invalid_change.status_code, status.HTTP_400_BAD_REQUEST)

        valid_change = self.client.post(
            '/api/accounts/change-password/',
            {'old_password': 'StrongPass123!', 'new_password': 'AnotherStrongPass123!'},
            format='json',
        )
        self.assertEqual(valid_change.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertTrue(user.check_password('AnotherStrongPass123!'))

    def test_user_and_role_management_are_not_public(self):
        anonymous_response = self.client.get('/api/accounts/users/')
        self.assertIn(anonymous_response.status_code, {status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN})

        role = Role.objects.create(name='system_admin')
        admin = User.objects.create_user(
            email='admin@example.edu',
            password='StrongPass123!',
            first_name='System',
            last_name='Admin',
            national_id='3456789012',
            phone='09120000002',
            gender='male',
            is_staff=True,
        )
        UserRole.objects.create(user=admin, role=role)
        self.authenticate(admin)

        users = self.client.get('/api/accounts/users/')
        roles = self.client.get('/api/accounts/roles/')
        self.assertEqual(users.status_code, status.HTTP_200_OK)
        self.assertEqual(roles.status_code, status.HTTP_200_OK)

    def test_cors_preflight_allows_the_frontend_authorization_header(self):
        response = self.client.options(
            '/api/accounts/getToken/',
            HTTP_ORIGIN='http://127.0.0.1:18080',
            HTTP_ACCESS_CONTROL_REQUEST_METHOD='POST',
            HTTP_ACCESS_CONTROL_REQUEST_HEADERS='authorization,content-type',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Access-Control-Allow-Origin'], '*')
        self.assertIn('authorization', response['Access-Control-Allow-Headers'].lower())

    def test_superuser_cannot_be_created_without_required_privileges(self):
        with self.assertRaises(ValueError):
            User.objects.create_superuser(
                email='invalid-superuser@example.edu',
                password='StrongPass123!',
                first_name='Invalid',
                last_name='Superuser',
                national_id='4567890123',
                phone='09120000003',
                gender='male',
                is_staff=False,
            )
