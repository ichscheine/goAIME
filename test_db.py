# test_db.py
from pymongo import MongoClient

MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "amc10_test2"
COLLECTION_NAME = "2022_amc10a"

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
collection = db[COLLECTION_NAME]

problems = list(collection.find({}))
print(f"Found {len(problems)} problem(s).")
for doc in problems:
    print(doc)
