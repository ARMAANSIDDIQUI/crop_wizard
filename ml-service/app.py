from flask import Flask, request, jsonify
import joblib
import numpy as np
import pandas as pd
from flask_cors import CORS

import os
import traceback

app = Flask(__name__)
CORS(app)

model = None
label_encoder = None

def load_models():
    global model, label_encoder
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        print(f"DEBUG: Base directory: {base_dir}")
        
        model_path = os.path.join(base_dir, 'grand_crop_model.pkl')
        label_encoder_path = os.path.join(base_dir, 'label_encoder.pkl')
        
        print(f"DEBUG: Loading model from: {model_path}")
        print(f"DEBUG: Loading label encoder from: {label_encoder_path}")
        
        model = joblib.load(model_path)
        label_encoder = joblib.load(label_encoder_path)
        print("DEBUG: Models loaded successfully.")
        return True, None
    except Exception as e:
        error_msg = f"Error loading model or label encoder: {e}\n{traceback.format_exc()}"
        print(error_msg)
        return False, str(e)

# Initial load attempt
load_models()

@app.route('/predict', methods=['POST'])
def predict():
    global model, label_encoder
    
    if not model or not label_encoder:
        print("DEBUG: Models not found, attempting to reload...")
        success, error = load_models()
        if not success:
            return jsonify({'error': f'Model loading failed: {error}'}), 500

    try:
        data = request.get_json()
        
        # The model expects columns in this order:
        # 'N', 'P', 'K', 'pH', 'Moisture', 'Temperature', 'Rainfall', 'Humidity', 'Soil_Type', 'State'
        
        # Create a DataFrame from the input data with the correct column names and order
        feature_df = pd.DataFrame({
            'N': [float(data['nitrogen'])],
            'P': [float(data['phosphorus'])],
            'K': [float(data['potassium'])],
            'pH': [float(data['ph'])],
            'Moisture': [float(data['moisture'])],
            'Temperature': [float(data['temperature'])],
            'Rainfall': [float(data['rainfall'])],
            'Humidity': [float(data['humidity'])],
            'Soil_Type': [data['soil_type']],
            'State': [data['state']]
        })

        # Use predict_proba to get the probabilities for each crop
        prediction_probabilities = model.predict_proba(feature_df)
        
        # Get the top 3 predictions
        # argsort sorts the probabilities in ascending order, so we take the last 3 indices
        top3_indices = np.argsort(prediction_probabilities[0])[-3:][::-1]
        
        # Get the corresponding probabilities and crop names
        top3_probabilities = prediction_probabilities[0][top3_indices]
        top3_crop_names = label_encoder.inverse_transform(top3_indices)
        
        # Format the response
        predictions = []
        for i in range(3):
            predictions.append({
                'crop': top3_crop_names[i],
                'probability': round(top3_probabilities[i] * 100, 2)
            })
            
        return jsonify(predictions)

    except Exception as e:
        print(f"Prediction error: {e}")
        # Return a more specific error message if possible
        return jsonify({'error': f'An error occurred during prediction: {str(e)}'}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5001)