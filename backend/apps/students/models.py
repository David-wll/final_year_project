from django.db import models
from django.conf import settings

class StudentProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='student_profile')
    full_name = models.CharField(max_length=255, blank=True)
    matric_number = models.CharField(max_length=50, unique=True, null=True, blank=True)
    department = models.CharField(max_length=100, blank=True)
    faculty = models.CharField(max_length=100, blank=True)
    level = models.IntegerField(choices=[(100, '100'), (200, '200'), (300, '300'), (400, '400'), (500, '500')], default=100)
    cgpa = models.FloatField(default=0.0)
    course_of_study = models.CharField(max_length=255, blank=True)
    
    # Skills stored as JSON
    # Structure: [{"name": "Python", "proficiency": "intermediate"}]
    technical_skills = models.JSONField(default=list)
    soft_skills = models.JSONField(default=list)
    
    preferred_sectors = models.JSONField(default=list)
    preferred_locations = models.JSONField(default=list)
    career_aspirations = models.TextField(blank=True)
    portfolio_url = models.URLField(blank=True)
    resume = models.FileField(upload_to='resumes/', null=True, blank=True)
    
    profile_completeness = models.IntegerField(default=0)
    
    def calculate_completeness(self):
        fields_to_check = [
            'full_name', 'matric_number', 'department', 'faculty', 
            'level', 'cgpa', 'course_of_study', 'technical_skills', 
            'soft_skills', 'preferred_sectors', 'preferred_locations'
        ]
        completed = 0
        for field in fields_to_check:
            val = getattr(self, field)
            if val and (not isinstance(val, (list, dict)) or len(val) > 0):
                completed += 1
        
        return int((completed / len(fields_to_check)) * 100)

    def save(self, *args, **kwargs):
        self.profile_completeness = self.calculate_completeness()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.full_name} ({self.matric_number})"
