#!/usr/bin/env python
"""
Check for users in the database and fix user_id for goAmy
"""

import sys
import os
sys.path.append('./backend')

from services.db_service import get_db
from bson import ObjectId

def check_users_and_fix_user_id():
    """
    Check what users exist and fix user_id for goAmy
    """
    print("CHECKING USERS AND FIXING USER_ID")
    print("="*50)
    
    # Connect to database
    db = get_db()
    print("✅ Connected to MongoDB")
    
    # Check all users
    users = list(db.users.find({}))
    print(f"\nFound {len(users)} users in database:")
    
    for user in users:
        print(f"  - {user.get('username', 'no-username')} (ID: {user['_id']})")
    
    # Look for users with similar names to goAmy
    similar_users = list(db.users.find({'username': {'$regex': 'amy', '$options': 'i'}}))
    print(f"\nUsers with 'amy' in name: {len(similar_users)}")
    for user in similar_users:
        print(f"  - {user.get('username')} (ID: {user['_id']})")
    
    # Check if we should create a user for goAmy or use an existing one
    target_user = None
    
    if similar_users:
        target_user = similar_users[0]
        print(f"\nUsing existing user: {target_user['username']} (ID: {target_user['_id']})")
    else:
        # Create a new user for goAmy
        new_user = {
            'username': 'goAmy',
            'email': 'goamy@example.com',  # placeholder
            'created_at': '2025-05-26T12:00:00Z',
            'is_active': True
        }
        result = db.users.insert_one(new_user)
        target_user = db.users.find_one({'_id': result.inserted_id})
        print(f"\nCreated new user: {target_user['username']} (ID: {target_user['_id']})")
    
    # Update sessions with correct user_id
    if target_user:
        user_id = str(target_user['_id'])
        sessions = list(db.sessions.find({'username': 'goAmy'}))
        
        print(f"\nUpdating {len(sessions)} sessions with user_id: {user_id}")
        
        for session in sessions:
            result = db.sessions.update_one(
                {'_id': session['_id']},
                {'$set': {'user_id': user_id}}
            )
            print(f"  Updated session {session['_id']}: {result.modified_count} modified")
        
        print(f"\n✅ All sessions updated with user_id: {user_id}")
    
    # Verify the update
    print(f"\nVERIFICATION:")
    sessions = list(db.sessions.find({'username': 'goAmy'}))
    for i, session in enumerate(sessions):
        print(f"  Session {i+1}: user_id = {session.get('user_id', 'MISSING')}")

if __name__ == "__main__":
    check_users_and_fix_user_id()
