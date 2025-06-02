#!/usr/bin/env python
"""
Script to create a test user with good performance metrics by:
1. Creating a new user named test_user_good_performer
2. Copying all sessions from goAmy to the new user
3. Improving performance by making 70% of incorrect answers correct

Run with: python create_test_user.py
"""

import os
import sys
import random
from datetime import datetime
import bcrypt
from pathlib import Path
from bson import ObjectId
import copy

# Add the backend directory to the path so we can import config.py
script_dir = Path(__file__).resolve().parent
backend_dir = script_dir.parent
sys.path.append(str(backend_dir))

# Import database configuration from the backend
try:
    from config import get_db, get_db_client, close_db
    print("Successfully imported database configuration")
except ImportError as e:
    print(f"Error importing database configuration: {e}")
    print("Please make sure you're running this script from the backend/scripts directory")
    sys.exit(1)

def hash_password(password):
    """Generate a bcrypt hash for the password"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def create_test_user():
    """Create a test user with good performance metrics"""
    try:
        # Get database connection
        db = get_db()
        
        # Get collections
        users_collection = db.users
        
        # Check if "goaime.sessions" collection exists
        collections = db.list_collection_names()
        print(f"Available collections: {', '.join(collections)}")
        
        # Determine which collections to use
        sessions_collection_name = "goaime.sessions" if "goaime.sessions" in collections else "sessions"
        problems_collection_name = "goaime.problems" if "goaime.problems" in collections else "problems"
        
        sessions_collection = db[sessions_collection_name]
        problems_collection = db[problems_collection_name]
        
        print(f"Using sessions collection: {sessions_collection_name}")
        print(f"Using problems collection: {problems_collection_name}")
        
        print("Connected to MongoDB successfully")
    except Exception as e:
        print(f"Error connecting to the database: {e}")
        sys.exit(1)

    # Test user data
    test_user = {
        "username": "test_user_good_performer",
        "email": "test_good@example.com",
        "password": hash_password("test123"),
        "role": "student",
        "created_at": datetime.utcnow()
    }

    # Check if user already exists
    existing_user = users_collection.find_one({"username": test_user["username"]})
    if existing_user:
        print(f"User {test_user['username']} already exists. Deleting existing data...")
        # Delete existing sessions for this user
        sessions_collection.delete_many({"user_id": existing_user["_id"]})
        users_collection.delete_one({"_id": existing_user["_id"]})
        print("Existing user data deleted.")

    # Create new test user
    print(f"Creating new test user: {test_user['username']}...")
    result = users_collection.insert_one(test_user)
    test_user_id = result.inserted_id
    print(f"Test user created with ID: {test_user_id}")

    # Find goAmy user
    print("Looking for goAmy to copy data from...")
    source_user = users_collection.find_one({"username": "goAmy"})
    if not source_user:
        print("Source user goAmy not found. Cannot copy data.")
        return

    print(f"Found goAmy user with ID: {source_user['_id']}")

    # Get goAmy's sessions
    source_sessions = list(sessions_collection.find({"user_id": source_user["_id"]}))
    if not source_sessions:
        print("No sessions found for goAmy. Cannot copy data.")
        return

    print(f"Found {len(source_sessions)} sessions from goAmy to copy.")

    # Copy each session
    session_count = 0
    total_problems_copied = 0

    for source_session in source_sessions:
        try:
            # Create a new session document based on the source
            new_session = copy.deepcopy(source_session)
            new_session.pop("_id")  # Remove original ID
            new_session["user_id"] = test_user_id  # Assign to new user
            new_session["username"] = test_user["username"]  # Update username
            
            # Get the problems attempted from the session
            problems_attempted = new_session.get("problems_attempted", [])
            
            if problems_attempted:
                # Track metrics for recalculation
                correct_count = 0
                total_time = 0
                improved_problems = []
                
                # Copy and improve each problem attempt
                for problem in problems_attempted:
                    # Make 70% of previously wrong answers correct
                    make_correct = problem.get("is_correct", False) or random.random() < 0.7
                    
                    # Improve speed for correct answers
                    time_spent = problem.get("time_spent", 30)
                    if make_correct:
                        time_spent = max(5, time_spent * 0.7)  # Faster for correct answers
                    
                    # Track for session metrics
                    if make_correct:
                        correct_count += 1
                    total_time += time_spent
                    
                    # Create the improved problem
                    improved_problem = copy.deepcopy(problem)
                    improved_problem["is_correct"] = make_correct
                    improved_problem["time_spent"] = time_spent
                    
                    # If it's now correct, change the answer if needed
                    if make_correct and not problem.get("is_correct", False):
                        improved_problem["user_answer"] = improved_problem.get("correct_answer", "A")
                    
                    improved_problems.append(improved_problem)
                
                # Update session with improved problems
                new_session["problems_attempted"] = improved_problems
                
                # Update session metrics
                total_problems = len(improved_problems)
                if total_problems > 0:
                    new_session["score"] = correct_count
                    new_session["total_attempted"] = total_problems
                    
                    # Update performance metrics
                    if "performance_metrics" in new_session:
                        new_session["performance_metrics"]["accuracy"] = (correct_count / total_problems) * 100
                        new_session["performance_metrics"]["average_time"] = total_time / total_problems
                
                # Insert the new session
                result = sessions_collection.insert_one(new_session)
                session_count += 1
                total_problems_copied += total_problems
                
                print(f"Copied session {session_count}/{len(source_sessions)} with {total_problems} problems. " +
                      f"New accuracy: {(correct_count / total_problems * 100):.2f}%")
            else:
                # No problems in this session, just copy it
                result = sessions_collection.insert_one(new_session)
                session_count += 1
                print(f"Copied empty session {session_count}/{len(source_sessions)} (no problems)")
        except Exception as e:
            print(f"Error copying session {session_count + 1}: {e}")
            continue

    print("\nTest user creation completed!")
    print(f"\nUser details:")
    print(f"- Username: {test_user['username']}")
    print(f"- Password: test123")
    print(f"- Email: {test_user['email']}")
    print(f"\nCreated a total of {session_count} sessions with {total_problems_copied} problems.")
    print("You can now log in with this test account to explore the application.")

if __name__ == "__main__":
    try:
        create_test_user()
    except KeyboardInterrupt:
        print("\nOperation cancelled by user.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        print("Closing MongoDB connection...")
        close_db()
        print("Done.")

    # Test user data
    test_user = {
        "username": "test_user_good_performer",
        "email": "test_good@example.com",
        "password": hash_password("test123"),
        "role": "student",
        "created_at": datetime.utcnow()
    }

    # Check if user already exists
    existing_user = users_collection.find_one({"username": test_user["username"]})
    if existing_user:
        print(f"User {test_user['username']} already exists. Deleting existing data...")
        problems_collection.delete_many({"user_id": existing_user["_id"]})
        sessions_collection.delete_many({"user_id": existing_user["_id"]})
        users_collection.delete_one({"_id": existing_user["_id"]})
        print("Existing user data deleted.")

    # Create new test user
    print(f"Creating new test user: {test_user['username']}...")
    result = users_collection.insert_one(test_user)
    test_user_id = result.inserted_id
    print(f"Test user created with ID: {test_user_id}")

    # Find goAmy user
    print("Looking for goAmy to copy data from...")
    source_user = users_collection.find_one({"username": "goAmy"})
    if not source_user:
        print("Source user goAmy not found. Cannot copy data.")
        return

    print(f"Found goAmy user with ID: {source_user['_id']}")

    # Get goAmy's sessions
    source_sessions = list(sessions_collection.find({"user_id": source_user["_id"]}))
    if not source_sessions:
        print("No sessions found for goAmy. Cannot copy data.")
        return

    print(f"Found {len(source_sessions)} sessions from goAmy to copy.")

    # Copy each session
    session_count = 0
    total_problems_copied = 0

    for source_session in source_sessions:
        try:
            # Create a new session for the test user
            new_session = source_session.copy()
            new_session.pop("_id")  # Remove original ID
            new_session["user_id"] = test_user_id  # Assign to new user
            new_session["problems"] = []  # Will be populated with new problems

            # Insert the new session
            result = sessions_collection.insert_one(new_session)
            new_session_id = result.inserted_id
            session_count += 1

            # Get source problems for this session
            source_problems = list(problems_collection.find({"session_id": source_session["_id"]}))
            
            if source_problems:
                # Track metrics for recalculation
                correct_count = 0
                total_time = 0
                new_problems_list = []

                # Copy and improve each problem
                for source_problem in source_problems:
                    # Make 70% of previously wrong answers correct
                    make_correct = source_problem.get("is_correct", False) or random.random() < 0.7
                    
                    # Improve speed for correct answers
                    time_spent = source_problem.get("time_spent", 30)
                    if make_correct:
                        time_spent = max(5, time_spent * 0.7)  # Faster for correct answers
                    
                    # Track for session metrics
                    if make_correct:
                        correct_count += 1
                    total_time += time_spent
                    
                    # Create the improved problem
                    new_problem = source_problem.copy()
                    new_problem.pop("_id")  # Remove original ID
                    new_problem["session_id"] = new_session_id
                    new_problem["user_id"] = test_user_id
                    new_problem["is_correct"] = make_correct
                    new_problem["time_spent"] = time_spent
                    
                    # If it's now correct, change the answer
                    if make_correct and not source_problem.get("is_correct", False):
                        new_problem["user_answer"] = new_problem.get("correct_answer", "A")
                    
                    new_problems_list.append(new_problem)
                
                # Insert all new problems
                if new_problems_list:
                    problems_result = problems_collection.insert_many(new_problems_list)
                    problem_ids = problems_result.inserted_ids
                    total_problems_copied += len(problem_ids)
                    
                    # Update session with problem references and improved metrics
                    sessions_collection.update_one(
                        {"_id": new_session_id},
                        {
                            "$set": {
                                "problems": problem_ids,
                                "score": correct_count,
                                "total_attempted": len(problem_ids),
                                "accuracy": (correct_count / len(problem_ids)) * 100 if problem_ids else 0,
                                "average_time_per_problem": total_time / len(problem_ids) if problem_ids else 0
                            }
                        }
                    )
                    
                    print(f"Copied session {session_count}/{len(source_sessions)} with {len(problem_ids)} problems. " +
                          f"New accuracy: {(correct_count / len(problem_ids) * 100):.2f}%")
        except Exception as e:
            print(f"Error copying session {session_count + 1}: {e}")
            continue

    print("\nTest user creation completed!")
    print(f"\nUser details:")
    print(f"- Username: {test_user['username']}")
    print(f"- Password: test123")
    print(f"- Email: {test_user['email']}")
    print(f"\nCreated a total of {session_count} sessions with {total_problems_copied} problems.")
    print("You can now log in with this test account to explore the application.")

if __name__ == "__main__":
    try:
        create_test_user()
    except KeyboardInterrupt:
        print("\nOperation cancelled by user.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        print("Closing MongoDB connection...")
        close_db()
        print("Done.")
