#!/usr/bin/env python3
"""
Script to reset the total sessions count for user goAmy

This script will:
1. Connect to the MongoDB database
2. Find the user record for goAmy
3. Update the user record to reset total_sessions field
"""

import pymongo
from pymongo import MongoClient
import os
import sys
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),  # Log to stdout
        logging.FileHandler("goamy_reset.log")  # Also log to a file
    ]
)
logger = logging.getLogger(__name__)

# Database connection
def get_database():
    """Connect to MongoDB and return the database object"""
    # Read environment variables from .env file
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
    env_vars = {}
    if os.path.exists(env_path):
        print(f"Found .env file at {env_path}")
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and not line.startswith('//'):
                    try:
                        key, value = line.split('=', 1)
                        env_vars[key.strip()] = value.strip()
                    except ValueError:
                        continue
    
    # Use values from .env file or fallback to defaults
    mongo_uri = env_vars.get("MONGODB_URI", os.environ.get("MONGODB_URI", "mongodb://localhost:27017/"))
    db_name = env_vars.get("MONGODB_DB", os.environ.get("DB_NAME", "goaime"))
    
    print(f"Using MongoDB URI: {mongo_uri}")
    print(f"Using database: {db_name}")
    
    # Connect to MongoDB
    client = MongoClient(mongo_uri)
    return client[db_name]

def main():
    """Main function to reset goAmy's session count"""
    try:
        # Connect to database
        print("Connecting to database...")
        db = get_database()
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
        
        # Reset session count in user document
        print("Resetting goAmy's total_sessions count...")
        result = db.users.update_one(
            {"username": "goAmy"},
            {
                "$set": {
                    "total_sessions": 0  # Reset to 0
                }
            }
        )
        
        if result.modified_count > 0:
            print("Successfully reset goAmy's total_sessions count to 0")
            logger.info("Successfully reset goAmy's total_sessions count to 0")
        else:
            print("Warning: No updates were made - user might not have total_sessions field")
            logger.warning("No updates were made - user might not have total_sessions field")
            
        # Also try updating user stats directly in sessions collection
        print("Updating session documents...")
        session_result = db.sessions.update_many(
            {"user_id": user["_id"]},
            {
                "$set": {
                    "user_stats.total_sessions": 0  # Reset user stats in session documents
                }
            }
        )
        
        print(f"Updated {session_result.modified_count} session documents")
        logger.info(f"Updated {session_result.modified_count} session documents")
        
        # Print verification
        updated_user = db.users.find_one({"username": "goAmy"})
        print(f"Current total_sessions value: {updated_user.get('total_sessions', 'Field not present')}")
        logger.info(f"Current total_sessions value: {updated_user.get('total_sessions', 'Field not present')}")
        
        print("Reset operation completed successfully!")
        
    except Exception as e:
        print(f"ERROR during execution: {str(e)}")
        logger.error(f"Error during execution: {str(e)}")
        import traceback
        traceback.print_exc()
        
if __name__ == "__main__":
    # Print debug messages
    print("Starting goAmy session reset script...")
    main()
    print("Script execution completed.")
