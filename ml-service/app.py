from flask import Flask, request, jsonify
import joblib
import numpy as np
import pandas as pd
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

try:
    model = joblib.load('grand_crop_model.pkl')
    label_encoder = joblib.load('label_encoder.pkl')
except FileNotFoundError as e:
    print(f"Error loading model or label encoder: {e}")
    model = None
    label_encoder = None

@app.route('/predict', methods=['POST'])
def predict():
    if not model or not label_encoder:
        return jsonify({'error': 'Model or label encoder not loaded properly.'}), 500

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

        # The pipeline expects a DataFrame.
        prediction_index = model.predict(feature_df)
        
        # Decode the prediction to the original label
        crop_name = label_encoder.inverse_transform(prediction_index)
        
        return jsonify({'crop': crop_name[0]})

    except Exception as e:
        print(f"Prediction error: {e}")
        # Return a more specific error message if possible
        return jsonify({'error': f'An error occurred during prediction: {str(e)}'}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5001)