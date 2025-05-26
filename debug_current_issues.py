#!/usr/bin/env python
import sys
sys.path.append('/Users/daoming/Documents/Github/goAIME')

from backend.services.db_service import get_db
import json

def debug_current_issues():
    """Debug the current issues with user_id and metrics"""
    db = get_db()
    
    # Get goAmy sessions to debug
    sessions = list(db.sessions.find({"username": "goAmy"}).sort("created_at", -1).limit(2))
    
    print("=== Debugging Current Issues ===")
    for i, session in enumerate(sessions, 1):
        print(f"\n--- Session {i} ---")
        print(f"Session ID: {session.get('session_id')}")
        print(f"Username: '{session.get('username')}'")
        print(f"User ID: '{session.get('user_id')}'")
        print(f"Created at: {session.get('created_at')}")
        
        # Check if user_id is specifically None vs missing vs empty
        user_id = session.get('user_id')
        if user_id is None:
            print("  ❌ user_id is None")
        elif user_id == '':
            print("  ❌ user_id is empty string")
        elif user_id:
            print(f"  ✅ user_id present: {user_id}")
        else:
            print(f"  ❌ user_id other issue: {repr(user_id)}")
        
        # Check problems_attempted data
        problems = session.get('problems_attempted', [])
        print(f"Problems attempted: {len(problems)}")
        
        if problems:
            first_problem = problems[0]
            print(f"First problem topics: {first_problem.get('topics')}")
            print(f"First problem difficulty: {first_problem.get('difficulty')}")
            print(f"First problem is_correct: {first_problem.get('is_correct')}")
        
        # Check performance metrics structure
        perf_metrics = session.get('performance_metrics', {})
        print(f"Performance metrics keys: {list(perf_metrics.keys())}")
        
        topic_metrics = perf_metrics.get('topic_metrics', {})
        difficulty_metrics = perf_metrics.get('difficulty_metrics', {})
        
        print(f"Topic metrics type: {type(topic_metrics)}, length: {len(topic_metrics)}")
        print(f"Difficulty metrics type: {type(difficulty_metrics)}, length: {len(difficulty_metrics)}")
        
        if topic_metrics:
            print(f"Topic metrics sample: {dict(list(topic_metrics.items())[:2])}")
        if difficulty_metrics:
            print(f"Difficulty metrics: {difficulty_metrics}")

if __name__ == "__main__":
    debug_current_issues()
