from pydantic import BaseModel, Field
from typing import List, Optional

class PredictRequest(BaseModel):
    algorithms: List[str]        # ex: ["svm", "random_forest", "mlp"]
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
    prediction_proba: Optional[float] = None
    decision_threshold: float
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    confusion_matrix: List[List[int]]   # [[TN, FP], [FN, TP]]

class PredictResponse(BaseModel):
    results: List[AlgoResult]
    comparison: bool             # true si >= 2 algos -> frontend affiche le comparatif
