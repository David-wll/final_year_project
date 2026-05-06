from django.urls import path
from .views import (
    OrganizationProfileDetailView, 
    InternshipOpportunityListCreateView, 
    InternshipOpportunityDetailView,
    CoordinatorOrganizationListView,
    CoordinatorApproveOrganizationView,
    ScrapeInternshipsView,
    OpportunityRankedApplicantsView,
)

urlpatterns = [
    path('profile/', OrganizationProfileDetailView.as_view(), name='org_profile'),
    path('opportunities/', InternshipOpportunityListCreateView.as_view(), name='opportunity_list'),
    path('opportunities/<int:pk>/', InternshipOpportunityDetailView.as_view(), name='opportunity_detail'),
    path('opportunities/<int:pk>/ranked-applicants/', OpportunityRankedApplicantsView.as_view(), name='ranked_applicants'),
    
    # Coordinator endpoints
    path('coordinator/pending-orgs/', CoordinatorOrganizationListView.as_view(), name='pending_orgs'),
    path('coordinator/approve-org/<int:pk>/', CoordinatorApproveOrganizationView.as_view(), name='approve_org'),
    path('scrape/', ScrapeInternshipsView.as_view(), name='scrape_internships'),
]
