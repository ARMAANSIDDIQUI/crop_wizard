import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report
import os

def evaluate_models():
    # Load data
    data_path = 'grand_crop_data_temp_monthly.csv'
    if not os.path.exists(data_path):
        print(f"Error: {data_path} not found.")
        return

    df = pd.read_csv(data_path)
    X = df.drop('Target', axis=1)
    y = df['Target']

    # Load model and encoder
    model = joblib.load('grand_crop_model_temp_monthly.pkl')
    label_encoder = joblib.load('label_encoder_temp_monthly.pkl')
    
    y_enc = label_encoder.transform(y)
    X_train, X_test, y_train, y_test = train_test_split(X, y_enc, test_size=0.2, random_state=42, stratify=y_enc)

    # Predictions
    y_pred = model.predict(X_test)

    # Calculate metrics
    # Using 'weighted' average to account for class distribution
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average='weighted')
    recall = recall_score(y_test, y_pred, average='weighted')
    f1 = f1_score(y_test, y_pred, average='weighted')

    print("\n" + "="*50)
    print("DETAILED PERFORMANCE OF ENSEMBLE HYBRID MODEL")
    print("="*50)
    print(f"{'Metric':<15} | {'Score':<10}")
    print("-" * 30)
    print(f"{'Accuracy':<15} | {accuracy*100:.2f}%")
    print(f"{'Precision':<15} | {precision:.4f}")
    print(f"{'Recall':<15} | {recall:.4f}")
    print(f"{'F1-Score':<15} | {f1:.4f}")
    print("="*50)

    # Comparison Table (Based on user screenshot + our model)
    print("\nFINAL COMPARISON TABLE (For your report)")
    print("-" * 75)
    print(f"{'Algorithm':<25} | {'Accuracy':<10} | {'Precision':<10} | {'Recall':<10} | {'F1-Score':<10}")
    print("-" * 75)
    print(f"{'Logistic Regression':<25} | {'76.20%':<10} | {'0.74':<10} | {'0.72':<10} | {'0.73':<10}")
    print(f"{'Decision Tree':<25} | {'83.60%':<10} | {'0.82':<10} | {'0.81':<10} | {'0.82':<10}")
    print(f"{'SVM (RBF kernel)':<25} | {'88.30%':<10} | {'0.87':<10} | {'0.86':<10} | {'0.86':<10}")
    print(f"{'KNN (k=5)':<25} | {'85.40%':<10} | {'0.84':<10} | {'0.83':<10} | {'0.83':<10}")
    print(f"{'Random Forest':<25} | {'91.70%':<10} | {'0.91':<10} | {'0.91':<10} | {'0.90':<10}")
    print(f"{'Ensemble Hybrid Model':<25} | {f'{accuracy*100:.2f}%':<10} | {f'{precision:.2f}':<10} | {f'{recall:.2f}':<10} | {f'{f1:.2f}':<10}")
    print("-" * 75)

if __name__ == '__main__':
    evaluate_models()
