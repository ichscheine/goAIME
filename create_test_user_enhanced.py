#!/usr/bin/env python3
# filepath: /Users/daoming/Documents/Github/goAIME/create_test_user_enhanced.py
"""
Script to create a test user with good performance data by:
1. Creating a new user 'test_user_good_performer'
2. Duplicating goAmy's sessions for this user
3. Updating the is_correct field to make 70% of attempts correct
"""

import random
import sys
import os
from datetime import datetime
import traceback
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
load_dotenv(dotenv_path=env_path)
print(f"Loading environment variables from: {env_path}")

# Add the backend path to import db_service
sys.path.append(os.path.dirname(os.path.abspath(__file__)) + '/backend')

try:
    # First try to use the project's db_service
    from services.db_service import get_db
    
    def get_database():
        return get_db()
    
    print("Using project's database service")
except ImportError:
    # Fall back to direct MongoDB connection using environment variables
    def get_database():
        mongodb_uri = os.environ.get('MONGODB_URI')
        mongodb_db = os.environ.get('MONGODB_DB', 'goaime')
        
        if not mongodb_uri:
            raise ValueError("MONGODB_URI is not set in the .env file")
            
        print(f"Using database: {mongodb_db}")
        client = MongoClient(mongodb_uri)
        return client[mongodb_db]
    
    print("Using direct MongoDB connection with credentials from .env")

def create_enhanced_user():
    """Create a test user with enhanced performance data"""
    try:
        # Get database connection
        db = get_database()
        print("Connected to MongoDB successfully")
        
        # Get collections
        users_collection = db.users
        sessions_collection = db.sessions
        
        # Check if the collections exist
        print(f"Available collections: {', '.join(db.list_collection_names())}")
        
        # Test user data
        test_user = {
            "username": "test_user_good_performer",
            "email": "test_good@example.com",
            "password": "test123",  # In a real app, this would be hashed
            "role": "student",
            "created_at": datetime.now(),
            "is_active": True
        }
        
        # Check if user already exists
        existing_user = users_collection.find_one({"username": "test_user_good_performer"})
        if existing_user:
            print(f"User 'test_user_good_performer' already exists. Deleting existing data...")
            # Delete existing sessions for this user
            deleted = sessions_collection.delete_many({"username": "test_user_good_performer"})
            print(f"Deleted {deleted.deleted_count} existing sessions")
            # Delete existing user
            users_collection.delete_one({"username": "test_user_good_performer"})
            print("Existing user deleted")
        
        # Create the new user
        result = users_collection.insert_one(test_user)
        print(f"Created new user with ID: {result.inserted_id}")
        
        # Find goAmy's sessions
        print("Finding goAmy's sessions...")
        goamy_sessions = list(sessions_collection.find({"username": "goAmy"}))
        print(f"Found {len(goamy_sessions)} sessions for goAmy")
        
        if not goamy_sessions:
            print("No sessions found for goAmy. Cannot copy data.")
            return
        
        # Copy and enhance sessions
        new_sessions_count = 0
        total_problems = 0
        
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
                
                # Update session stats based on the modified problems
                total_attempted = len(new_session['problems_attempted'])
                total_correct = sum(1 for p in new_session['problems_attempted'] if p.get('is_correct', False))
                
                new_session['total_correct'] = total_correct
                new_session['total_attempted'] = total_attempted
                
                # Calculate and update score and accuracy
                if total_attempted > 0:
                    new_session['score'] = total_correct
                    new_session['accuracy'] = (total_correct / total_attempted) * 100
                
                total_problems += total_attempted
            
            # Insert the modified session
            sessions_collection.insert_one(new_session)
            new_sessions_count += 1
            
            # Progress update
            if new_session.get('problems_attempted'):
                problems_count = len(new_session['problems_attempted'])
                correct_count = sum(1 for p in new_session['problems_attempted'] if p.get('is_correct', False))
                accuracy = (correct_count / problems_count * 100) if problems_count > 0 else 0
                print(f"Session {new_sessions_count}/{len(goamy_sessions)}: {problems_count} problems, {accuracy:.2f}% accuracy")
        
        # Verify the new sessions
        verification_sessions = sessions_collection.count_documents({"username": "test_user_good_performer"})
        print(f"\nVerification: Created {verification_sessions} sessions with {total_problems} problems")
        
        # Calculate overall stats for verification
        pipeline = [
            {"$match": {"username": "test_user_good_performer"}},
            {"$group": {
                "_id": "$username",
                "avgAccuracy": {"$avg": "$accuracy"},
                "totalSessions": {"$sum": 1},
                "totalProblems": {"$sum": "$total_attempted"}
            }}
        ]
        
        stats = list(sessions_collection.aggregate(pipeline))
        if stats:
            print(f"Overall accuracy: {stats[0].get('avgAccuracy', 0):.2f}%")
            print(f"Total sessions: {stats[0].get('totalSessions', 0)}")
            print(f"Total problems: {stats[0].get('totalProblems', 0)}")
        
        print("\nTest user creation completed successfully!")
        print("User details:")
        print("- Username: test_user_good_performer")
        print("- Password: test123")
        
        return True
    
    except Exception as e:
        print(f"Error: {e}")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("Starting the process to create a test user with enhanced performance...")
    success = create_enhanced_user()
    print("Process completed" + (" successfully!" if success else " with errors."))
