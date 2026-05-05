from rest_framework import serializers
from datetime import date, timedelta
from .models import OrganizationProfile, InternshipOpportunity

class OrganizationProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrganizationProfile
        fields = '__all__'
        read_only_fields = ('user', 'itf_approval_status', 'verified', 'created_at')

class InternshipOpportunitySerializer(serializers.ModelSerializer):
    organization_name = serializers.ReadOnlyField(source='organization.company_name')
    required_technical_skills = serializers.ListField(
        child=serializers.CharField(), required=False, default=list
    )
    required_soft_skills = serializers.ListField(
        child=serializers.CharField(), required=False, default=list
    )
    sector = serializers.CharField(required=False, allow_blank=True)
    location_state = serializers.CharField(required=False, allow_blank=True)
    location_lga = serializers.CharField(required=False, allow_blank=True)
    duration_weeks = serializers.IntegerField(required=False, default=12)
    start_date = serializers.DateField(required=False, allow_null=True)
    application_deadline = serializers.DateField(required=False, allow_null=True)
    slots_available = serializers.IntegerField(required=False, default=1)
    stipend_available = serializers.BooleanField(required=False, default=False)
    stipend_amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = InternshipOpportunity
        fields = '__all__'
        read_only_fields = ('organization', 'slots_filled', 'created_at')

    def validate(self, attrs):
        request = self.context.get('request')
        org_profile = None
        if request and getattr(request, 'user', None) and request.user.is_authenticated:
            org_profile = getattr(request.user, 'organization_profile', None)

        # Provide safe defaults so the frontend can submit a minimal form.
        attrs.setdefault('required_technical_skills', [])
        attrs.setdefault('required_soft_skills', [])
        attrs.setdefault('duration_weeks', 12)
        attrs.setdefault('slots_available', 1)
        attrs.setdefault('stipend_available', False)
        attrs.setdefault('stipend_amount', None)

        if not attrs.get('location_state'):
            attrs['location_state'] = getattr(org_profile, 'state', '') or 'Nigeria'

        if not attrs.get('location_lga'):
            attrs['location_lga'] = getattr(org_profile, 'lga', '') or 'Any'

        if not attrs.get('start_date'):
            attrs['start_date'] = date.today() + timedelta(days=7)

        if not attrs.get('application_deadline'):
            attrs['application_deadline'] = date.today() + timedelta(days=30)

        if not attrs.get('sector'):
            attrs['sector'] = getattr(org_profile, 'industry_sector', '') or 'General'

        return attrs
