#!/usr/bin/env python
import sys
sys.path.append('/Users/daoming/Documents/Github/goAIME')

from backend.services.db_service import get_db
import json

def check_actual_db_sessions():
    """Check what's actually stored in the database"""
    db = get_db()
    
    # Get a recent goAmy session
    session = db.sessions.find_one(
        {"username": "goAmy"}, 
        sort=[("created_at", -1)]
    )
    
    print("=== Actual Database Session ===")
    print(f"Session ID: {session.get('session_id')}")
    print(f"Username: {session.get('username')}")
    print(f"User ID: {session.get('user_id')}")
    print(f"Created at: {session.get('created_at')}")
    
    # Check performance metrics in detail
    perf_metrics = session.get('performance_metrics', {})
    print(f"\nPerformance metrics keys: {list(perf_metrics.keys()) if perf_metrics else 'None'}")
    
    if perf_metrics:
        topic_metrics = perf_metrics.get('topic_metrics', {})
        difficulty_metrics = perf_metrics.get('difficulty_metrics', {})
        
        print(f"Topic metrics: {len(topic_metrics)} topics")
        print(f"Difficulty metrics: {len(difficulty_metrics)} difficulties")
        
        if not topic_metrics:
            print("Topic metrics is empty or missing!")
        if not difficulty_metrics:
            print("Difficulty metrics is empty or missing!")
        
        # Print first few topic metrics if they exist
        if topic_metrics:
            print(f"First few topic metrics: {dict(list(topic_metrics.items())[:3])}")
        if difficulty_metrics:
            print(f"Difficulty metrics: {difficulty_metrics}")

if __name__ == "__main__":
    check_actual_db_sessions()
