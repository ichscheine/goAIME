#!/usr/bin/env python3
"""
Find all sessions to understand the current database state
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from services.db_service import get_db
from bson import ObjectId
import json

def find_all_sessions():
    """Find all sessions to understand current state"""
    db = get_db()
    
    print("Searching for all sessions...")
    print("=" * 60)
    
    # Get total count
    total_sessions = db.user_sessions.count_documents({})
    print(f"Total sessions in database: {total_sessions}")
    print()
    
    # Find recent sessions
    sessions = list(db.user_sessions.find({}).sort("start_time", -1).limit(10))
    
    print(f"Recent {len(sessions)} sessions:")
    print()
    
    for i, session in enumerate(sessions):
        session_id = session.get('session_id')
        username = session.get('username')
        start_time = session.get('start_time')
        user_id = session.get('user_id')
        total_attempted = session.get('total_attempted', 0)
        
        print(f"Session {i+1}:")
        print(f"  Session ID: {session_id}")
        print(f"  Username: {username}")
        print(f"  Start time: {start_time}")
        print(f"  User ID: {user_id}")
        print(f"  Total attempted: {total_attempted}")
        
        # Check metrics
        perf_metrics = session.get('performance_metrics', {})
        topic_metrics = perf_metrics.get('topic_metrics', {})
        difficulty_metrics = perf_metrics.get('difficulty_metrics', {})
        
        print(f"  Topic metrics count: {len(topic_metrics)}")
        print(f"  Difficulty metrics count: {len(difficulty_metrics)}")
        print()
    
    # Check for any sessions with user_id 'None'
    print("=" * 60)
    print("Checking for sessions with user_id issues...")
    none_sessions = list(db.user_sessions.find({"user_id": "None"}).limit(5))
    print(f"Sessions with user_id 'None': {len(none_sessions)}")
    
    for session in none_sessions:
        print(f"  Session ID: {session.get('session_id')}")
        print(f"  Username: {session.get('username')}")
        print(f"  Start time: {session.get('start_time')}")
        print()

if __name__ == "__main__":
    find_all_sessions()
