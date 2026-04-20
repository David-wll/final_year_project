from rest_framework import views, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from students.models import StudentProfile
from organizations.models import InternshipOpportunity
from organizations.serializers import InternshipOpportunitySerializer
from django.conf import settings
from django.db.models import Count
from accounts.permissions import IsStudent, IsCoordinator
import ml.predict as ml_predict
import PyPDF2
from organizations.scraper import TECH_KEYWORDS, SECTOR_MAP


class RecommendationView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        print(f"RECOMMENDATION VIEW CALLED for user: {request.user.email}")
        if request.user.role != 'student':
            return Response({"results": []})

        student, created = StudentProfile.objects.get_or_create(user=request.user)

        sector_filter = request.query_params.get("sector")
        location_filter = request.query_params.get("location")
        try:
            min_score = int(request.query_params.get("min_score", 0))
        except (TypeError, ValueError):
            min_score = 0
            
        try:
            top_n = int(request.query_params.get("top_n", 10))
        except (TypeError, ValueError):
            top_n = 10

        opportunities = InternshipOpportunity.objects.filter(is_active=True)

        if sector_filter:
            opportunities = opportunities.filter(sector=sector_filter)
        if location_filter:
            opportunities = opportunities.filter(location_state=location_filter)

        try:
            ml_predict.load_resources()
        except Exception as e:
            print(f"ML load error: {e}")

        recommendations = []
        try:
            for opp in opportunities:
                if opp.slots_filled >= opp.slots_available:
                    continue

                student_data = {
                    "cgpa": student.cgpa,
                    "level": student.level,
                    "technical_skills": [
                        s["name"] if isinstance(s, dict) else s
                        for s in (student.technical_skills or [])
                    ],
                    "preferred_sectors": student.preferred_sectors or [],
                    "preferred_locations": student.preferred_locations or [],
                }

                opp_data = {
                    "sector": opp.sector,
                    "required_technical_skills": [
                        s["name"] if isinstance(s, dict) else s
                        for s in (opp.required_technical_skills or [])
                    ],
                    "location_state": opp.location_state,
                }

                ml_score = ml_predict.get_recommendation_score(student_data, opp_data)

                student_skills = set(student_data["technical_skills"])
                required_skills = set(opp_data["required_technical_skills"])
                matched_skills = student_skills & required_skills
                missing_skills = required_skills - student_skills

                skill_match_ratio = (
                    len(matched_skills) / len(required_skills) if required_skills else 0
                )

                explanations = []
                explanations.append(
                    f"{len(matched_skills)} of {len(required_skills)} required skills matched"
                )

                sector_match = 1 if opp.sector in student_data["preferred_sectors"] else 0
                if sector_match:
                    explanations.append(f"{opp.sector} matches your preference")

                match_score = int(
                    (ml_score * 0.6 + skill_match_ratio * 0.3 + sector_match * 0.1) * 100
                )

                recommendations.append(
                    {
                        "opportunity": InternshipOpportunitySerializer(opp).data,
                        "match_score": match_score,
                        "ml_confidence": round(ml_score * 100, 1),
                        "breakdown": {
                            "ml_model_weight": round(ml_score * 60, 1),
                            "skill_match_weight": round(skill_match_ratio * 30, 1),
                            "preference_weight": round(sector_match * 10, 1),
                        },
                        "explanations": explanations,
                        "matched_skills": list(matched_skills),
                        "missing_skills": list(missing_skills),
                    }
                )
        except Exception as e:
            print(f"Error in recommendation loop: {e}")

        recommendations.sort(key=lambda x: x["match_score"], reverse=True)
        return Response(
            {"count": len(recommendations), "results": recommendations[:top_n]}
        )

