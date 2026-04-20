from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.db import models
from .models import ProgressReport, Evaluation
from .serializers import ProgressReportSerializer, EvaluationSerializer
from placements.models import Placement
from placements.serializers import PlacementSerializer
from accounts.permissions import IsStudent, IsSupervisor, IsCoordinator
from django.db.models import Avg, Count

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
            serializer.save(placement=placement)
        except Placement.DoesNotExist:
            raise serializers.ValidationError("You do not have an active placement to submit reports for.")

class ProgressReportMarkSeenView(generics.UpdateAPIView):
    queryset = ProgressReport.objects.all()
    serializer_class = ProgressReportSerializer
    permission_classes = [permissions.IsAuthenticated, IsSupervisor]

    def patch(self, request, *args, **kwargs):
        report = self.get_object()
        if report.placement.supervisor_assigned != request.user:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        
        report.supervisor_seen = True
        report.save()
        return Response(self.get_serializer(report).data)

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
