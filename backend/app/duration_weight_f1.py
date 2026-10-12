"""Read-only SVM feature-weight experiment on the training split only."""

import warnings

import pandas as pd
from sklearn.base import clone
from sklearn.compose import ColumnTransformer
from sklearn.model_selection import StratifiedKFold, cross_val_predict, train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from .models import get_model_instances
from .preprocessing import CAT_COLS, NUM_COLS, TARGET
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
    for weight in (0.5, 1, 1.5, 2, 3, 4):
        preprocess = ColumnTransformer(
            [
                ("categorical", OneHotEncoder(handle_unknown="ignore"), CAT_COLS),
                ("numeric", StandardScaler(), [c for c in NUM_COLS if c != "duration"]),
                ("duration", StandardScaler(), ["duration"]),
            ],
            transformer_weights={"duration": weight},
        )
        model = clone(get_model_instances()["svm"]).set_params(
            preprocess=preprocess, model__C=1, model__gamma="scale",
            model__class_weight="balanced",
        )
        probabilities = cross_val_predict(
            model, X_train, y_train, cv=cv, method="predict_proba", n_jobs=1,
        )[:, 1]
        threshold, score = best_f1_threshold(y_train, probabilities)
        print(f"poids_duration={weight}: F1={score:.4f}, seuil={threshold:.4f}", flush=True)


if __name__ == "__main__":
    main()
