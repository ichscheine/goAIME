#!/usr/bin/env python
import sys
sys.path.append('/Users/daoming/Documents/Github/goAIME')

from backend.services.db_service import get_db
import json

def check_none_username_session():
    """Check the session that has None as username"""
    db = get_db()
    
    # Get the session with None username
    none_session = db.sessions.find_one({"username": "None"})
    
    if none_session:
        print("=== Session with username='None' ===")
        print(f"Session ID: {none_session.get('session_id', 'MISSING')}")
        print(f"Username: '{none_session.get('username', 'MISSING')}'")
        print(f"User ID: '{none_session.get('user_id', 'MISSING')}'")
        print(f"Created at: {none_session.get('created_at', 'MISSING')}")
        print(f"Score: {none_session.get('score', 'MISSING')}")
        print(f"Total attempted: {none_session.get('total_attempted', 'MISSING')}")
        print(f"Contest: {none_session.get('contest', 'MISSING')}")
        print(f"Year: {none_session.get('year', 'MISSING')}")
        print(f"Mode: {none_session.get('mode', 'MISSING')}")
        
        # Check if this might be a recent test session
        problems = none_session.get('problems_attempted', [])
        print(f"Problems attempted: {len(problems)}")
        
        if problems and len(problems) > 0:
            first_problem = problems[0]
            print(f"First problem: {first_problem.get('problem_id')}")
            print(f"First problem topics: {first_problem.get('topics')}")
    else:
        print("No session found with username='None'")
    
    # Also check the most recent sessions by creation time
    print(f"\n=== Most recent sessions by creation time ===")
    recent_sessions = list(db.sessions.find().sort("created_at", -1).limit(5))
    for i, session in enumerate(recent_sessions, 1):
        print(f"{i}. Username: '{session.get('username')}' | Session ID: {session.get('session_id')} | Created: {session.get('created_at')}")

if __name__ == "__main__":
    check_none_username_session()
