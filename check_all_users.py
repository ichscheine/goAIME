#!/usr/bin/env python
import sys
sys.path.append('/Users/daoming/Documents/Github/goAIME')

from backend.services.db_service import get_db

def check_all_real_users():
    """Check if there are other real users that need migration"""
    db = get_db()
    
    # Find unique usernames
    usernames = db.sessions.distinct("username")
    print(f"Found {len(usernames)} unique users: {usernames}")
    
    # Check which users still have old performance metrics
    old_sessions = list(db.sessions.find({
        "$or": [
            {"performance_metrics.totals": {"$exists": True}},
            {"performance_metrics.averages": {"$exists": True}},
            {"performance_metrics.topic_performance": {"$exists": True}},
            {"performance_metrics.difficulty_performance": {"$exists": True}},
            {"performance_metrics.topic_metrics": {"$exists": False}},
            {"performance_metrics.difficulty_metrics": {"$exists": False}}
        ]
    }))
    
    print(f"\nUsers with sessions needing migration: {len(old_sessions)}")
    for session in old_sessions:
        print(f"  - {session.get('username')}: {session.get('session_id')}")

if __name__ == "__main__":
    check_all_real_users()
