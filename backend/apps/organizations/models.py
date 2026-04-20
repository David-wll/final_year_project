from django.db import models
from django.conf import settings

class OrganizationProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='organization_profile')
    company_name = models.CharField(max_length=255, blank=True)
    registration_number = models.CharField(max_length=100, unique=True, null=True, blank=True)
    itf_approval_status = models.CharField(
        max_length=20, 
        choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')],
        default='pending'
    )
    industry_sector = models.CharField(max_length=100, blank=True)
    address = models.TextField(blank=True)
    state = models.CharField(max_length=100, blank=True)
    lga = models.CharField(max_length=100, blank=True)
    
    # Location coordinates for mapping/distance
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    
    contact_person_name = models.CharField(max_length=255, blank=True)
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=20, blank=True)
    description = models.TextField(blank=True)
    
    verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.company_name

class InternshipOpportunity(models.Model):
    organization = models.ForeignKey(OrganizationProfile, on_delete=models.CASCADE, related_name='opportunities')
    title = models.CharField(max_length=255)
    description = models.TextField()
    
    # Skills stored as JSON
    required_technical_skills = models.JSONField(default=list)
    required_soft_skills = models.JSONField(default=list)
    
    sector = models.CharField(max_length=100)
    location_state = models.CharField(max_length=100)
    location_lga = models.CharField(max_length=100)
    
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    
    duration_weeks = models.IntegerField()
    start_date = models.DateField()
    application_deadline = models.DateField()
    
    slots_available = models.IntegerField()
    slots_filled = models.IntegerField(default=0)
    
    stipend_available = models.BooleanField(default=False)
    stipend_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} at {self.organization.company_name}"
