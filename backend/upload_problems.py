import json
import sys
import os
from pathlib import Path

# Set up path to import project modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.config import get_db

def upload_problems_to_mongodb():
    """Upload problems from JSON file to MongoDB."""
    print("Starting problems upload to MongoDB...")
    
    # Get database connection
    db = get_db()
    
    # Path to the JSON file
    json_file_path = 'frontend/public/data/problems.json'
    
    # Load JSON data
    try:
        with open(json_file_path, 'r') as file:
            problems_data = json.load(file)
            print(f"Loaded {len(problems_data)} problems from JSON file")
    except Exception as e:
        print(f"Error loading JSON file: {e}")
        return False
    
    # Drop existing collection if it exists
    try:
        if "problems" in db.list_collection_names():
            db.problems.drop()
            print("Dropped existing problems collection")
    except Exception as e:
        print(f"Error dropping collection: {e}")
    
    # Insert the data
    try:
        if problems_data:
            result = db.problems.insert_many(problems_data)
            print(f"Successfully inserted {len(result.inserted_ids)} problems into the database")
            return True
        else:
            print("No problems to insert")
            return False
    except Exception as e:
        print(f"Error inserting problems: {e}")
        return False

if __name__ == "__main__":
    success = upload_problems_to_mongodb()
    if success:
        print("Upload completed successfully!")
    else:
        print("Upload failed!")