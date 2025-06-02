#!/usr/bin/env python3
# filepath: /Users/daoming/Documents/Github/goAIME/verify_test_user.py
"""
Script to verify if test_user_good_performer exists and has sessions
"""

from pymongo import MongoClient
import sys

try:
    # Connect to MongoDB directly
    client = MongoClient('mongodb://localhost:27017')
    db = client.goaime
    
    # Check if the user exists
    user = db.users.find_one({"username": "test_user_good_performer"})
    if user:
        print(f"User test_user_good_performer exists with ID: {user['_id']}")
    else:
        print("User test_user_good_performer does not exist")
    
    # Check if the user has sessions
    session_count = db.sessions.count_documents({"username": "test_user_good_performer"})
    print(f"User has {session_count} sessions")
    
    # Check average accuracy
    if session_count > 0:
        pipeline = [
            {"$match": {"username": "test_user_good_performer"}},
            {"$group": {
                "_id": "$username",
                "avgAccuracy": {"$avg": "$accuracy"}
            }}
        ]
        
        avg_accuracy = list(db.sessions.aggregate(pipeline))
        if avg_accuracy:
            print(f"Average accuracy: {avg_accuracy[0].get('avgAccuracy', 0):.2f}%")
    
    # Print the first session for inspection
    if session_count > 0:
        print("\nFirst session sample:")
        session = db.sessions.find_one({"username": "test_user_good_performer"})
        
        # Print relevant information from the session
        print(f"  Session ID: {session['_id']}")
        print(f"  Contest: {session.get('contest', 'N/A')}")
        print(f"  Score: {session.get('score', 'N/A')}")
        print(f"  Accuracy: {session.get('accuracy', 'N/A')}")
        print(f"  Total correct: {session.get('total_correct', 'N/A')}")
        print(f"  Total attempted: {session.get('total_attempted', 'N/A')}")
        
        # Check how many problems are correct
        if 'problems_attempted' in session:
            problems = session['problems_attempted']
            correct_count = sum(1 for p in problems if p.get('is_correct', False))
            print(f"  Problems attempted: {len(problems)}")
            print(f"  Problems correct: {correct_count} ({(correct_count/len(problems)*100):.2f}%)")
    
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
