from django.db import models
from django.conf import settings
from placements.models import Placement

class ProgressReport(models.Model):
    placement = models.ForeignKey(Placement, on_delete=models.CASCADE, related_name='reports')
    week_number = models.IntegerField()
    tasks_completed = models.TextField()
    skills_developed = models.TextField()
    challenges = models.TextField()
    submitted_at = models.DateTimeField(auto_now_add=True)
    supervisor_seen = models.BooleanField(default=False)

    class Meta:
        ordering = ['-week_number']
        unique_together = ('placement', 'week_number')

    def __str__(self):
        return f"Week {self.week_number} Report - {self.placement.application.student.full_name}"

class Evaluation(models.Model):
    EVAL_TYPE_CHOICES = (
        ('midterm', 'Midterm'),
        ('final', 'Final'),
    )
    
    placement = models.ForeignKey(Placement, on_delete=models.CASCADE, related_name='evaluations')
    evaluator = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        limit_choices_to={'role': 'supervisor'}
    )
    evaluation_type = models.CharField(max_length=20, choices=EVAL_TYPE_CHOICES)
    
    # Ratings 1-5
    technical_competence = models.IntegerField(default=1)
    professionalism = models.IntegerField(default=1)
    communication = models.IntegerField(default=1)
    teamwork = models.IntegerField(default=1)
    problem_solving = models.IntegerField(default=1)
    
    overall_rating = models.FloatField(editable=False)
    comments = models.TextField()
    submitted_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Calculate overall rating
        ratings = [
            self.technical_competence, self.professionalism, 
            self.communication, self.teamwork, self.problem_solving
        ]
        self.overall_rating = sum(ratings) / len(ratings)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.evaluation_type.capitalize()} Evaluation - {self.placement.application.student.full_name}"
