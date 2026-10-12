# Cahier des charges — Simulateur ML (Bank Marketing)

## 0. Contexte

TP de Machine Learning : prédire si un client va souscrire à un produit bancaire
(colonne cible `y` : yes/no) à partir du dataset `bank.csv`, en utilisant et en
comparant 3 algorithmes de classification :

- **SVM** (Support Vector Machine)
- **Random Forest**
- **MLP** (Perceptron multicouche / réseau de neurones)

Objectif : construire une application web (Backend **FastAPI** + Frontend
**React**) reproduisant l'esprit de la maquette fournie ("Simulateur ML"),
mais adaptée aux colonnes du dataset bancaire, avec possibilité de sélectionner
1, 2 ou 3 algorithmes et d'afficher automatiquement un comparatif quand plus
d'un algorithme est choisi.

---

## 1. Dataset

Fichier : `bank.csv`, séparateur `;`, 4521 lignes.

| Colonne | Type | Description |
|---|---|---|
| age | numérique | âge du client |
| job | catégorielle | métier |
| marital | catégorielle | statut marital |
| education | catégorielle | niveau d'éducation |
| default | catégorielle (yes/no) | a un défaut de crédit |
| balance | numérique | solde moyen annuel |
| housing | catégorielle (yes/no) | a un prêt immobilier |
| loan | catégorielle (yes/no) | a un prêt personnel |
| contact | catégorielle | type de contact |
| day | numérique | jour du dernier contact |
| month | catégorielle | mois du dernier contact |
| duration | numérique | durée du dernier appel (secondes) |
| campaign | numérique | nombre de contacts pendant cette campagne |
| pdays | numérique | jours depuis dernier contact (-1 = jamais) |
| previous | numérique | nombre de contacts avant cette campagne |
| poutcome | catégorielle | résultat de la campagne précédente |
| **y** | **cible (yes/no)** | **le client a-t-il souscrit ?** |

---

## 2. Architecture générale

```
projet/
├── backend/
│   ├── data/
│   │   └── bank.csv
│   ├── app/
│   │   ├── main.py                # point d'entrée FastAPI
│   │   ├── preprocessing.py       # encodage + normalisation
│   │   ├── models.py              # définition/entraînement des 3 modèles
│   │   ├── train.py               # script d'entraînement offline
│   │   ├── schemas.py             # schémas Pydantic (requêtes/réponses)
│   │   └── artifacts/             # modèles + encoders + scaler sauvegardés (.joblib)
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── components/
    │   │   ├── AlgoSelector.jsx       # menu de sélection des algorithmes
    │   │   ├── FeatureForm.jsx        # formulaire des champs (job, age, education, ...)
    │   │   ├── ResultsPanel.jsx       # résultats par algorithme (prédiction, métriques, matrice)
    │   │   └── ComparisonPanel.jsx    # tableau + graphique comparatif (si >1 algo choisi)
    │   └── api/client.js              # appels HTTP vers le backend
    └── package.json
```

Flux général :
1. Au chargement, le frontend appelle `GET /api/meta` pour récupérer la liste des
   algorithmes disponibles et la structure du formulaire (colonnes + valeurs possibles).
2. L'utilisateur coche 1, 2 ou 3 algorithmes dans le menu.
3. L'utilisateur remplit le formulaire (job, marital, education, age, balance, ...).
4. Clic sur **"Simuler"** → `POST /api/predict` avec les features + la liste des
   algorithmes sélectionnés.
5. Le backend renvoie, pour chaque algorithme sélectionné : la prédiction, les
   métriques (accuracy, precision, recall, F1) calculées sur le jeu de test, et
   la matrice de confusion.
6. Le frontend affiche :
   - Un bloc de résultat par algorithme sélectionné.
   - **Si et seulement si** ≥ 2 algorithmes sont sélectionnés : un bloc de
     comparaison supplémentaire (tableau comparatif + graphique en barres),
     identique dans l'esprit au code Python déjà réalisé en TP.

---

## 3. Backend — FastAPI

