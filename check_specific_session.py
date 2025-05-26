#!/usr/bin/env python
import sys
sys.path.append('/Users/daoming/Documents/Github/goAIME')

from backend.services.db_service import get_db
import json

def check_specific_session():
    """Check the specific session mentioned by the user"""
    db = get_db()
    
    # Find the specific session
    session = db.sessions.find_one({"session_id": "91e107af-1980-402e-b651-ad895dd2e1c7"})
    
    if not session:
        print("❌ Session not found!")
        return
    
    print("=== Session 91e107af-1980-402e-b651-ad895dd2e1c7 ===")
    print(f"Username: '{session.get('username')}'")
    print(f"User ID: '{session.get('user_id')}'")
    print(f"Created at: {session.get('created_at')}")
    print(f"Score: {session.get('score')}")
    print(f"Total attempted: {session.get('total_attempted')}")
    
    # Check performance metrics
    perf_metrics = session.get('performance_metrics', {})
    topic_metrics = perf_metrics.get('topic_metrics', {})
    difficulty_metrics = perf_metrics.get('difficulty_metrics', {})
    
    print(f"\nPerformance metrics structure:")
    print(f"  Keys: {list(perf_metrics.keys()) if perf_metrics else 'None'}")
    print(f"  Topic metrics: {len(topic_metrics)} topics")
    print(f"  Difficulty metrics: {len(difficulty_metrics)} difficulties")
    
    # Check problems attempted in detail
    problems = session.get('problems_attempted', [])
    print(f"\nProblems attempted: {len(problems)} problems")
    
    if problems:
        for i, problem in enumerate(problems[:5]):  # Check first 5 problems
            print(f"\n  Problem {i+1}:")
            print(f"    Problem ID: {problem.get('problem_id')}")
            print(f"    Topics: {problem.get('topics')} (type: {type(problem.get('topics'))})")
            print(f"    Difficulty: {problem.get('difficulty')} (type: {type(problem.get('difficulty'))})")
            print(f"    Is correct: {problem.get('is_correct')}")
            
            # Check if this problem exists in problems collection
            problem_id = problem.get('problem_id')
            if problem_id:
                try:
                    from bson import ObjectId
                    db_problem = db.problems.find_one({"_id": ObjectId(problem_id)})
                    if db_problem:
                        print(f"    DB Topics: {db_problem.get('topics')}")
                        print(f"    DB Difficulty: {db_problem.get('difficulty')}")
                    else:
                        print(f"    ❌ Problem not found in DB")
                except:
                    print(f"    ❌ Error checking problem in DB")
    
    # Check if empty topic_metrics and difficulty_metrics are the issue
    if len(topic_metrics) == 0:
        print(f"\n❌ ISSUE: topic_metrics is empty!")
    if len(difficulty_metrics) == 0:
        print(f"❌ ISSUE: difficulty_metrics is empty!")

if __name__ == "__main__":
    check_specific_session()
