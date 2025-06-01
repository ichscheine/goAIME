#!/usr/bin/env python3
"""
Quick script to list all users in the database
"""

import os
import sys
sys.path.append('/Users/daoming/Documents/Github/goAIME/backend')

from services.db_service import get_db
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/Users/daoming/Documents/Github/goAIME/.env')

def list_all_users():
    """List all users in the database"""
    try:
        db = get_db()
        users = list(db.users.find({}, {"username": 1, "_id": 0}))
        print("Users in database:")
        for user in users:
            print(f"  - {user['username']}")
        return [user['username'] for user in users]
    except Exception as e:
        print(f"Error listing users: {e}")
        return []

if __name__ == "__main__":
    list_all_users()
