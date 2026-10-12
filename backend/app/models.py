"""Model pipelines and bounded search spaces for the three TP algorithms."""

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.svm import SVC

from .preprocessing import CAT_COLS, NUM_COLS


ALGO_LABELS = {
    "svm": "SVM",
    "random_forest": "Random Forest",
    "mlp": "MLP (Perceptron multicouche)",
}


def get_model_instances():
    """Keep preprocessing inside each pipeline so CV folds cannot leak data."""
    scaled = ColumnTransformer([
        ("categorical", OneHotEncoder(handle_unknown="ignore"), CAT_COLS),
        ("numeric", StandardScaler(), NUM_COLS),
    ])
    unscaled = ColumnTransformer([
        ("categorical", OneHotEncoder(handle_unknown="ignore"), CAT_COLS),
        ("numeric", "passthrough", NUM_COLS),
    ])
    return {
        "svm": Pipeline([
            ("preprocess", scaled),
            ("model", SVC(kernel="rbf", probability=True, random_state=42)),
        ]),
        "random_forest": Pipeline([
            ("preprocess", unscaled),
            ("model", RandomForestClassifier(random_state=42, n_jobs=1)),
        ]),
        "mlp": Pipeline([
            ("preprocess", scaled),
            ("model", MLPClassifier(
                max_iter=600, early_stopping=True, n_iter_no_change=20,
                random_state=42,
            )),
        ]),
    }


def get_search_spaces():
    """Small, reproducible searches that can run on a student's computer."""
    return {
        "svm": {
            "model__C": [0.1, 1, 3, 10, 30],
            "model__gamma": ["scale", 0.001, 0.01, 0.1],
            "model__class_weight": [None, "balanced"],
        },
        "random_forest": {
            "model__n_estimators": [200, 400],
            "model__max_depth": [None, 8, 16],
            "model__min_samples_leaf": [1, 3, 5],
            "model__max_features": ["sqrt", 0.5],
            "model__class_weight": [None, "balanced_subsample"],
        },
        "mlp": {
            "model__hidden_layer_sizes": [(32,), (64,), (64, 32)],
            "model__alpha": [0.0001, 0.001, 0.01],
            "model__learning_rate_init": [0.0003, 0.001],
        },
    }
