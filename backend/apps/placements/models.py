from django.db import models
from django.conf import settings
from students.models import StudentProfile
from organizations.models import InternshipOpportunity

class Application(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('reviewing', 'Reviewing'),
        ('interviewing', 'Interviewing'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    )

    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='applications')
    opportunity = models.ForeignKey(InternshipOpportunity, on_delete=models.CASCADE, related_name='applications')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    cover_letter = models.TextField(blank=True)
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('student', 'opportunity')
        ordering = ['-applied_at']

    def __str__(self):
        return f"{self.student.full_name} - {self.opportunity.title}"

class Placement(models.Model):
    application = models.OneToOneField(Application, on_delete=models.CASCADE, related_name='placement')
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=True)
    supervisor_assigned = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        limit_choices_to={'role': 'supervisor'}
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Placement: {self.application}"

class InternshipFeedback(models.Model):
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('organization', 'Organization'),
        ('supervisor', 'Supervisor'),
    )
    
    placement = models.ForeignKey(Placement, on_delete=models.CASCADE, related_name='feedbacks')
    submitted_by_role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    overall_rating = models.IntegerField(default=5)
    would_recommend = models.BooleanField(default=True)
    
    # Skills gaps identified during the internship
    skills_gaps = models.JSONField(default=list)
    comments = models.TextField(blank=True)
    
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('placement', 'submitted_by_role')

    def __str__(self):
        return f"Feedback from {self.submitted_by_role} for {self.placement}"


class SavedOpportunity(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='saved_opportunities')
    opportunity = models.ForeignKey(InternshipOpportunity, on_delete=models.CASCADE, related_name='saved_by_users')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'opportunity')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} saved {self.opportunity.title}"


class FollowedOrganization(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='followed_organizations')
    organization = models.ForeignKey(
        'organizations.OrganizationProfile',
        on_delete=models.CASCADE,
        related_name='followers'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'organization')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} follows {self.organization.company_name}"


class PlacementActivity(models.Model):
    ACTIVITY_TYPES = (
        ('application_status', 'Application Status Updated'),
        ('supervisor_assigned', 'Supervisor Assigned'),
        ('placement_created', 'Placement Created'),
        ('feedback_submitted', 'Feedback Submitted'),
    )

    activity_type = models.CharField(max_length=50, choices=ACTIVITY_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField(blank=True)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='placement_activities'
    )
    application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='activities'
    )
    placement = models.ForeignKey(
        Placement,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='activities'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title
