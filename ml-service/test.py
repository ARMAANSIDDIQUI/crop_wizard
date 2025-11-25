import joblib
import pandas as pd
import os

# --- CONFIGURATION ---
# MODEL_FILENAME = "grand_crop_model_gaussian_bell_curve.pkl"
# ENCODER_FILENAME = "label_encodergrand_gaussian_bell_curve.pkl"
# CSV_FILENAME = "new_test_values.csv"


MODEL_FILENAME = "grand_crop_model_without_state_soil.pkl"
ENCODER_FILENAME = "label_encoder_without_state_soil.pkl"
CSV_FILENAME = "new_test_values.csv"
# --- SCRIPT ---

# Check if required files exist
if not os.path.exists(CSV_FILENAME):
    print(f"\n❌ Error: Test file '{CSV_FILENAME}' not found.")
    print("   Please make sure the CSV file is in the same directory as this script.")
    exit()

if not os.path.exists(MODEL_FILENAME) or not os.path.exists(ENCODER_FILENAME):
    print(f"\n❌ Error: Model or encoder file not found.")
    print(f"   Expected files: '{MODEL_FILENAME}', '{ENCODER_FILENAME}'")
    print("   Please make sure both files are in the same directory as this script.")
    exit()

# Load the model pipeline and label encoder
try:
    pipeline = joblib.load(MODEL_FILENAME)
    le = joblib.load(ENCODER_FILENAME)
except Exception as e:
    print(f"\n❌ Error loading model files: {e}")
    exit()

# Load the test data
try:
    test_df = pd.read_csv(CSV_FILENAME)
    # Ensure required columns are present
    required_cols = {'N', 'P', 'K', 'pH', 'Moisture', 'Temperature', 'Rainfall', 'Humidity', 'Soil_Type', 'State', 'Target'}
    if not required_cols.issubset(test_df.columns):
        print(f"\n❌ Error: CSV file must contain the following columns: {required_cols}")
        exit()
except Exception as e:
    print(f"\n❌ Error reading CSV file: {e}")
    exit()

# Prepare input features for prediction
features = ['N', 'P', 'K', 'pH', 'Moisture', 'Temperature', 'Rainfall', 'Humidity', 'Soil_Type', 'State']
X_test = test_df[features]

# Make predictions using the pipeline
try:
    y_pred_encoded = pipeline.predict(X_test)
    y_pred = le.inverse_transform(y_pred_encoded)
except Exception as e:
    print(f"\n❌ Error during prediction: {e}")
    exit()

# Collect results
results = []
for idx, (expected, predicted) in enumerate(zip(test_df['Target'], y_pred)):
    results.append({
        "id": idx + 1,
        "expected": expected,
        "predicted": predicted,
        "status": "✅ Correct" if expected == predicted else "❌ Incorrect"
    })

# --- DISPLAY RESULTS ---
print("\n--- 📊 Batch Prediction Results ---")

if results:
    header = f"| {'ID':<3} | {'Expected Crop':<15} | {'Predicted Crop':<15} | {'Result':<12} |"
    separator = "-" * len(header)
    print(separator)
    print(header)
    print(separator)

    for res in results:
        print(f"| {res['id']:<3} | {res['expected']:<15} | {res['predicted']:<15} | {res['status']:<12} |")

    print(separator)

    correct_predictions = sum(1 for res in results if res['status'] == "✅ Correct")
    total_predictions = len(results)
    accuracy = (correct_predictions / total_predictions) * 100 if total_predictions > 0 else 0
    print(f"\nSummary: {correct_predictions} out of {total_predictions} correct ({accuracy:.2f}% Accuracy)")

else:
    print("No results to display. The test may have been interrupted.")
