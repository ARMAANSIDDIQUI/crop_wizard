import pandas as pd
import numpy as np
import random

# --- CONFIGURATION ---
INPUT_FILE = "Crop_recommendation.csv"
OUTPUT_FILE = "grand_crop_data_temp_monthly.csv"
DUPLICATION_FACTOR = 50
NOISE_LEVEL = 0.17  # Adjusted to balance accuracy >93%
OUTLIER_PROB_PER_ROW = 0.02 # 2% chance a row will have extreme outliers

# --- CROP SEASONAL PROFILES ---
CROP_PROFILES = {
    'Rice': {'type': 'Monsoon', 'water': 'High', 'temp_opt': 25},
    'Maize': {'type': 'Monsoon', 'water': 'Medium', 'temp_opt': 25},
    'Jute': {'type': 'Monsoon', 'water': 'High', 'temp_opt': 30},
    'Cotton': {'type': 'Monsoon', 'water': 'Medium', 'temp_opt': 30},
    'Coconut': {'type': 'Year-Round', 'water': 'Medium', 'temp_opt': 27},
    'Papaya': {'type': 'Year-Round', 'water': 'Medium', 'temp_opt': 25},
    'Orange': {'type': 'Year-Round', 'water': 'Medium', 'temp_opt': 20},
    'Apple': {'type': 'Winter', 'water': 'Medium', 'temp_opt': 10}, 
    'Muskmelon': {'type': 'Summer', 'water': 'Low', 'temp_opt': 35},
    'Watermelon': {'type': 'Summer', 'water': 'Low', 'temp_opt': 35},
    'Grapes': {'type': 'Winter', 'water': 'Low', 'temp_opt': 20},
    'Mango': {'type': 'Summer', 'water': 'Medium', 'temp_opt': 30},
    'Banana': {'type': 'Year-Round', 'water': 'High', 'temp_opt': 27},
    'Pomegranate': {'type': 'Year-Round', 'water': 'Low', 'temp_opt': 30},
    'Lentil': {'type': 'Winter', 'water': 'Low', 'temp_opt': 20},
    'Blackgram': {'type': 'Monsoon', 'water': 'Medium', 'temp_opt': 25},
    'Mungbean': {'type': 'Summer', 'water': 'Low', 'temp_opt': 30},
    'Mothbeans': {'type': 'Monsoon', 'water': 'Low', 'temp_opt': 30},
    'Pigeonpeas': {'type': 'Monsoon', 'water': 'Medium', 'temp_opt': 25},
    'Kidneybeans': {'type': 'Winter', 'water': 'Medium', 'temp_opt': 20},
    'Chickpea': {'type': 'Winter', 'water': 'Low', 'temp_opt': 20},
    'Coffee': {'type': 'Year-Round', 'water': 'Medium', 'temp_opt': 23},
    'Cashew': {'type': 'Year-Round', 'water': 'Low', 'temp_opt': 27},
    'Raisins': {'type': 'Winter', 'water': 'Low', 'temp_opt': 25}, 
    'Dates': {'type': 'Year-Round', 'water': 'Very Low', 'temp_opt': 35},
    # ... (omitted for brevity)
}
DEFAULT_PROFILE = {'type': 'Monsoon (Kharif)', 'water': 'Medium', 'temp_opt': 25}

# --- STATE CLIMATE BASELINES ---
SEASONAL_PATTERNS = {
    'General': {
        'temp': [0.6, 0.7, 0.9, 1.1, 1.2, 1.1, 1.0, 1.0, 1.0, 0.9, 0.8, 0.6],
    },
    'Himalayan': {
        'temp': [0.1, 0.2, 0.4, 0.7, 0.9, 1.0, 0.9, 0.9, 0.8, 0.6, 0.4, 0.2],
    },
    'South': {
        'temp': [0.9, 0.95, 1.0, 1.05, 1.05, 0.9, 0.85, 0.85, 0.9, 0.9, 0.9, 0.9],
    }
}
HIMALAYAN_STATES = ['Jammu & Kashmir', 'Himachal Pradesh', 'Uttarakhand', 'Sikkim', 'Ladakh']
SOUTH_STATES = ['Kerala', 'Tamil Nadu', 'Karnataka', 'Andhra Pradesh', 'Telangana']

def add_noise(value, noise_level):
    """Adds random noise to a value."""
    return value * (1 + np.random.uniform(-noise_level, noise_level))

