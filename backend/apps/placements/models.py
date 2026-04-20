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
