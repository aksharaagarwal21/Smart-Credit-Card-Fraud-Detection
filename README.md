# 🛡️ FraudShield AI — Smart Credit Card Fraud Detection

> **Domain:** Information Management System  
> A full-stack fraud detection system using **Graph Neural Networks (GNN)** and **Machine Learning** for real-time credit card transaction monitoring.

## ✨ Features

- 📊 **Dashboard** — Real-time stats, hourly trends, category analysis
- 📋 **Transactions** — Searchable, filterable, paginated table
- 🕸️ **Graph View** — Interactive D3.js force-directed transaction graph
- 🤖 **Model Performance** — Side-by-side ML + GNN comparison
- 🔔 **Fraud Alerts** — Severity-based alert system
- 🔍 **Predict** — Real-time fraud scoring for new transactions
- 📈 **Analytics** — Amount, distance, channel distribution charts

## 🧠 Models Used

| Model | Type |
|-------|------|
| Random Forest | ML |
| XGBoost | ML |
| Logistic Regression | ML |
| Weighted Ensemble | ML |
| Graph Convolutional Network (GCN) | GNN |

## 📁 Project Structure

```
clientproject6/
├── backend/
│   ├── app.py              # Flask REST API
│   ├── ml_engine.py        # ML models + data generation
│   └── graph_builder.py    # GNN + transaction graph
├── frontend/
│   ├── index.html          # Dashboard UI
│   ├── style.css           # Dark theme styles
│   └── app.js              # Charts + D3 graph logic
├── requirements.txt
└── README.md
```

## 🚀 How to Run

### Prerequisites
- Python 3.9 or higher
- pip (Python package manager)

### Steps

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Start the server
python backend/app.py

# 3. Open in browser
# http://localhost:5000
```

Wait for the models to train (~10 seconds), then open **http://localhost:5000** in your browser.

### Run in VS Code
1. Open the project folder in VS Code
2. Open terminal (`Ctrl + ``)
3. Run `pip install -r requirements.txt`
4. Run `python backend/app.py`
5. Ctrl+Click the `http://localhost:5000` link in the terminal

## 🛠️ Tech Stack

**Backend:** Python, Flask, scikit-learn, XGBoost, NetworkX, NumPy, Pandas  
**Frontend:** HTML, CSS, JavaScript, Chart.js, D3.js  
**Database:** In-memory (synthetic 10K transactions)

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Summary statistics |
| GET | `/api/transactions` | Paginated transactions |
| POST | `/api/predict` | Fraud prediction |
| GET | `/api/graph-data` | Graph visualization data |
| GET | `/api/model-performance` | Model metrics |
| GET | `/api/alerts` | Fraud alerts |
| GET | `/api/analytics` | Analytics data |