def get_monthly_temps(row, crop, state):
    profile = CROP_PROFILES.get(crop, DEFAULT_PROFILE)
    
    if state in HIMALAYAN_STATES:
        pattern = SEASONAL_PATTERNS['Himalayan']
        base_temp_avg = 15
    elif state in SOUTH_STATES:
        pattern = SEASONAL_PATTERNS['South']
        base_temp_avg = 28
    else:
        pattern = SEASONAL_PATTERNS['General']
        base_temp_avg = 30
        
    base_temp_avg += np.random.uniform(-2, 2)
    temp_bias = (profile['temp_opt'] - base_temp_avg) * 0.1

    monthly_temps = []
    for i in range(12):
        t_val = (base_temp_avg + temp_bias) * pattern['temp'][i] + np.random.normal(0, 2.0)
        if t_val < -15: t_val = -15
        if t_val > 50: t_val = 50
        if crop == 'Apple' and i in [0, 1, 11] and t_val > 10:
             t_val = np.random.normal(2, 3)
        monthly_temps.append(round(t_val, 1))
    return monthly_temps

def main():
    print(f"Reading original data from {INPUT_FILE}...")
    try:
        df = pd.read_csv(INPUT_FILE)
    except FileNotFoundError:
        print(f"Error: {INPUT_FILE} not found.")
        return

    df.rename(columns={'label': 'Target', 'ph': 'pH'}, inplace=True)

    print(f"Generating augmented and monthly temperature data (Factor: {DUPLICATION_FACTOR}x)...")
    
    new_data = []
    
    for _ in range(DUPLICATION_FACTOR):
        for index, row in df.iterrows():
            new_row = {}
            
            # Add noise to soil and single atmospheric features
            is_outlier = np.random.rand() < OUTLIER_PROB_PER_ROW
            outlier_multiplier = np.random.uniform(2.0, 5.0) if is_outlier else 1.0

            new_row['N'] = add_noise(row['N'], NOISE_LEVEL) * (outlier_multiplier if np.random.rand() < 0.5 else 1.0)
            new_row['P'] = add_noise(row['P'], NOISE_LEVEL) * (outlier_multiplier if np.random.rand() < 0.5 else 1.0)
            new_row['K'] = add_noise(row['K'], NOISE_LEVEL) * (outlier_multiplier if np.random.rand() < 0.5 else 1.0)
            
            # For pH, outlier might mean extreme low or high
            new_ph = add_noise(row['pH'], NOISE_LEVEL)
            if is_outlier and np.random.rand() < 0.5:
                new_ph = np.random.uniform(1.0, 3.0) if np.random.rand() < 0.5 else np.random.uniform(9.0, 14.0)
            new_row['pH'] = new_ph
            
            new_row['Humidity'] = add_noise(row['humidity'], NOISE_LEVEL) * (0.2 if is_outlier and np.random.rand() < 0.5 else 1.0)
            new_row['Rainfall'] = add_noise(row['rainfall'], NOISE_LEVEL) * (outlier_multiplier if np.random.rand() < 0.5 else 1.0)

            # Assign categorical features
            state = np.random.choice([
                'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Uttar Pradesh', 'Punjab', 
                'West Bengal', 'Gujarat', 'Madhya Pradesh', 'Andhra Pradesh', 'Kerala',
                'Jammu & Kashmir', 'Himachal Pradesh', 'Assam', 'Rajasthan'
            ])
            soil_type = np.random.choice([
                'Alluvial', 'Black', 'Red', 'Laterite', 'Arid', 'Forest'
            ])
            new_row['State'] = state
            new_row['Soil_Type'] = soil_type
            new_row['Target'] = row['Target']
            
            # Generate monthly temperature data
            monthly_temps = get_monthly_temps(row, row['Target'], state)
            
            months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            for i, m in enumerate(months):
                new_row[f'Temp_{m}'] = monthly_temps[i]

            new_data.append(new_row)

    new_df = pd.DataFrame(new_data)
    
    # Reorder columns
    temp_cols = [f'Temp_{m}' for m in months]
    cols_order = ['N', 'P', 'K', 'pH', 'Humidity', 'Rainfall'] + temp_cols + ['Soil_Type', 'State', 'Target']
    new_df = new_df[cols_order]

    print(f"Saving to {OUTPUT_FILE} with shape {new_df.shape}...")
    new_df.to_csv(OUTPUT_FILE, index=False)
    print("Done!")

if __name__ == "__main__":
    main()
