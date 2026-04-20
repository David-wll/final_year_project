import random
import csv
import os

SKILLS = [
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

SOFT_SKILLS = [
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

SECTORS = [
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

STATES = [
    "Lagos",
    "Abuja",
    "Rivers",
    "Oyo",
    "Enugu",
    "Kaduna",
    "Kano",
    "Delta",
    "Ogun",
    "Edo",
]

DEPARTMENTS = [
    "Computer Science",
    "Electrical Engineering",
    "Mechanical Engineering",
    "Business Administration",
    "Accounting",
    "Economics",
    "Medicine",
    "Pharmacy",
    "Law",
    "Mass Communication",
]


def generate_students(n=500):
    students = []
    for i in range(n):
        student = {
            "student_id": f"STU{i + 1:04d}",
            "department": random.choice(DEPARTMENTS),
            "level": random.choice([100, 200, 300, 400, 500]),
            "cgpa": round(random.uniform(2.0, 5.0), 2),
            "technical_skills": random.sample(SKILLS, random.randint(2, 8)),
            "soft_skills": random.sample(SOFT_SKILLS, random.randint(2, 5)),
            "preferred_sectors": random.sample(SECTORS, random.randint(1, 3)),
            "preferred_locations": random.sample(STATES, random.randint(1, 3)),
        }
        students.append(student)
    return students


def generate_opportunities(n=100):
    opportunities = []
    for i in range(n):
        opp = {
            "opportunity_id": f"OPP{i + 1:04d}",
            "sector": random.choice(SECTORS),
            "required_technical_skills": random.sample(SKILLS, random.randint(3, 7)),
            "required_soft_skills": random.sample(SOFT_SKILLS, random.randint(1, 3)),
            "location_state": random.choice(STATES),
            "slots": random.randint(1, 10),
            "duration_weeks": random.choice([4, 6, 8, 12]),
            "stipend_available": random.choice([True, False]),
        }
        opportunities.append(opp)
    return opportunities


def compute_features(student, opportunity):
    student_tech = set(student["technical_skills"])
    required_tech = set(opportunity["required_technical_skills"])

    student_soft = set(student["soft_skills"])
    required_soft = set(opportunity["required_soft_skills"])

    skill_overlap = len(student_tech & required_tech)
    skill_overlap_ratio = skill_overlap / len(required_tech) if required_tech else 0

    soft_skill_overlap = len(student_soft & required_soft)
    soft_skill_overlap_ratio = (
        soft_skill_overlap / len(required_soft) if required_soft else 0
    )

    sector_match = 1 if opportunity["sector"] in student["preferred_sectors"] else 0
    location_match = (
        1 if opportunity["location_state"] in student["preferred_locations"] else 0
    )

    return {
        "student_id": student["student_id"],
        "opportunity_id": opportunity["opportunity_id"],
        "cgpa_normalized": student["cgpa"] / 5.0,
        "skill_overlap_ratio": skill_overlap_ratio,
        "soft_skill_overlap_ratio": soft_skill_overlap_ratio,
        "sector_preference_match": sector_match,
        "location_match": location_match,
        "level_encoded": student["level"] / 100,
        "stipend_available": 1 if opportunity["stipend_available"] else 0,
        "duration_weeks": opportunity["duration_weeks"],
    }


def determine_success(features, student, opportunity):
    base_score = 0

    if features["cgpa_normalized"] >= 0.5:
        base_score += 0.25
    if features["skill_overlap_ratio"] >= 0.6:
        base_score += 0.35
    if features["sector_preference_match"] == 1:
        base_score += 0.15
    if features["location_match"] == 1:
        base_score += 0.15

    success_prob = min(base_score, 1.0)

    if random.random() < 0.15:
        return 1 - int(success_prob > 0.5)

    return 1 if success_prob > 0.5 else 0


def generate_training_data(output_path=None):
    if output_path is None:
        output_path = os.path.join(os.path.dirname(__file__), "training_data.csv")

    students = generate_students(500)
    opportunities = generate_opportunities(100)

    rows = []
    headers = [
        "student_id",
        "opportunity_id",
        "cgpa_normalized",
        "skill_overlap_ratio",
        "soft_skill_overlap_ratio",
        "sector_preference_match",
        "location_match",
        "level_encoded",
        "stipend_available",
        "duration_weeks",
        "placement_success",
    ]

    for student in students:
        for opp in opportunities:
            features = compute_features(student, opp)
            success = determine_success(features, student, opp)

            row = {
                "student_id": features["student_id"],
                "opportunity_id": features["opportunity_id"],
                "cgpa_normalized": features["cgpa_normalized"],
                "skill_overlap_ratio": features["skill_overlap_ratio"],
                "soft_skill_overlap_ratio": features["soft_skill_overlap_ratio"],
                "sector_preference_match": features["sector_preference_match"],
                "location_match": features["location_match"],
                "level_encoded": features["level_encoded"],
                "stipend_available": features["stipend_available"],
                "duration_weeks": features["duration_weeks"],
                "placement_success": success,
            }
            rows.append(row)

    with open(output_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Generated {len(rows)} training samples at {output_path}")
    return output_path


if __name__ == "__main__":
    generate_training_data()
