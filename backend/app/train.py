"""Train and compare SVM, Random Forest and MLP for positive-class F1.

Run from backend/: python -m app.train
The fixed test split is evaluated only after hyperparameters and decision
thresholds have been selected using the training portion.
"""

import json
import warnings
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score, confusion_matrix, f1_score, precision_recall_curve,
    precision_score, recall_score,
)
from sklearn.model_selection import (
    StratifiedKFold, cross_val_predict, cross_val_score, train_test_split,
)
from sklearn.base import clone

from .models import get_model_instances
from .preprocessing import CAT_COLS, TARGET


ARTIFACTS_DIR = Path(__file__).parent / "artifacts"
DATA_PATH = Path(__file__).parent.parent / "data" / "bank.csv"
SELECTED_PARAMS = {
    "svm": {
        "model__C": 1, "model__gamma": "scale",
        "model__class_weight": "balanced",
    },
    "random_forest": {
        "model__n_estimators": 400,
        "model__min_samples_split": 10,
        "model__min_samples_leaf": 4,
        "model__max_features": 0.5,
        "model__max_depth": 14,
        "model__class_weight": None,
    },
    "mlp": {
        "model__hidden_layer_sizes": (64, 32),
        "model__alpha": 0.0001,
        "model__learning_rate_init": 0.001,
    },
}


def best_f1_threshold(y_true, probabilities):
    """Select a threshold from out-of-fold training predictions only."""
    precision, recall, thresholds = precision_recall_curve(y_true, probabilities)
    if len(thresholds) == 0:
        return 0.5, 0.0
    numerator = 2 * precision[:-1] * recall[:-1]
    denominator = precision[:-1] + recall[:-1]
    f1_values = np.divide(
        numerator, denominator, out=np.zeros_like(numerator), where=denominator != 0,
    )
    best_index = int(np.argmax(f1_values))
    return float(thresholds[best_index]), float(f1_values[best_index])


def evaluate(y_true, probabilities, threshold):
    predictions = (probabilities >= threshold).astype(int)
    return {
        "accuracy": float(accuracy_score(y_true, predictions)),
        "precision": float(precision_score(y_true, predictions, zero_division=0)),
        "recall": float(recall_score(y_true, predictions, zero_division=0)),
        "f1_score": float(f1_score(y_true, predictions, zero_division=0)),
        "confusion_matrix": confusion_matrix(y_true, predictions, labels=[0, 1]).tolist(),
    }


def main():
    warnings.filterwarnings("ignore", category=FutureWarning, module="sklearn.svm")
    df = pd.read_csv(DATA_PATH, sep=";")
    X = df.drop(columns=[TARGET])
    y = (df[TARGET] == "yes").astype(int)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y,
    )
    cv_search = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)
    cv_threshold = StratifiedKFold(n_splits=5, shuffle=True, random_state=43)

    models = get_model_instances()
    trained = {}
    thresholds = {}
    test_metrics = {}
    report = {"training_rows": len(X_train), "test_rows": len(X_test), "models": {}}

    for name, pipeline in models.items():
        print(f"\nEntrainement de {name}...", flush=True)
        model = clone(pipeline).set_params(**SELECTED_PARAMS[name])
        default_f1 = float(cross_val_score(
            model, X_train, y_train, scoring="f1", cv=cv_search, n_jobs=1,
        ).mean())

        # Fresh fits for every fold: no training prediction is used to tune the threshold.
        oof_probabilities = cross_val_predict(
            model, X_train, y_train, cv=cv_threshold,
            method="predict_proba", n_jobs=1,
        )[:, 1]
        threshold, validation_f1 = best_f1_threshold(y_train, oof_probabilities)

        model.fit(X_train, y_train)
        test_probabilities = model.predict_proba(X_test)[:, 1]
        metrics = evaluate(y_test, test_probabilities, threshold)
        trained[name] = model
        thresholds[name] = threshold
        test_metrics[name] = metrics
        report["models"][name] = {
            "cv_f1_default_threshold": default_f1,
            "validation_f1_tuned_threshold": validation_f1,
            "threshold": threshold,
            "parameters": SELECTED_PARAMS[name],
            "test": metrics,
        }
        print(
            f"{name}: F1 validation={validation_f1:.4f}, "
            f"seuil={threshold:.4f}, F1 test={metrics['f1_score']:.4f}",
            flush=True,
        )

    # Select the recommended model using validation only, never the held-out test.
    report["recommended_model"] = max(
        report["models"],
        key=lambda name: report["models"][name]["validation_f1_tuned_threshold"],
    )
    ARTIFACTS_DIR.mkdir(exist_ok=True)
    for name, model in trained.items():
        joblib.dump(model, ARTIFACTS_DIR / f"{name}.joblib")
    joblib.dump(thresholds, ARTIFACTS_DIR / "thresholds.joblib")
    joblib.dump(test_metrics, ARTIFACTS_DIR / "metrics.joblib")
    joblib.dump((X_test, y_test), ARTIFACTS_DIR / "test_set.joblib")
    joblib.dump({col: sorted(X_train[col].unique().tolist()) for col in CAT_COLS},
                ARTIFACTS_DIR / "categorical_options.joblib")
    joblib.dump(list(X.columns), ARTIFACTS_DIR / "feature_order.joblib")
    (ARTIFACTS_DIR / "training_report.json").write_text(
        json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8",
    )
    print(f"\nModele recommande (validation): {report['recommended_model']}", flush=True)
    print(f"Rapport: {ARTIFACTS_DIR / 'training_report.json'}", flush=True)


if __name__ == "__main__":
    main()
