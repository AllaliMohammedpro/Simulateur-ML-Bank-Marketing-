"""Expanded, read-only search on the training rows only.

The fixed test set is deliberately discarded. Candidate thresholds are
computed from five-fold out-of-fold probabilities.
"""

import warnings

import pandas as pd
from sklearn.base import clone
from sklearn.model_selection import (
    RandomizedSearchCV, StratifiedKFold, cross_val_predict, train_test_split,
)
from sklearn.preprocessing import PowerTransformer, StandardScaler

from .models import get_model_instances
from .preprocessing import TARGET
from .train import DATA_PATH, best_f1_threshold


SEARCH_SPACES = {
    "svm": {
        "model__C": [0.3, 1, 2, 4, 8, 16, 32, 64],
        "model__gamma": ["scale", 0.001, 0.003, 0.01, 0.03, 0.1],
        "model__class_weight": [
            None, "balanced", {0: 1, 1: 2}, {0: 1, 1: 4}, {0: 1, 1: 6},
        ],
        "preprocess__numeric": [StandardScaler(), PowerTransformer()],
    },
    "random_forest": {
        "model__n_estimators": [200, 400, 600],
        "model__max_depth": [None, 6, 10, 14, 20],
        "model__min_samples_leaf": [1, 2, 3, 4, 5, 7, 10],
        "model__min_samples_split": [2, 5, 10, 20],
        "model__max_features": ["sqrt", 0.3, 0.5, 0.7],
        "model__class_weight": [None, "balanced", "balanced_subsample"],
    },
}


def main():
    warnings.filterwarnings("ignore", category=FutureWarning, module="sklearn.svm")
    df = pd.read_csv(DATA_PATH, sep=";")
    y = (df[TARGET] == "yes").astype(int)
    X_train, _, y_train, _ = train_test_split(
        df.drop(columns=[TARGET]), y,
        test_size=0.2, random_state=42, stratify=y,
    )
    search_cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)
    threshold_cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=43)

    for name in ("svm", "random_forest"):
        print(f"\nRecherche approfondie {name}...", flush=True)
        pipeline = get_model_instances()[name]
        search = RandomizedSearchCV(
            pipeline, SEARCH_SPACES[name], n_iter=28, random_state=97,
            scoring={"f1": "f1", "ap": "average_precision"},
            refit=False, cv=search_cv, n_jobs=1, error_score="raise",
        )
        search.fit(X_train, y_train)
        results = search.cv_results_
        candidate_indices = []
        for metric in ("f1", "ap"):
            candidate_indices.extend(
                sorted(range(len(results["params"])),
                       key=lambda i: results[f"mean_test_{metric}"][i], reverse=True)[:3]
            )
        candidate_indices = list(dict.fromkeys(candidate_indices))
        print(f"{name}: {len(candidate_indices)} finalistes hors pli", flush=True)
        for index in candidate_indices:
            params = results["params"][index]
            candidate = clone(pipeline).set_params(**params)
            probabilities = cross_val_predict(
                candidate, X_train, y_train, cv=threshold_cv,
                method="predict_proba", n_jobs=1,
            )[:, 1]
            threshold, validation_f1 = best_f1_threshold(y_train, probabilities)
            print(
                f"{name} candidat {index}: F1={validation_f1:.4f}, "
                f"seuil={threshold:.4f}, AP={results['mean_test_ap'][index]:.4f}, "
                f"parametres={params}", flush=True,
            )


if __name__ == "__main__":
    main()
