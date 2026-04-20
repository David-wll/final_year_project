from rest_framework import serializers
from .models import OrganizationProfile, InternshipOpportunity

class OrganizationProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrganizationProfile
        fields = '__all__'
        read_only_fields = ('user', 'itf_approval_status', 'verified', 'created_at')

class InternshipOpportunitySerializer(serializers.ModelSerializer):
    organization_name = serializers.ReadOnlyField(source='organization.company_name')

    class Meta:
        model = InternshipOpportunity
        fields = '__all__'
        read_only_fields = ('organization', 'slots_filled', 'created_at')
