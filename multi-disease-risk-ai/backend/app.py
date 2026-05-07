from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd

app = Flask(__name__)
CORS(app)

DISEASES = ["anemia", "diabetes", "heart", "kidney"]

models = {}
features = {}

for disease in DISEASES:
    models[disease] = joblib.load(f"models/{disease}_model.pkl")
    features[disease] = joblib.load(f"models/{disease}_features.pkl")


def risk_level(probability):
    if probability < 0.35:
        return "Low"
    elif probability < 0.70:
        return "Moderate"
    return "High"


def safe_float(value, default=0):
    try:
        if value is None or value == "":
            return default
        return float(value)
    except (ValueError, TypeError):
        return default


def build_input_row(data, disease):
    row = {}

    # Frontend values
    age = safe_float(data.get("age"))
    sex = safe_float(data.get("sex"))
    bp = safe_float(data.get("trestbps"))
    chol = safe_float(data.get("chol"))
    fbs = safe_float(data.get("fbs"))
    thalach = safe_float(data.get("thalach"))
    cp = safe_float(data.get("cp"))
    restecg = safe_float(data.get("restecg"))
    exang = safe_float(data.get("exang"))
    oldpeak = safe_float(data.get("oldpeak"))
    slope = safe_float(data.get("slope"))
    ca = safe_float(data.get("ca"))
    thal = safe_float(data.get("thal"))

    # Reasonable proxy values for other datasets
    glucose = safe_float(data.get("glucose"), fbs * 130 if fbs else 90)
    bmi = safe_float(data.get("bmi"), 25)
    hemoglobin = safe_float(data.get("hgb"), 13)
    rbc = safe_float(data.get("rbc"), 4.8)
    pcv = safe_float(data.get("pcv"), 40)
    creatinine = safe_float(data.get("creatinine"), 1.0)

    for feature in features[disease]:
        f = str(feature).strip().lower()

        value = 0

        # Common / heart features
        if f in ["age"]:
            value = age
        elif f in ["sex", "gender"]:
            value = sex
        elif f in ["trestbps", "bp", "bloodpressure", "blood_pressure"]:
            value = bp
        elif f in ["chol", "cholesterol"]:
            value = chol
        elif f in ["fbs"]:
            value = fbs
        elif f in ["thalach", "maxhr", "max_heart_rate"]:
            value = thalach
        elif f in ["cp", "chestpaintype", "chest_pain_type"]:
            value = cp
        elif f in ["restecg"]:
            value = restecg
        elif f in ["exang", "exerciseangina", "exercise_angina"]:
            value = exang
        elif f in ["oldpeak"]:
            value = oldpeak
        elif f in ["slope"]:
            value = slope
        elif f in ["ca"]:
            value = ca
        elif f in ["thal"]:
            value = thal

        # Diabetes-style features
        elif f in ["glucose"]:
            value = glucose
        elif f in ["bmi"]:
            value = bmi
        elif f in ["bloodpressure"]:
            value = bp
        elif f in ["diabetespedigreefunction"]:
            value = 0.5
        elif f in ["insulin"]:
            value = 80
        elif f in ["skinthickness"]:
            value = 20
        elif f in ["pregnancies"]:
            value = 0

        # Anemia-style features
        elif f in ["hgb", "hemoglobin"]:
            value = hemoglobin
        elif f in ["rbc"]:
            value = rbc
        elif f in ["pcv"]:
            value = pcv
        elif f in ["mcv"]:
            value = 85
        elif f in ["mch"]:
            value = 28
        elif f in ["mchc"]:
            value = 32
        elif f in ["rdw"]:
            value = 14
        elif f in ["tlc"]:
            value = 7
        elif f in ["plt", "plt /mm3", "platelet"]:
            value = 250

        # Kidney-style features
        elif f in ["bp"]:
            value = bp
        elif f in ["bgr"]:
            value = glucose
        elif f in ["sc", "serum_creatinine"]:
            value = creatinine
        elif f in ["hemo"]:
            value = hemoglobin
        elif f in ["pcv"]:
            value = pcv
        elif f in ["rbcc"]:
            value = rbc

        row[feature] = value

    return pd.DataFrame([row], columns=features[disease])


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "Multi-Disease Risk Intelligence API is running"
    })


@app.route("/predict", methods=["POST"])
def predict():
    data = request.json or {}

    print("Received data:", data)

    results = {}
    total_risk = 0

    for disease in DISEASES:
        input_df = build_input_row(data, disease)
        model = models[disease]

        probability = model.predict_proba(input_df)[0][1]
        risk_percent = round(probability * 100, 2)
        total_risk += risk_percent

        results[disease] = {
            "risk_percent": risk_percent,
            "risk_level": risk_level(probability)
        }

    health_score = round(100 - (total_risk / len(DISEASES)), 2)

    return jsonify({
        "results": results,
        "health_score": health_score
    })


if __name__ == "__main__":
    print("Starting Flask server...")
    app.run(debug=True)