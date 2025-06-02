#!/usr/bin/env python3
# filepath: /Users/daoming/Documents/Github/goAIME/check_test_user.py
"""
Simple script to check if test_user_good_performer exists and has sessions.
"""

from pymongo import MongoClient

# Use direct MongoDB connection
client = MongoClient('mongodb://localhost:27017')
db = client.goaime

# Check if the test user exists
test_user = db.users.find_one({"username": "test_user_good_performer"})
if test_user:
    print(f"User 'test_user_good_performer' exists with ID: {test_user['_id']}")
    
    # Check the user's sessions
    sessions = list(db.sessions.find({"username": "test_user_good_performer"}))
    print(f"Found {len(sessions)} sessions for this user")
    
    if sessions:
        # Calculate overall stats
        total_problems = 0
        total_correct = 0
        
        for session in sessions:
            if 'problems_attempted' in session:
                problems = session['problems_attempted']
                correct = sum(1 for p in problems if p.get('is_correct', False))
                
                total_problems += len(problems)
                total_correct += correct
        
        # Print stats
        if total_problems > 0:
            overall_accuracy = (total_correct / total_problems) * 100
            print(f"Total problems: {total_problems}")
            print(f"Correctly solved: {total_correct}")
            print(f"Overall accuracy: {overall_accuracy:.2f}%")
else:
    print("User 'test_user_good_performer' does not exist")
    
# Also check for goAmy for comparison
goamy = db.users.find_one({"username": "goAmy"})
if goamy:
    print(f"\nUser 'goAmy' exists with ID: {goamy['_id']}")
    
    # Check goAmy's sessions
    sessions = list(db.sessions.find({"username": "goAmy"}))
    print(f"Found {len(sessions)} sessions for goAmy")
    
    if sessions:
        # Calculate overall stats
        total_problems = 0
        total_correct = 0
        
        for session in sessions:
            if 'problems_attempted' in session:
                problems = session['problems_attempted']
                correct = sum(1 for p in problems if p.get('is_correct', False))
                
                total_problems += len(problems)
                total_correct += correct
        
        # Print stats
        if total_problems > 0:
            overall_accuracy = (total_correct / total_problems) * 100
            print(f"Total problems: {total_problems}")
            print(f"Correctly solved: {total_correct}")
            print(f"Overall accuracy: {overall_accuracy:.2f}%")
else:
    print("\nUser 'goAmy' does not exist")
