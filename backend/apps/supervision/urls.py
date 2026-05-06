from django.urls import path
from .views import (
    ProgressReportListCreateView, 
    ProgressReportActionView,
    EvaluationListCreateView, 
    CoordinatorAtRiskView
)

urlpatterns = [
    path('reports/', ProgressReportListCreateView.as_view(), name='reports'),
    path('reports/<int:pk>/action/', ProgressReportActionView.as_view(), name='report_action'),
    path('evaluations/', EvaluationListCreateView.as_view(), name='evaluations'),
    path('coordinator/at-risk/', CoordinatorAtRiskView.as_view(), name='at_risk'),
]
