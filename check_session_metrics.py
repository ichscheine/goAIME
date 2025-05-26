#!/usr/bin/env python3
"""
Check the current state of topic_metrics and difficulty_metrics for session 91e107af-1980-402e-b651-ad895dd2e1c7
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from services.db_service import get_db
from bson import ObjectId
import json

def check_session_metrics():
    """Check the current metrics for the specific session"""
    db = get_db()
    
    session_id = "91e107af-1980-402e-b651-ad895dd2e1c7"
    
    print(f"Checking session: {session_id}")
    print("=" * 60)
    
    # Find the session
    session = db.user_sessions.find_one({"session_id": session_id})
    
    if not session:
        print("❌ Session not found!")
        return
    
    print(f"✅ Session found")
    print(f"Username: {session.get('username')}")
    print(f"User ID: {session.get('user_id')}")
    print(f"Total attempted: {session.get('total_attempted')}")
    print()
    
    # Check performance metrics
    perf_metrics = session.get('performance_metrics', {})
    topic_metrics = perf_metrics.get('topic_metrics', {})
    difficulty_metrics = perf_metrics.get('difficulty_metrics', {})
    
    print("TOPIC METRICS:")
    print(f"Count: {len(topic_metrics)}")
    if topic_metrics:
        for topic, data in topic_metrics.items():
            print(f"  {topic}: {data}")
    else:
        print("  ❌ EMPTY")
    print()
    
    print("DIFFICULTY METRICS:")
    print(f"Count: {len(difficulty_metrics)}")
    if difficulty_metrics:
        for difficulty, data in difficulty_metrics.items():
            print(f"  {difficulty}: {data}")
    else:
        print("  ❌ EMPTY")
    print()
    
    # Check problems data
    problems = session.get('problems_attempted', [])
    print(f"PROBLEMS DATA ({len(problems)} problems):")
    
    if problems:
        for i, problem in enumerate(problems):
            problem_id = problem.get('problem_id')
            topics = problem.get('topics', [])
            difficulty = problem.get('difficulty')
            print(f"  Problem {i+1} (ID: {problem_id}):")
            print(f"    Topics: {topics}")
            print(f"    Difficulty: {difficulty}")
            
            # Check if problem exists in database and has topics/difficulty
            if problem_id:
                try:
                    db_problem = db.problems.find_one({"_id": ObjectId(problem_id)})
                    if db_problem:
                        db_topics = db_problem.get('topics', [])
                        db_difficulty = db_problem.get('difficulty')
                        print(f"    DB Topics: {db_topics}")
                        print(f"    DB Difficulty: {db_difficulty}")
                        
                        if not topics and db_topics:
                            print(f"    ⚠️  Session missing topics, DB has: {db_topics}")
                        if not difficulty and db_difficulty:
                            print(f"    ⚠️  Session missing difficulty, DB has: {db_difficulty}")
                    else:
                        print(f"    ❌ Problem not found in database")
                except Exception as e:
                    print(f"    ❌ Error checking database: {e}")
            print()
    else:
        print("  ❌ NO PROBLEMS DATA")

if __name__ == "__main__":
    check_session_metrics()
