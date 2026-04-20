from rest_framework import serializers
from .models import ProgressReport, Evaluation
from placements.serializers import PlacementSerializer

class ProgressReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProgressReport
        fields = '__all__'
        read_only_fields = ('submitted_at', 'supervisor_seen')

class EvaluationSerializer(serializers.ModelSerializer):
    evaluator_name = serializers.ReadOnlyField(source='evaluator.email')
    
    class Meta:
        model = Evaluation
        fields = '__all__'
        read_only_fields = ('evaluator', 'overall_rating', 'submitted_at')
