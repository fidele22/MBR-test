from pymongo import MongoClient
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.svm import LinearSVC
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, f1_score

# --- Step 1: Connect to MongoDB and Fetch Data ---
# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/')  # Update if your Mongo URL is different

# Select your database and collection
db = client['sensorDataDB']  # Replace with your actual DB name
collection = db['sensordatas']  # Replace with your actual collection name

# Fetch data from MongoDB
sensor_data = list(collection.find())

# Convert to pandas DataFrame for easy processing
df = pd.DataFrame(sensor_data)

# Handle RGB Object inside DataFrame
# Extract the RGB components from the 'RGB' object
df['RGB.red'] = df['RGB'].apply(lambda x: x.get('red') if isinstance(x, dict) else None)
df['RGB.green'] = df['RGB'].apply(lambda x: x.get('green') if isinstance(x, dict) else None)
df['RGB.blue'] = df['RGB'].apply(lambda x: x.get('blue') if isinstance(x, dict) else None)

# Define categorization function for 'milk_quality'
def categorize_milk_quality(time_taken):
    if time_taken < 2 * 3600:  # seconds
        return 'Poor'
    elif time_taken < 4 * 3600:
        return 'Fair'
    elif time_taken < 6 * 3600:
        return 'Good'
    elif time_taken < 8 * 3600:
        return 'Very Good'
    else:
        return 'Excellent'

# Apply categorization to your data
df['milk_quality'] = df['timeTaken'].apply(categorize_milk_quality)

# Check the unique values in the 'milk_quality' column
print("Unique values in milk_quality:", df['milk_quality'].unique())

# --- Remove unnecessary columns ---
columns_to_keep = ['RGB.red', 'RGB.green', 'RGB.blue', 'lightIntensity', 'timeTaken', 'milk_quality']
df = df[columns_to_keep]

# --- Handle missing values ---
df.dropna(inplace=True)  # Remove rows with any missing data

# --- Encode milk_quality labels ---
label_encoder = LabelEncoder()
df['milk_quality_encoded'] = label_encoder.fit_transform(df['milk_quality'])

# --- Scale numeric features ---
scaler = StandardScaler()
features = ['RGB.red', 'RGB.green', 'RGB.blue', 'lightIntensity', 'timeTaken']
df[features] = scaler.fit_transform(df[features])

# --- Split features (X) and target (y) ---
X = df[features]
y = df['milk_quality_encoded']

# --- Check class distribution before splitting ---
print("Class distribution before splitting:")
print(df['milk_quality'].value_counts())

# --- Split into training and testing sets ---
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# --- Check class distribution in training set ---
print("\nClass distribution in training set:")
print(y_train.value_counts())

# --- Initialize models ---
models = {
    'LinearSVC': LinearSVC(random_state=42, class_weight='balanced', max_iter=1000, n_jobs=-1),
    'Random Forest': RandomForestClassifier(random_state=42, class_weight='balanced'),
    'Logistic Regression': LogisticRegression(random_state=42, max_iter=1000, solver='liblinear', class_weight='balanced')
}

# --- Train and Evaluate Models ---
for model_name, model in models.items():
    print(f"\nTraining and Evaluating {model_name}...")
    model.fit(X_train, y_train)
    
    # Make predictions on the test data
    y_pred = model.predict(X_test)
    
    # Evaluate the model
    accuracy = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred, average='weighted')
    report = classification_report(y_test, y_pred, target_names=label_encoder.classes_)

    # Print the performance status
    print(f"\n{model_name} Performance Status:")
    print(f"Accuracy: {accuracy * 100:.2f}%")
    print(f"F1 Score: {f1:.2f}")
    print("Notes: Model has been trained with class balancing to address imbalanced data.")
    print("\nClassification Report:")
    print(report)

    # Handle feature importances for models that support it
    if model_name == 'Random Forest':
        importances = model.feature_importances_
        features_importance = list(zip(features, importances))
        features_importance = sorted(features_importance, key=lambda x: abs(x[1]), reverse=True)

        print("\nFeature Importances (Random Forest):")
        for feature, importance in features_importance:
            print(f"{feature}: {importance}")
    
    elif model_name == 'LinearSVC':
        # For LinearSVC, access the coef_ attribute if it's a linear model
        if hasattr(model, 'coef_'):
            importances = model.coef_.flatten()
            features_importance = list(zip(features, importances))
            features_importance = sorted(features_importance, key=lambda x: abs(x[1]), reverse=True)

            print("\nFeature Importances (LinearSVC):")
            for feature, importance in features_importance:
                print(f"{feature}: {importance}")
