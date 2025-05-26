#!/usr/bin/env python
import sys
sys.path.append('/Users/daoming/Documents/Github/goAIME')

from backend.services.db_service import get_db
import json

def debug_recent_session_problems():
    """Debug why the recent session has no topics/difficulty in problems"""
    db = get_db()
    
    # Get the recent session with issues
    recent_session = db.sessions.find_one({"session_id": "91e107af-1980-402e-b651-ad895dd2e1c7"})
    
    if recent_session:
        print("=== Recent Session Problems Analysis ===")
        problems = recent_session.get('problems_attempted', [])
        
        print(f"Total problems: {len(problems)}")
        
        # Check first few problems in detail
        for i, problem in enumerate(problems[:3], 1):
            print(f"\n--- Problem {i} ---")
            print(f"Problem ID: {problem.get('problem_id')}")
            print(f"Problem number: {problem.get('problem_number')}")
            print(f"Topics: {problem.get('topics')} (type: {type(problem.get('topics'))})")
            print(f"Difficulty: {problem.get('difficulty')} (type: {type(problem.get('difficulty'))})")
            print(f"Is correct: {problem.get('is_correct')}")
            print(f"All keys: {list(problem.keys())}")
        
        # Now check if the problem exists in the problems collection
        if problems:
            first_problem_id = problems[0].get('problem_id')
            print(f"\n=== Checking Problem in Database ===")
            print(f"Looking for problem_id: {first_problem_id}")
            
            if first_problem_id:
                try:
                    from bson import ObjectId
                    db_problem = db.problems.find_one({"_id": ObjectId(first_problem_id)})
                    if db_problem:
                        print(f"Found in DB - Topics: {db_problem.get('topics')}")
                        print(f"Found in DB - Difficulty: {db_problem.get('difficulty')}")
                    else:
                        print("Problem not found in problems collection")
                except Exception as e:
                    print(f"Error looking up problem: {e}")
                    # Try without ObjectId conversion
                    db_problem = db.problems.find_one({"_id": first_problem_id})
                    if db_problem:
                        print(f"Found in DB (string ID) - Topics: {db_problem.get('topics')}")
                        print(f"Found in DB (string ID) - Difficulty: {db_problem.get('difficulty')}")

if __name__ == "__main__":
    debug_recent_session_problems()
