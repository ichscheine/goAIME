#!/usr/bin/env python3
"""
Script to list all sessions in the database to help identify the correct user sessions
"""

import sys
from pathlib import Path
from pprint import pprint

# Add the backend directory to the path so we can import config.py
script_dir = Path(__file__).resolve().parent
backend_dir = script_dir.parent
sys.path.append(str(backend_dir))

# Import database configuration from the backend
try:
    from config import get_db, close_db
    print("Successfully imported database configuration")
except ImportError as e:
    print(f"Error importing database configuration: {e}")
    sys.exit(1)

def list_collections():
    """List all collections in the database"""
    try:
        # Get database connection
        db = get_db()
        
        collections = db.list_collection_names()
        print(f"\nCollections in the database:")
        for collection in collections:
            print(f"- {collection}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        close_db()

if __name__ == "__main__":
    list_collections()
