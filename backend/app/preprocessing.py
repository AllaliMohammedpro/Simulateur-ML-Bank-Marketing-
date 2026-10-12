import pandas as pd
from fastapi import HTTPException

TARGET = "y"
CAT_COLS = ["job", "marital", "education", "default", "housing",
            "loan", "contact", "month", "poutcome"]
NUM_COLS = ["age", "balance", "day", "duration", "campaign", "pdays", "previous"]

def encode_input(row_dict: dict, categorical_options: dict, feature_order: list) -> pd.DataFrame:
    """Validate a request and preserve raw values for the fitted model pipeline."""
    df = pd.DataFrame([row_dict])
    for col in CAT_COLS:
        val = df.loc[0, col]
        if val not in categorical_options[col]:
            raise HTTPException(
                status_code=400,
                detail=f"Valeur inconnue pour '{col}': '{val}'. Valeurs possibles: {categorical_options[col]}"
            )
    return df[feature_order]
