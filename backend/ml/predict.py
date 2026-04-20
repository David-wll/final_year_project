import joblib
import pandas as pd
import numpy as np
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "ml/models/recommendation_model.pkl")
FEATURES_PATH = os.path.join(BASE_DIR, "ml/models/feature_names.pkl")

model = None
feature_names = None


def load_resources():
    global model, feature_names
    if model is None:
        if os.path.exists(MODEL_PATH):
            model = joblib.load(MODEL_PATH)
        else:
            print(f"Model not found at {MODEL_PATH}")

    if feature_names is None:
        if os.path.exists(FEATURES_PATH):
            feature_names = joblib.load(FEATURES_PATH)
        else:
            print(f"Feature names not found at {FEATURES_PATH}")


def get_recommendation_score(student_data, opportunity_data):
    """
    student_data: dict with cgpa, level, technical_skills (list)
    opportunity_data: dict with sector
    """
    load_resources()
    if model is None or feature_names is None:
        return 0.5

    input_row = pd.Series(0, index=feature_names)

    input_row["cgpa"] = student_data.get("cgpa", 0.0)
    input_row["level"] = student_data.get("level", 100)

    for skill in student_data.get("technical_skills", []):
        col_name = f"skill_{skill}"
        if col_name in input_row.index:
            input_row[col_name] = 1

    sector_col = f"placement_sector_{opportunity_data.get('sector', '')}"
    if sector_col in input_row.index:
        input_row[sector_col] = 1

    input_df = pd.DataFrame([input_row])
    proba = model.predict_proba(input_df)[0]
    score = proba[1] if len(proba) > 1 else proba[0]

    return float(score)


def get_recommendations(student_profile, opportunities, top_n=10):
    """
    Get recommended internship opportunities for a student.

    student_profile: StudentProfile model instance
    opportunities: QuerySet of InternshipOpportunity

    Returns list of dicts with opportunity, match_score, explanations
    """
    load_resources()

    student_data = {
        "cgpa": student_profile.cgpa,
        "level": student_profile.level,
        "technical_skills": [
            s["name"] if isinstance(s, dict) else s
            for s in student_profile.technical_skills
        ],
        "preferred_sectors": student_profile.preferred_sectors or [],
        "preferred_locations": student_profile.preferred_locations or [],
    }

    recommendations = []

    for opp in opportunities:
        if not opp.is_active or opp.slots_filled >= opp.slots_available:
            continue

        opp_data = {
            "sector": opp.sector,
            "required_technical_skills": [
                s["name"] if isinstance(s, dict) else s
                for s in opp.required_technical_skills
            ],
            "location_state": opp.location_state,
        }

        ml_score = get_recommendation_score(student_data, opp_data)

        student_skills = set(student_data["technical_skills"])
        required_skills = set(opp_data["required_technical_skills"])
        matched_skills = student_skills & required_skills
        missing_skills = required_skills - student_skills

        skill_match_ratio = (
            len(matched_skills) / len(required_skills) if required_skills else 0
        )

        explanations = {}
        explanations["skill_match"] = (
            f"{len(matched_skills)} of {len(required_skills)} required skills matched"
        )
        if missing_skills:
            explanations["missing_skills"] = list(missing_skills)[:3]

        sector_match = (
            1 if opp_data["sector"] in student_data["preferred_sectors"] else 0
        )
        if sector_match:
            explanations["sector"] = f"{opp_data['sector']} matches your preference"

        location_match = (
            1 if opp_data["location_state"] in student_data["preferred_sectors"] else 0
        )
        if location_match:
            explanations["location"] = (
                f"{opp_data['location_state']} is one of your preferred locations"
            )

        if student_profile.cgpa >= 2.5:
            explanations["cgpa"] = "Your CGPA meets the threshold"

        match_score = int(
            (ml_score * 0.6 + skill_match_ratio * 0.3 + sector_match * 0.1) * 100
        )
        match_score = min(100, max(0, match_score))

        recommendations.append(
            {
                "opportunity": opp,
                "match_score": match_score,
                "ml_confidence": round(ml_score * 100, 1),
                "explanations": explanations,
                "matched_skills": list(matched_skills),
                "missing_skills": list(missing_skills),
            }
        )

    recommendations.sort(key=lambda x: x["match_score"], reverse=True)
    return recommendations[:top_n]


if __name__ == "__main__":
    test_student = {
        "cgpa": 4.5,
        "level": 400,
        "technical_skills": ["Python", "Django", "React"],
    }
    test_opp = {"sector": "Technology"}
    print(f"Recommendation Score: {get_recommendation_score(test_student, test_opp)}")
