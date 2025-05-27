#!/usr/bin/env python
"""
Script to correct goAmy's session count in both database and UI
This script will:
1. Fix the database to have exactly 3 sessions for goAmy
2. Update the user document to show total_sessions=3
3. Ensure proper data for UI display
"""

import sys
import os
sys.path.append('/Users/daoming/Documents/Github/goAIME')

from backend.services.db_service import get_db
from bson import ObjectId
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("goamy_session_correction.log")
    ]
)
logger = logging.getLogger(__name__)

def main():
    """Main function to fix goAmy's sessions"""
    try:
        # Connect to database
        print("Connecting to database...")
        db = get_db()
        logger.info("Connected to MongoDB database")
        
        # Find goAmy user
        print("Looking for goAmy user...")
        user = db.users.find_one({"username": "goAmy"})
        
        if not user:
            print("ERROR: User goAmy not found in the database")
            logger.error("User goAmy not found in the database")
            return
            
        print(f"Found user goAmy with ID: {user['_id']}")
        logger.info(f"Found user goAmy with ID: {user['_id']}")
        
        # Create a backup of current state
        backup_collection = f"users_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        db[backup_collection].insert_one(user)
        print(f"Created backup in collection: {backup_collection}")
        logger.info(f"Created backup in collection: {backup_collection}")
        
        # Find all goAmy sessions
        goamy_sessions = list(db.sessions.find({"username": "goAmy"}).sort("created_at", -1))
        print(f"Found {len(goamy_sessions)} sessions for goAmy")
        logger.info(f"Found {len(goamy_sessions)} sessions for goAmy")
        
        # Create a backup of sessions
        session_backup = f"sessions_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        if goamy_sessions:
            db[session_backup].insert_many(goamy_sessions)
            print(f"Created session backup in collection: {session_backup}")
            logger.info(f"Created session backup in collection: {session_backup}")
        
        # If there are more than 3 sessions, remove the excess ones
        if len(goamy_sessions) > 3:
            # Keep only the 3 most recent sessions
            sessions_to_keep = goamy_sessions[:3]
            sessions_to_remove = goamy_sessions[3:]
            
            # Get IDs of sessions to remove
            session_ids_to_remove = [s["_id"] for s in sessions_to_remove]
            
            print(f"Removing {len(session_ids_to_remove)} excess sessions")
            logger.info(f"Removing {len(session_ids_to_remove)} excess sessions")
            
            # Remove excess sessions
            if session_ids_to_remove:
                result = db.sessions.delete_many({"_id": {"$in": session_ids_to_remove}})
                print(f"Removed {result.deleted_count} excess sessions")
                logger.info(f"Removed {result.deleted_count} excess sessions")
        
        # Update user document to set total_sessions to 3
        result = db.users.update_one(
            {"username": "goAmy"},
            {"$set": {"total_sessions": 3}}
        )
        
        print(f"Updated user document: {result.modified_count} modified")
        logger.info(f"Updated user document: {result.modified_count} modified")
        
        # Update user_stats in each session document
        update_result = db.sessions.update_many(
            {"username": "goAmy"},
            {"$set": {"user_stats.total_sessions": 3}}
        )
        
        print(f"Updated {update_result.modified_count} session documents")
        logger.info(f"Updated {update_result.modified_count} session documents")
        
        # Verify the fix
        final_count = db.sessions.count_documents({"username": "goAmy"})
        print(f"Final goAmy session count: {final_count}")
        logger.info(f"Final goAmy session count: {final_count}")
        
        if final_count == 3:
            print("✅ Fix successful! goAmy now has exactly 3 sessions.")
            logger.info("Fix successful! goAmy now has exactly 3 sessions.")
        else:
            print(f"⚠️ Warning: goAmy has {final_count} sessions, expected 3")
            logger.warning(f"goAmy has {final_count} sessions, expected 3")
        
    except Exception as e:
        print(f"ERROR during execution: {str(e)}")
        logger.error(f"Error during execution: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("Starting goAmy session correction script...")
    main()
    print("Script execution completed.")
