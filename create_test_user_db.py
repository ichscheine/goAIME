#!/usr/bin/env python3
# filepath: /Users/daoming/Documents/Github/goAIME/create_test_user_db.py
"""
Script to create a test user with enhanced performance data by duplicating goAmy's sessions.
This script uses the project's database service for MongoDB connection.
"""

import random
import sys
import os
import traceback
from datetime import datetime
import traceback

# Add the backend path to import db_service
sys.path.append('/Users/daoming/Documents/Github/goAIME/backend')

# Import the database service from the backend
try:
    from services.db_service import get_db
    from dotenv import load_dotenv
    
    # Load environment variables
    load_dotenv('/Users/daoming/Documents/Github/goAIME/.env')
except ImportError as e:
    print(f"Error importing modules: {e}")
    print("Make sure you have the required packages installed:")
    print("  - python-dotenv")
    print("  - pymongo")
    sys.exit(1)

def create_enhanced_user_sessions():
    """
    Create a test user with enhanced performance data by:
    1. Creating a new user named 'test_user_good_performer'
    2. Duplicating goAmy's session records
    3. Modifying the duplicate records to set 70% of is_correct fields to True
    """
    print("Starting the process to create enhanced user sessions...")
    
    try:
        # Get database connection using the project's db_service
        db = get_db()
        print("Successfully connected to MongoDB database")
        
        # Step 1: Check if the user already exists
        print("Checking if user already exists...")
        existing_user = db.users.find_one({"username": "test_user_good_performer"})
        if existing_user:
            print(f"User 'test_user_good_performer' already exists with id: {existing_user['_id']}")
            # Delete existing sessions for this user to avoid duplicates
            deleted = db.sessions.delete_many({"username": "test_user_good_performer"})
            print(f"Deleted {deleted.deleted_count} existing sessions for this user")
        else:
            # Create the new user
            new_user = {
                "username": "test_user_good_performer",
                "email": "test_good@example.com",
                "password": "hashed_password_would_go_here",
                "created_at": datetime.now(),
                "role": "student",
                "is_active": True
            }
            result = db.users.insert_one(new_user)
            print(f"Created new user with ID: {result.inserted_id}")
        
        # Step 2: Find goAmy's sessions
        print("Finding goAmy's sessions...")
        goamy_sessions = list(db.sessions.find({"username": "goAmy"}))
        print(f"Found {len(goamy_sessions)} sessions for goAmy")
        
        if not goamy_sessions:
            print("No sessions found for goAmy. Check the database connection and username.")
            return
        
        # Step 3: Duplicate and modify sessions for the new user
        print("Creating enhanced sessions for test_user_good_performer...")
        new_sessions_count = 0
        
        for session in goamy_sessions:
            # Create a copy of the session
            new_session = session.copy()
            
            # Update the copy with new user information
            new_session.pop('_id')  # Remove the original ID so MongoDB generates a new one
            new_session['username'] = "test_user_good_performer"
            
            # Modify problems_attempted to have 70% correct answers
            if 'problems_attempted' in new_session:
                for problem in new_session['problems_attempted']:
                    # Set 70% of problems to correct
                    if random.random() < 0.7:
                        problem['is_correct'] = True
                    else:
                        problem['is_correct'] = False
            
            # Update any other relevant fields
            if 'problems_attempted' in new_session:
                total_attempted = len(new_session.get('problems_attempted', []))
                total_correct = sum(1 for p in new_session.get('problems_attempted', []) if p.get('is_correct', False))
                
                new_session['total_correct'] = total_correct
                new_session['total_attempted'] = total_attempted
                
                # Calculate and update score and accuracy
                if total_attempted > 0:
                    new_session['score'] = total_correct
                    new_session['accuracy'] = (total_correct / total_attempted) * 100
            
            # Insert the modified session
            db.sessions.insert_one(new_session)
            new_sessions_count += 1
        
        print(f"Successfully created {new_sessions_count} enhanced sessions for test_user_good_performer")
        
        # Verify the new sessions
        test_user_sessions = db.sessions.count_documents({"username": "test_user_good_performer"})
        print(f"Verification: test_user_good_performer now has {test_user_sessions} sessions")
        
        # Calculate average accuracy for verification
        pipeline = [
            {"$match": {"username": "test_user_good_performer"}},
            {"$group": {
                "_id": "$username",
                "avgAccuracy": {"$avg": "$accuracy"}
            }}
        ]
        
        avg_accuracy = list(db.sessions.aggregate(pipeline))
        if avg_accuracy:
            print(f"Average accuracy for test_user_good_performer: {avg_accuracy[0].get('avgAccuracy', 0):.2f}%")
        
        print("Process completed successfully.")
        
    except Exception as e:
        print(f"Error: {e}")
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    create_enhanced_user_sessions()
