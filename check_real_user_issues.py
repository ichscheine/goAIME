#!/usr/bin/env python
import sys
sys.path.append('/Users/daoming/Documents/Github/goAIME')

from backend.services.db_service import get_db
import json

def check_real_user_sessions():
    """Check sessions for real users to identify the issues"""
    db = get_db()
    
    # Find sessions for goAmy
    sessions = list(db.sessions.find({"username": "goAmy"}).limit(3))
    
    print("=== Checking goAmy sessions ===")
    for i, session in enumerate(sessions, 1):
        print(f"\n--- Session {i} ---")
        print(f"Session ID: {session.get('session_id', 'MISSING')}")
        print(f"Username: {session.get('username', 'MISSING')}")
        print(f"User ID: {session.get('user_id', 'MISSING')}")
        print(f"Score: {session.get('score', 'MISSING')}")
        print(f"Total Attempted: {session.get('total_attempted', 'MISSING')}")
        
        # Check problems_attempted structure
        problems = session.get('problems_attempted', [])
        print(f"Problems attempted count: {len(problems)}")
        
        if problems:
            first_problem = problems[0]
            print(f"First problem structure:")
            print(f"  - topics: {first_problem.get('topics', 'MISSING')}")
            print(f"  - difficulty: {first_problem.get('difficulty', 'MISSING')}")
        
        # Check performance metrics
        perf_metrics = session.get('performance_metrics', {})
        topic_metrics = perf_metrics.get('topic_metrics', {})
        difficulty_metrics = perf_metrics.get('difficulty_metrics', {})
        
        print(f"Topic metrics: {len(topic_metrics)} topics")
        print(f"Difficulty metrics: {len(difficulty_metrics)} difficulties")
        
        if topic_metrics:
            print(f"Topic metrics keys: {list(topic_metrics.keys())}")
        if difficulty_metrics:
            print(f"Difficulty metrics keys: {list(difficulty_metrics.keys())}")

if __name__ == "__main__":
    check_real_user_sessions()
