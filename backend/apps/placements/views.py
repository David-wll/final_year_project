from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import Application, Placement, InternshipFeedback
from .serializers import ApplicationSerializer, PlacementSerializer, InternshipFeedbackSerializer
from accounts.permissions import IsStudent, IsOrganization, IsCoordinator, IsSupervisor
from organizations.models import InternshipOpportunity
from organizations.serializers import InternshipOpportunitySerializer

class StudentApplicationListCreateView(generics.ListCreateAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated, IsStudent]

    def get_queryset(self):
        return Application.objects.filter(student__user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(student=self.request.user.student_profile)

class OrganizationApplicationListView(generics.ListAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated, IsOrganization]

    def get_queryset(self):
        return Application.objects.filter(opportunity__organization__user=self.request.user)

from django.db import transaction
from datetime import date, timedelta

class ApplicationStatusUpdateView(generics.UpdateAPIView):
    queryset = Application.objects.all()
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated, IsOrganization]

    def patch(self, request, *args, **kwargs):
        application = self.get_object()
        # Verify organization owns the opportunity
        if application.opportunity.organization.user != request.user:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        
        new_status = request.data.get('status')
        if new_status not in [choice[0] for choice in Application.STATUS_CHOICES]:
            return Response({"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)
            
        old_status = application.status
        
        # Prevent updating if already accepted
        if old_status == 'accepted':
            return Response({"error": "Application already accepted"}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            application.status = new_status
            application.save()
            
            if new_status == 'accepted':
                opp = application.opportunity
                if opp.slots_filled >= opp.slots_available:
                    return Response({"error": "No slots available"}, status=status.HTTP_400_BAD_REQUEST)
                
                # Increment filled slots
                opp.slots_filled += 1
                opp.save()
                
                # Auto-create placement
                Placement.objects.create(
                    application=application,
                    start_date=date.today() + timedelta(days=7), # Default start in a week
                    end_date=date.today() + timedelta(days=90),  # Default 3 months
                )
                
        return Response(self.get_serializer(application).data)

class OpportunityDiscoveryView(generics.ListAPIView):
    serializer_class = InternshipOpportunitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # List all active opportunities
        return InternshipOpportunity.objects.filter(is_active=True)

class SupervisorPlacementListView(generics.ListAPIView):
    serializer_class = PlacementSerializer
    permission_classes = [permissions.IsAuthenticated, IsSupervisor]

    def get_queryset(self):
        return Placement.objects.filter(supervisor_assigned=self.request.user, is_active=True)

class CoordinatorPlacementListView(generics.ListAPIView):
    serializer_class = PlacementSerializer
    permission_classes = [permissions.IsAuthenticated, IsCoordinator]

    def get_queryset(self):
        return Placement.objects.all()

class FeedbackCreateView(generics.CreateAPIView):
    serializer_class = InternshipFeedbackSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # Determine the role of the user
        role = self.request.user.role
        serializer.save(submitted_by_role=role)
