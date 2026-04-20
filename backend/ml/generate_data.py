import pandas as pd
import numpy as np
import random
import os

# Set seed for reproducibility
np.random.seed(42)
random.seed(42)

def generate_synthetic_data(n_samples=1000):
    sectors = ["Technology", "Finance", "Healthcare", "Engineering", "Media", "Education", "Agriculture", "Energy", "Telecommunications", "Manufacturing"]
    skills_pool = [
        "Python", "JavaScript", "React", "Django", "Node.js", "SQL", "MongoDB", 
        "Java", "C++", "C#", "PHP", "Laravel", "Flutter", "React Native",
        "HTML/CSS", "Bootstrap", "Tailwind CSS", "Git", "Docker", "AWS",
        "Azure", "Data Analysis", "Machine Learning", "Cybersecurity",
        "Network Administration", "Cloud Computing", "UI/UX Design",
        "Graphic Design", "Video Editing", "Digital Marketing"
    ]
    
    data = []
    
    for i in range(n_samples):
        # Student features
        cgpa = round(random.uniform(2.5, 5.0), 2)
        level = random.choice([300, 400]) # Most SIWES students are 300/400 level
        
        # Randomly pick 3-6 skills
        n_skills = random.randint(3, 6)
        student_skills = random.sample(skills_pool, n_skills)
        
        # Placement features
        placement_sector = random.choice(sectors)
        
        # Simple logic for "successful" match (Label: 1 for success, 0 for failure)
        # In reality, this would be historical data. Here we simulate success based on some rules.
        is_success = 0
        
        # Rule 1: High CGPA helps
        if cgpa > 4.0:
            is_success += 0.3
            
        # Rule 2: Skill match with sector
        tech_skills = ["Python", "JavaScript", "React", "Django", "Node.js", "SQL", "MongoDB"]
        if placement_sector == "Technology" and any(s in tech_skills for s in student_skills):
            is_success += 0.5
            
        # Rule 3: Random noise
        is_success += random.uniform(0, 0.4)
        
        label = 1 if is_success > 0.7 else 0
        
        # Flatten skills into binary columns for the CSV
        row = {
            'student_id': i,
            'cgpa': cgpa,
            'level': level,
            'placement_sector': placement_sector,
            'label': label
        }
        
        # Add binary skill flags
        for skill in skills_pool:
            row[f'skill_{skill}'] = 1 if skill in student_skills else 0
            
        data.append(row)
        
    df = pd.DataFrame(data)
    
    # Save to data folder
    os.makedirs('ml/data', exist_ok=True)
    df.to_csv('ml/data/historical_placements.csv', index=False)
    print(f"Generated {n_samples} synthetic placement records in ml/data/historical_placements.csv")

if __name__ == "__main__":
    generate_synthetic_data()