### 3.1 Entraînement des modèles (offline, une seule fois)

Créer `backend/app/train.py`. Reprend exactement la logique déjà validée en TP
(Jupyter) :

```python
# backend/app/train.py
import pandas as pd
import joblib
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier
from sklearn.neural_network import MLPClassifier

ARTIFACTS_DIR = Path(__file__).parent / "artifacts"
ARTIFACTS_DIR.mkdir(exist_ok=True)

TARGET = "y"
CAT_COLS = ["job", "marital", "education", "default", "housing",
            "loan", "contact", "month", "poutcome"]
NUM_COLS = ["age", "balance", "day", "duration", "campaign", "pdays", "previous"]

def main():
    df = pd.read_csv(Path(__file__).parent.parent / "data" / "bank.csv", sep=";")

    # 1. Encodage des colonnes catégorielles (LabelEncoder, une colonne par variable)
    encoders = {}
    for col in CAT_COLS + [TARGET]:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col])
        encoders[col] = le

    X = df.drop(columns=[TARGET])
    y = df[TARGET]

    # 2. Normalisation
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # 3. Split train/test (le test set sert aussi à calculer les métriques
    #    affichées dans l'app)
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42, stratify=y
    )

    models = {
        "svm": SVC(kernel="rbf", C=1.0, gamma="scale", probability=True, random_state=42),
        "random_forest": RandomForestClassifier(n_estimators=100, random_state=42),
        "mlp": MLPClassifier(hidden_layer_sizes=(100,), max_iter=1000, random_state=42),
    }

    for name, model in models.items():
        model.fit(X_train, y_train)
        joblib.dump(model, ARTIFACTS_DIR / f"{name}.joblib")

    joblib.dump(scaler, ARTIFACTS_DIR / "scaler.joblib")
    joblib.dump(encoders, ARTIFACTS_DIR / "encoders.joblib")
    joblib.dump(list(X.columns), ARTIFACTS_DIR / "feature_order.joblib")
    joblib.dump((X_test, y_test), ARTIFACTS_DIR / "test_set.joblib")

    print("Entraînement terminé, artefacts sauvegardés dans", ARTIFACTS_DIR)

if __name__ == "__main__":
    main()
```

À exécuter une fois : `python -m app.train`. Les modèles, encoders, scaler et
le jeu de test sont sérialisés avec `joblib` pour être rechargés instantanément
par l'API (pas de ré-entraînement à chaque requête).

### 3.2 Schémas Pydantic

```python
# backend/app/schemas.py
from pydantic import BaseModel
from typing import List

class PredictRequest(BaseModel):
    algorithms: List[str]        # ex: ["svm", "random_forest"]
    age: int
    job: str
    marital: str
    education: str
    default: str                 # "yes" / "no"
    balance: int
    housing: str                 # "yes" / "no"
    loan: str                    # "yes" / "no"
    contact: str
    day: int
    month: str
    duration: int
    campaign: int
    pdays: int
    previous: int
    poutcome: str

class AlgoResult(BaseModel):
    algorithm: str
    prediction: str              # "yes" / "no"
    prediction_proba: float | None
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    confusion_matrix: List[List[int]]   # [[TN, FP], [FN, TP]]

class PredictResponse(BaseModel):
    results: List[AlgoResult]
    comparison: bool             # true si >= 2 algos → frontend affiche le comparatif
```

### 3.3 Endpoint principal

