#!/usr/bin/env python
import sys
sys.path.append('/Users/daoming/Documents/Github/goAIME')

from backend.services.db_service import get_db

def cleanup_problematic_sessions():
    """Clean up sessions with issues"""
    db = get_db()
    
    # Find sessions with issues
    problematic_sessions = list(db.sessions.find({
        "$or": [
            {"username": "None"},
            {"username": None},
            {"user_id": "None"},
            {"user_id": None},
            {"session_id": {"$regex": "^test_fix_"}}  # Clean up test sessions
        ]
    }))
    
    print(f"Found {len(problematic_sessions)} problematic sessions to clean up:")
    
    for session in problematic_sessions:
        session_id = session.get('session_id')
        username = session.get('username')
        user_id = session.get('user_id')
        
        print(f"  - Session: {session_id}")
        print(f"    Username: '{username}'")
        print(f"    User ID: '{user_id}'")
        
        # Delete the session
        result = db.sessions.delete_one({"_id": session["_id"]})
        print(f"    Deleted: {result.deleted_count} session(s)")
        print()
    
    print("Cleanup complete!")

if __name__ == "__main__":
    cleanup_problematic_sessions()
