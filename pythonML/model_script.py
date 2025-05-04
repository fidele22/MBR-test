from pymongo import MongoClient
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from joblib import dump

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['sensorDataDB']
collection = db['sensordatas']
sensor_data = list(collection.find())

# Convert to DataFrame
df = pd.DataFrame(sensor_data)

# Extract RGB channels from nested dict
df['RGB.red'] = df['RGB'].apply(lambda x: x.get('red') if isinstance(x, dict) else None)
df['RGB.green'] = df['RGB'].apply(lambda x: x.get('green') if isinstance(x, dict) else None)
df['RGB.blue'] = df['RGB'].apply(lambda x: x.get('blue') if isinstance(x, dict) else None)

# Define milk quality categories from timeTaken (in seconds)
def categorize_milk_quality(time_taken):
    if time_taken < 2 * 3600:
        return 'Poor'
    elif time_taken < 4 * 3600:
        return 'Fair'
    elif time_taken < 6 * 3600:
        return 'Good'
    elif time_taken < 8 * 3600:
        return 'Very Good'
    else:
        return 'Excellent'

df['milk_quality'] = df['timeTaken'].apply(categorize_milk_quality)

# Select and clean necessary columns
features = ['RGB.red', 'RGB.green', 'RGB.blue', 'lightIntensity', 'timeTaken']
df = df[features + ['milk_quality']].dropna()

# Encode target labels
label_encoder = LabelEncoder()
df['milk_quality_encoded'] = label_encoder.fit_transform(df['milk_quality'])

# Feature scaling
scaler = StandardScaler()
df[features] = scaler.fit_transform(df[features])

# Split dataset
X = df[features]
y = df['milk_quality_encoded']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train model
model = RandomForestClassifier(random_state=42, class_weight='balanced')
model.fit(X_train, y_train)

# Evaluate model
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
f1_score = classification_report(y_test, y_pred, output_dict=True)['weighted avg']['f1-score']

print("\n Model Evaluation:")
print(f"Accuracy: {accuracy * 100:.2f}%")
print(f"F1 Score: {f1_score:.2f}")
print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=label_encoder.classes_))

# Feature importances
print("\nFeature Importances:")
for feature_name, importance in zip(features, model.feature_importances_):
    print(f"{feature_name}: {importance:.3f}")

# Save model and encoder
dump(model, "random_forest_model.joblib")
dump(label_encoder, "label_encoder.joblib")
dump(scaler, "scaler.joblib")

print("\n Model, label encoder, and scaler saved successfully.")
