"""
Script to verify that topic_performance and difficulty_performance data
are being correctly calculated from actual problem attempts.

This script:
1. Connects to the MongoDB database
2. Finds a session for test_user_good_performer
3. Verifies if topic_performance matches the actual problem attempts
4. Creates a new test session to validate that our fix works
"""

import os
import sys
import json
from datetime import datetime, timezone
from pymongo import MongoClient
from bson.objectid import ObjectId
import uuid

def connect_to_db():
    """Connect to the MongoDB database"""
    try:
        # Load environment variables
        mongodb_uri = os.environ.get("MONGODB_URI")
        if not mongodb_uri:
            # Try to load from .env file
            try:
                with open('/Users/daoming/Documents/Github/goAIME/.env', 'r') as f:
                    for line in f:
                        if line.startswith('MONGODB_URI='):
                            mongodb_uri = line.strip().split('=', 1)[1].strip('"\'')
                            break
            except Exception as e:
                print(f"Error loading .env file: {e}")
                
        if not mongodb_uri:
            print("MongoDB URI not found. Please set MONGODB_URI environment variable.")
            sys.exit(1)
            
        # Connect to MongoDB
        client = MongoClient(mongodb_uri)
        db = client["goaime"]
        print("Connected to MongoDB database")
        return db
    except Exception as e:
        print(f"Error connecting to database: {e}")
        sys.exit(1)

def analyze_session(db, session_id=None, username="test_user_good_performer"):
    """Analyze a session for the specified user"""
    # Find a session for the user
    if session_id:
        session = db.sessions.find_one({"_id": ObjectId(session_id)})
    else:
        session = db.sessions.find_one({"username": username})
        
    if not session:
        print(f"No session found for user {username}")
        return
        
    print(f"Analyzing session: {session.get('session_id')}")
    
    # Extract problems attempted
    problems = session.get("problems_attempted", [])
    if not problems:
        print("No problems found in session")
        return
        
    print(f"Found {len(problems)} problems in session")
    
    # Calculate topic performance directly from problems
    topic_performance = {}
    for problem in problems:
        topics = problem.get("topics", [])
        is_correct = problem.get("is_correct", False)
        
        for topic in topics:
            if topic not in topic_performance:
                topic_performance[topic] = {"attempted": 0, "correct": 0, "accuracy": 0}
                
            topic_performance[topic]["attempted"] += 1
            if is_correct:
                topic_performance[topic]["correct"] += 1
    
    # Calculate accuracy for each topic
    for topic, data in topic_performance.items():
        if data["attempted"] > 0:
            data["accuracy"] = round((data["correct"] / data["attempted"]) * 100, 2)
        else:
            data["accuracy"] = 0
    
    # Get the session's topic_performance
    session_topic_performance = session.get("topic_performance", {})
    
    # Compare calculated vs stored topic performance
    print("\nCOMPARISON OF TOPIC PERFORMANCE")
    print("=" * 80)
    print(f"{'Topic':<30} {'Calculated':<30} {'Stored':<30}")
    print("-" * 80)
    
    all_topics = set(list(topic_performance.keys()) + list(session_topic_performance.keys()))
    
    matches = 0
    mismatches = 0
    
    for topic in sorted(all_topics):
        calc = topic_performance.get(topic, {})
        stored = session_topic_performance.get(topic, {})
        
        calc_str = f"A:{calc.get('attempted',0)} C:{calc.get('correct',0)} ({calc.get('accuracy',0)}%)"
        stored_str = f"A:{stored.get('attempted',0)} C:{stored.get('correct',0)} ({stored.get('accuracy',0)}%)"
        
        # Check if they match
        is_match = (calc.get('attempted',0) == stored.get('attempted',0) and 
                   calc.get('correct',0) == stored.get('correct',0))
        
        match_indicator = "✓" if is_match else "✗"
        
        if is_match:
            matches += 1
        else:
            mismatches += 1
            
        print(f"{topic:<30} {calc_str:<30} {stored_str:<30} {match_indicator}")
    
    # Print summary
    print("\nSUMMARY")
    print("=" * 80)
    print(f"Total topics: {len(all_topics)}")
    print(f"Matching topics: {matches}")
    print(f"Mismatching topics: {mismatches}")
    
    # Calculate overall accuracy
    total_correct = sum(p.get('is_correct', False) for p in problems)
    total_attempted = len(problems)
    overall_accuracy = round((total_correct / total_attempted) * 100, 2) if total_attempted > 0 else 0
    
    print(f"\nOverall accuracy: {overall_accuracy}%")
    print(f"Session score: {session.get('score', 0)}")
    print(f"Session total attempted: {session.get('total_attempted', 0)}")
    print(f"Session accuracy: {session.get('accuracy', 0)}%")

    return session

def create_test_session(db, username="test_user_good_performer"):
    """Create a test session to verify our fix"""
    print("\nCreating test session...")
    
    # Create a simple session with a few problems
    session_id = str(uuid.uuid4())
    
    # Create problems with different topics
    problems = [
        {
            "problem_number": 1,
            "problem_id": "problem1",
            "is_correct": True,
            "selected_answer": "A",
            "time_spent_ms": 1000,
            "time_spent_seconds": 1.0,
            "attempt_timestamp": datetime.now(timezone.utc).isoformat(),
            "difficulty": "easy",
            "topics": ["Algebra", "Equations"]
        },
        {
            "problem_number": 2,
            "problem_id": "problem2",
            "is_correct": False,
            "selected_answer": "B",
            "time_spent_ms": 2000,
            "time_spent_seconds": 2.0,
            "attempt_timestamp": datetime.now(timezone.utc).isoformat(),
            "difficulty": "medium",
            "topics": ["Geometry", "Triangles"]
        },
        {
            "problem_number": 3,
            "problem_id": "problem3",
            "is_correct": True,
            "selected_answer": "C",
            "time_spent_ms": 1500,
            "time_spent_seconds": 1.5,
            "attempt_timestamp": datetime.now(timezone.utc).isoformat(),
            "difficulty": "easy",
            "topics": ["Algebra", "Equations"]
        }
    ]
    
    # Create session data
    session_data = {
        "session_id": session_id,
        "username": username,
        "year": 2022,
        "contest": "AMC 10A",
        "mode": "practice",
        "score": 2,
        "total_attempted": 3,
        "problems_attempted": problems,
        "total_time_ms": 4500
    }
    
    # Import the function we modified
    sys.path.append('/Users/daoming/Documents/Github/goAIME')
    from backend.services.db_service import enhance_session_data
    
    # Enhance session data
    enhanced_data = enhance_session_data(session_data, username)
    
    # Save to database
    result = db.sessions.insert_one(enhanced_data)
    print(f"Created test session with ID: {result.inserted_id}")
    
    # Analyze the new session
    return str(result.inserted_id)

def main():
    """Main function"""
    print("Verifying topic_performance data calculation...")
    
    # Connect to database
    db = connect_to_db()
    
    # Analyze an existing session
    print("\n1. ANALYZING EXISTING SESSION")
    print("=" * 80)
    analyze_session(db)
    
    # Create and analyze a test session
    print("\n2. CREATING AND ANALYZING TEST SESSION")
    print("=" * 80)
    new_session_id = create_test_session(db)
    
    if new_session_id:
        analyze_session(db, new_session_id)

if __name__ == "__main__":
    main()
