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
        
        model_path = os.path.join(base_dir, 'grand_crop_model_temp_monthly.pkl')
        label_encoder_path = os.path.join(base_dir, 'label_encoder_temp_monthly.pkl')
        
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

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'message': 'CropWizard ML Service is running',
        'endpoints': {
            '/predict': 'POST - Get crop recommendations',
            '/': 'GET - Health check'
        }
    })

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
        
        # The model expects monthly columns: Temp_Jan...Dec, Rain_Jan...Dec, Hum_Jan...Dec
        # followed by Soil_Type, State
        
        input_data = {}
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        
        # Helper to process monthly inputs (expecting lists of 12)
        def process_monthly(key, prefix):
            values = data.get(key)
            if not isinstance(values, list) or len(values) != 12:
                # Fallback: if scalar, repeat for all months (or error handle)
                # print(f"Warning: {key} is not a list of 12. Using as scalar/average.")
                val = float(values) if values else 0.0
                return {f'{prefix}_{m}': val for m in months}
            return {f'{prefix}_{m}': float(v) for m, v in zip(months, values)}

        # 1. Standard Inputs
        input_data['N'] = float(data['nitrogen'])
        input_data['P'] = float(data['phosphorus'])
        input_data['K'] = float(data['potassium'])
        input_data['pH'] = float(data['ph'])
        input_data['Humidity'] = float(data['humidity'])
        input_data['Rainfall'] = float(data['rainfall'])
        
        # 2. Monthly Inputs (Only Temperature now)
        input_data.update(process_monthly('temperature', 'Temp'))

        # 3. Categorical Inputs
        input_data['Soil_Type'] = data.get('soil_type', 'Alluvial') # Default to Alluvial if missing

        # Determine column order dynamically or hardcode if strict
        # Model pipeline usually handles dict->df conversion if cols match, 
        # but to be safe we should match the training DF order if possible.
        # However, the pipeline uses column transformers which leverage column names.
        
        feature_df = pd.DataFrame([input_data])

        # Use predict_proba to get the probabilities for each crop
        prediction_probabilities = model.predict_proba(feature_df)
        
        # Get the top 3 predictions
        # argsort sorts the probabilities in ascending order, so we take the last 3 indices
        top3_indices = np.argsort(prediction_probabilities[0])[-3:][::-1]
        
        # Get the corresponding probabilities and crop names
        top3_probabilities = prediction_probabilities[0][top3_indices]
        top3_crop_names = label_encoder.inverse_transform(top3_indices)
        
        
        # Crop Information Dictionary - Updated with English seasons
        CROP_INFO = {
            'Rice': {'type': 'Monsoon', 'water': 'High', 'duration': '120-150 days'},
            'Maize': {'type': 'Monsoon', 'water': 'Medium', 'duration': '90-110 days'},
            'Jute': {'type': 'Monsoon', 'water': 'High', 'duration': '120 days'},
            'Cotton': {'type': 'Monsoon', 'water': 'Medium', 'duration': '150-180 days'},
            'Coconut': {'type': 'Year-Round', 'water': 'Medium', 'duration': 'Perennial'},
            'Papaya': {'type': 'Year-Round', 'water': 'Medium', 'duration': 'Perennial'},
            'Orange': {'type': 'Year-Round', 'water': 'Medium', 'duration': 'Perennial'},
            'Apple': {'type': 'Winter', 'water': 'Medium', 'duration': 'Perennial'},
            'Muskmelon': {'type': 'Summer', 'water': 'Low', 'duration': '60-80 days'},
            'Watermelon': {'type': 'Summer', 'water': 'Low', 'duration': '70-90 days'},
            'Grapes': {'type': 'Winter', 'water': 'Low', 'duration': 'Perennial'},
            'Mango': {'type': 'Summer', 'water': 'Medium', 'duration': 'Perennial'},
            'Banana': {'type': 'Year-Round', 'water': 'High', 'duration': '12-14 months'},
            'Pomegranate': {'type': 'Year-Round', 'water': 'Low', 'duration': 'Perennial'},
            'Lentil': {'type': 'Winter', 'water': 'Low', 'duration': '90-120 days'},
            'Blackgram': {'type': 'Monsoon', 'water': 'Medium', 'duration': '70-85 days'},
            'Mungbean': {'type': 'Summer', 'water': 'Low', 'duration': '60-70 days'},
            'Mothbeans': {'type': 'Monsoon', 'water': 'Low', 'duration': '75-90 days'},
            'Pigeonpeas': {'type': 'Monsoon', 'water': 'Medium', 'duration': '140-180 days'},
            'Kidneybeans': {'type': 'Winter', 'water': 'Medium', 'duration': '90-120 days'},
            'Chickpea': {'type': 'Winter', 'water': 'Low', 'duration': '90-110 days'},
            'Coffee': {'type': 'Year-Round', 'water': 'Medium', 'duration': 'Perennial'},
            'Cashew': {'type': 'Year-Round', 'water': 'Low', 'duration': 'Perennial'},
            'Raisins': {'type': 'Winter', 'water': 'Low', 'duration': 'Perennial'},
            'Dates': {'type': 'Year-Round', 'water': 'Very Low', 'duration': 'Perennial'},
            'Marigold': {'type': 'Year-Round', 'water': 'Medium', 'duration': '60-70 days'},
            'Tuberose': {'type': 'Year-Round', 'water': 'Medium', 'duration': 'Perennial'},
            'Arecanut': {'type': 'Year-Round', 'water': 'High', 'duration': 'Perennial'},
            'Ashwagandha': {'type': 'Winter', 'water': 'Low', 'duration': '150-180 days'},
            'Ginger': {'type': 'Monsoon', 'water': 'High', 'duration': '8-9 months'},
            'Turmeric': {'type': 'Monsoon', 'water': 'High', 'duration': '8-9 months'},
            'Garlic': {'type': 'Winter', 'water': 'Medium', 'duration': '120-150 days'},
            'Onion': {'type': 'Winter', 'water': 'Medium', 'duration': '100-120 days'},
            'Potato': {'type': 'Winter', 'water': 'Medium', 'duration': '90-120 days'},
            'Tomato': {'type': 'Winter', 'water': 'Medium', 'duration': '90-100 days'},
            'Brinjal': {'type': 'Year-Round', 'water': 'Medium', 'duration': '100-120 days'},
            'Chilli': {'type': 'Year-Round', 'water': 'Medium', 'duration': '90-120 days'},
            'Capsicum': {'type': 'Winter', 'water': 'Medium', 'duration': '90-100 days'},
            'Cucumber': {'type': 'Summer', 'water': 'High', 'duration': '60-70 days'},
            'Bottle Gourd': {'type': 'Summer', 'water': 'High', 'duration': '60-70 days'},
            'Bitter Gourd': {'type': 'Summer', 'water': 'High', 'duration': '60-70 days'},
            'Pumpkin': {'type': 'Summer', 'water': 'Medium', 'duration': '90-100 days'},
            'Okra': {'type': 'Monsoon', 'water': 'Medium', 'duration': '60-70 days'},
            'Cabbage': {'type': 'Winter', 'water': 'Medium', 'duration': '90-120 days'},
            'Cauliflower': {'type': 'Winter', 'water': 'Medium', 'duration': '90-120 days'},
            'Carrot': {'type': 'Winter', 'water': 'Medium', 'duration': '80-100 days'},
            'Radish': {'type': 'Winter', 'water': 'Medium', 'duration': '40-60 days'},
            'Beetroot': {'type': 'Winter', 'water': 'Medium', 'duration': '80-100 days'},
            'Spinach': {'type': 'Winter', 'water': 'Medium', 'duration': '30-45 days'},
            'Fenugreek': {'type': 'Winter', 'water': 'Medium', 'duration': '30-45 days'},
            'Coriander': {'type': 'Winter', 'water': 'Medium', 'duration': '40-60 days'},
            'Mint': {'type': 'Year-Round', 'water': 'High', 'duration': 'Perennial'},
            'Tulsi': {'type': 'Year-Round', 'water': 'Medium', 'duration': 'Perennial'},
            'Aloe Vera': {'type': 'Year-Round', 'water': 'Very Low', 'duration': 'Perennial'},
            'Stevia': {'type': 'Year-Round', 'water': 'Medium', 'duration': 'Perennial'},
            'Lemongrass': {'type': 'Year-Round', 'water': 'Medium', 'duration': 'Perennial'},
            'Citronella': {'type': 'Year-Round', 'water': 'Medium', 'duration': 'Perennial'},
            'Palmarosa': {'type': 'Year-Round', 'water': 'Medium', 'duration': 'Perennial'},
            'Menthol': {'type': 'Year-Round', 'water': 'Medium', 'duration': 'Perennial'},
            'Geranium': {'type': 'Year-Round', 'water': 'Medium', 'duration': 'Perennial'},
            'Patchouli': {'type': 'Year-Round', 'water': 'High', 'duration': 'Perennial'},
            'Davana': {'type': 'Winter', 'water': 'Low', 'duration': '110-120 days'},
            'Vanilla': {'type': 'Year-Round', 'water': 'High', 'duration': 'Perennial'},
            'Cardamom': {'type': 'Year-Round', 'water': 'High', 'duration': 'Perennial'},
            'Clove': {'type': 'Year-Round', 'water': 'High', 'duration': 'Perennial'},
            'Nutmeg': {'type': 'Year-Round', 'water': 'High', 'duration': 'Perennial'},
            'Cinnamon': {'type': 'Year-Round', 'water': 'High', 'duration': 'Perennial'},
            'Black Pepper': {'type': 'Year-Round', 'water': 'High', 'duration': 'Perennial'},
            'Rubber': {'type': 'Year-Round', 'water': 'High', 'duration': 'Perennial'},
            'Tea': {'type': 'Year-Round', 'water': 'High', 'duration': 'Perennial'},
            'Almond': {'type': 'Winter', 'water': 'Medium', 'duration': 'Perennial'},
            'Guava': {'type': 'Year-Round', 'water': 'Medium', 'duration': 'Perennial'},
            'Fig': {'type': 'Year-Round', 'water': 'Low', 'duration': 'Perennial'},
            'Apricot': {'type': 'Winter', 'water': 'Medium', 'duration': 'Perennial'},
            'Pistachio': {'type': 'Year-Round', 'water': 'Low', 'duration': 'Perennial'},
            'Walnut': {'type': 'Winter', 'water': 'Medium', 'duration': 'Perennial'}
        }

        # Format the response
        predictions = []
        for i in range(3):
            crop_name_raw = top3_crop_names[i]

            # Normalize for lookup and display: model classes are lowercase, CROP_INFO keys are Title Case
            crop_name = crop_name_raw.strip().title()

            info = CROP_INFO.get(
                crop_name,
                {'type': 'Unknown', 'water': 'Medium', 'duration': 'N/A'}
            )

            predictions.append({
                'crop': crop_name,
                'probability': round(top3_probabilities[i] * 100, 2),
                'season': info['type'],
                'duration': info['duration'],
                'water_needs': info['water']
            })
            
        return jsonify(predictions)

    except Exception as e:
        print(f"Prediction error: {e}")
        # Return a more specific error message if possible
        return jsonify({'error': f'An error occurred during prediction: {str(e)}'}), 400

if __name__ == '__main__':
    # Hugging Face requires port 7860
    app.run(host='0.0.0.0', port=7860)
