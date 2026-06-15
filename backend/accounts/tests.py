from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth.hashers import make_password
from .models import User, Role

class AccountsTests(TestCase):
    
    def setUp(self):
        self.client = APIClient()
        self.student_role = Role.objects.create(name='student', description='دانشجو')
        
    def test_register_student(self):
        data = {
            'email': 'test@test.com',
            'first_name': 'سارا',
            'last_name': 'احمدی',
            'national_id': '0012345678',
            'phone': '09123456789',
            'gender': 'female',
            'password': '12345678'
        }
        response = self.client.post('/api/accounts/register/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(response.data['email'], 'test@test.com')
        
    def test_register_duplicate_email(self):
        User.objects.create(
            email='test@test.com',
            first_name='test',
            last_name='user',
            national_id='0098765432',
            phone='09123456788',
            gender='male',
            password=make_password('12345678')
        )
        data = {
            'email': 'test@test.com',
            'first_name': 'سارا',
            'last_name': 'احمدی',
            'national_id': '0012345678',
            'phone': '09123456789',
            'gender': 'female',
            'password': '12345678'
        }
        response = self.client.post('/api/accounts/register/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
    def test_login_success(self):
        user = User.objects.create(
            email='login@test.com',
            first_name='test',
            last_name='user',
            national_id='0098765432',
            phone='09123456788',
            gender='male'
        )
        user.set_password('testpass123')
        user.save()
        
        response = self.client.post('/api/auth/login/', {
            'email': 'login@test.com',
            'password': 'testpass123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        
    def test_login_wrong_password(self):
        user = User.objects.create(
            email='login@test.com',
            first_name='test',
            last_name='user',
            national_id='0098765432',
            phone='09123456788',
            gender='male'
        )
        user.set_password('testpass123')
        user.save()
        
        response = self.client.post('/api/auth/login/', {
            'email': 'login@test.com',
            'password': 'wrongpass'
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
    def test_get_me_authenticated(self):
        user = User.objects.create(
            email='me@test.com',
            first_name='test',
            last_name='user',
            national_id='0098765432',
            phone='09123456788',
            gender='male'
        )
        user.set_password('testpass123')
        user.save()
        
        response = self.client.post('/api/auth/login/', {
            'email': 'me@test.com',
            'password': 'testpass123'
        })
        token = response.data['access']
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.get('/api/accounts/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'me@test.com')
        
    def test_get_me_unauthenticated(self):
        response = self.client.get('/api/accounts/me/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
    def test_update_profile(self):
        user = User.objects.create(
            email='update@test.com',
            first_name='old',
            last_name='name',
            national_id='0098765432',
            phone='09123456788',
            gender='male'
        )
        user.set_password('testpass123')
        user.save()
        
        response = self.client.post('/api/auth/login/', {
            'email': 'update@test.com',
            'password': 'testpass123'
        })
        token = response.data['access']
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.patch('/api/accounts/update-profile/', {
            'first_name': 'new first name',
            'phone': '09999999999'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['first_name'], 'new first name')
        
    def test_change_password(self):
        user = User.objects.create(
            email='pass@test.com',
            first_name='test',
            last_name='user',
            national_id='0098765432',
            phone='09123456788',
            gender='male'
        )
        user.set_password('oldpass123')
        user.save()
        
        response = self.client.post('/api/auth/login/', {
            'email': 'pass@test.com',
            'password': 'oldpass123'
        })
        token = response.data['access']
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.post('/api/accounts/change-password/', {
            'old_password': 'oldpass123',
            'new_password': 'newpass456'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test login with new password
        response = self.client.post('/api/auth/login/', {
            'email': 'pass@test.com',
            'password': 'newpass456'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)