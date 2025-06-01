#!/usr/bin/env python3
"""
Test the user progress data logic directly (without Flask)
"""

import os
import sys
sys.path.append('/Users/daoming/Documents/Github/goAIME/backend')

from services.db_service import get_db
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/Users/daoming/Documents/Github/goAIME/.env')

def test_progress_logic(username):
    """Test the progress data aggregation logic for a user"""
    print(f"\n=== Testing progress logic for user: {username} ===")
    
    try:
        # Get the database connection
        db = get_db()
        
        # Query to find all sessions for the user (same as in the API)
        user_sessions = list(db.sessions.find(
            {"username": username},
            {
                "session_id": 1,
                "completed_at": 1,
                "year": 1,
                "contest": 1,
                "mode": 1,
                "score": 1,
                "total_attempted": 1,
                "topic_performance": 1,
                "difficulty_performance": 1,
                "performance_metrics": 1
            }
        ).sort("completed_at", -1))
        
        print(f"Found {len(user_sessions)} sessions")
        
        if not user_sessions:
            print("No sessions found")
            return
            
        # Initialize aggregation (same logic as API)
        all_topics = {}
        all_difficulties = {}
        
        # Process each session
        for session in user_sessions:
            # Aggregate topic performance
            session_topics = session.get("topic_performance", {})
            for topic, data in session_topics.items():
                if topic not in all_topics:
                    all_topics[topic] = {"attempted": 0, "correct": 0}
                
                all_topics[topic]["attempted"] += data.get("attempted", 0)
                all_topics[topic]["correct"] += data.get("correct", 0)
            
            # Aggregate difficulty performance
            session_difficulties = session.get("difficulty_performance", {})
            for difficulty, data in session_difficulties.items():
                if difficulty not in all_difficulties:
                    all_difficulties[difficulty] = {"attempted": 0, "correct": 0}
                
                all_difficulties[difficulty]["attempted"] += data.get("attempted", 0)
                all_difficulties[difficulty]["correct"] += data.get("correct", 0)
        
        # Calculate accuracy for topics
        for topic, data in all_topics.items():
            if data["attempted"] > 0:
                data["accuracy"] = (data["correct"] / data["attempted"]) * 100
            else:
                data["accuracy"] = 0
        
        # Calculate accuracy for difficulties
        for difficulty, data in all_difficulties.items():
            if data["attempted"] > 0:
                data["accuracy"] = (data["correct"] / data["attempted"]) * 100
            else:
                data["accuracy"] = 0
        
        # Show results
        print(f"Topic performance aggregation:")
        print(f"  Total topics: {len(all_topics)}")
        
        # Show top 5 topics by attempts
        sorted_topics = sorted(all_topics.items(), key=lambda x: x[1]['attempted'], reverse=True)[:5]
        for topic, data in sorted_topics:
            print(f"  {topic}: {data['correct']}/{data['attempted']} = {data['accuracy']:.1f}%")
        
        print(f"\nDifficulty performance aggregation:")
        for difficulty, data in all_difficulties.items():
            print(f"  {difficulty}: {data['correct']}/{data['attempted']} = {data['accuracy']:.1f}%")
            
        # Check if any topics/difficulties have data
        has_topic_data = any(data['attempted'] > 0 for data in all_topics.values())
        has_diff_data = any(data['attempted'] > 0 for data in all_difficulties.values())
        
        print(f"\nData availability:")
        print(f"  Has topic data: {has_topic_data}")
        print(f"  Has difficulty data: {has_diff_data}")
        
        if has_topic_data and has_diff_data:
            print("  ✅ Both topic and difficulty performance data are available!")
        else:
            print("  ❌ Missing performance data")
            
    except Exception as e:
        print(f"Error testing progress logic for user {username}: {e}")
        import traceback
        traceback.print_exc()

def main():
    """Test the progress logic for key users"""
    test_users = ['goAmy', 'wongwong', 'dq']
    
    print("=== User Progress Logic Test ===")
    
    for username in test_users:
        test_progress_logic(username)
        
    print("\n=== Logic Test Complete ===")

if __name__ == "__main__":
    main()
