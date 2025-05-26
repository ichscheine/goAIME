#!/usr/bin/env python3
"""
Check users in the database and test the enhanced session functionality
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from services.db_service import get_db
from bson import ObjectId
import json

def check_users_and_problems():
    """Check if users and problems exist in database"""
    db = get_db()
    
    print("Checking database state...")
    print("=" * 60)
    
    # Check users
    users_count = db.users.count_documents({})
    print(f"Total users: {users_count}")
    
    if users_count > 0:
        users = list(db.users.find({}).limit(5))
        print("Sample users:")
        for user in users:
            print(f"  ID: {user.get('_id')}")
            print(f"  Username: {user.get('username')}")
            print(f"  Email: {user.get('email')}")
            print()
    
    # Check problems
    problems_count = db.problems.count_documents({})
    print(f"Total problems: {problems_count}")
    
    if problems_count > 0:
        problems = list(db.problems.find({}).limit(3))
        print("Sample problems:")
        for problem in problems:
            print(f"  ID: {problem.get('_id')}")
            print(f"  Title: {problem.get('title')}")
            print(f"  Topics: {problem.get('topics', [])}")
            print(f"  Difficulty: {problem.get('difficulty')}")
            print()
    
    # Check sessions
    sessions_count = db.user_sessions.count_documents({})
    print(f"Total sessions: {sessions_count}")

if __name__ == "__main__":
    check_users_and_problems()
