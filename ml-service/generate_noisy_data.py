import pandas as pd
import numpy as np

# Load original data
INPUT_FILE = "grand_crop_data_bell.csv"
OUTPUT_FILE = "grand_crop_data_noisy.csv"

print(f"Reading {INPUT_FILE}...")
df = pd.read_csv(INPUT_FILE)

# Numerical columns to add noise to
num_cols = ['N', 'P', 'K', 'pH', 'Moisture', 'Temperature', 'Rainfall', 'Humidity']

# Set random seed for reproducibility
np.random.seed(42)

# Add noise
# We want to reduce accuracy from 100% to ~90%.
# This means we need to introduce enough noise to cause some class overlap.
# Strategy: Add Gaussian noise with mean 0 and std dev = factor * std_dev_of_column
NOISE_FACTOR = 1.5  # Adjust this to control how much "messier" the data gets

print(f"Adding noise to numerical columns (Factor: {NOISE_FACTOR})...")

for col in num_cols:
    std_dev = df[col].std()
    noise = np.random.normal(0, std_dev * NOISE_FACTOR, size=len(df))
    df[col] = df[col] + noise
    
    # Ensure no negative values for physical parameters if applicable
    # pH is typically 0-14, others > 0
    if col == 'pH':
        df[col] = df[col].clip(0, 14)
    else:
        df[col] = df[col].clip(lower=0)

print(f"Saving noisy data to {OUTPUT_FILE}...")
df.to_csv(OUTPUT_FILE, index=False)
print("Done!")
