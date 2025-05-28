#!/usr/bin/env python
"""
Script to standardize session modes in the database
Replaces Mode "contest" with "competition" for all sessions
"""

import sys
import os
from datetime import datetime

# Add the backend directory to the path so we can import the db_service
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Import the database service
from services.db_service import get_db
from utils.logging_utils import log_event

def standardize_session_modes():
    """
    Updates all sessions in the database that have mode='contest'
    to use mode='competition' instead for consistency
    """
    print("Starting session mode standardization...")
    
    # Get database connection
    db = get_db()
    
    # Find all sessions with mode='contest'
    contest_sessions = list(db.sessions.find({"mode": "contest"}))
    total_sessions = len(contest_sessions)
    
    if total_sessions == 0:
        print("No sessions with mode='contest' found. No changes needed.")
        return
    
    print(f"Found {total_sessions} sessions with mode='contest'")
    
    # Update all found sessions
    result = db.sessions.update_many(
        {"mode": "contest"},
        {"$set": {"mode": "competition"}}
    )
    
    # Log the results
    print(f"Updated {result.modified_count} sessions from 'contest' to 'competition'")
    
    # Log the event
    log_event('admin.standardize_session_modes', {
        'sessions_found': total_sessions,
        'sessions_updated': result.modified_count,
        'timestamp': datetime.now().isoformat()
    })
    
    # Verify the update
    remaining = db.sessions.count_documents({"mode": "contest"})
    if remaining == 0:
        print("Verification successful: No sessions with mode='contest' remain.")
    else:
        print(f"Warning: {remaining} sessions still have mode='contest'")

if __name__ == "__main__":
    standardize_session_modes()
    print("Session mode standardization complete.")
