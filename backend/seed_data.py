import os
import django
import random
from datetime import date, timedelta

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from organizations.models import OrganizationProfile, InternshipOpportunity
from students.models import StudentProfile

User = get_user_model()

def seed_data():
    print("Seeding initial data...")

    # 1. Create Organization Users and Profiles
    orgs_data = [
        {
            "email": "hr@interswitch.com",
            "company": "Interswitch Group",
            "sector": "Technology",
            "reg_no": "RC123456",
            "state": "Lagos",
            "opportunities": [
                {"title": "Backend Engineering Intern", "desc": "Work with Python and Django on payment gateways.", "tech": ["Python", "Django", "SQL"]},
                {"title": "UI/UX Design Intern", "desc": "Design modern interfaces for fintech applications.", "tech": ["UI/UX Design", "Graphic Design"]}
            ]
        },
        {
            "email": "careers@kuda.com",
            "company": "Kuda Bank",
            "sector": "Finance",
            "reg_no": "RC654321",
            "state": "Lagos",
            "opportunities": [
                {"title": "Data Analysis Intern", "desc": "Analyze banking transactions and user behavior.", "tech": ["Data Analysis", "Python", "SQL"]},
                {"title": "Mobile Dev Intern", "desc": "Help build our Flutter mobile app.", "tech": ["Flutter", "Dart", "Git"]}
            ]
        },
        {
            "email": "contact@dangote.com",
            "company": "Dangote Group",
            "sector": "Manufacturing",
            "reg_no": "RC789012",
            "state": "Kano",
            "opportunities": [
                {"title": "Mechanical Engineering Intern", "desc": "Support operations at our refinery plant.", "tech": ["Engineering", "Problem Solving"]},
                {"title": "Supply Chain Intern", "desc": "Optimize logistics and distribution networks.", "tech": ["Data Analysis", "Logistics"]}
            ]
        }
    ]

    for data in orgs_data:
        user, created = User.objects.get_or_create(
            email=data["email"],
            defaults={"role": "organization", "is_verified": True}
        )
        if created:
            user.set_password("password123")
            user.save()
            print(f"Created user: {user.email}")

        profile, created = OrganizationProfile.objects.get_or_create(
            user=user,
            defaults={
                "company_name": data["company"],
                "registration_number": data["reg_no"],
                "industry_sector": data["sector"],
                "address": f"No 1 {data['company']} Way",
                "state": data["state"],
                "lga": "Main LGA",
                "contact_person_name": "HR Manager",
                "contact_email": data["email"],
                "contact_phone": "08012345678",
                "description": f"Leading company in the {data['sector']} sector.",
                "itf_approval_status": "approved",
                "verified": True
            }
        )
        if created:
            print(f"Created profile for: {data['company']}")

        for opp in data["opportunities"]:
            opportunity, created = InternshipOpportunity.objects.get_or_create(
                organization=profile,
                title=opp["title"],
                defaults={
                    "description": opp["desc"],
                    "required_technical_skills": [{"name": skill} for skill in opp["tech"]],
                    "sector": data["sector"],
                    "location_state": data["state"],
                    "location_lga": "Main LGA",
                    "duration_weeks": 24,
                    "start_date": date.today() + timedelta(days=30),
                    "application_deadline": date.today() + timedelta(days=20),
                    "slots_available": random.randint(2, 5),
                    "is_active": True
                }
            )
            if created:
                print(f"  - Created opportunity: {opp['title']}")

    # 2. Create a test Student
    student_email = "student@example.com"
    student_user, created = User.objects.get_or_create(
        email=student_email,
        defaults={"role": "student", "is_verified": True}
    )
    if created:
        student_user.set_password("password123")
        student_user.save()
        print(f"Created student user: {student_email}")

    student_profile, created = StudentProfile.objects.get_or_create(
        user=student_user,
        defaults={
            "full_name": "Samuel Okon",
            "matric_number": "RUN/CMP/20/0001",
            "department": "Computer Science",
            "faculty": "Natural Sciences",
            "level": 400,
            "cgpa": 4.2,
            "course_of_study": "B.Sc Computer Science",
            "technical_skills": ["Python", "JavaScript", "SQL"],
            "soft_skills": ["Communication", "Teamwork"],
            "preferred_sectors": ["Technology", "Finance"],
            "preferred_locations": ["Lagos"]
        }
    )
    if created:
        print("Created student profile for testing.")

    print("\nSeeding complete!")
    print(f"Login as student: {student_email} / password123")

if __name__ == "__main__":
    seed_data()
