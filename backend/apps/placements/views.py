from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import models
from django.shortcuts import get_object_or_404
from .models import Application, Placement, InternshipFeedback, PlacementActivity, SavedOpportunity, FollowedOrganization
from .serializers import (
    ApplicationSerializer,
    PlacementSerializer,
    InternshipFeedbackSerializer,
    PlacementActivitySerializer,
    SavedOpportunitySerializer,
    FollowedOrganizationSerializer,
)
from accounts.permissions import IsStudent, IsOrganization, IsCoordinator, IsSupervisor
from organizations.models import InternshipOpportunity
from organizations.serializers import InternshipOpportunitySerializer
from django.contrib.auth import get_user_model
from .services import log_activity
from accounts.models import Notification

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
        new_status = request.data.get('status')
        if new_status not in [choice[0] for choice in Application.STATUS_CHOICES]:
            return Response({"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            application = Application.objects.select_for_update().select_related(
                'opportunity', 'opportunity__organization'
            ).get(pk=kwargs.get('pk'))

            # Verify organization owns the opportunity
            if application.opportunity.organization.user != request.user:
                return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

            # Prevent updating if already accepted
            if application.status == 'accepted':
                return Response({"error": "Application already accepted"}, status=status.HTTP_400_BAD_REQUEST)

            if new_status == 'accepted':
                opp = application.opportunity
                if opp.slots_filled >= opp.slots_available:
                    return Response({"error": "No slots available"}, status=status.HTTP_400_BAD_REQUEST)

                # Update application only after all checks pass
                application.status = new_status
                application.save(update_fields=['status', 'updated_at'])

                # Increment filled slots safely
                opp.slots_filled += 1
                opp.save(update_fields=['slots_filled'])

                # Auto-create placement
                placement = Placement.objects.create(
                    application=application,
                    start_date=date.today() + timedelta(days=7),  # Default start in a week
                    end_date=date.today() + timedelta(days=90),  # Default 3 months
                )
                
                # Notify Student
                Notification.create_notification(
                    user=application.student.user,
                    title="Congratulations! Application Accepted",
                    message=f"Your application for {opp.title} at {opp.organization_name} has been accepted.",
                    notification_type='success'
                )
                log_activity(
                    activity_type='placement_created',
                    title=f'Placement created for {application.student.full_name}',
                    message=f'Placement created for {opp.title} after acceptance.',
                    actor=request.user,
                    application=application,
                    placement=placement,
                )
                log_activity(
                    activity_type='application_status',
                    title=f'Application accepted for {application.student.full_name}',
                    message=f'{request.user.email} accepted the application for {opp.title}.',
                    actor=request.user,
                    application=application,
                    placement=placement,
                )
            else:
                application.status = new_status
                application.save(update_fields=['status', 'updated_at'])

                # Notify Student
                Notification.create_notification(
                    user=application.student.user,
                    title="Application Status Updated",
                    message=f"Your application for {application.opportunity.title} is now {new_status}.",
                    notification_type='info' if new_status != 'rejected' else 'error'
                )
                log_activity(
                    activity_type='application_status',
                    title=f'Application {new_status} for {application.student.full_name}',
                    message=f'{request.user.email} marked the application for {application.opportunity.title} as {new_status}.',
                    actor=request.user,
                    application=application,
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
        feedback = serializer.save(submitted_by_role=role)
        log_activity(
            activity_type='feedback_submitted',
            title=f'Feedback submitted by {role}',
            message=f'{self.request.user.email} submitted feedback for placement {feedback.placement_id}.',
            actor=self.request.user,
            placement=feedback.placement,
        )


class AssignSupervisorView(generics.UpdateAPIView):
    """Assign a supervisor user to a placement.

    Allowed for coordinators, or an organization owner for placements belonging
    to their opportunities.
    """
    queryset = Placement.objects.all()
    serializer_class = PlacementSerializer

    def patch(self, request, *args, **kwargs):
        placement = self.get_object()
        user = request.user

        # Check permissions: coordinator can assign any; organization can assign for their placement
        if user.role == 'organization':
            if placement.application.opportunity.organization.user != user:
                return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        elif user.role != 'coordinator':
            return Response({"error": "Only coordinators or organization owners can assign supervisors"}, status=status.HTTP_403_FORBIDDEN)

        supervisor_id = request.data.get('supervisor_id')
        if not supervisor_id:
            return Response({"error": "Missing supervisor_id"}, status=status.HTTP_400_BAD_REQUEST)

        User = get_user_model()
        try:
            sup = User.objects.get(pk=supervisor_id)
        except User.DoesNotExist:
            return Response({"error": "Supervisor not found"}, status=status.HTTP_404_NOT_FOUND)

        if sup.role != 'supervisor':
            return Response({"error": "User is not a supervisor"}, status=status.HTTP_400_BAD_REQUEST)

        placement.supervisor_assigned = sup
        placement.save()

        log_activity(
            activity_type='supervisor_assigned',
            title=f'Supervisor assigned to placement {placement.id}',
            message=f'{user.email} assigned {sup.email} to placement {placement.id}.',
            actor=user,
            placement=placement,
            application=placement.application,
        )

        return Response(self.get_serializer(placement).data)


class PlacementActivityListView(generics.ListAPIView):
    serializer_class = PlacementActivitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = PlacementActivity.objects.select_related('actor', 'application', 'placement')

        if user.role == 'coordinator':
            return qs
        if user.role == 'organization':
            return qs.filter(
                models.Q(application__opportunity__organization__user=user) |
                models.Q(placement__application__opportunity__organization__user=user)
            )
        if user.role == 'student':
            return qs.filter(application__student__user=user)
        if user.role == 'supervisor':
            return qs.filter(placement__supervisor_assigned=user)
        return qs.none()


class SavedOpportunityToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsStudent]

    def post(self, request):
        opportunity_id = request.data.get('opportunity_id')
        if not opportunity_id:
            return Response({'error': 'Missing opportunity_id'}, status=status.HTTP_400_BAD_REQUEST)

        opportunity = get_object_or_404(InternshipOpportunity, pk=opportunity_id)
        saved, created = SavedOpportunity.objects.get_or_create(
            user=request.user,
            opportunity=opportunity,
        )
        if not created:
            saved.delete()
            return Response({'saved': False})

        return Response({'saved': True, 'opportunity': SavedOpportunitySerializer(saved).data})


class SavedOpportunityListView(generics.ListAPIView):
    serializer_class = SavedOpportunitySerializer
    permission_classes = [permissions.IsAuthenticated, IsStudent]

    def get_queryset(self):
        return SavedOpportunity.objects.filter(user=self.request.user).select_related('opportunity', 'opportunity__organization')


class FollowOrganizationToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsStudent]

    def post(self, request):
        organization_id = request.data.get('organization_id')
        if not organization_id:
            return Response({'error': 'Missing organization_id'}, status=status.HTTP_400_BAD_REQUEST)

        from organizations.models import OrganizationProfile

        organization = get_object_or_404(OrganizationProfile, pk=organization_id)
        follow, created = FollowedOrganization.objects.get_or_create(
            user=request.user,
            organization=organization,
        )
        if not created:
            follow.delete()
            return Response({'followed': False})

        return Response({'followed': True, 'organization': FollowedOrganizationSerializer(follow).data})


class FollowedOrganizationListView(generics.ListAPIView):
    serializer_class = FollowedOrganizationSerializer
    permission_classes = [permissions.IsAuthenticated, IsStudent]

    def get_queryset(self):
        return FollowedOrganization.objects.filter(user=self.request.user).select_related('organization')


class ApplicationTimelineView(generics.ListAPIView):
    serializer_class = PlacementActivitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        application = get_object_or_404(Application, pk=self.kwargs['pk'])
        user = self.request.user

        if user.role == 'student' and application.student.user != user:
            return PlacementActivity.objects.none()
        if user.role == 'organization' and application.opportunity.organization.user != user:
            return PlacementActivity.objects.none()
        if user.role not in ['student', 'organization', 'coordinator']:
            return PlacementActivity.objects.none()

        return PlacementActivity.objects.filter(application=application).select_related('actor', 'application', 'placement')
