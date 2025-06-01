#!/usr/bin/env python3
"""
Quick script to list all session usernames in the database
"""

import os
import sys
sys.path.append('/Users/daoming/Documents/Github/goAIME/backend')

from services.db_service import get_db
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/Users/daoming/Documents/Github/goAIME/.env')

def list_session_users():
    """List all users with sessions in the database"""
    try:
        db = get_db()
        # Get distinct usernames from sessions
        usernames = db.sessions.distinct("username")
        print("Users with sessions:")
        for username in usernames:
            session_count = db.sessions.count_documents({"username": username})
            print(f"  - {username}: {session_count} sessions")
        return usernames
    except Exception as e:
        print(f"Error listing session users: {e}")
        return []

if __name__ == "__main__":
    list_session_users()
