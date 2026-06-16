from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import AccommodationRequest, BedAssignment
from .serializers import AccommodationRequestSerializer, BedAssignmentSerializer


class AccommodationRequestViewSet(viewsets.ModelViewSet):
    serializer_class = AccommodationRequestSerializer
    
    def get_queryset(self):
        user_id = self.request.user.id if self.request.user.is_authenticated else None
        if user_id and self.request.user.is_staff:
            return AccommodationRequest.objects.all()
        return AccommodationRequest.objects.filter(user_id=user_id)
    
    def perform_create(self, serializer):
        serializer.save(user_id=self.request.user.id)
    
    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        request_obj = self.get_object()
        status_val = request.data.get('status')
        review_note = request.data.get('review_note', '')
        
        if status_val not in ['approved', 'rejected']:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        request_obj.status = status_val
        request_obj.reviewed_by_id = request.user.id
        request_obj.reviewed_at = timezone.now()
        request_obj.review_note = review_note
        request_obj.save()
        
        return Response(self.get_serializer(request_obj).data)


class BedAssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = BedAssignmentSerializer
    
    def get_queryset(self):
        user_id = self.request.user.id if self.request.user.is_authenticated else None
        if user_id and self.request.user.is_staff:
            return BedAssignment.objects.all()
        return BedAssignment.objects.filter(user_id=user_id)
    
    def perform_create(self, serializer):
        serializer.save(assigned_by_id=self.request.user.id)
    
    @action(detail=True, methods=['post'])
    def end(self, request, pk=None):
        assignment = self.get_object()
        assignment.status = 'inactive'
        assignment.end_date = timezone.now().date()
        assignment.save()
        return Response(self.get_serializer(assignment).data)