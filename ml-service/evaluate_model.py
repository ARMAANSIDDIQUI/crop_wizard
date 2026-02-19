import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import os

# --- CONFIGURATION ---
CSV_FILENAME = "grand_crop_data_monthly.csv"
MODEL_FILENAME = "grand_crop_model.pkl"
ENCODER_FILENAME = "label_encoder.pkl"

def main():
    print(f"Loading data from {CSV_FILENAME}...")
    if not os.path.exists(CSV_FILENAME):
        print(f"Error: {CSV_FILENAME} not found.")
        return

    df = pd.read_csv(CSV_FILENAME)
    print(f"Data Loaded. Shape: {df.shape}")

    if 'Target' not in df.columns:
        print("Error: 'Target' column not found.")
        return

    X = df.drop(['Target'], axis=1)
    y = df['Target']

    # Load Encoder
    if not os.path.exists(ENCODER_FILENAME):
        print(f"Error: {ENCODER_FILENAME} not found. Train the model first.")
        return
    
    print(f"Loading encoder from {ENCODER_FILENAME}...")
    le = joblib.load(ENCODER_FILENAME)
    y_enc = le.transform(y)

    # Split (Same seed as training to reproduce test set)
    print("Splitting data (80% Train, 20% Test)...")
    X_train, X_test, y_train, y_test = train_test_split(X, y_enc, test_size=0.2, random_state=42, stratify=y_enc)

    # Load Model
    if not os.path.exists(MODEL_FILENAME):
        print(f"Error: {MODEL_FILENAME} not found. Train the model first.")
        return

    print(f"Loading model from {MODEL_FILENAME}...")
    pipeline = joblib.load(MODEL_FILENAME)

    # Evaluate
    print("Evaluating on Test Set...")
    y_pred = pipeline.predict(X_test)
    test_acc = accuracy_score(y_test, y_pred)

    print(f"\n--- RESULTS ---")
    print(f"Test Accuracy:  {test_acc*100:.2f}%")
    
    print("\nClassification Report:")
    report = classification_report(y_test, y_pred, target_names=le.classes_, output_dict=True)
    print(classification_report(y_test, y_pred, target_names=le.classes_))

    # --- Generate Precision Matrix (Confusion Matrix) ---
    import matplotlib.pyplot as plt
    from sklearn.metrics import confusion_matrix
    import seaborn as sns

    print("\nGenering Confusion Matrix...")
    cm = confusion_matrix(y_test, y_pred)
    
    plt.figure(figsize=(14, 12))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=le.classes_, yticklabels=le.classes_)
    plt.xlabel('Predicted')
    plt.ylabel('Actual')
    plt.title(f'Confusion Matrix\nAccuracy: {test_acc*100:.2f}%', fontsize=16)
    plt.xticks(rotation=45, ha='right')
    plt.tight_layout()
    plt.savefig('confusion_matrix.png')
    print("Confusion matrix saved as 'confusion_matrix.png'")

if __name__ == "__main__":
    main()
