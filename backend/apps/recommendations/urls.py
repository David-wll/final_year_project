from django.urls import path
from .views import RecommendationView, RetrainModelView, CoordinatorAnalyticsView, CustomMatchView

urlpatterns = [
    path('', RecommendationView.as_view(), name='recommendations'),
    path('match-custom/', CustomMatchView.as_view(), name='match_custom'),
    path('retrain/', RetrainModelView.as_view(), name='retrain'),
    path('analytics/', CoordinatorAnalyticsView.as_view(), name='analytics'),
]
