import pandas as pd
import numpy as np
import joblib
import xgboost as xgb
from catboost import CatBoostClassifier
from sklearn.ensemble import VotingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import LabelEncoder, StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, precision_score
import os

# --- CONFIGURATION ---
CSV_FILENAME = "grand_crop_data_temp_monthly.csv"
MODEL_FILENAME = "grand_crop_model_temp_monthly.pkl"
ENCODER_FILENAME = "label_encoder_temp_monthly.pkl"

def main():
    print(f"Loading data from {CSV_FILENAME}...")

    if not os.path.exists(CSV_FILENAME):
        print(f"Error: {CSV_FILENAME} not found.")
        return

    df = pd.read_csv(CSV_FILENAME)
    print(f"Data Loaded. Shape: {df.shape}")

    # --- PREPARE DATA ---
    if 'Target' not in df.columns:
        print("Error: 'Target' column not found.")
        return

    X = df.drop(['Target'], axis=1)
    y = df['Target']

    # Encode Targets
    le = LabelEncoder()
    y_enc = le.fit_transform(y)
    class_names = le.classes_

    # Split
    print("Splitting data (80% Train, 20% Test)...")
    X_train, X_test, y_train, y_test = train_test_split(X, y_enc, test_size=0.2, random_state=42, stratify=y_enc)

    # --- DEFINE PIPELINE ---
    cat_cols = X.select_dtypes(include=['object']).columns.tolist()
    num_cols = X.select_dtypes(include=['int64', 'float64']).columns.tolist()

    print(f"Categorical Columns: {cat_cols}")
    print(f"Numerical Columns: {len(num_cols)} columns")

    preprocessor = ColumnTransformer([
        ('num', StandardScaler(), num_cols),
        ('cat', OneHotEncoder(handle_unknown='ignore'), cat_cols)
    ])

    # Ensemble Models
    # CatBoost - Balanced regularization
    clf_cat = CatBoostClassifier(
        iterations=250, 
        learning_rate=0.04, 
        depth=5,             
        l2_leaf_reg=15,      
        subsample=0.7,       
        bootstrap_type='Bernoulli', 
        verbose=0, 
        random_state=42, 
        allow_writing_files=False
    )
    
    # XGBoost - Balanced regularization
    clf_xgb = xgb.XGBClassifier(
        n_estimators=250, 
        learning_rate=0.04, 
        max_depth=5,         
        reg_lambda=15,       
        reg_alpha=8,         
        subsample=0.7,       
        colsample_bytree=0.7,
        random_state=42, 
        eval_metric='mlogloss'
    )
    
    # Random Forest - Balanced pruning
    clf_rf = RandomForestClassifier(
        n_estimators=250, 
        max_depth=12,        
        min_samples_leaf=10, 
        min_samples_split=20,
        max_features='sqrt',
        random_state=42
    )

    voting_clf = VotingClassifier(
        estimators=[
            ('cat', clf_cat),
            ('xgb', clf_xgb),
            ('rf', clf_rf)
        ],
        voting='soft'
    )

    pipeline = Pipeline([
        ('prep', preprocessor),
        ('model', voting_clf)
    ])

    # --- CROSS-VALIDATION ---
    print("\nPerforming 5-Fold Cross-Validation (Robustness Check)...")
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(pipeline, X_train, y_train, cv=cv, scoring='accuracy')
    
    print(f"CV Mean Accuracy: {cv_scores.mean()*100:.2f}% (+/- {cv_scores.std()*200:.2f}%)")

    # --- TRAIN & EVALUATE ---
    print("\nTraining Final Ensemble Model...")
    pipeline.fit(X_train, y_train)

    print("Evaluating on Test Set...")
    y_pred = pipeline.predict(X_test)
    test_acc = accuracy_score(y_test, y_pred)
    
    y_train_pred = pipeline.predict(X_train)
    train_acc = accuracy_score(y_train, y_train_pred)

    print(f"\n--- RESULTS ---")
    print(f"Train Accuracy: {train_acc*100:.2f}%")
    print(f"Test Accuracy:  {test_acc*100:.2f}%")
    print(f"CV Mean:        {cv_scores.mean()*100:.2f}%")
    
    # Check for overfitting
    if train_acc - test_acc > 0.08:
        print("WARNING: Model is overfitting. Test accuracy significantly lower than training.")
    elif test_acc - cv_scores.mean() > 0.05:
         print("WARNING: Potential data leakage or optimistic split.")
    else:
        print("STATUS: Model generalizes well and is robust.")
        
    print("\nGenerating evaluation metric images...")
    
    # Accuracy Plot
    plt.figure(figsize=(8, 6))
    sns.barplot(x=['Train Accuracy', 'Test Accuracy'], y=[train_acc, test_acc], palette=['skyblue', 'lightgreen'])
    plt.title('Model Accuracy')
    plt.ylabel('Accuracy Score')
    plt.ylim(0, 1.1)
    for i, v in enumerate([train_acc, test_acc]):
        plt.text(i, v + 0.02, f"{v*100:.2f}%", ha='center', va='bottom', fontweight='bold')
    plt.savefig('accuracy_metrics.png')
    plt.close()
    
    # Precision Matrix / Confusion Matrix
    cm = confusion_matrix(y_test, y_pred)
    # Calculate precision for each class
    # To plot precision matrix we use row-normalized CM (precision = true pos / predicted pos)
    # Actually, calculating precision score and plotting it makes more sense, or just plotting cm
    plt.figure(figsize=(12, 10))
    sns.heatmap(cm, annot=False, cmap='Blues', xticklabels=class_names, yticklabels=class_names, linewidths=1, linecolor='black')
    plt.title('Confusion Matrix')
    plt.xlabel('Predicted Label')
    plt.ylabel('True Label')
    plt.xticks(rotation=90)
    plt.yticks(rotation=0)
    plt.tight_layout()
    plt.savefig('precision_matrix.png')
    plt.close()

    # Save
    print(f"\nSaving model to {MODEL_FILENAME}...")
    joblib.dump(pipeline, MODEL_FILENAME)
    joblib.dump(le, ENCODER_FILENAME)
    print("Model saved successfully.")

if __name__ == "__main__":
    main()
