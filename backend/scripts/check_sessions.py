#!/usr/bin/env python3
"""
Script to check sessions in the database
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

def list_sessions():
    """List sessions in the database"""
    try:
        # Get database connection
        db = get_db()
        
        # First, check users
        users = list(db.users.find())
        print(f"\nUsers in the database:")
        for user in users:
            print(f"- {user.get('username')} (ID: {user.get('_id')})")
        
        # Check all collections that might contain session data
        collections = ['sessions', 'problem_sessions']
        
        for collection_name in collections:
            collection = db[collection_name]
            sessions = list(collection.find().limit(5))  # Limit to 5 for brevity
            
            print(f"\nSample {collection_name} data (showing up to 5):")
            print(f"Found {collection.count_documents({})} documents in {collection_name}")
            
            if sessions:
                # Show the first session's keys
                first_session = sessions[0]
                print(f"\nSession document structure (keys):")
                print(f"- {', '.join(first_session.keys())}")
                
                # Print user IDs from the sessions to help with mapping
                print(f"\nUser references in sessions:")
                user_field = 'user_id' if 'user_id' in first_session else 'user'
                for session in sessions:
                    print(f"- Session {session.get('_id')} -> User: {session.get(user_field)}")
            else:
                print("No sessions found in this collection.")
                
    except Exception as e:
        print(f"Error: {e}")
    finally:
        close_db()

if __name__ == "__main__":
    list_sessions()
