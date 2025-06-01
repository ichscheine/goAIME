#!/usr/bin/env python3
"""
Direct test of progress data to verify our migration worked.
This bypasses the Flask server and directly checks the database.
"""

import os
import sys
sys.path.append('/Users/daoming/Documents/Github/goAIME/backend')

from services.db_service import get_db
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/Users/daoming/Documents/Github/goAIME/.env')

def test_user_progress(username):
    """Test progress data for a specific user"""
    print(f"\n=== Testing progress data for user: {username} ===")
    
    try:
        # Get database connection
        db = get_db()
        
        # Get user data (check if user exists in users collection)
        user = db.users.find_one({"username": username})
        if user:
            print(f"User found in users collection: {user.get('username', 'N/A')}")
        else:
            print(f"User {username} not in users collection (session-only user)")
        
        # Get sessions
        sessions = list(db.sessions.find({"username": username}))
        print(f"Number of sessions: {len(sessions)}")
        
        if not sessions:
            print("No sessions found")
            return
            
        # Check if sessions have the new performance data
        sessions_with_topic_perf = 0
        sessions_with_difficulty_perf = 0
        
        for session in sessions:
            if session.get('topic_performance'):
                sessions_with_topic_perf += 1
            if session.get('difficulty_performance'):
                sessions_with_difficulty_perf += 1
                
        print(f"Sessions with topic_performance: {sessions_with_topic_perf}")
        print(f"Sessions with difficulty_performance: {sessions_with_difficulty_perf}")
        
        # Show sample data from first session
        if sessions:
            first_session = sessions[0]
            print(f"\nSample session data:")
            print(f"Session ID: {first_session.get('_id')}")
            print(f"Problems attempted: {len(first_session.get('problems_attempted', []))}")
            
            topic_perf = first_session.get('topic_performance', {})
            if topic_perf:
                print(f"Topics in performance data: {len(topic_perf)}")
                # Show top 3 topics
                sorted_topics = sorted(topic_perf.items(), key=lambda x: x[1]['attempted'], reverse=True)[:3]
                for topic, data in sorted_topics:
                    print(f"  {topic}: {data['correct']}/{data['attempted']} = {data['accuracy']:.1f}%")
            
            diff_perf = first_session.get('difficulty_performance', {})
            if diff_perf:
                print(f"Difficulty levels: {list(diff_perf.keys())}")
                for diff, data in diff_perf.items():
                    print(f"  {diff}: {data['correct']}/{data['attempted']} = {data['accuracy']:.1f}%")
                    
    except Exception as e:
        print(f"Error testing user {username}: {e}")

def main():
    """Test multiple users"""
    test_users = ['goAmy', 'wongwong', 'dq', 'test_user', 'kenny', 'test_user1']
    
    print("=== Progress Data Migration Verification ===")
    print(f"Testing {len(test_users)} users...")
    
    for username in test_users:
        test_user_progress(username)
        
    print("\n=== Test Complete ===")

if __name__ == "__main__":
    main()
