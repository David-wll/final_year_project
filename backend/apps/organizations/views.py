import threading
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import OrganizationProfile, InternshipOpportunity
from .serializers import OrganizationProfileSerializer, InternshipOpportunitySerializer
from accounts.permissions import IsOrganization, IsCoordinator

class OrganizationProfileDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = OrganizationProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsOrganization]

    def get_object(self):
        profile, created = OrganizationProfile.objects.get_or_create(user=self.request.user)
        return profile

class InternshipOpportunityListCreateView(generics.ListCreateAPIView):
    serializer_class = InternshipOpportunitySerializer
    permission_classes = [permissions.IsAuthenticated, IsOrganization]

    def get_queryset(self):
        return InternshipOpportunity.objects.filter(organization__user=self.request.user)

    def perform_create(self, serializer):
        profile, created = OrganizationProfile.objects.get_or_create(user=self.request.user)
        serializer.save(organization=profile)

class InternshipOpportunityDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = InternshipOpportunitySerializer
    permission_classes = [permissions.IsAuthenticated, IsOrganization]

    def get_queryset(self):
        return InternshipOpportunity.objects.filter(organization__user=self.request.user)

class CoordinatorOrganizationListView(generics.ListAPIView):
    queryset = OrganizationProfile.objects.filter(itf_approval_status='pending')
    serializer_class = OrganizationProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsCoordinator]

class CoordinatorApproveOrganizationView(generics.UpdateAPIView):
    queryset = OrganizationProfile.objects.all()
    serializer_class = OrganizationProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsCoordinator]

    def patch(self, request, *args, **kwargs):
        org = self.get_object()
        action = request.data.get('action')
        if action == 'approve':
            org.itf_approval_status = 'approved'
            org.verified = True
        elif action == 'reject':
            org.itf_approval_status = 'rejected'
            org.verified = False
        org.save()
        return Response(self.get_serializer(org).data)


class ScrapeInternshipsView(APIView):
    """Coordinator-only endpoint to trigger the real-data scraper."""
    permission_classes = [permissions.IsAuthenticated, IsCoordinator]

    def post(self, request):
        from .scraper import run_scraper
        sources = request.data.get('sources', None)  # e.g. ['myjobmag']
        max_pages = int(request.data.get('max_pages', 2))

        # Run in a thread so the HTTP response isn't held open for minutes
        result_holder = {}

        def _run():
            result_holder.update(run_scraper(sources=sources, max_pages=max_pages))

        t = threading.Thread(target=_run, daemon=True)
        t.start()
        t.join(timeout=120)  # wait up to 2 min; return whatever we have

        return Response({
            "status": "complete" if not t.is_alive() else "timeout",
            "results": result_holder,
        })