```python
# backend/app/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.metrics import (accuracy_score, precision_score,
                              recall_score, f1_score, confusion_matrix)

from .schemas import PredictRequest, PredictResponse, AlgoResult

app = FastAPI(title="Simulateur ML - Bank Marketing")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # à restreindre en production
    allow_methods=["*"],
    allow_headers=["*"],
)

ARTIFACTS_DIR = Path(__file__).parent / "artifacts"
ALGO_LABELS = {
    "svm": "SVM",
    "random_forest": "Random Forest",
    "mlp": "MLP (Perceptron multicouche)",
}

scaler = joblib.load(ARTIFACTS_DIR / "scaler.joblib")
encoders = joblib.load(ARTIFACTS_DIR / "encoders.joblib")
feature_order = joblib.load(ARTIFACTS_DIR / "feature_order.joblib")
X_test, y_test = joblib.load(ARTIFACTS_DIR / "test_set.joblib")

models = {name: joblib.load(ARTIFACTS_DIR / f"{name}.joblib") for name in ALGO_LABELS}

CAT_COLS = ["job", "marital", "education", "default", "housing",
            "loan", "contact", "month", "poutcome"]


@app.get("/api/meta")
def get_meta():
    """Renvoie la liste des algos et les valeurs possibles pour chaque champ
    catégoriel, afin que le frontend construise dynamiquement les menus."""
    return {
        "algorithms": [{"key": k, "label": v} for k, v in ALGO_LABELS.items()],
        "categorical_options": {
            col: list(encoders[col].classes_) for col in CAT_COLS
        },
        "numeric_fields": ["age", "balance", "day", "duration",
                            "campaign", "pdays", "previous"],
    }


def encode_input(payload: PredictRequest) -> np.ndarray:
    row = payload.dict(exclude={"algorithms"})
    df = pd.DataFrame([row])
    for col in CAT_COLS:
        le = encoders[col]
        if df.loc[0, col] not in le.classes_:
            raise HTTPException(400, f"Valeur inconnue pour '{col}': {df.loc[0, col]}")
        df[col] = le.transform(df[col])
    df = df[feature_order]
    return scaler.transform(df)


@app.post("/api/predict", response_model=PredictResponse)
def predict(payload: PredictRequest):
    if not payload.algorithms:
        raise HTTPException(400, "Aucun algorithme sélectionné")

    X_input = encode_input(payload)
    y_label_encoder = encoders["y"]

    results = []
    for algo_key in payload.algorithms:
        if algo_key not in models:
            raise HTTPException(400, f"Algorithme inconnu: {algo_key}")
        model = models[algo_key]

        # Prédiction sur la saisie utilisateur
        pred_encoded = model.predict(X_input)[0]
        pred_label = y_label_encoder.inverse_transform([pred_encoded])[0]
        proba = None
        if hasattr(model, "predict_proba"):
            proba = float(np.max(model.predict_proba(X_input)[0]))

        # Métriques calculées sur le jeu de test (fixe, préparé à l'entraînement)
        y_pred_test = model.predict(X_test)
        acc = accuracy_score(y_test, y_pred_test)
        prec = precision_score(y_test, y_pred_test)
        rec = recall_score(y_test, y_pred_test)
        f1 = f1_score(y_test, y_pred_test)
        cm = confusion_matrix(y_test, y_pred_test).tolist()

        results.append(AlgoResult(
            algorithm=ALGO_LABELS[algo_key],
            prediction=str(pred_label),
            prediction_proba=proba,
            accuracy=acc,
            precision=prec,
            recall=rec,
            f1_score=f1,
            confusion_matrix=cm,
        ))

    return PredictResponse(results=results, comparison=len(payload.algorithms) > 1)
```

### 3.4 `requirements.txt`

```
fastapi
uvicorn[standard]
scikit-learn
pandas
numpy
joblib
pydantic
```

Lancement : `uvicorn app.main:app --reload --port 8000`.

---

## 4. Frontend — React

### 4.1 Page (structure visuelle, inspirée de la maquette fournie)

1. **En-tête** : titre `Simulateur ML` + sous-titre
   `Prédiction de souscription bancaire par SVM / Random Forest / MLP`.
2. **Carte "Choix des algorithmes"** : un menu (checkboxes) listant les 3 algos
   (`SVM`, `Random Forest`, `MLP`), rempli dynamiquement via `GET /api/meta`.
   L'utilisateur peut cocher 1, 2 ou 3 cases.
