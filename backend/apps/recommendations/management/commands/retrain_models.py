import pandas as pd
from django.core.management.base import BaseCommand
from placements.models import Placement
from ml.train import train_model
import os

class Command(BaseCommand):
    help = 'Retrains the ML recommendation model based on new placement outcomes'

    def handle(self, *args, **options):
        self.stdout.write('Collecting new training data...')
        
        # 1. Fetch completed placements
        # For simplicity, we consider placements with a final evaluation as "completed"
        placements = Placement.objects.filter(evaluations__evaluation_type='final').distinct()
        
        if not placements.exists():
            self.stdout.write(self.style.WARNING('No completed placements found for retraining.'))
            return

        new_data = []
        for p in placements:
            student = p.application.student
            opp = p.application.opportunity
            final_eval = p.evaluations.filter(evaluation_type='final').first()
            
            if not final_eval:
                continue
                
            # Success = rating >= 3.0
            label = 1 if final_eval.overall_rating >= 3.0 else 0
            
            row = {
                'student_id': student.user.id,
                'cgpa': student.cgpa,
                'level': student.level,
                'placement_sector': opp.sector,
                'label': label
            }
            
            # Map skills to binary flags
            # We assume the same skills pool as in generate_data.py
            student_skills = [s['name'] if isinstance(s, dict) else s for s in student.technical_skills]
            
            # Since we don't have the full skills pool here easily, 
            # we'll append to the existing CSV if possible, 
            # or recreate it if we have consistent headers.
            row['student_skills'] = student_skills # We'll handle this in a specialized preprocessing step
            
            new_data.append(row)

        self.stdout.write(f'Found {len(new_data)} new records.')
        
        # 2. Append to historical_placements.csv
        data_path = 'ml/data/historical_placements.csv'
        if os.path.exists(data_path):
            existing_df = pd.read_csv(data_path)
            
            # Preprocess new_data to match existing_df columns
            processed_new_data = []
            for item in new_data:
                new_row = {
                    'student_id': item['student_id'],
                    'cgpa': item['cgpa'],
                    'level': item['level'],
                    'placement_sector': item['placement_sector'],
                    'label': item['label']
                }
                
                # Fill skill columns
                for col in existing_df.columns:
                    if col.startswith('skill_'):
                        skill_name = col.replace('skill_', '')
                        new_row[col] = 1 if skill_name in item['student_skills'] else 0
                
                processed_new_data.append(new_row)
            
            new_df = pd.DataFrame(processed_new_data)
            updated_df = pd.concat([existing_df, new_df], ignore_index=True)
            updated_df.to_csv(data_path, index=False)
            self.stdout.write(self.style.SUCCESS(f'Updated {data_path}'))
        else:
            self.stdout.write(self.style.ERROR(f'Could not find {data_path}. Initial data must exist.'))
            return

        # 3. Trigger retraining
        self.stdout.write('Starting model retraining...')
        train_model()
        self.stdout.write(self.style.SUCCESS('Model retrained and saved Successfully!'))
