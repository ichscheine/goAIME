#!/usr/bin/env python
import sys
sys.path.append('/Users/daoming/Documents/Github/goAIME')

from backend.services.db_service import save_user_session, get_db
from datetime import datetime, timezone
import uuid

def test_username_user_id_fix():
    """Test that username and user_id are properly set after the fix"""
    
    # Create test session data
    test_session_data = {
        'session_id': f'test_fix_{uuid.uuid4()}',
        'score': 5,
        'total_attempted': 10,
        'user_id': '68345fa47e94f1735c2f5792',  # goAmy's user_id
        'year': 2023,
        'contest': 'aime',
        'mode': 'practice',
        'problems_attempted': [
            {
                'problem_id': '68312df9afe4204d0e14d520',
                'problem_number': 1,
                'is_correct': True,
                'selected_answer': '100',
                'correct_answer': '100',
                'time_spent_ms': 30000,
                'difficulty': 'easy',
                'topics': ['Algebra', 'Continued Fractions']
            },
            {
                'problem_id': '68312df9afe4204d0e14d521',
                'problem_number': 2,
                'is_correct': False,
                'selected_answer': '50',
                'correct_answer': '75',
                'time_spent_ms': 45000,
                'difficulty': 'medium',
                'topics': ['Geometry', 'Area']
            }
        ]
    }
    
    # Test saving with proper username
    print("=== Testing save_user_session with username 'goAmy' ===")
    session_id = save_user_session('goAmy', test_session_data)
    print(f"Saved session ID: {session_id}")
    
    # Verify the saved session by finding it with the session_id we created
    db = get_db()
    saved_session = db.sessions.find_one({'session_id': test_session_data['session_id']})
    
    if saved_session:
        print(f"\n=== Verification ===")
        print(f"Session ID: {saved_session.get('session_id')}")
        print(f"Username: '{saved_session.get('username')}'")
        print(f"User ID: '{saved_session.get('user_id')}'")
        print(f"Score: {saved_session.get('score')}")
        print(f"Total attempted: {saved_session.get('total_attempted')}")
        
        # Check performance metrics
        perf_metrics = saved_session.get('performance_metrics', {})
        topic_metrics = perf_metrics.get('topic_metrics', {})
        difficulty_metrics = perf_metrics.get('difficulty_metrics', {})
        
        print(f"Topic metrics: {len(topic_metrics)} topics")
        print(f"Difficulty metrics: {len(difficulty_metrics)} difficulties")
        
        if topic_metrics:
            print(f"Topics: {list(topic_metrics.keys())}")
        if difficulty_metrics:
            print(f"Difficulties: {list(difficulty_metrics.keys())}")
        
        # Verify username and user_id are not None
        if saved_session.get('username') == 'goAmy':
            print("✅ Username correctly set to 'goAmy'")
        else:
            print(f"❌ Username issue: {saved_session.get('username')}")
            
        if saved_session.get('user_id') == '68345fa47e94f1735c2f5792':
            print("✅ User ID correctly set")
        else:
            print(f"❌ User ID issue: {saved_session.get('user_id')}")
        
        # Clean up - delete the test session
        db.sessions.delete_one({'session_id': test_session_data['session_id']})
        print(f"\n✅ Test session cleaned up")
    else:
        print("❌ Could not find saved session")

if __name__ == "__main__":
    test_username_user_id_fix()
