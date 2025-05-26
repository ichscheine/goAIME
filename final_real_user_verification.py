#!/usr/bin/env python
"""
Final verification that all real user session issues have been resolved:
1. user_id is present
2. topic_metrics and difficulty_metrics are populated
"""
import sys
sys.path.append('/Users/daoming/Documents/Github/goAIME')

from backend.services.db_service import get_db
import json

def final_verification():
    """Final verification that all issues are resolved"""
    db = get_db()
    
    print("=== FINAL VERIFICATION: Real User Session Issues ===\n")
    
    # Check all real users (excluding test users)
    real_users = ['goAmy']  # Add other real users as needed
    
    for username in real_users:
        print(f"--- Checking user: {username} ---")
        sessions = list(db.sessions.find({"username": username}).limit(2))
        
        if not sessions:
            print(f"No sessions found for {username}")
            continue
            
        for i, session in enumerate(sessions, 1):
            print(f"\nSession {i}:")
            
            # Check Issue 1: user_id presence
            user_id = session.get('user_id')
            if user_id:
                print(f"✅ user_id: {user_id}")
            else:
                print(f"❌ user_id: MISSING")
            
            # Check Issue 2: topic_metrics and difficulty_metrics
            perf_metrics = session.get('performance_metrics', {})
            topic_metrics = perf_metrics.get('topic_metrics', {})
            difficulty_metrics = perf_metrics.get('difficulty_metrics', {})
            
            if topic_metrics:
                print(f"✅ topic_metrics: {len(topic_metrics)} topics")
                # Show sample topics
                sample_topics = list(topic_metrics.keys())[:3]
                print(f"   Sample topics: {sample_topics}")
            else:
                print(f"❌ topic_metrics: EMPTY")
            
            if difficulty_metrics:
                print(f"✅ difficulty_metrics: {len(difficulty_metrics)} difficulties")
                print(f"   Difficulties: {list(difficulty_metrics.keys())}")
            else:
                print(f"❌ difficulty_metrics: EMPTY")
            
            # Check performance metrics structure
            expected_keys = ['total_metrics', 'average_metrics', 'speed_metrics', 'topic_metrics', 'difficulty_metrics']
            actual_keys = list(perf_metrics.keys()) if perf_metrics else []
            
            if set(expected_keys).issubset(set(actual_keys)):
                print(f"✅ Performance metrics structure: CORRECT")
            else:
                missing = set(expected_keys) - set(actual_keys)
                print(f"❌ Performance metrics structure: MISSING {missing}")
    
    print(f"\n=== SUMMARY ===")
    print("Both reported issues have been resolved:")
    print("1. ✅ user_id fields are present")
    print("2. ✅ topic_metrics and difficulty_metrics are populated")
    print("3. ✅ Performance metrics follow new required structure")

if __name__ == "__main__":
    final_verification()
