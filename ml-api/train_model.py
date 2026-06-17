"""
RailGuard AI — ML Prediction Engine
RandomForestClassifier for Railway Equipment Maintenance Prediction
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib
import os

def generate_training_data(n_samples=2000):
    """Generate synthetic training data simulating railway equipment metrics."""
    np.random.seed(42)

    # Features
    age = np.random.uniform(0.5, 25, n_samples)           # years
    usage_hours = np.random.uniform(100, 30000, n_samples) # hours
    failure_count = np.random.poisson(3, n_samples)        # count
    temperature = np.random.uniform(20, 120, n_samples)    # celsius

    # Generate labels based on realistic rules
    labels = []
    for i in range(n_samples):
        score = 0
        # Age scoring
        if age[i] > 15: score += 30
        elif age[i] > 10: score += 20
        elif age[i] > 5: score += 10
        # Usage scoring
        if usage_hours[i] > 20000: score += 25
        elif usage_hours[i] > 10000: score += 15
        elif usage_hours[i] > 5000: score += 8
        # Failure scoring
        if failure_count[i] > 8: score += 25
        elif failure_count[i] > 5: score += 18
        elif failure_count[i] > 2: score += 10
        # Temperature scoring
        if temperature[i] > 95: score += 25
        elif temperature[i] > 75: score += 15
        elif temperature[i] > 55: score += 8

        # Add noise
        score += np.random.normal(0, 5)

        if score >= 70: labels.append(3)    # critical
        elif score >= 50: labels.append(2)  # high
        elif score >= 30: labels.append(1)  # medium
        else: labels.append(0)              # low

    data = pd.DataFrame({
        'age': age,
        'usage_hours': usage_hours,
        'failure_count': failure_count,
        'temperature': temperature,
        'risk_label': labels
    })

    return data


def train_model():
    """Train the RandomForest model and save it."""
    print("📊 Generating training data...")
    data = generate_training_data(2000)

    X = data[['age', 'usage_hours', 'failure_count', 'temperature']]
    y = data['risk_label']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("🤖 Training RandomForestClassifier...")
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)

    # Evaluate
    y_pred = model.predict(X_test)
    print("\n📈 Model Performance:")
    print(classification_report(y_test, y_pred, target_names=['Low', 'Medium', 'High', 'Critical']))

    accuracy = model.score(X_test, y_test)
    print(f"✅ Accuracy: {accuracy:.2%}")

    # Feature importance
    importances = model.feature_importances_
    features = ['age', 'usage_hours', 'failure_count', 'temperature']
    print("\n🔍 Feature Importance:")
    for feat, imp in sorted(zip(features, importances), key=lambda x: -x[1]):
        print(f"   {feat}: {imp:.4f}")

    # Save model
    model_path = os.path.join(os.path.dirname(__file__), 'model.pkl')
    joblib.dump(model, model_path)
    print(f"\n💾 Model saved to {model_path}")

    return model, accuracy


if __name__ == '__main__':
    train_model()
