import os
import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

DATASETS = {
    "anemia": "datasets/anemia.csv",
    "diabetes": "datasets/diabetes.csv",
    "heart": "datasets/heart.csv",
    "kidney": "datasets/kidney.csv",
}

os.makedirs("models", exist_ok=True)


def clean_columns(df):
    df.columns = df.columns.str.strip()
    return df


def preprocess_general(df):
    df = clean_columns(df)
    df = df.replace("?", pd.NA)
    df = df.dropna(how="all")

    for col in df.columns:
        df[col] = df[col].astype(str).str.strip()

    for col in df.columns:
        numeric_col = pd.to_numeric(df[col], errors="coerce")

        if numeric_col.notna().sum() > 0:
            df[col] = numeric_col
        else:
            encoder = LabelEncoder()
            df[col] = encoder.fit_transform(df[col].astype(str))

    df = df.fillna(df.median(numeric_only=True))

    for col in df.columns:
        if df[col].dtype == "object":
            encoder = LabelEncoder()
            df[col] = encoder.fit_transform(df[col].astype(str))

    return df


def prepare_anemia(df):
    df = clean_columns(df)

    # Remove description row and empty rows
    df = df[pd.to_numeric(df["Age"], errors="coerce").notna()]
    df = df.dropna(how="all")

    for col in df.columns:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    df = df.fillna(df.median(numeric_only=True))

    # 0 = male, 1 = female
    # Anemia rule using hemoglobin level
    df["anemia_target"] = df.apply(
        lambda row: 1
        if (
            (row["Sex"] == 0 and row["HGB"] < 13.0)
            or (row["Sex"] == 1 and row["HGB"] < 12.0)
        )
        else 0,
        axis=1,
    )

    df = df.drop(columns=["S. No."], errors="ignore")

    return df


def train(name, path):
    print(f"\nTraining {name}...")

    df = pd.read_csv(path, low_memory=False)

    if name == "anemia":
        df = prepare_anemia(df)
        target = "anemia_target"
    else:
        df = preprocess_general(df)
        target = df.columns[-1]

    print(name, "rows after preprocessing:", df.shape[0])
    print(name, "columns after preprocessing:", df.shape[1])
    print(name, "target column:", target)

    if df.shape[0] == 0:
        print(f"{name} dataset has 0 rows. Skipping.")
        return

    X = df.drop(target, axis=1)
    y = df[target]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
    )

    model = RandomForestClassifier(
        n_estimators=150,
        random_state=42,
    )

    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)

    joblib.dump(model, f"models/{name}_model.pkl")
    joblib.dump(list(X.columns), f"models/{name}_features.pkl")

    print(f"{name} accuracy: {accuracy:.2f}")
    print(f"{name} model saved successfully.")


for name, path in DATASETS.items():
    train(name, path)

print("\nAll models trained successfully.")