import joblib
import pandas as pd
import numpy as np
import os

# --- CONFIGURATION ---
MODEL_FILENAME = "grand_crop_model.pkl"
ENCODER_FILENAME = "label_encoder.pkl"
# CSV_FILENAME = "new_test_values.csv"


# Test Cases (Seasonal Profiles)
test_cases = [
    {
        "name": "Apple Scenario (Cold Winter)",
        "input": {
            'N': 100, 'P': 40, 'K': 30, 'pH': 6.5, 'Moisture': 30, 'Soil_Type': 'Loamy', 'State': 'Himachal Pradesh',
            # Cold Jan/Feb/Dec, Moderate rain
            'Temp_Jan': 2, 'Temp_Feb': 5, 'Temp_Mar': 10, 'Temp_Apr': 15, 'Temp_May': 20, 'Temp_Jun': 25,
            'Temp_Jul': 25, 'Temp_Aug': 24, 'Temp_Sep': 20, 'Temp_Oct': 15, 'Temp_Nov': 10, 'Temp_Dec': 3,
            'Rain_Jan': 50, 'Rain_Feb': 50, 'Rain_Mar': 60, 'Rain_Apr': 40, 'Rain_May': 50, 'Rain_Jun': 100,
            'Rain_Jul': 150, 'Rain_Aug': 150, 'Rain_Sep': 100, 'Rain_Oct': 40, 'Rain_Nov': 30, 'Rain_Dec': 40,
            'Hum_Jan': 60, 'Hum_Feb': 60, 'Hum_Mar': 50, 'Hum_Apr': 40, 'Hum_May': 40, 'Hum_Jun': 60,
            'Hum_Jul': 80, 'Hum_Aug': 80, 'Hum_Sep': 70, 'Hum_Oct': 60, 'Hum_Nov': 60, 'Hum_Dec': 60
        },
        "expected": "Apple"
    },
    {
        "name": "Rice Scenario (Heavy Monsoon)",
        "input": {
            'N': 80, 'P': 40, 'K': 40, 'pH': 7.0, 'Moisture': 80, 'Soil_Type': 'Alluvial', 'State': 'West Bengal',
            # Warm, Very Wet Jun-Sep
            'Temp_Jan': 15, 'Temp_Feb': 20, 'Temp_Mar': 25, 'Temp_Apr': 30, 'Temp_May': 35, 'Temp_Jun': 30,
            'Temp_Jul': 30, 'Temp_Aug': 30, 'Temp_Sep': 28, 'Temp_Oct': 25, 'Temp_Nov': 20, 'Temp_Dec': 15,
            'Rain_Jan': 10, 'Rain_Feb': 10, 'Rain_Mar': 20, 'Rain_Apr': 40, 'Rain_May': 100, 'Rain_Jun': 300,
            'Rain_Jul': 400, 'Rain_Aug': 350, 'Rain_Sep': 250, 'Rain_Oct': 100, 'Rain_Nov': 20, 'Rain_Dec': 10,
            'Hum_Jan': 50, 'Hum_Feb': 50, 'Hum_Mar': 60, 'Hum_Apr': 70, 'Hum_May': 80, 'Hum_Jun': 90,
            'Hum_Jul': 95, 'Hum_Aug': 95, 'Hum_Sep': 90, 'Hum_Oct': 80, 'Hum_Nov': 60, 'Hum_Dec': 50
        },
        "expected": "Rice" # Or Jute/Coconut depending on similarity
    }
]

print(f"Loading model from {MODEL_FILENAME}...")
try:
    pipeline = joblib.load(MODEL_FILENAME)
    le = joblib.load(ENCODER_FILENAME)
    print("Model and Encoder loaded successfully.")
except FileNotFoundError as e:
    print(f"Error loading model: {e}")
    exit(1)

print("\n--- 🧪 Running Verification Tests ---")

for case in test_cases:
    input_df = pd.DataFrame([case['input']])
    
    # Predict
    try:
        # Pipeline expects columns in specific order or name matching?
        # ColumnTransformer uses names if configured, but sometimes order matters if strictly numpy.
        # Our pipeline uses names (ColumnTransformer matches by name).
        
        y_pred_enc = pipeline.predict(input_df)
        pred_label = le.inverse_transform(y_pred_enc)[0]
        
        status = "✅ PASS" if pred_label == case['expected'] else f"⚠️  WARN (Got {pred_label})"
        print(f"Test: {case['name']}")
        print(f"   Expected: {case['expected']}")
        print(f"   Predicted: {pred_label}")
        print(f"   Status: {status}")
        
        # Proba
        probs = pipeline.predict_proba(input_df)[0]
        top3_idx = np.argsort(probs)[-3:][::-1]
        print(f"   Top 3: {le.inverse_transform(top3_idx)} {probs[top3_idx]}")
        print("-" * 30)
        
    except Exception as e:
        print(f"❌ Error in {case['name']}: {e}")

