#!/usr/bin/env python3
"""
Quick script to inspect the sessions and problems collections
"""

import sys
try:
    from services.db_service import get_db
except ImportError:
    print("Error: Could not import database service. Make sure to run this from the backend directory.")
    sys.exit(1)

def inspect_collections():
    """Inspect the database collections"""
    db = get_db()
    
    # Check sessions collection
    print("=== SESSIONS COLLECTION ===")
    sessions_count = db.sessions.count_documents({})
    print(f"Total sessions: {sessions_count}")
    
    if sessions_count > 0:
        # Get a sample session
        sample_session = db.sessions.find_one({})
        print(f"Sample session structure:")
        for key in sample_session.keys():
            if key == 'problems' and sample_session[key]:
                print(f"  {key}: (array with {len(sample_session[key])} items)")
                if sample_session[key]:
                    print(f"    Sample problem: {sample_session[key][0]}")
            else:
                print(f"  {key}: {type(sample_session[key])}")
    
    # Check problems collection  
    print("\n=== PROBLEMS COLLECTION ===")
    problems_count = db.problems.count_documents({})
    print(f"Total problems: {problems_count}")
    
    if problems_count > 0:
        # Get a sample problem
        sample_problem = db.problems.find_one({})
        print(f"Sample problem structure:")
        for key, value in sample_problem.items():
            print(f"  {key}: {value}")
    
    # Check if sessions have usernames we recognize
    print("\n=== USERNAMES IN SESSIONS ===")
    usernames = db.sessions.distinct("username")
    print(f"Usernames: {usernames}")

if __name__ == "__main__":
    inspect_collections()
