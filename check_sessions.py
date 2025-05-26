#!/usr/bin/env python3

"""
Check if sessions are properly recorded in the MongoDB database.
"""

import os
import sys
from pymongo import MongoClient
from datetime import datetime, timedelta

def check_sessions():
    # Get MongoDB URI from .env file
    mongodb_uri = None
    with open('.env', 'r') as f:
        for line in f:
            if line.startswith('MONGODB_URI='):
                mongodb_uri = line.strip().split('=', 1)[1]
                break
    
    if not mongodb_uri:
        print("❌ Error: MONGODB_URI not found in .env file")
        return
    
    try:
        # Connect to MongoDB
        print(f"Connecting to MongoDB...")
        client = MongoClient(mongodb_uri)
        db = client.goaime
        
        # Check if sessions collection exists
        collections = db.list_collection_names()
        print(f"Collections: {collections}")
        
        if 'sessions' not in collections:
            print("❌ Warning: 'sessions' collection not found in database")
        
        # Count recent sessions (last 7 days)
        week_ago = datetime.now() - timedelta(days=7)
        recent_sessions = db.sessions.count_documents({
            'created_at': {'$gte': week_ago}
        })
        
        # Count all sessions
        all_sessions = db.sessions.count_documents({})
        
        print(f"Total sessions in database: {all_sessions}")
        print(f"Sessions created in the last 7 days: {recent_sessions}")
        
        # Show the most recent sessions
        recent = list(db.sessions.find().sort('created_at', -1).limit(5))
        if recent:
            print("\nMost recent sessions:")
            for i, session in enumerate(recent, 1):
                created = session.get('created_at', 'Unknown date')
                if isinstance(created, datetime):
                    created = created.strftime('%Y-%m-%d %H:%M:%S')
                    
                print(f"{i}. User: {session.get('username', 'Unknown')} | " +
                      f"Score: {session.get('score', 'N/A')}/{session.get('attempted', 'N/A')} | " +
                      f"Date: {created}")
        else:
            print("No sessions found in the database.")
        
    except Exception as e:
        print(f"❌ Error connecting to database: {str(e)}")

if __name__ == "__main__":
    check_sessions()
