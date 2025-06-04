#!/usr/bin/env python3
"""
Script to update topic performance data for test users to verify
the Wind Rose chart color logic in the frontend.
"""

import sys
import json
from datetime import datetime

# Add the backend directory to the path so we can import the db service
sys.path.append('/Users/daoming/Documents/Github/goAIME/backend')
from services.db_service import get_db, get_db_client

def update_topic_performance(username, topics_to_update):
    """Update topic performance data for a specific user."""
    print(f"Updating topic performance for {username}...")
    
    # Get the database connection
    db = get_db()
    
    # Find user sessions
    sessions = list(db.sessions.find({"username": username}))
    
    if not sessions:
        print(f"No sessions found for {username}")
        return False
    
    # Update first session only - this is enough for testing
    session = sessions[0]
    session_id = session.get("_id")
    
    # Get existing topic performance
    topic_performance = session.get("topic_performance", {})
    
    # Print current state before update
    print(f"Current topic performance (showing 3 examples):")
    for i, (topic, data) in enumerate(topic_performance.items()):
        if i < 3:
            print(f"  {topic}: {data.get('correct')}/{data.get('attempted')} = {data.get('accuracy')}%")
    
    # Update selected topics with new values
    for topic, new_data in topics_to_update.items():
        if topic in topic_performance:
            # Get the original attempted count
            attempted = topic_performance[topic]["attempted"]
            
            # Calculate correct count needed for desired accuracy
            correct = int(attempted * (new_data["accuracy"] / 100))
            
            # Update the topic performance
            topic_performance[topic] = {
                "attempted": attempted,
                "correct": correct,
                "accuracy": new_data["accuracy"]
            }
            
            print(f"Updated {topic}: {correct}/{attempted} = {new_data['accuracy']}%")
    
    # Update the session in the database
    try:
        result = db.sessions.update_one(
            {"_id": session_id},
            {"$set": {"topic_performance": topic_performance}}
        )
        
        if result.modified_count > 0:
            print(f"Successfully updated session {session_id}")
            return True
        else:
            print(f"No changes made to session {session_id}")
            return False
    except Exception as e:
        print(f"Error updating session: {e}")
        return False

def main():
    """Main function to update test data."""
    print("Starting Wind Rose chart data fix...")
    
    # Define varied performance levels for testing
    high_performance_topics = {
        "Algebra": {"accuracy": 85.0},  # High performance (green)
        "Geometry": {"accuracy": 65.0},  # Medium performance (yellow)
        "Number Theory": {"accuracy": 35.0}  # Low performance (red)
    }
    
    # User selection
    test_user = "test_user_good_performer"  # Changed to test_user_good_performer
    
    # Update selected user's topic performance
    success = update_topic_performance(test_user, high_performance_topics)
    
    if success:
        print(f"\nData update complete for {test_user}! The Wind Rose chart should now display:")
        print("- Algebra: GREEN (>75% accuracy)")
        print("- Geometry: YELLOW (50-75% accuracy)")
        print("- Number Theory: RED (<50% accuracy)")
        print(f"\nRefresh the progress dashboard for {test_user} to see the changes.")
    else:
        print(f"\nFailed to update test data for {test_user}.")

if __name__ == "__main__":
    main()