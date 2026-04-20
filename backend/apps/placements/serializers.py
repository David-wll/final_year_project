from rest_framework import serializers
from .models import Application, Placement, InternshipFeedback
from organizations.serializers import InternshipOpportunitySerializer
from students.serializers import StudentProfileSerializer

class ApplicationSerializer(serializers.ModelSerializer):
    opportunity_details = InternshipOpportunitySerializer(source='opportunity', read_only=True)
    student_details = StudentProfileSerializer(source='student', read_only=True)

    class Meta:
        model = Application
        fields = [
            'id', 'student', 'opportunity', 'status', 'cover_letter', 
            'applied_at', 'updated_at', 'opportunity_details', 
            'student_details', 'placement'
        ]
        read_only_fields = ('student', 'applied_at', 'updated_at', 'placement')

    def validate(self, data):
        student = self.context['request'].user.student_profile
        opportunity = data.get('opportunity')
        
        if Application.objects.filter(student=student, opportunity=opportunity).exists():
            raise serializers.ValidationError("You have already applied for this opportunity.")
        
        return data

class PlacementSerializer(serializers.ModelSerializer):
    application_details = ApplicationSerializer(source='application', read_only=True)

    class Meta:
        model = Placement
        fields = '__all__'
        read_only_fields = ('application', 'created_at')

class InternshipFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = InternshipFeedback
        fields = '__all__'
        read_only_fields = ('submitted_at',)
