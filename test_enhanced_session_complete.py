#!/usr/bin/env python3
"""
Test the enhanced session functionality end-to-end
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from services.db_service import get_db, save_user_session
from bson import ObjectId
import json
import uuid
from datetime import datetime

def test_enhanced_session_functionality():
    """Test that enhanced session functionality works correctly"""
    db = get_db()
    
    print("Testing Enhanced Session Functionality")
    print("=" * 60)
    
    # Get a real user and problems from database
    user = db.users.find_one({"username": "goAmy"})
    if not user:
        print("❌ No user found!")
        return
    
    problems = list(db.problems.find({}).limit(5))
    if not problems:
        print("❌ No problems found!")
        return
    
    print(f"✅ Found user: {user['username']} (ID: {user['_id']})")
    print(f"✅ Found {len(problems)} problems")
    print()
    
    # Create test session data that simulates the problematic scenario
    test_session_id = str(uuid.uuid4())
    
    # Simulate session data with user_id as 'None' string and missing topic/difficulty data
    session_data = {
        "session_id": test_session_id,
        "user_id": "None",  # This is the problem we're fixing
        "username": "goAmy",
        "start_time": datetime.utcnow(),
        "end_time": datetime.utcnow(),
        "total_attempted": len(problems),
        "problems_attempted": []
    }
    
    # Add problems with missing topics/difficulty (simulating the issue)
    for i, problem in enumerate(problems):
        problem_data = {
            "problem_id": str(problem["_id"]),
            "attempted_at": datetime.utcnow(),
            "is_correct": i % 2 == 0,  # Alternate correct/incorrect
            "topics": [],  # Missing topics - this is the issue we're fixing
            "difficulty": None,  # Missing difficulty - this is the issue we're fixing
            "user_answer": f"test_answer_{i}",
            "correct_answer": f"correct_answer_{i}",
            "time_taken": 30 + i * 10
        }
        session_data["problems_attempted"].append(problem_data)
    
    print("BEFORE ENHANCEMENT:")
    print(f"User ID: {session_data['user_id']}")
    print(f"Problems with missing data: {len([p for p in session_data['problems_attempted'] if not p['topics']])}")
    print()
    
    # Save the session using our enhanced function
    print("Saving session with enhanced functionality...")
    try:
        result = save_user_session("goAmy", session_data)  # Correct parameter order: username first
        print(f"✅ Session saved successfully: {result}")
    except Exception as e:
        print(f"❌ Error saving session: {e}")
        return
    
    print()
    
    # Retrieve the saved session and verify the enhancements
    saved_session = db.sessions.find_one({"session_id": test_session_id})
    
    if not saved_session:
        print("❌ Session not found after saving!")
        return
    
    print("AFTER ENHANCEMENT:")
    print(f"✅ Session retrieved successfully")
    print(f"User ID: {saved_session.get('user_id')}")
    print(f"Username: {saved_session.get('username')}")
    print()
    
    # Check performance metrics
    perf_metrics = saved_session.get('performance_metrics', {})
    topic_metrics = perf_metrics.get('topic_metrics', {})
    difficulty_metrics = perf_metrics.get('difficulty_metrics', {})
    
    print("PERFORMANCE METRICS:")
    print(f"Topic metrics count: {len(topic_metrics)}")
    print(f"Difficulty metrics count: {len(difficulty_metrics)}")
    print()
    
    if topic_metrics:
        print("Topic Metrics:")
        for topic, data in topic_metrics.items():
            print(f"  {topic}: {data}")
        print()
    else:
        print("❌ No topic metrics found!")
    
    if difficulty_metrics:
        print("Difficulty Metrics:")
        for difficulty, data in difficulty_metrics.items():
            print(f"  {difficulty}: {data}")
        print()
    else:
        print("❌ No difficulty metrics found!")
    
    # Check problems data
    problems_attempted = saved_session.get('problems_attempted', [])
    print(f"PROBLEMS DATA ({len(problems_attempted)} problems):")
    
    all_have_topics = True
    all_have_difficulty = True
    
    for i, problem in enumerate(problems_attempted):
        topics = problem.get('topics', [])
        difficulty = problem.get('difficulty')
        
        if not topics:
            all_have_topics = False
        if not difficulty:
            all_have_difficulty = False
        
        print(f"  Problem {i+1}:")
        print(f"    Topics: {topics}")
        print(f"    Difficulty: {difficulty}")
    
    print()
    print("VERIFICATION RESULTS:")
    print(f"✅ User ID fixed: {saved_session.get('user_id') != 'None'}")
    print(f"✅ Username preserved: {saved_session.get('username') == 'goAmy'}")
    print(f"✅ All problems have topics: {all_have_topics}")
    print(f"✅ All problems have difficulty: {all_have_difficulty}")
    print(f"✅ Topic metrics populated: {len(topic_metrics) > 0}")
    print(f"✅ Difficulty metrics populated: {len(difficulty_metrics) > 0}")
    
    # Clean up - remove test session
    print()
    print("Cleaning up test session...")
    db.sessions.delete_one({"session_id": test_session_id})
    print("✅ Test session removed")

if __name__ == "__main__":
    test_enhanced_session_functionality()
