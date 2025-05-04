from pymongo import MongoClient
import random
import time

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['sensorDataDB']
collection = db['sensordatas']

# RGB, lightIntensity, timeTaken generator
def generate_record():
    return {
        "RGB": {
            "red": random.randint(0, 255),
            "green": random.randint(0, 255),
            "blue": random.randint(0, 255),
        },
        "lightIntensity": round(random.uniform(100.0, 1000.0), 2),
        "timeTaken": random.randint(3600, 36000)  # New (1h to 10h)
  # between 1 hour and 4 hours
    }

# Generate 200,000 records
batch_size = 10000
total_records = 200000
print("Generating and inserting synthetic records to MongoDB...")

for i in range(0, total_records, batch_size):
    batch = [generate_record() for _ in range(batch_size)]
    collection.insert_many(batch)
    print(f"Inserted batch {i + batch_size} / {total_records}")

print("All synthetic data inserted into MongoDB.")
