#!/usr/bin/env python3
"""
Find sessions by username to get the correct session ID
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from services.db_service import get_db
from bson import ObjectId
import json

def find_sessions():
    """Find sessions for goAmy"""
    db = get_db()
    
    print("Searching for sessions...")
    print("=" * 60)
    
    # Find sessions by username
    sessions = list(db.user_sessions.find({"username": "goAmy"}).sort("start_time", -1))
    
    print(f"Found {len(sessions)} sessions for goAmy:")
    print()
    
    for i, session in enumerate(sessions):
        session_id = session.get('session_id')
        start_time = session.get('start_time')
        user_id = session.get('user_id')
        total_attempted = session.get('total_attempted', 0)
        
        print(f"Session {i+1}:")
        print(f"  Session ID: {session_id}")
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

if __name__ == "__main__":
    find_sessions()
