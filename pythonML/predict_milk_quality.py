# predict.py
import sys
import os
import json
import pandas as pd
from joblib import load

# Get current script directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Load model and preprocessors using absolute paths
model = load(os.path.join(BASE_DIR, "random_forest_model.joblib"))
scaler = load(os.path.join(BASE_DIR, "scaler.joblib"))
label_encoder = load(os.path.join(BASE_DIR, "label_encoder.joblib"))

# Get JSON from Node.js
input_json = json.load(sys.stdin)

# Create DataFrame
input_df = pd.DataFrame([{
    'RGB.red': input_json['RGB']['red'],
    'RGB.green': input_json['RGB']['green'],
    'RGB.blue': input_json['RGB']['blue'],
    'lightIntensity': input_json['lightIntensity'],
    'timeTaken': input_json['timeTaken']
}])

# Scale and predict
scaled_input = scaler.transform(input_df)
prediction = model.predict(scaled_input)
predicted_label = label_encoder.inverse_transform(prediction)[0]

# Return result
print(json.dumps({
    "encoded": int(prediction[0]),
    "label": predicted_label
}))
