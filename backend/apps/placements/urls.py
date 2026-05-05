from django.urls import path
from .views import (
    StudentApplicationListCreateView, 
    OrganizationApplicationListView, 
    ApplicationStatusUpdateView,
    OpportunityDiscoveryView,
    SupervisorPlacementListView,
    CoordinatorPlacementListView,
    FeedbackCreateView,
    AssignSupervisorView,
    PlacementActivityListView,
    SavedOpportunityToggleView,
    SavedOpportunityListView,
    FollowOrganizationToggleView,
    FollowedOrganizationListView,
    ApplicationTimelineView,
)

urlpatterns = [
    path('student/applications/', StudentApplicationListCreateView.as_view(), name='student_applications'),
    path('organization/applications/', OrganizationApplicationListView.as_view(), name='org_applications'),
    path('applications/<int:pk>/status/', ApplicationStatusUpdateView.as_view(), name='update_status'),
    path('discovery/', OpportunityDiscoveryView.as_view(), name='opportunity_discovery'),
    path('supervisor/placements/', SupervisorPlacementListView.as_view(), name='supervisor_placements'),
    path('coordinator/placements/', CoordinatorPlacementListView.as_view(), name='coordinator_placements'),
    path('placements/<int:pk>/assign-supervisor/', AssignSupervisorView.as_view(), name='assign_supervisor'),
    path('feedback/', FeedbackCreateView.as_view(), name='feedback_create'),
    path('activity/', PlacementActivityListView.as_view(), name='placement_activity'),
    path('saved/toggle/', SavedOpportunityToggleView.as_view(), name='saved_opportunity_toggle'),
    path('saved/', SavedOpportunityListView.as_view(), name='saved_opportunity_list'),
    path('follow/toggle/', FollowOrganizationToggleView.as_view(), name='follow_organization_toggle'),
    path('followed/', FollowedOrganizationListView.as_view(), name='followed_organization_list'),
    path('applications/<int:pk>/timeline/', ApplicationTimelineView.as_view(), name='application_timeline'),
]
