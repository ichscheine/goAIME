#!/usr/bin/env python
import sys
sys.path.append('/Users/daoming/Documents/Github/goAIME')

from backend.services.db_service import get_db
import json

def check_recent_none_session():
    """Check the recent session with None username"""
    db = get_db()
    
    # Get the most recent session
    recent_session = db.sessions.find_one(
        {"session_id": "89d176a5-7a24-4842-9a70-98af88c101bd"}
    )
    
    if recent_session:
        print("=== Recent session with username='None' ===")
        print(f"Session ID: {recent_session.get('session_id')}")
        print(f"Username: '{recent_session.get('username')}'")
        print(f"User ID: '{recent_session.get('user_id')}'")
        print(f"Created at: {recent_session.get('created_at')}")
        print(f"Score: {recent_session.get('score')}")
        print(f"Total attempted: {recent_session.get('total_attempted')}")
        
        # Check performance metrics
        perf_metrics = recent_session.get('performance_metrics', {})
        topic_metrics = perf_metrics.get('topic_metrics', {})
        difficulty_metrics = perf_metrics.get('difficulty_metrics', {})
        
        print(f"Topic metrics: {len(topic_metrics)} topics")
        print(f"Difficulty metrics: {len(difficulty_metrics)} difficulties")
        
        # This is likely the problematic session - let's see if we can fix it
        print(f"\nThis appears to be a test session with missing username/user_id")
        
        # Delete this problematic session
        print(f"Deleting problematic session...")
        result = db.sessions.delete_one({"_id": recent_session["_id"]})
        print(f"Deleted: {result.deleted_count} session(s)")

if __name__ == "__main__":
    check_recent_none_session()
