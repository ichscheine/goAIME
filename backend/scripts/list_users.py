#!/usr/bin/env python3
"""
Script to list all users in the database to help identify the correct username for goAmy
"""

import sys
from pathlib import Path

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

def list_users():
    """List all users in the database"""
    try:
        # Get database connection
        db = get_db()
        users_collection = db.users
        
        # Get all users
        users = list(users_collection.find())
        
        print(f"\nFound {len(users)} users in the database:")
        print("-" * 50)
        
        for user in users:
            print(f"ID: {user.get('_id')}")
            print(f"Username: {user.get('username')}")
            print(f"Email: {user.get('email')}")
            print(f"Role: {user.get('role', 'N/A')}")
            print("-" * 50)
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        close_db()

if __name__ == "__main__":
    list_users()
