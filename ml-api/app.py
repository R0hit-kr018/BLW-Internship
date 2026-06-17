"""
RailGuard AI — Flask ML API
Serves maintenance predictions via REST API
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import joblib
import os

app = Flask(__name__)
CORS(app)

RISK_LABELS = {0: 'low', 1: 'medium', 2: 'high', 3: 'critical'}
model = None

def load_model():
    global model
    model_path = os.path.join(os.path.dirname(__file__), 'model.pkl')
    if os.path.exists(model_path):
        model = joblib.load(model_path)
        print("✅ Model loaded successfully")
    else:
        print("⚠️  No model found. Training new model...")
        from train_model import train_model
        model, _ = train_model()

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'model_loaded': model is not None})

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        age = float(data.get('age', 0))
        usage_hours = float(data.get('usage_hours', 0))
        failure_count = int(data.get('failure_count', 0))
        temperature = float(data.get('temperature', 25))

        features = np.array([[age, usage_hours, failure_count, temperature]])

        if model is None:
            load_model()

        prediction = model.predict(features)[0]
        probabilities = model.predict_proba(features)[0]

        risk_level = RISK_LABELS.get(prediction, 'unknown')
        risk_score = int(probabilities[prediction] * 100)
        confidence = float(max(probabilities))

        # Feature importance for this prediction
        importances = model.feature_importances_
        feature_names = ['age', 'usage_hours', 'failure_count', 'temperature']
        feature_impact = {
            name: round(float(imp), 4)
            for name, imp in zip(feature_names, importances)
        }

        return jsonify({
            'risk_level': risk_level,
            'risk_score': risk_score,
            'confidence': round(confidence, 3),
            'probabilities': {
                'low': round(float(probabilities[0]), 3),
                'medium': round(float(probabilities[1]), 3),
                'high': round(float(probabilities[2]), 3),
                'critical': round(float(probabilities[3]), 3),
            },
            'feature_impact': feature_impact,
            'recommendation': get_recommendation(risk_level, age, usage_hours, failure_count, temperature),
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/batch-predict', methods=['POST'])
def batch_predict():
    try:
        data = request.json.get('equipment_list', [])
        results = []
        for eq in data:
            features = np.array([[
                float(eq.get('age', 0)),
                float(eq.get('usage_hours', 0)),
                int(eq.get('failure_count', 0)),
                float(eq.get('temperature', 25)),
            ]])
            prediction = model.predict(features)[0]
            probabilities = model.predict_proba(features)[0]
            results.append({
                'equipment_id': eq.get('equipment_id', ''),
                'risk_level': RISK_LABELS.get(prediction, 'unknown'),
                'risk_score': int(probabilities[prediction] * 100),
                'confidence': round(float(max(probabilities)), 3),
            })
        return jsonify({'predictions': results})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_recommendation(risk_level, age, usage, failures, temp):
    if risk_level == 'critical':
        return 'IMMEDIATE maintenance required. Equipment shows critical degradation across multiple parameters. Schedule emergency inspection within 24 hours.'
    elif risk_level == 'high':
        recs = ['Schedule preventive maintenance within the next 7 days.']
        if temp > 80: recs.append('Temperature is elevated — inspect cooling systems.')
        if failures > 5: recs.append('High failure count — consider component replacement.')
        if age > 10: recs.append('Equipment is aging — evaluate for overhaul or replacement.')
        return ' '.join(recs)
    elif risk_level == 'medium':
        return 'Monitor closely. Schedule routine inspection within 30 days. Track temperature and usage trends.'
    else:
        return 'Equipment is in good condition. Continue standard maintenance schedule.'

if __name__ == '__main__':
    load_model()
    print("\n🚂 RailGuard ML API running on port 5001\n")
    app.run(host='0.0.0.0', port=5001, debug=True)
