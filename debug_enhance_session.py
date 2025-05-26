#!/usr/bin/env python
import sys
sys.path.append('/Users/daoming/Documents/Github/goAIME')

from backend.services.db_service import get_db, enhance_session_data
import json

def debug_enhance_session():
    """Debug the enhance_session_data function with real data"""
    db = get_db()
    
    # Get a real session
    session = db.sessions.find_one({"username": "goAmy"})
    
    print("=== Original Session Data ===")
    print(f"Username: {session.get('username')}")
    print(f"User ID: {session.get('user_id')}")
    print(f"Problems attempted: {len(session.get('problems_attempted', []))}")
    
    # Run through enhance_session_data
    enhanced = enhance_session_data(session)
    
    print(f"\n=== Enhanced Session Data ===")
    print(f"Username: {enhanced.get('username')}")
    print(f"User ID: {enhanced.get('user_id')}")
    
    perf_metrics = enhanced.get('performance_metrics', {})
    topic_metrics = perf_metrics.get('topic_metrics', {})
    difficulty_metrics = perf_metrics.get('difficulty_metrics', {})
    
    print(f"Topic metrics count: {len(topic_metrics)}")
    print(f"Difficulty metrics count: {len(difficulty_metrics)}")
    
    if topic_metrics:
        print(f"Topic metrics: {topic_metrics}")
    if difficulty_metrics:
        print(f"Difficulty metrics: {difficulty_metrics}")
    
    # Debug the problems processing
    problems = session.get('problems_attempted', [])
    print(f"\n=== Debug Problems Processing ===")
    for i, problem in enumerate(problems[:3]):
        print(f"Problem {i+1}:")
        print(f"  Topics: {problem.get('topics')}")
        print(f"  Difficulty: {problem.get('difficulty')}")
        print(f"  Is correct: {problem.get('is_correct', problem.get('correct'))}")

if __name__ == "__main__":
    debug_enhance_session()
