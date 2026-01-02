import pandas as pd
import numpy as np

import joblib
import xgboost as xgb
from catboost import CatBoostClassifier
from sklearn.ensemble import VotingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder, StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.metrics import accuracy_score, confusion_matrix, ConfusionMatrixDisplay, classification_report
from sklearn.pipeline import Pipeline
import os

# --- CONFIGURATION ---
CSV_FILENAME = "grand_crop_data_noisy.csv"
MODEL_FILENAME = "grand_crop_model.pkl"
ENCODER_FILENAME = "label_encoder.pkl"

print(f"Loading data from {CSV_FILENAME}...")

# --- 1. LOAD DATA ---
if not os.path.exists(CSV_FILENAME):
    print(f"Error: {CSV_FILENAME} not found in the current directory.")
    print("   Please ensure the CSV file is in the same folder as this script.")
    exit()

df = pd.read_csv(CSV_FILENAME)
print(f"Data Loaded. Shape: {df.shape}")

# --- 2. PREPARE DATA ---
# Ensure your CSV has a 'Target' column (Crop Name)
if 'Target' not in df.columns:
    print("Error: 'Target' column not found in CSV.")
    exit()

X = df.drop(['Target'], axis=1)
y = df['Target']

# Encode Targets
le = LabelEncoder()
y_enc = le.fit_transform(y)
class_names = le.classes_

# Split (Standard 80/20)
print("\nTraining High-Accuracy Ensemble (CatBoost + XGBoost + Ridge + Lasso + RF)...")
X_train, X_test, y_train, y_test = train_test_split(X, y_enc, test_size=0.2, random_state=42, stratify=y_enc)

# --- 3. DEFINE PIPELINE ---
# Identifies Categorical vs Numerical columns automatically based on the input CSV
cat_cols = X.select_dtypes(include=['object']).columns.tolist()
num_cols = X.select_dtypes(include=['int64', 'float64']).columns.tolist()

print(f"   Categorical Columns: {cat_cols}")
print(f"   Numerical Columns: {num_cols}")

preprocessor = ColumnTransformer([
    ('num', StandardScaler(), num_cols),
    ('cat', OneHotEncoder(handle_unknown='ignore'), cat_cols)
])

# Models: CatBoost + XGBoost + Ridge + Lasso + Random Forest
# Regularization & Bagging added to reduce overfitting
# Reduced iterations/estimators for faster diagnostic run
clf_cat = CatBoostClassifier(iterations=200, learning_rate=0.05, depth=6, verbose=0, random_state=42)
clf_xgb = xgb.XGBClassifier(n_estimators=100, learning_rate=0.05, max_depth=6, random_state=42)
clf_ridge = LogisticRegression(penalty='l2', max_iter=1000, random_state=42, solver='lbfgs')  # Ridge
clf_lasso = LogisticRegression(penalty='l1', max_iter=1000, random_state=42, solver='liblinear') # Lasso
clf_rf = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42) # Bagging

voting_clf = VotingClassifier(
    estimators=[
        ('cat', clf_cat),
        ('xgb', clf_xgb),
        ('ridge', clf_ridge),
        ('lasso', clf_lasso),
        ('rf', clf_rf)
    ],
    voting='soft'
)

pipeline = Pipeline([
    ('prep', preprocessor),
    ('model', voting_clf)
])

# --- 4. TRAIN & VALIDATE ---
# Cross-Validation to check for Overfitting
print("\nRunning 3-Fold Cross-Validation (this may take a moment)...")
cv_scores = cross_val_score(pipeline, X_train, y_train, cv=3, scoring='accuracy')

print(f"   Cross-Validation Scores: {cv_scores}")
print(f"   Mean CV Accuracy: {cv_scores.mean()*100:.2f}% (+/- {cv_scores.std()*100:.2f}%)")

pipeline.fit(X_train, y_train)

# --- 5. EVALUATE ---
y_pred = pipeline.predict(X_test)
train_pred = pipeline.predict(X_train)

train_acc = accuracy_score(y_train, train_pred)
test_acc = accuracy_score(y_test, y_pred)

print(f"\n--- OVERFITTING CHECK ---")
print(f"Train Accuracy: {train_acc*100:.2f}%")
print(f"Test Accuracy:  {test_acc*100:.2f}%")
if train_acc - test_acc > 0.05:
    print("WARNING: Possible Overfitting detected (Train > Test by > 5%)")
else:
    print("STATUS: Model generalizes well.")

print(f"\nFINAL TEST ACCURACY: {test_acc*100:.2f}%")

# Classification Report
print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=class_names))

# Visualize Results
# cm = confusion_matrix(y_test, y_pred)
# disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=class_names)
# fig, ax = plt.subplots(figsize=(12, 10))
# disp.plot(cmap="viridis", xticks_rotation=90, ax=ax)
# plt.title(f"Model Performance\nAccuracy: {test_acc:.4f}")
# plt.tight_layout()
# plt.savefig('confusion_matrix.png')
# plt.show()

# --- 6. SAVE FILES LOCALLY ---
joblib.dump(pipeline, MODEL_FILENAME)
joblib.dump(le, ENCODER_FILENAME)

print(f"\nTraining Complete. Files saved locally:")
print(f"   - {MODEL_FILENAME}")
print(f"   - {ENCODER_FILENAME}")