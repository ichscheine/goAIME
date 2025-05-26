#!/usr/bin/env python
import sys
sys.path.append('/Users/daoming/Documents/Github/goAIME')

from backend.services.db_service import get_db, enhance_session_data
from datetime import datetime, timezone

def fix_specific_session():
    """Fix the specific problematic session in the database"""
    db = get_db()
    
    # Get the specific session
    session = db.sessions.find_one({"session_id": "91e107af-1980-402e-b651-ad895dd2e1c7"})
    
    if not session:
        print("❌ Session not found!")
        return
    
    print("=== Fixing session 91e107af-1980-402e-b651-ad895dd2e1c7 ===")
    print("Session found in database")
    
    # Run enhance_session_data to fix the issues
    print("Running enhance_session_data...")
    enhanced_data = enhance_session_data(session, 'goAmy')
    print("Enhanced data created successfully")
    
    # Update the session in the database
    print("Updating session in database...")
    result = db.sessions.update_one(
        {'_id': session['_id']},
        {
            '$set': {
                **enhanced_data,
                'fixed_at': datetime.now(timezone.utc),
                'fix_version': '2.1'
            }
        }
    )
    print(f"Update result: matched={result.matched_count}, modified={result.modified_count}")
    
    if result.modified_count > 0:
        print("✅ Successfully fixed the session in database")
        
        # Verify the fix
        updated_session = db.sessions.find_one({"session_id": "91e107af-1980-402e-b651-ad895dd2e1c7"})
        
        print(f"\n=== Verification ===")
        print(f"Username: '{updated_session.get('username')}'")
        print(f"User ID: '{updated_session.get('user_id')}'")
        
        perf_metrics = updated_session.get('performance_metrics', {})
        topic_metrics = perf_metrics.get('topic_metrics', {})
        difficulty_metrics = perf_metrics.get('difficulty_metrics', {})
        
        print(f"Topic metrics: {len(topic_metrics)} topics")
        print(f"Difficulty metrics: {len(difficulty_metrics)} difficulties")
        
        # Check first problem
        problems = updated_session.get('problems_attempted', [])
        if problems:
            first_problem = problems[0]
            print(f"First problem topics: {first_problem.get('topics')}")
            print(f"First problem difficulty: {first_problem.get('difficulty')}")
        
        print(f"✅ Session successfully fixed and updated in database!")
        
    else:
        print("❌ Failed to update session in database")
        print("This might be because the data is already the same")

if __name__ == "__main__":
    fix_specific_session()
