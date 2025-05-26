#!/usr/bin/env python3
"""
Script to optimize performance_metrics structure in goAIME sessions collection

This script will:
1. Connect to the MongoDB database
2. Find all session documents with performance_metrics
3. Regroup metrics to put totals together and averages together
4. Update the documents with the new structure
"""

import pymongo
from pymongo import MongoClient
import os
import sys
from datetime import datetime
import logging
from bson import ObjectId

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),  # Log to stdout
        logging.FileHandler("regroup_metrics.log")  # Also log to a file
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

def regroup_performance_metrics(metrics):
    """
    Regroup performance_metrics to organize them better:
    - Group total metrics together
    - Group average metrics together
    - Group time metrics together
    """
    if not metrics:
        return {}
    
    # Create a new structure with grouped metrics
    new_metrics = {
        # Total metrics group
        "totals": {
            "total_attempted": metrics.get("total_attempted", 0),
            "total_correct": metrics.get("total_correct", 0),
            "total_incorrect": metrics.get("total_incorrect", 0),
            "total_time_ms": metrics.get("total_time_ms", 0),
            "total_time_seconds": metrics.get("total_time_seconds", 0),
            "total_time_minutes": metrics.get("total_time_minutes", 0)
        },
        
        # Averages and percentages group
        "averages": {
            "accuracy_percentage": metrics.get("accuracy_percentage", 0),
            "average_time_per_problem_ms": metrics.get("average_time_per_problem_ms", 0),
            "average_time_per_problem_seconds": metrics.get("average_time_per_problem_seconds", 0),
            "average_time_correct_problems_ms": metrics.get("average_time_correct_problems_ms", 0),
            "average_time_incorrect_problems_ms": metrics.get("average_time_incorrect_problems_ms", 0)
        },
        
        # Speed metrics
        "speed_metrics": {
            "fastest_correct_time_ms": metrics.get("fastest_correct_time_ms", 0),
            "slowest_correct_time_ms": metrics.get("slowest_correct_time_ms", 0)
        }
    }
    
    # Preserve any performance metrics that weren't explicitly categorized
    for key, value in metrics.items():
        if (key not in new_metrics["totals"] and 
            key not in new_metrics["averages"] and 
            key not in new_metrics["speed_metrics"]):
            
            # Special handling for topic_performance and difficulty_performance
            if key == "topic_performance" or key == "difficulty_performance":
                new_metrics[key] = value
            else:
                # Put any other uncategorized metrics in a misc category
                if "misc" not in new_metrics:
                    new_metrics["misc"] = {}
                new_metrics["misc"][key] = value
    
    return new_metrics

def main():
    """Main function to regroup performance metrics"""
    try:
        # Connect to database
        print("Connecting to MongoDB database...")
        db = get_database()
        logger.info("Connected to MongoDB database")
        
        # Create a backup collection
        backup_collection = f"sessions_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Find all sessions with performance_metrics
        print("Finding sessions with performance_metrics...")
        sessions = list(db.sessions.find({"performance_metrics": {"$exists": True}}))
        print(f"Found {len(sessions)} sessions with performance_metrics")
        logger.info(f"Found {len(sessions)} sessions with performance_metrics")
        
        if not sessions:
            print("Warning: No sessions with performance_metrics found")
            logger.warning("No sessions with performance_metrics found")
            return
            
        # Back up the sessions before modifying them
        if sessions:
            print(f"Creating backup in collection: {backup_collection}...")
            db[backup_collection].insert_many(sessions)
            print(f"Created backup of {len(sessions)} sessions")
            logger.info(f"Created backup of {len(sessions)} sessions in collection: {backup_collection}")
        
        # Process each session
        print("Processing sessions...")
        updated_count = 0
        for idx, session in enumerate(sessions):
            # Get current performance metrics
            metrics = session.get("performance_metrics", {})
            
            # Regroup the metrics
            new_metrics = regroup_performance_metrics(metrics)
            
            # Update the session document
            result = db.sessions.update_one(
                {"_id": session["_id"]},
                {"$set": {"performance_metrics": new_metrics}}
            )
            
            if result.modified_count > 0:
                updated_count += 1
                if (idx + 1) % 10 == 0 or idx == len(sessions) - 1:
                    print(f"Updated {updated_count}/{len(sessions)} sessions")
        
        print(f"Performance metrics regrouping completed. Updated {updated_count} sessions successfully.")
        logger.info(f"Performance metrics regrouping completed. Updated {updated_count} sessions successfully.")
        
    except Exception as e:
        print(f"ERROR during execution: {str(e)}")
        logger.error(f"Error during execution: {str(e)}")
        import traceback
        traceback.print_exc()
        
if __name__ == "__main__":
    print("Starting performance metrics regrouping script...")
    main()
    print("Script execution completed.")
