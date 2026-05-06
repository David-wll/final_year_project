from datetime import date

from rest_framework import serializers
from .models import Application, Placement, InternshipFeedback, PlacementActivity, SavedOpportunity, FollowedOrganization
from organizations.serializers import InternshipOpportunitySerializer
from students.serializers import StudentProfileSerializer
from accounts.serializers import UserSerializer

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

        if not opportunity:
            raise serializers.ValidationError({'opportunity': 'An opportunity is required.'})

        if not opportunity.is_active:
            raise serializers.ValidationError({'opportunity': 'This opportunity is no longer active.'})

        if opportunity.application_deadline and opportunity.application_deadline < date.today():
            raise serializers.ValidationError({'opportunity': 'The application deadline has passed.'})

        if opportunity.slots_filled >= opportunity.slots_available:
            raise serializers.ValidationError({'opportunity': 'No slots are available for this opportunity.'})

        cover_letter = (data.get('cover_letter') or '').strip()
        if len(cover_letter) < 120:
            raise serializers.ValidationError({'cover_letter': 'Please write at least 120 characters to strengthen your application.'})
        
        if Application.objects.filter(student=student, opportunity=opportunity).exists():
            raise serializers.ValidationError("You have already applied for this opportunity.")
        
        return data

class PlacementSerializer(serializers.ModelSerializer):
    application_details = ApplicationSerializer(source='application', read_only=True)
    supervisor_assigned_details = UserSerializer(source='supervisor_assigned', read_only=True)

    class Meta:
        model = Placement
        fields = '__all__'
        read_only_fields = ('application', 'created_at')

class InternshipFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = InternshipFeedback
        fields = '__all__'
        read_only_fields = ('submitted_at', 'submitted_by_role')


class PlacementActivitySerializer(serializers.ModelSerializer):
    actor_details = UserSerializer(source='actor', read_only=True)
    application_details = ApplicationSerializer(source='application', read_only=True)
    placement_details = PlacementSerializer(source='placement', read_only=True)

    class Meta:
        model = PlacementActivity
        fields = '__all__'


class SavedOpportunitySerializer(serializers.ModelSerializer):
    opportunity_details = InternshipOpportunitySerializer(source='opportunity', read_only=True)

    class Meta:
        model = SavedOpportunity
        fields = ['id', 'user', 'opportunity', 'created_at', 'opportunity_details']
        read_only_fields = ['user', 'created_at']


class FollowedOrganizationSerializer(serializers.ModelSerializer):
    organization_details = serializers.SerializerMethodField()

    class Meta:
        model = FollowedOrganization
        fields = ['id', 'user', 'organization', 'created_at', 'organization_details']
        read_only_fields = ['user', 'created_at']

    def get_organization_details(self, obj):
        org = obj.organization
        return {
            'id': org.id,
            'company_name': org.company_name,
            'industry_sector': org.industry_sector,
            'state': org.state,
            'verified': org.verified,
        }
