import requests
from django.conf import settings
from .models import OrganizationProfile, InternshipOpportunity
from django.utils import timezone
from django.contrib.auth import get_user_model

User = get_user_model()

ADZUNA_APP_ID = "2f92b500"
ADZUNA_API_KEY = "a900fdc20ffc4431210c043826629562"

def fetch_adzuna_jobs(query="internship", country="ng"):
    url = f"https://api.adzuna.com/v1/api/jobs/{country}/search/1"
    params = {
        "app_id": ADZUNA_APP_ID,
        "app_key": ADZUNA_API_KEY,
        "results_per_page": 20,
        "what": query,
        "content-type": "application/json"
    }
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        return data.get('results', [])
    except Exception as e:
        print(f"Error fetching from Adzuna: {e}")
        return []

def sync_adzuna_to_db():
    jobs = fetch_adzuna_jobs()
    
    # Get or create a system user for external jobs
    system_user, _ = User.objects.get_or_create(
        email="external-jobs@internmatch.com",
        defaults={"role": "organization", "is_active": False}
    )
    
    sync_count = 0
    for job in jobs:
        # Create a placeholder organization for each unique company
        company_name = job.get('company', {}).get('display_name', 'External Company')
        org_profile, _ = OrganizationProfile.objects.get_or_create(
            company_name=company_name,
            defaults={
                "user": system_user,
                "industry_sector": job.get('category', {}).get('label', 'Other'),
                "address": job.get('location', {}).get('display_name', 'Nigeria'),
                "state": job.get('location', {}).get('area', ['Nigeria'])[-1],
                "verified": True
            }
        )
        
        # Avoid duplicates based on Adzuna ID (encoded in redirect_url or just use title+company)
        title = job.get('title')
        
        # Check if already exists
        if not InternshipOpportunity.objects.filter(title=title, organization=org_profile).exists():
            InternshipOpportunity.objects.create(
                organization=org_profile,
                title=title,
                description=job.get('description', ''),
                sector=job.get('category', {}).get('label', 'General'),
                location_state=job.get('location', {}).get('area', ['Nigeria'])[-1],
                location_lga=job.get('location', {}).get('display_name', ''),
                duration_weeks=12,  # Default
                start_date=timezone.now().date(),
                application_deadline=timezone.now().date() + timezone.timedelta(days=30),
                slots_available=5,
                is_active=True
            )
            sync_count += 1
            
    return sync_count
