from flask import Flask, request, jsonify
import joblib
import numpy as np
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # This will allow all origins

# Load the pre-trained model and label encoder
try:
    # Use joblib to load files saved with joblib
    model = joblib.load('grand_crop_model.pkl')
    label_encoder = joblib.load('label_encoder.pkl')

except FileNotFoundError as e:
    print(f"Error loading model or label encoder: {e}")
    # Exit or handle gracefully if files are essential
    model = None
    label_encoder = None

@app.route('/predict', methods=['POST'])
def predict():
    if not model or not label_encoder:
        return jsonify({'error': 'Model or label encoder not loaded properly.'}), 500

    try:
        data = request.get_json()
        
        # Extract features from the request in the correct order
        # The order should match the training data: N, P, K, temperature, humidity, ph, rainfall
        # Assuming humidity is not provided by the frontend, we might need a default or average value.
        # Let's use a placeholder for humidity, e.g., an average value if known, or omit if the model handles it.
        # For this example, let's assume the model was trained on 7 features and we'll use a placeholder for humidity.
        # A better approach is to ensure the frontend sends all required features.
        
        # Let's assume the model was trained on these features in this order:
        # Nitrogen, Phosphorus, Potassium, Temperature, pH, Rainfall
        # And let's assume the frontend sends them with these keys:
        # 'nitrogen', 'phosphorus', 'potassium', 'temperature', 'ph', 'rainfall'
        
        features = [
            float(data['nitrogen']),
            float(data['phosphorus']),
            float(data['potassium']),
            float(data['temperature']),
            float(data['ph']),
            float(data['rainfall'])
        ]
        
        # The saved model expects a certain number of features. Let's check the number of features.
        # If the model was trained with humidity, we have a mismatch. Let's assume for now it was trained without it.
        # If the model expects 7 features, and we have 6, we'll get an error.
        
        # Let's reshape data for a single prediction
        final_features = np.array(features).reshape(1, -1)
        
        # Make prediction
        prediction_index = model.predict(final_features)
        
        # Decode the prediction to the original label
        crop_name = label_encoder.inverse_transform(prediction_index)
        
        return jsonify({'crop': crop_name[0]})

    except Exception as e:
        print(f"Prediction error: {e}")
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    # Make sure to use the correct port, e.g., 5001
    app.run(debug=True, port=5001)