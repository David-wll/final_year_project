from django.urls import path
from .views import StudentProfileDetailView, SkillTaxonomyView

urlpatterns = [
    path('profile/', StudentProfileDetailView.as_view(), name='student_profile'),
    path('taxonomy/', SkillTaxonomyView.as_view(), name='skill_taxonomy'),
]
