import numpy as np
import pandas as pd
from joblib import load

# Load saved model, scaler, and encoder
model = load("random_forest_model.joblib")
scaler = load("scaler.joblib")
label_encoder = load("label_encoder.joblib")

# Define new sensor input
new_data = {
    'RGB.red': 120,
    'RGB.green': 200,
    'RGB.blue': 150,
    'lightIntensity': 450.75,
    'timeTaken': 14500
}

# Convert input to a pandas DataFrame with correct column names
input_df = pd.DataFrame([new_data])

# Scale input data
scaled_input = scaler.transform(input_df)
scaled_df = pd.DataFrame(scaled_input, columns=input_df.columns)

# Predict
prediction = model.predict(scaled_df)
predicted_label = label_encoder.inverse_transform(prediction)[0]

# Output
print(f"\n Input Sensor Data: {new_data}")
print(f" Predicted Milk Quality (Encoded): {int(prediction[0])}")
print(f" Predicted Milk Quality: {predicted_label}")
