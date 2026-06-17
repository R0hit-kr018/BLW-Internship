# 🚂 RailGuard AI — Railway Equipment Maintenance Prediction System

> AI-Powered MERN Stack application for railway workshops to manage equipment, track maintenance history, generate smart alerts, and predict maintenance requirements using Machine Learning.

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  React Frontend │────▶│  Express Backend  │────▶│   MongoDB Atlas  │
│  (Vite + TW4)   │     │  (JWT + RBAC)     │     │                  │
└─────────────────┘     └───────┬──────────┘     └─────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
              ┌─────▼─────┐         ┌──────▼──────┐
              │ Flask ML   │         │ IBM Granite  │
              │ API (5001) │         │    AI API    │
              └───────────┘         └─────────────┘
```

## 🚀 Quick Start

### 1. Backend Server
```bash
cd server
cp .env.example .env
# Edit .env with your MongoDB URI
npm install
npm run seed     # Seeds demo data
npm run dev      # Starts on port 5000
```

### 2. ML API (Python)
```bash
cd ml-api
pip install -r requirements.txt
python train_model.py   # Train the model first
python app.py           # Starts on port 5001
```

### 3. Frontend
```bash
cd client
npm install
npm run dev     # Starts on port 3000
```

## 🔐 Demo Credentials

| Role       | Email                  | Password    |
|------------|------------------------|-------------|
| Admin      | admin@railguard.in     | admin123    |
| Engineer   | engineer@railguard.in  | engineer123 |
| Technician | tech1@railguard.in     | tech123     |

## 📦 Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS 4, Recharts, React Router, Axios
- **Backend:** Node.js, Express.js, MongoDB (Mongoose), JWT, bcrypt
- **ML API:** Python Flask, scikit-learn (RandomForestClassifier)
- **AI:** IBM Granite for explainable maintenance recommendations
- **Auth:** JWT with role-based access control (Admin/Engineer/Technician)

## 📋 Modules

1. **Equipment Management** — Full CRUD with ML predictions
2. **Maintenance Records** — Scheduling, tracking, and role-based updates
3. **Dashboard Analytics** — KPIs, Recharts, trends, risk analysis
4. **Smart Alerts** — AI-powered notifications with severity levels
5. **Reports Generation** — Equipment summary, cost analysis, CSV export
6. **User Management** — Admin-only user CRUD and role assignment

## 🤖 ML Features

- RandomForestClassifier trained on equipment age, usage hours, failure count, and temperature
- Predicts maintenance risk level (Low/Medium/High/Critical)
- Feature importance analysis for each prediction
- Batch prediction support for fleet-wide analysis
- Falls back to rule-based prediction when ML API is unavailable

## 🧠 IBM Granite AI

- Generates explainable maintenance recommendations
- Provides root cause analysis and risk assessment
- Cost-benefit analysis for maintenance scheduling
- Safety recommendations based on equipment parameters
