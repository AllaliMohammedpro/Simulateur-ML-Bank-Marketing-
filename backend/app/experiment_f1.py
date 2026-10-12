"""Read-only F1 experiments on the training split (never opens the test set).

Run from backend/: python -m app.experiment_f1
"""

import warnings

import pandas as pd
from sklearn.base import clone
from sklearn.model_selection import StratifiedKFold, cross_val_predict, train_test_split
from sklearn.preprocessing import OrdinalEncoder, PowerTransformer, RobustScaler

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
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=43)
    originals = get_model_instances()
    experiments = [
        ("svm_standard", "svm", {
            "model__C": 1, "model__gamma": "scale", "model__class_weight": "balanced",
        }),
        ("svm_robust", "svm", {
            "model__C": 1, "model__gamma": "scale", "model__class_weight": "balanced",
            "preprocess__numeric": RobustScaler(),
        }),
        ("svm_power", "svm", {
            "model__C": 1, "model__gamma": "scale", "model__class_weight": "balanced",
            "preprocess__numeric": PowerTransformer(),
        }),
        ("rf_onehot", "random_forest", {
            "model__n_estimators": 400, "model__min_samples_leaf": 5,
            "model__max_features": 0.5, "model__max_depth": None,
            "model__class_weight": "balanced_subsample",
        }),
        ("rf_ordinal", "random_forest", {
            "model__n_estimators": 400, "model__min_samples_leaf": 5,
            "model__max_features": 0.5, "model__max_depth": None,
            "model__class_weight": "balanced_subsample",
            "preprocess__categorical": OrdinalEncoder(
                handle_unknown="use_encoded_value", unknown_value=-1,
            ),
        }),
        ("mlp_standard", "mlp", {
            "model__hidden_layer_sizes": (64, 32), "model__alpha": 0.0001,
            "model__learning_rate_init": 0.001,
        }),
        ("mlp_power", "mlp", {
            "model__hidden_layer_sizes": (64, 32), "model__alpha": 0.0001,
            "model__learning_rate_init": 0.001,
            "preprocess__numeric": PowerTransformer(),
        }),
    ]
    for label, name, parameters in experiments:
        print(f"{label}: calcul en cours...", flush=True)
        model = clone(originals[name]).set_params(**parameters)
        probabilities = cross_val_predict(
            model, X_train, y_train, cv=cv, method="predict_proba", n_jobs=1,
        )[:, 1]
        threshold, f1 = best_f1_threshold(y_train, probabilities)
        print(f"{label}: F1 validation={f1:.4f}, seuil={threshold:.4f}", flush=True)


if __name__ == "__main__":
    main()
