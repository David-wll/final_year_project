from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.db import models
from .models import ProgressReport, Evaluation
from .serializers import ProgressReportSerializer, EvaluationSerializer
from placements.models import Placement
from placements.serializers import PlacementSerializer
from accounts.permissions import IsStudent, IsSupervisor, IsCoordinator
from django.db.models import Avg, Count
from accounts.models import Notification

class ProgressReportListCreateView(generics.ListCreateAPIView):
    serializer_class = ProgressReportSerializer
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated(), IsStudent()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        placement_id = self.request.query_params.get('placement')
        if placement_id:
            return ProgressReport.objects.filter(placement_id=placement_id)
        
        if self.request.user.role == 'student':
            return ProgressReport.objects.filter(placement__application__student__user=self.request.user)
        return ProgressReport.objects.all()

    def perform_create(self, serializer):
        # Automatically find the active placement for the student
        try:
            placement = Placement.objects.get(application__student__user=self.request.user, is_active=True)
            report = serializer.save(placement=placement)

            # Notify Supervisor
            if placement.supervisor_assigned:
                Notification.create_notification(
                    user=placement.supervisor_assigned,
                    title="New Weekly Report",
                    message=f"{self.request.user.email} submitted a report for Week {report.week_number}.",
                    notification_type='info'
                )
        except Placement.DoesNotExist:
            raise serializers.ValidationError("You do not have an active placement to submit reports for.")

class ProgressReportActionView(generics.UpdateAPIView):
    queryset = ProgressReport.objects.all()
    serializer_class = ProgressReportSerializer
    permission_classes = [permissions.IsAuthenticated, IsSupervisor]

    def patch(self, request, *args, **kwargs):
        report = self.get_object()
        if report.placement.supervisor_assigned != request.user:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        
        status_val = request.data.get('status')
        comment = request.data.get('supervisor_comment', '')
        
        if status_val in ['approved', 'revision_requested']:
            report.status = status_val
            report.supervisor_comment = comment
            report.supervisor_seen = True
            report.save()

            # Notify Student
            Notification.create_notification(
                user=report.placement.student.user,
                title=f"Logbook {status_val.replace('_', ' ').title()}",
                message=f"Your supervisor has {status_val.replace('_', ' ')} your Week {report.week_number} report.",
                notification_type='success' if status_val == 'approved' else 'warning'
            )
            return Response(self.get_serializer(report).data)
        
        return Response({"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)

class EvaluationListCreateView(generics.ListCreateAPIView):
    serializer_class = EvaluationSerializer
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated(), IsSupervisor()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        placement_id = self.request.query_params.get('placement')
        if placement_id:
            return Evaluation.objects.filter(placement_id=placement_id)
        return Evaluation.objects.all()

    def perform_create(self, serializer):
        serializer.save(evaluator=self.request.user)

class CoordinatorAtRiskView(generics.ListAPIView):
    serializer_class = PlacementSerializer
    permission_classes = [permissions.IsAuthenticated, IsCoordinator]

    def get_queryset(self):
        # Identify at-risk students: 
        # 1. Average evaluation rating < 2.5
        # 2. Fewer than 2 reports submitted (for simplicity)
        
        at_risk_placements = Placement.objects.annotate(
            avg_rating=Avg('evaluations__overall_rating'),
            report_count=Count('reports')
        ).filter(
            models.Q(avg_rating__lt=2.5) | models.Q(report_count__lt=2)
        )
        
        return at_risk_placements
