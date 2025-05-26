#!/usr/bin/env python
import sys
sys.path.append('/Users/daoming/Documents/Github/goAIME')

from backend.services.db_service import get_db
import json

def check_goamy_user_fields():
    """Check specifically the username and user_id fields for goAmy sessions"""
    db = get_db()
    
    # Get the most recent goAmy sessions
    sessions = list(db.sessions.find({"username": "goAmy"}).sort("created_at", -1).limit(3))
    
    print("=== goAmy Session User Fields Check ===")
    for i, session in enumerate(sessions, 1):
        print(f"\n--- Session {i} ---")
        print(f"Session ID: {session.get('session_id', 'MISSING')}")
        print(f"Username: '{session.get('username', 'MISSING')}'")
        print(f"User ID: '{session.get('user_id', 'MISSING')}'")
        print(f"Created at: {session.get('created_at', 'MISSING')}")
        
        # Check if user_id is None specifically
        if session.get('user_id') is None:
            print("  ❌ user_id is None!")
        elif session.get('user_id') == '':
            print("  ❌ user_id is empty string!")
        elif session.get('user_id'):
            print(f"  ✅ user_id is present: {session.get('user_id')}")
        
        # Check if username is None specifically
        if session.get('username') is None:
            print("  ❌ username is None!")
        elif session.get('username') == '':
            print("  ❌ username is empty string!")
        elif session.get('username'):
            print(f"  ✅ username is present: {session.get('username')}")
    
    # Also check what other username values exist in the database
    print(f"\n=== All usernames in database ===")
    all_usernames = db.sessions.distinct("username")
    for username in all_usernames:
        count = db.sessions.count_documents({"username": username})
        print(f"'{username}': {count} sessions")

if __name__ == "__main__":
    check_goamy_user_fields()
