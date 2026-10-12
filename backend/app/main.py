# backend/app/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import joblib
import pandas as pd
from pathlib import Path
from typing import Dict, Any, List

from .schemas import PredictRequest, PredictResponse, AlgoResult
from .preprocessing import encode_input, CAT_COLS, NUM_COLS
from .models import ALGO_LABELS

app = FastAPI(
    title="Simulateur ML - Bank Marketing",
    description="API de prediction de souscription bancaire avec comparaison SVM, Random Forest et MLP",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ARTIFACTS_DIR = Path(__file__).parent / "artifacts"

# Lazy-loaded or startup-loaded artifacts
artifacts: Dict[str, Any] = {}

def load_artifacts():
    if not (ARTIFACTS_DIR / "thresholds.joblib").exists():
        raise RuntimeError("Artefacts optimises absents. Lancez 'python -m app.train' d'abord.")

    artifacts["categorical_options"] = joblib.load(ARTIFACTS_DIR / "categorical_options.joblib")
    artifacts["feature_order"] = joblib.load(ARTIFACTS_DIR / "feature_order.joblib")
    artifacts["thresholds"] = joblib.load(ARTIFACTS_DIR / "thresholds.joblib")
    artifacts["metrics"] = joblib.load(ARTIFACTS_DIR / "metrics.joblib")
    artifacts["models"] = {
        name: joblib.load(ARTIFACTS_DIR / f"{name}.joblib")
        for name in ALGO_LABELS
    }

@app.on_event("startup")
def startup_event():
    try:
        load_artifacts()
        print("Artefacts charges avec succes !")
    except Exception as e:
        print(f"Attention lors du chargement des artefacts: {e}")

@app.get("/")
def root():
    return {
        "message": "Simulateur ML - Bank Marketing API",
        "docs": "/docs",
        "status": "ready" if "models" in artifacts else "artifacts_missing"
    }

@app.get("/api/meta")
def get_meta():
    """Renvoie la liste des algos et les valeurs possibles pour chaque champ categoriel,
    ainsi que les plages de valeurs numeriques utiles pour le frontend."""
    if "models" not in artifacts:
        load_artifacts()

    return {
        "algorithms": [{"key": k, "label": v} for k, v in ALGO_LABELS.items()],
        "categorical_options": artifacts["categorical_options"],
        "numeric_fields": NUM_COLS,
    }

@app.get("/api/sample")
def get_sample(type: str = "yes"):
    """Renvoie une ligne d'exemple reelle extraite du dataset."""
    data_path = Path(__file__).parent.parent / "data" / "bank.csv"
    if not data_path.exists():
        data_path = Path(__file__).parent.parent.parent / "bank.csv"
    
    if not data_path.exists():
        raise HTTPException(500, "Fichier bank.csv introuvable.")

    df = pd.read_csv(data_path, sep=";")
    target_val = "yes" if type.lower() == "yes" else "no"
    subset = df[df["y"] == target_val]
    if subset.empty:
        subset = df
    
    # Take a representative row
    sample_row = subset.sample(1, random_state=123 if target_val == "yes" else 456).iloc[0].to_dict()
    # Remove the target column from sample input
    sample_row.pop("y", None)
    return {
        "sample_type": target_val,
        "data": sample_row
    }

@app.post("/api/predict", response_model=PredictResponse)
def predict(payload: PredictRequest):
    if not payload.algorithms:
        raise HTTPException(status_code=400, detail="Aucun algorithme selectionne")

    if "models" not in artifacts:
        load_artifacts()

    categorical_options = artifacts["categorical_options"]
    feature_order = artifacts["feature_order"]
    thresholds = artifacts["thresholds"]
    test_metrics = artifacts["metrics"]
    models = artifacts["models"]

    # Pretraitement des donnees utilisateurs
    row_dict = payload.dict(exclude={"algorithms"})
    X_input = encode_input(row_dict, categorical_options, feature_order)

    results: List[AlgoResult] = []
    for algo_key in payload.algorithms:
        if algo_key not in models:
            raise HTTPException(status_code=400, detail=f"Algorithme inconnu: {algo_key}")
        
        model = models[algo_key]

        probability_yes = float(model.predict_proba(X_input)[0, 1])
        threshold = thresholds[algo_key]
        pred_label = "yes" if probability_yes >= threshold else "no"
        metrics = test_metrics[algo_key]

        results.append(AlgoResult(
            algorithm=ALGO_LABELS[algo_key],
            prediction=str(pred_label),
            prediction_proba=probability_yes,
            decision_threshold=threshold,
            **metrics,
        ))

    return PredictResponse(
        results=results,
        comparison=len(payload.algorithms) > 1
    )
