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
                {"title": "Mobile Dev Intern", "desc": "Help build our Flutter mobile app.", "tech": ["Flutter", "Dart", "Git"]},
                {"title": "Financial Analysis Intern", "desc": "Assist in financial modeling and economic analysis.", "tech": ["Excel", "Financial Modeling", "Economics"]}
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
                {"title": "Supply Chain Intern", "desc": "Optimize logistics and distribution networks.", "tech": ["Data Analysis", "Logistics"]},
                {"title": "Business Development Intern", "desc": "Research market trends and economic factors affecting manufacturing.", "tech": ["Market Research", "Economics", "Data Analysis"]}
            ]
        },
        {
            "email": "hr@accessbank.com",
            "company": "Access Bank PLC",
            "sector": "Finance",
            "reg_no": "RC234567",
            "state": "Lagos",
            "opportunities": [
                {"title": "Investment Banking Intern", "desc": "Support investment analysis and portfolio management.", "tech": ["Financial Analysis", "Excel", "Bloomberg"]},
                {"title": "Risk Management Intern", "desc": "Analyze economic indicators and assess financial risks.", "tech": ["Risk Analysis", "Economics", "Statistical Modeling"]},
                {"title": "Corporate Finance Intern", "desc": "Assist in mergers, acquisitions, and capital raising activities.", "tech": ["Financial Modeling", "Valuation", "Economics"]}
            ]
        },
        {
            "email": "careers@gtbank.com",
            "company": "Guaranty Trust Bank",
            "sector": "Finance",
            "reg_no": "RC345678",
            "state": "Lagos",
            "opportunities": [
                {"title": "Economic Research Intern", "desc": "Conduct macroeconomic research and policy analysis.", "tech": ["Econometrics", "Data Analysis", "Research"]},
                {"title": "Treasury Operations Intern", "desc": "Manage foreign exchange and interest rate risk.", "tech": ["FX Trading", "Risk Management", "Economics"]},
                {"title": "Retail Banking Intern", "desc": "Support customer acquisition and relationship management.", "tech": ["Customer Service", "Sales", "Market Analysis"]}
            ]
        },
        {
            "email": "hr@pwc.ng",
            "company": "PwC Nigeria",
            "sector": "Consulting",
            "reg_no": "RC456789",
            "state": "Lagos",
            "opportunities": [
                {"title": "Financial Services Consulting Intern", "desc": "Assist in financial strategy and regulatory compliance projects.", "tech": ["Financial Analysis", "Consulting", "Regulatory Knowledge"]},
                {"title": "Economic Advisory Intern", "desc": "Support economic impact assessments and policy analysis.", "tech": ["Economic Modeling", "Policy Analysis", "Data Visualization"]},
                {"title": "Risk Assurance Intern", "desc": "Conduct financial audits and risk assessments.", "tech": ["Audit", "Risk Analysis", "Excel"]}
            ]
        },
        {
            "email": "careers@deloitte.ng",
            "company": "Deloitte Nigeria",
            "sector": "Consulting",
            "reg_no": "RC567890",
            "state": "Lagos",
            "opportunities": [
                {"title": "Strategy Consulting Intern", "desc": "Work on business strategy and economic development projects.", "tech": ["Strategy", "Market Research", "Economics"]},
                {"title": "Financial Advisory Intern", "desc": "Support M&A transactions and valuation analysis.", "tech": ["Valuation", "Financial Modeling", "Due Diligence"]},
                {"title": "Tax Consulting Intern", "desc": "Assist in tax planning and compliance advisory.", "tech": ["Tax Law", "Financial Analysis", "Regulatory Compliance"]}
            ]
        },
        {
            "email": "hr@worldbank.ng",
            "company": "World Bank Nigeria",
            "sector": "Development",
            "reg_no": "RC678901",
            "state": "Abuja",
            "opportunities": [
                {"title": "Development Economics Intern", "desc": "Research economic development indicators and policy impacts.", "tech": ["Development Economics", "Data Analysis", "Policy Research"]},
                {"title": "Project Finance Intern", "desc": "Support infrastructure project financing and economic analysis.", "tech": ["Project Finance", "Economic Modeling", "Risk Assessment"]},
                {"title": "Social Development Intern", "desc": "Analyze social impact of economic policies and programs.", "tech": ["Social Economics", "Impact Assessment", "Research"]}
            ]
        },
        {
            "email": "careers@unilever.ng",
            "company": "Unilever Nigeria",
            "sector": "Consumer Goods",
            "reg_no": "RC890124",
            "state": "Lagos",
            "opportunities": [
                {"title": "Marketing Analytics Intern", "desc": "Analyze consumer behavior and market trends.", "tech": ["Marketing", "Data Analysis", "Consumer Economics"]},
                {"title": "Supply Chain Economics Intern", "desc": "Optimize supply chain costs and economic efficiency.", "tech": ["Supply Chain", "Cost Analysis", "Economics"]},
                {"title": "Brand Management Intern", "desc": "Support brand strategy and market positioning.", "tech": ["Brand Management", "Market Research", "Strategy"]}
            ]
        },
        {
            "email": "hr@shell.ng",
            "company": "Shell Nigeria",
            "sector": "Energy",
            "reg_no": "RC901235",
            "state": "Lagos",
            "opportunities": [
                {"title": "Energy Economics Intern", "desc": "Analyze energy markets and economic trends.", "tech": ["Energy Economics", "Market Analysis", "Data Modeling"]},
                {"title": "Corporate Planning Intern", "desc": "Support strategic planning and economic forecasting.", "tech": ["Strategic Planning", "Economic Forecasting", "Analytics"]},
                {"title": "Sustainability Economics Intern", "desc": "Assess economic impacts of sustainability initiatives.", "tech": ["Sustainability", "Economic Analysis", "ESG"]}
            ]
        },
        {
            "email": "careers@total.ng",
            "company": "Total Nigeria",
            "sector": "Energy",
            "reg_no": "RC012346",
            "state": "Lagos",
            "opportunities": [
                {"title": "Petroleum Economics Intern", "desc": "Analyze oil and gas market economics and pricing.", "tech": ["Petroleum Economics", "Market Analysis", "Financial Modeling"]},
                {"title": "Business Development Intern", "desc": "Research new market opportunities and economic viability.", "tech": ["Business Development", "Market Research", "Economic Analysis"]},
                {"title": "Trading Operations Intern", "desc": "Support commodity trading and risk management.", "tech": ["Commodity Trading", "Risk Management", "Economics"]}
            ]
        },
        {
            "email": "hr@centralbank.ng",
            "company": "Central Bank of Nigeria",
            "sector": "Government",
            "reg_no": "RC123457",
            "state": "Abuja",
            "opportunities": [
                {"title": "Monetary Policy Intern", "desc": "Support monetary policy analysis and implementation.", "tech": ["Monetary Economics", "Policy Analysis", "Data Analysis"]},
                {"title": "Financial Stability Intern", "desc": "Monitor financial system stability and economic indicators.", "tech": ["Financial Stability", "Economic Indicators", "Risk Analysis"]},
                {"title": "Research Economics Intern", "desc": "Conduct economic research and policy studies.", "tech": ["Economic Research", "Statistics", "Policy Analysis"]}
            ]
        },
        {
            "email": "careers@nigeria-bulk.com",
            "company": "Nigeria Bulk Electricity Trading",
            "sector": "Energy",
            "reg_no": "RC234568",
            "state": "Abuja",
            "opportunities": [
                {"title": "Energy Market Intern", "desc": "Analyze electricity market dynamics and pricing.", "tech": ["Energy Markets", "Economic Analysis", "Data Modeling"]},
                {"title": "Regulatory Economics Intern", "desc": "Support regulatory framework development and analysis.", "tech": ["Regulatory Economics", "Policy Analysis", "Research"]}
            ]
        },
        {
            "email": "hr@lagosstate.gov.ng",
            "company": "Lagos State Government",
            "sector": "Government",
            "reg_no": "RC345679",
            "state": "Lagos",
            "opportunities": [
                {"title": "Economic Planning Intern", "desc": "Support economic development planning and analysis.", "tech": ["Economic Planning", "Development Economics", "Data Analysis"]},
                {"title": "Budget Analysis Intern", "desc": "Analyze government budgets and fiscal policy.", "tech": ["Budget Analysis", "Fiscal Policy", "Economics"]}
            ]
        },
        {
            "email": "careers@actionaid.ng",
            "company": "ActionAid Nigeria",
            "sector": "NGO",
            "reg_no": "RC456780",
            "state": "Abuja",
            "opportunities": [
                {"title": "Development Research Intern", "desc": "Research poverty alleviation and economic development.", "tech": ["Development Research", "Poverty Economics", "Impact Assessment"]},
                {"title": "Policy Advocacy Intern", "desc": "Support economic policy advocacy and campaigns.", "tech": ["Policy Advocacy", "Economic Policy", "Research"]}
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
