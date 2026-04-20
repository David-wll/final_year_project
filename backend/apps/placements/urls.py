from django.urls import path
from .views import (
    StudentApplicationListCreateView, 
    OrganizationApplicationListView, 
    ApplicationStatusUpdateView,
    OpportunityDiscoveryView,
    SupervisorPlacementListView,
    CoordinatorPlacementListView,
    FeedbackCreateView
)

urlpatterns = [
    path('student/applications/', StudentApplicationListCreateView.as_view(), name='student_applications'),
    path('organization/applications/', OrganizationApplicationListView.as_view(), name='org_applications'),
    path('applications/<int:pk>/status/', ApplicationStatusUpdateView.as_view(), name='update_status'),
    path('discovery/', OpportunityDiscoveryView.as_view(), name='opportunity_discovery'),
    path('supervisor/placements/', SupervisorPlacementListView.as_view(), name='supervisor_placements'),
    path('coordinator/placements/', CoordinatorPlacementListView.as_view(), name='coordinator_placements'),
    path('feedback/', FeedbackCreateView.as_view(), name='feedback_create'),
]
