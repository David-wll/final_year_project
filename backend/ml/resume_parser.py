import re
from PyPDF2 import PdfReader

TECHNICAL_SKILLS = [
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
    "HTML",
    "CSS",
    "Bootstrap",
    "Tailwind",
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
    "Excel",
    "PowerPoint",
    "Word",
    "Figma",
    "Adobe",
    "Photoshop",
    "Illustrator",
    "TypeScript",
    "Vue.js",
    "Angular",
    "Express",
    "Flask",
    "FastAPI",
    "TensorFlow",
    "PyTorch",
    "Keras",
    "Pandas",
    "NumPy",
    "Matplotlib",
    "Scikit-learn",
    "R",
    "Ruby",
    "Rails",
    "REST API",
    "GraphQL",
    "NLP",
    "Computer Vision",
    "Linux",
    "Ubuntu",
    "Windows Server",
    "Networking",
    "TCP/IP",
    "DNS",
    "DHCP",
    " VPN",
    "Firewalls",
    "Penetration Testing",
    " ethical Hacking",
    " Kali Linux",
]

SOFT_SKILLS = [
    "Communication",
    "Teamwork",
    "Problem Solving",
    "Critical Thinking",
    "Time Management",
    "Adaptability",
    "Leadership",
    " Emotional Intelligence",
    "Creativity",
    "Work Ethic",
    "Attention to Detail",
    "Public Speaking",
    "Interpersonal Skills",
    "Conflict Resolution",
    "Negotiation",
    "Presentation",
    "Project Management",
    "Agile",
    "Scrum",
    "Analytical Skills",
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
    "Banking",
    "Consulting",
    "Marketing",
    "Software",
    "Hardware",
    "Insurance",
]


def extract_text_from_pdf(file):
    try:
        reader = PdfReader(file)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        print(f"Error extracting PDF text: {e}")
        return ""


def extract_skills(text):
    text_lower = text.lower()

    found_technical = []
    found_soft = []
    found_sectors = []

    for skill in TECHNICAL_SKILLS:
        if skill.lower() in text_lower:
            found_technical.append({"name": skill, "proficiency": "intermediate"})

    for skill in SOFT_SKILLS:
        if skill.lower() in text_lower:
            found_soft.append({"name": skill, "proficiency": "intermediate"})

    for sector in SECTORS:
        if sector.lower() in text_lower:
            found_sectors.append(sector)

    return {
        "technical_skills": found_technical[:10],
        "soft_skills": found_soft[:5],
        "preferred_sectors": found_sectors[:3],
    }


def extract_name(text_lines):
    for line in text_lines[:5]:
        line = line.strip()
        if 2 <= len(line.split()) <= 4:
            if any(char.isalpha() for char in line):
                return line
    return ""


def extract_email(text):
    email_pattern = r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"
    match = re.search(email_pattern, text)
    return match.group(0) if match else ""


def extract_phone(text):
    phone_pattern = r"(\+?234[0-9]{9}|[0-9]{11})"
    match = re.search(phone_pattern, text)
    return match.group(0) if match else ""


def parse_resume(file):
    text = extract_text_from_pdf(file)
    if not text:
        return {"error": "Could not extract text from PDF"}

    lines = text.split("\n")

    result = {
        "name": extract_name(lines),
        "email": extract_email(text),
        "phone": extract_phone(text),
    }

    skills_data = extract_skills(text)
    result.update(skills_data)

    return result


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        with open(sys.argv[1], "rb") as f:
            result = parse_resume(f)
            print(result)
