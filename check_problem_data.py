#!/usr/bin/env python
import sys
sys.path.append('/Users/daoming/Documents/Github/goAIME')

from backend.services.db_service import get_db
import json

def check_problem_data():
    """Check how topics and difficulties are stored in problems collection"""
    db = get_db()
    
    # Get a few problems to see their structure
    problems = list(db.problems.find().limit(3))
    
    print("=== Problem Collection Structure ===")
    for i, problem in enumerate(problems, 1):
        print(f"\n--- Problem {i} ---")
        print(f"Problem ID: {problem.get('_id')}")
        print(f"Title: {problem.get('title', 'MISSING')}")
        print(f"Difficulty: {problem.get('difficulty', 'MISSING')}")
        print(f"Topics: {problem.get('topics', 'MISSING')}")
        print(f"Category: {problem.get('category', 'MISSING')}")
        
    # Also check a session's problem to see what data is available
    session = db.sessions.find_one({"username": "goAmy"})
    if session and session.get('problems_attempted'):
        first_problem = session['problems_attempted'][0]
        print(f"\n=== Session Problem Data ===")
        print(f"Problem ID: {first_problem.get('problem_id')}")
        print(f"Topics in session: {first_problem.get('topics')}")
        print(f"Difficulty in session: {first_problem.get('difficulty')}")
        
        # Try to find this problem in the problems collection
        problem_id = first_problem.get('problem_id')
        if problem_id:
            db_problem = db.problems.find_one({"_id": problem_id})
            if db_problem:
                print(f"\n=== Corresponding DB Problem ===")
                print(f"Topics in DB: {db_problem.get('topics')}")
                print(f"Difficulty in DB: {db_problem.get('difficulty')}")

if __name__ == "__main__":
    check_problem_data()
