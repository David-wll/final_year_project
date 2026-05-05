from rest_framework import serializers
from organizations.models import InternshipOpportunity


class InternshipOpportunitySerializer(serializers.ModelSerializer):
    organization_name = serializers.ReadOnlyField(source='organization.company_name')
    organization_verified = serializers.ReadOnlyField(source='organization.verified')

    class Meta:
        model = InternshipOpportunity
        fields = [
            "id",
            "title",
            "description",
            "organization_name",
            "organization_verified",
            "sector",
            "location_state",
            "location_lga",
            "duration_weeks",
            "start_date",
            "application_deadline",
            "slots_available",
            "slots_filled",
            "stipend_available",
            "stipend_amount",
            "required_technical_skills",
            "required_soft_skills",
        ]


class RecommendationSerializer(serializers.Serializer):
    opportunity = InternshipOpportunitySerializer()
    match_score = serializers.IntegerField()
    ml_confidence = serializers.FloatField()
    explanations = serializers.DictField()
    matched_skills = serializers.ListField()
    missing_skills = serializers.ListField()