3. **Carte "Caractéristiques en entrée"** : formulaire avec tous les champs du
   dataset (`age`, `job`, `marital`, `education`, `default`, `balance`,
   `housing`, `loan`, `contact`, `day`, `month`, `duration`, `campaign`,
   `pdays`, `previous`, `poutcome`). Les champs catégoriels sont des `<select>`
   remplis avec `categorical_options` renvoyé par `/api/meta`. Bouton
   "Charger des valeurs d'exemple" pour pré-remplir avec une ligne du dataset.
4. **Bouton "Simuler"** → appelle `POST /api/predict`.
5. **Résultats** :
   - Un bloc **par algorithme sélectionné** : prédiction (`yes`/`no`),
     probabilité, accuracy/precision/recall/F1, et la matrice de confusion
     (affichée en mini-heatmap ou tableau 2x2).
   - **Uniquement si `comparison === true`** (donc si ≥ 2 algos cochés) :
     un bloc supplémentaire "Comparaison des modèles" avec un tableau
     récapitulatif des 4 métriques par modèle + un graphique en barres
     (equivalent du graphique matplotlib du TP), et la mention du modèle
     ayant le meilleur F1-score.

### 4.2 Composants à générer

- `AlgoSelector.jsx` : checkboxes contrôlées, état `selectedAlgos: string[]`.
- `FeatureForm.jsx` : formulaire contrôlé, état `formValues`, généré
  dynamiquement à partir de `meta.categorical_options` et `meta.numeric_fields`.
- `ResultsPanel.jsx` : reçoit `results: AlgoResult[]`, affiche une carte par
  algorithme avec ses métriques et sa matrice de confusion.
- `ComparisonPanel.jsx` : reçoit `results` (si `comparison === true`), affiche
  un tableau + un graphique en barres (librairie `recharts` recommandée) et
  met en évidence le meilleur modèle selon le F1-score.
- `api/client.js` : fonctions `getMeta()` et `predict(payload)` (fetch vers
  `http://localhost:8000/api`).

### 4.3 Logique clé côté React (App.jsx, simplifié)

```jsx
const [meta, setMeta] = useState(null);
const [selectedAlgos, setSelectedAlgos] = useState([]);
const [formValues, setFormValues] = useState({});
const [response, setResponse] = useState(null);

useEffect(() => { getMeta().then(setMeta); }, []);

async function handleSimulate() {
  const payload = { algorithms: selectedAlgos, ...formValues };
  const res = await predict(payload);
  setResponse(res); // { results, comparison }
}

// Dans le rendu :
// <ResultsPanel results={response.results} />
// {response.comparison && <ComparisonPanel results={response.results} />}
```

Règle d'affichage à respecter strictement :
- `selectedAlgos.length === 1` → afficher seulement `ResultsPanel` (un seul bloc).
- `selectedAlgos.length >= 2` → afficher `ResultsPanel` (un bloc par algo) **puis**
  `ComparisonPanel` juste en dessous.
- `selectedAlgos.length === 0` → bouton "Simuler" désactivé.

---

## 5. Points d'attention pour Antigravity

- Reprendre exactement le prétraitement déjà validé en TP (LabelEncoder colonne
  par colonne + StandardScaler), pour rester cohérent avec le code Python
  Jupyter déjà produit.
- Les métriques affichées dans l'app doivent être calculées sur le **même jeu
  de test fixe** (`random_state=42`, `test_size=0.2`) que celui utilisé en TP,
  afin que les chiffres correspondent à ceux du rapport.
- Le MLP doit être entraîné avec `max_iter=1000` (au lieu de 500) pour éviter
  le `ConvergenceWarning` observé en TP.
- Gérer proprement les valeurs catégorielles inconnues envoyées par erreur par
  le frontend (retourner une erreur 400 explicite plutôt qu'un crash).
- Le champ `pdays` peut valoir `-1` (client jamais recontacté) : ne pas le
  bloquer côté validation.
- Prévoir un bouton "valeurs d'exemple" côté frontend qui charge une ligne
  réelle du dataset (peut être exposée via un futur endpoint `GET /api/sample`
  optionnel, ou codée en dur côté frontend).
- CORS activé côté FastAPI pour permettre les appels depuis le frontend React
  en développement (`localhost:5173` ou `localhost:3000`).
