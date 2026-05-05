from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import StudentProfile
from .serializers import StudentProfileSerializer
from accounts.permissions import IsStudent

from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
import json

try:
    from ml.resume_parser import parse_resume

    RESUME_PARSER_AVAILABLE = True
except ImportError:
    RESUME_PARSER_AVAILABLE = False


class StudentProfileDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = StudentProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsStudent]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_object(self):
        profile, created = StudentProfile.objects.get_or_create(user=self.request.user)
        return profile

    def patch(self, request, *args, **kwargs):
        if "resume" in request.FILES:
            profile = self.get_object()
            resume_file = request.FILES["resume"]

            filename = resume_file.name.lower()

            if filename.endswith(".pdf") and RESUME_PARSER_AVAILABLE:
                try:
                    resume_file.seek(0)
                    parsed = parse_resume(resume_file)

                    if "technical_skills" in parsed and parsed["technical_skills"]:
                        if not profile.technical_skills:
                            profile.technical_skills = parsed["technical_skills"]

                    if "soft_skills" in parsed and parsed["soft_skills"]:
                        if not profile.soft_skills:
                            profile.soft_skills = parsed["soft_skills"]

                    if "preferred_sectors" in parsed and parsed["preferred_sectors"]:
                        if not profile.preferred_sectors:
                            profile.preferred_sectors = parsed["preferred_sectors"]

                    if "name" in parsed and parsed["name"] and not profile.full_name:
                        profile.full_name = parsed["name"]

                    profile.save()
                except Exception as e:
                    print(f"Resume parsing error: {e}")
            else:
                extracted_skills = []
                keywords = {
                    "python": "Python",
                    "django": "Django",
                    "react": "React",
                    "javascript": "JavaScript",
                    "sql": "SQL",
                    "java": "Java",
                    "flutter": "Flutter",
                    "design": "UI/UX Design",
                    "data": "Data Analysis",
                }

                for key, val in keywords.items():
                    if key in filename:
                        extracted_skills.append(
                            {"name": val, "proficiency": "intermediate"}
                        )

                if extracted_skills and not profile.technical_skills:
                    profile.technical_skills = extracted_skills
                    profile.save()

        return super().patch(request, *args, **kwargs)


class SkillTaxonomyView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        technical_skills = [
            "Python",
            "JavaScript",
            "React",
            "Django",
            "Node.js",
            "SQL",
            "MongoDB",
            "Java",
            "C++",
            "C#",
            "PHP",
            "Laravel",
            "Flutter",
            "React Native",
            "HTML/CSS",
            "Bootstrap",
            "Tailwind CSS",
            "Git",
            "Docker",
            "AWS",
            "Azure",
            "Data Analysis",
            "Machine Learning",
            "Cybersecurity",
            "Network Administration",
            "Cloud Computing",
            "UI/UX Design",
            "Graphic Design",
            "Video Editing",
            "Digital Marketing",
        ]
        soft_skills = [
            "Communication",
            "Teamwork",
            "Problem Solving",
            "Critical Thinking",
            "Time Management",
            "Adaptability",
            "Leadership",
            "Emotional Intelligence",
            "Creativity",
            "Work Ethic",
            "Attention to Detail",
            "Public Speaking",
        ]
        sectors = [
            "Technology",
            "Finance",
            "Healthcare",
            "Engineering",
            "Media",
            "Education",
            "Agriculture",
            "Energy",
            "Telecommunications",
            "Manufacturing",
        ]
        locations = [
            "Lagos",
            "Abia",
            "Adamawa",
            "Akwa Ibom",
            "Anambra",
            "Bauchi",
            "Bayelsa",
            "Benue",
            "Borno",
            "Cross River",
            "Delta",
            "Ebonyi",
            "Edo",
            "Ekiti",
            "Enugu",
            "Gombe",
            "Imo",
            "Jigawa",
            "Abuja",
            "Kaduna",
            "Kano",
            "Katsina",
            "Kebbi",
            "Kogi",
            "Kwara",
            "Nasarawa",
            "Niger",
            "Ogun",
            "Ondo",
            "Osun",
            "Oyo",
            "Plateau",
            "Rivers",
            "Sokoto",
            "Taraba",
            "Yobe",
            "Zamfara",
        ]

        return Response(
            {
                "technical_skills": technical_skills,
                "soft_skills": soft_skills,
                "sectors": sectors,
                "locations": locations,
            }
        )