class CustomMatchView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        try:
            ml_predict.load_resources()
        except Exception as e:
            print(f"ML load error in CustomMatchView: {e}")

        # Parse form data or json
        data = request.data
        
        student_data = {
            "cgpa": float(data.get("cgpa", 0.0) or 0.0),
            "level": int(data.get("level", 100) or 100),
            "preferred_sectors": [],
            "preferred_locations": [],
            "technical_skills": []
        }

        if data.get("sector"):
            student_data["preferred_sectors"].append(data.get("sector"))
        if data.get("location"):
            student_data["preferred_locations"].append(data.get("location"))

        skills_text = data.get("manual_skills", "")

        # Resume extraction
        resume_file = request.FILES.get("resume")
        if resume_file:
            try:
                reader = PyPDF2.PdfReader(resume_file)
                for page in reader.pages:
                    extracted = page.extract_text()
                    if extracted:
                        skills_text += " " + extracted
            except Exception as e:
                print(f"File extraction error: {e}")

        # Basic skill extraction using global keyword list
        text_lower = skills_text.lower()
        extracted_skills = []
        for kw in TECH_KEYWORDS:
            if kw.lower() in text_lower:
                extracted_skills.append(kw)
        
        student_data["technical_skills"] = extracted_skills

        try:
            top_n = int(request.query_params.get("top_n", 10))
        except:
            top_n = 10

        opportunities = InternshipOpportunity.objects.filter(is_active=True)
        recommendations = []

        for opp in opportunities:
            if opp.slots_filled >= opp.slots_available:
                continue

            opp_data = {
                "sector": opp.sector,
                "required_technical_skills": [
                    s["name"] if isinstance(s, dict) else s
                    for s in (opp.required_technical_skills or [])
                ],
                "location_state": opp.location_state,
            }

            ml_score = ml_predict.get_recommendation_score(student_data, opp_data)

            student_skills = set(student_data["technical_skills"])
            required_skills = set(opp_data["required_technical_skills"])
            matched_skills = student_skills & required_skills
            missing_skills = required_skills - student_skills

            skill_match_ratio = (
                len(matched_skills) / len(required_skills) if required_skills else 0
            )

            explanations = []
            explanations.append(
                f"{len(matched_skills)} of {len(required_skills)} required skills matched"
            )

            sector_match = 1 if opp.sector in student_data["preferred_sectors"] else 0
            if sector_match:
                explanations.append(f"{opp.sector} matches your preference")

            match_score = int(
                (ml_score * 0.6 + skill_match_ratio * 0.3 + sector_match * 0.1) * 100
            )

            recommendations.append(
                {
                    "opportunity": InternshipOpportunitySerializer(opp).data,
                    "match_score": match_score,
                    "ml_confidence": round(ml_score * 100, 1),
                    "breakdown": {
                        "ml_model_weight": round(ml_score * 60, 1),
                        "skill_match_weight": round(skill_match_ratio * 30, 1),
                        "preference_weight": round(sector_match * 10, 1),
                    },
                    "explanations": explanations,
                    "matched_skills": list(matched_skills),
                    "missing_skills": list(missing_skills),
                }
            )

        recommendations.sort(key=lambda x: x["match_score"], reverse=True)
        
        return Response({
            "count": len(recommendations),
            "extracted_skills": extracted_skills,
            "results": recommendations[:top_n]
        })

from django.core.management import call_command

class RetrainModelView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsCoordinator]

    def post(self, request):
        try:
            call_command('retrain_models')
            return Response({"status": "Model retrained successfully"})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CoordinatorAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsCoordinator]

    def get(self, request):
        from placements.models import Placement, Application
        from students.models import StudentProfile
        from organizations.models import InternshipOpportunity
        
        # 1. Placement success rate
        total_placements = Placement.objects.filter(evaluations__evaluation_type='final').count()
        successful_placements = Placement.objects.filter(
            evaluations__evaluation_type='final', 
            evaluations__overall_rating__gte=3.0
        ).count()
        
        success_rate = (successful_placements / total_placements * 100) if total_placements > 0 else 0
        
        # 2. Sector distribution
        sector_dist = InternshipOpportunity.objects.values('sector').annotate(
            count=Count('sector')
        ).order_by('-count')
        
        # 3. Monthly applications trend (last 6 months)
        from django.utils import timezone
        import datetime
        six_months_ago = timezone.now() - datetime.timedelta(days=180)
        apps_trend = Application.objects.filter(applied_at__gte=six_months_ago).extra(
            select={'month': "EXTRACT(month FROM applied_at)"}
        ).values('month').annotate(count=Count('id')).order_by('month')
        
        # Handle SQLite extraction if necessary (since EXTRACT is Postgres)
        # For simplicity in this demo, let's use a standard list if DB is SQLite
        if 'sqlite' in settings.DATABASES['default']['ENGINE']:
            apps_trend = Application.objects.filter(applied_at__gte=six_months_ago).values(
                'applied_at'
            ) # We'll group manually if needed or just return raw
        
        # 4. Top skills in demand
        all_opps = InternshipOpportunity.objects.all()
        skill_counts = {}
        for opp in all_opps:
            for skill in opp.required_technical_skills:
                skill_name = skill if isinstance(skill, str) else skill.get('name')
                skill_counts[skill_name] = skill_counts.get(skill_name, 0) + 1
        
        top_skills = sorted(
            [{'name': k, 'count': v} for k, v in skill_counts.items()], 
            key=lambda x: x['count'], 
            reverse=True
        )[:10]

        return Response({
            "placement_stats": {
                "total": total_placements,
                "successful": successful_placements,
                "success_rate": round(success_rate, 1)
            },
            "sector_distribution": list(sector_dist),
            "top_skills": top_skills,
            "application_trend": list(apps_trend)[:6] # Placeholder for now
        })
