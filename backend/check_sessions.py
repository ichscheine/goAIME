#!/usr/bin/env python3
"""
Check the structure of problems_attempted in sessions
"""

import sys
try:
    from services.db_service import get_db
except ImportError:
    print("Error: Could not import database service. Make sure to run this from the backend directory.")
    sys.exit(1)

def check_problems_attempted():
    """Check the structure of problems_attempted"""
    db = get_db()
    
    # Get a session with problems_attempted
    session = db.sessions.find_one({'problems_attempted': {'$exists': True, '$ne': []}})
    
    if session:
        print(f"Session for user: {session.get('username')}")
        print(f"Number of problems attempted: {len(session.get('problems_attempted', []))}")
        
        # Show structure of first problem
        if session.get('problems_attempted'):
            first_problem = session['problems_attempted'][0]
            print(f"Sample problem structure:")
            for key, value in first_problem.items():
                print(f"  {key}: {value}")
                
        # Check if sessions already have topic/difficulty performance
        print(f"\nHas topic_performance: {'topic_performance' in session}")
        print(f"Has difficulty_performance: {'difficulty_performance' in session}")
        
        if 'topic_performance' in session:
            print(f"Topic performance: {session['topic_performance']}")
        if 'difficulty_performance' in session:
            print(f"Difficulty performance: {session['difficulty_performance']}")
    else:
        print("No sessions found with problems_attempted")

if __name__ == "__main__":
    check_problems_attempted()
