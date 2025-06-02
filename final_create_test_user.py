#!/usr/bin/env python3
# filepath: /Users/daoming/Documents/Github/goAIME/final_create_test_user.py
"""
Final attempt to create a test user with enhanced performance.
This script uses the minimal possible approach with cloud MongoDB.
"""

import os
import sys
import random
from datetime import datetime
from pymongo import MongoClient
from dotenv import load_dotenv

# Write to a log file so we can see what happened
log_file = open("test_user_creation.log", "w")

def log(message):
    """Write a message to both stdout and the log file"""
    print(message)
    log_file.write(message + "\n")
    log_file.flush()

try:
    # Load environment variables
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
    load_dotenv(dotenv_path=env_path)
    log(f"Loading environment variables from: {env_path}")
    
    # Get MongoDB connection info from environment variables
    mongodb_uri = os.environ.get('MONGODB_URI')
    mongodb_db = os.environ.get('MONGODB_DB', 'goaime')
    
    if not mongodb_uri:
        log("Error: MONGODB_URI is not set in the .env file")
        sys.exit(1)
        
    # Connect to MongoDB using cloud credentials
    log(f"Connecting to MongoDB using URI from .env...")
    log(f"Using database: {mongodb_db}")
    client = MongoClient(mongodb_uri)
    db = client[mongodb_db]
    
    # Check connection by listing collections
    collections = db.list_collection_names()
    log(f"Available collections: {', '.join(collections)}")
    
    # Check if users and sessions collections exist
    if 'users' not in collections or 'sessions' not in collections:
        log("Error: Required collections not found")
        sys.exit(1)
    
    # Create the test user
    log("Creating test_user_good_performer...")
    test_user = {
        "username": "test_user_good_performer",
        "email": "test_good@example.com",
        "password": "test123",
        "role": "student",
        "created_at": datetime.now(),
        "is_active": True
    }
    
    # Delete existing user if it exists
    existing_user = db.users.find_one({"username": "test_user_good_performer"})
    if existing_user:
        log(f"User already exists, deleting...")
        db.sessions.delete_many({"username": "test_user_good_performer"})
        db.users.delete_one({"username": "test_user_good_performer"})
    
    # Insert the new user
    result = db.users.insert_one(test_user)
    log(f"Created user with ID: {result.inserted_id}")
    
    # Find goAmy's sessions
    log("Finding goAmy's sessions...")
    goamy_sessions = list(db.sessions.find({"username": "goAmy"}))
    log(f"Found {len(goamy_sessions)} sessions for goAmy")
    
    if not goamy_sessions:
        log("No sessions found for goAmy, cannot continue")
        sys.exit(1)
    
    # Copy the sessions with enhanced performance
    session_count = 0
    total_problems = 0
    
    for session in goamy_sessions:
        new_session = session.copy()
        new_session.pop('_id')
        new_session['username'] = "test_user_good_performer"
        
        # Modify problems_attempted to have 70% correct answers
        if 'problems_attempted' in new_session:
            for problem in new_session['problems_attempted']:
                # Set 70% of problems to correct
                if random.random() < 0.7:
                    problem['is_correct'] = True
                else:
                    problem['is_correct'] = False
            
            # Update session metrics
            problems = new_session['problems_attempted']
            total_attempted = len(problems)
            total_correct = sum(1 for p in problems if p.get('is_correct', False))
            
            new_session['total_correct'] = total_correct
            new_session['total_attempted'] = total_attempted
            
            # Calculate score and accuracy
            if total_attempted > 0:
                new_session['score'] = total_correct
                new_session['accuracy'] = (total_correct / total_attempted) * 100
            
            total_problems += total_attempted
        
        # Insert the new session
        db.sessions.insert_one(new_session)
        session_count += 1
        
        # Log progress
        log(f"Copied session {session_count}/{len(goamy_sessions)}")
    
    # Log final results
    log(f"\nCreated {session_count} sessions with {total_problems} problems")
    log("Test user creation completed successfully!")
    
except Exception as e:
    log(f"Error: {e}")
    import traceback
    log(traceback.format_exc())
finally:
    log_file.close()
