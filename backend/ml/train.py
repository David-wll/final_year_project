import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import joblib
import os

def train_model():
    # 1. Load data
    data_path = 'ml/data/historical_placements.csv'
    if not os.path.exists(data_path):
        print("Data not found. Run generate_data.py first.")
        return
    
    df = pd.read_csv(data_path)
    
    # 2. Preprocessing
    # Convert sector to categorical/one-hot
    df_encoded = pd.get_dummies(df, columns=['placement_sector'])
    
    # Define features (X) and target (y)
    # Exclude student_id and label from features
    X = df_encoded.drop(['student_id', 'label'], axis=1)
    y = df_encoded['label']
    
    # Save feature names for inference consistency
    feature_names = X.columns.tolist()
    joblib.dump(feature_names, 'ml/models/feature_names.pkl')
    
    # 3. Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # 4. Train Random Forest
    print("Training Random Forest model...")
    rf = RandomForestClassifier(n_estimators=100, random_state=42)
    rf.fit(X_train, y_train)
    
    # 5. Evaluate
    y_pred = rf.predict(X_test)
    print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    # 6. Save model
    os.makedirs('ml/models', exist_ok=True)
    joblib.dump(rf, 'ml/models/recommendation_model.pkl')
    print("Model saved to ml/models/recommendation_model.pkl")

if __name__ == "__main__":
    train_model()
