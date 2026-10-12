"""Check finalist F1 on new folds of training data only; never use test labels."""

import warnings

import pandas as pd
from sklearn.base import clone
from sklearn.model_selection import StratifiedKFold, cross_val_predict, train_test_split

from .models import get_model_instances
from .preprocessing import TARGET
from .train import DATA_PATH, best_f1_threshold


def main():
    warnings.filterwarnings("ignore", category=FutureWarning, module="sklearn.svm")
    df = pd.read_csv(DATA_PATH, sep=";")
    y = (df[TARGET] == "yes").astype(int)
    X_train, _, y_train, _ = train_test_split(
        df.drop(columns=[TARGET]), y,
        test_size=0.2, random_state=42, stratify=y,
    )
    models = get_model_instances()
    candidates = [
        ("rf_old", "random_forest", {
            "model__n_estimators": 400, "model__min_samples_leaf": 5,
            "model__max_features": 0.5, "model__max_depth": None,
            "model__class_weight": "balanced_subsample",
        }),
        ("rf_candidate_11", "random_forest", {
            "model__n_estimators": 400, "model__min_samples_split": 2,
            "model__min_samples_leaf": 5, "model__max_features": 0.7,
            "model__max_depth": 14, "model__class_weight": None,
        }),
        ("rf_candidate_19", "random_forest", {
            "model__n_estimators": 400, "model__min_samples_split": 10,
            "model__min_samples_leaf": 4, "model__max_features": 0.5,
            "model__max_depth": 14, "model__class_weight": None,
        }),
        ("svm_old", "svm", {
            "model__C": 1, "model__gamma": "scale", "model__class_weight": "balanced",
        }),
        ("svm_candidate_11", "svm", {
            "model__C": 2, "model__gamma": 0.01,
            "model__class_weight": {0: 1, 1: 4},
        }),
    ]
    for seed in (44, 45):
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=seed)
        print(f"\nPlis de validation {seed}", flush=True)
        for label, name, params in candidates:
            model = clone(models[name]).set_params(**params)
            probabilities = cross_val_predict(
                model, X_train, y_train, cv=cv, method="predict_proba", n_jobs=1,
            )[:, 1]
            threshold, score = best_f1_threshold(y_train, probabilities)
            print(f"{label}: F1={score:.4f}, seuil={threshold:.4f}", flush=True)


if __name__ == "__main__":
    main()
