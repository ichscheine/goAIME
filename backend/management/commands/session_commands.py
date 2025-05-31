"""
Session management commands for maintenance and fixes.

This module contains commands for:
- Standardizing session modes (contest -> competition)
- Fixing session-related database issues
- Analyzing and reporting on session data
"""

import os
from datetime import datetime
from services.db_service import get_db
from utils.logging_utils import log_event, log_exception

def standardize_session_modes():
    """
    Updates all sessions in the database that have mode='contest'
    to use mode='competition' instead for consistency.
    
    Returns:
        dict: Results including sessions found and modified count
    """
    print("Starting session mode standardization...")
    
    # Get database connection
    db = get_db()
    
    # Find all sessions with mode='contest'
    contest_sessions = list(db.sessions.find({"mode": "contest"}))
    total_sessions = len(contest_sessions)
    
    if total_sessions == 0:
        print("No sessions with mode='contest' found. No changes needed.")
        return {"sessions_found": 0, "sessions_updated": 0}
    
    print(f"Found {total_sessions} sessions with mode='contest'")
    
    # Update all found sessions
    result = db.sessions.update_many(
        {"mode": "contest"},
        {"$set": {"mode": "competition"}}
    )
    
    modified_count = result.modified_count
    
    # Log the results
    print(f"Updated {modified_count} sessions from 'contest' to 'competition'")
    
    # Log the event
    log_event('admin.standardize_session_modes', {
        'sessions_found': total_sessions,
        'sessions_updated': modified_count,
        'timestamp': datetime.now().isoformat()
    })
    
    # Verify the update
    remaining = db.sessions.count_documents({"mode": "contest"})
    if remaining == 0:
        print("Verification successful: No sessions with mode='contest' remain.")
    else:
        print(f"Warning: {remaining} sessions still have mode='contest'")
    
    return {
        "sessions_found": total_sessions,
        "sessions_updated": modified_count,
        "remaining": remaining
    }

def check_user_sessions(username):
    """
    Check and display session details for a specific user.
    
    Args:
        username (str): The username to check sessions for
        
    Returns:
        list: List of session data for the user
    """
    # Get database connection
    db = get_db()
    
    # Get user's sessions
    sessions = list(db.sessions.find({'username': username}))
    print(f'Found {len(sessions)} sessions for user {username}')
    
    # Print details of each session
    for idx, session in enumerate(sessions):
        print(f"Session {idx+1}:")
        print(f"  Score: {session.get('score')}")
        print(f"  Attempted: {session.get('total_attempted')}")
        print(f"  Performance metrics: {session.get('performance_metrics')}")
        print()
    
    return sessions

def fix_user_stats(username=None):
    """
    Fix user stats based on session data.
    Can target a specific user or all users.
    
    Args:
        username (str, optional): Username to fix stats for. If None, fixes all users.
        
    Returns:
        dict: Results of the operation
    """
    db = get_db()
    results = {"users_processed": 0, "stats_updated": 0}
    
    try:
        # Get sessions query
        query = {}
        if username:
            query["username"] = username
            print(f"Fixing stats for user: {username}")
        else:
            print("Fixing stats for all users")
        
        # Group sessions by username and calculate stats
        pipeline = [
            {"$match": query},
            {"$group": {
                "_id": "$username",
                "total_sessions": {"$sum": 1},
                "total_score": {"$sum": "$score"},
                "total_attempted": {"$sum": "$total_attempted"},
                "best_score": {"$max": "$score"}
            }}
        ]
        
        user_stats = list(db.sessions.aggregate(pipeline))
        results["users_processed"] = len(user_stats)
        
        # Update user stats in database
        for stats in user_stats:
            username = stats["_id"]
            if not username:
                continue
                
            accuracy = 0
            if stats["total_attempted"] > 0:
                accuracy = (stats["total_score"] / stats["total_attempted"]) * 100
                
            # Update user document
            db.users.update_one(
                {"username": username},
                {"$set": {
                    "stats.session_count": stats["total_sessions"],
                    "stats.best_score": stats["best_score"],
                    "stats.accuracy": accuracy
                }}
            )
            
            print(f"Updated stats for {username}: {stats['total_sessions']} sessions, best score: {stats['best_score']}")
            results["stats_updated"] += 1
            
        log_event('admin.fix_user_stats', results)
        return results
            
    except Exception as e:
        log_exception(e)
        print(f"Error fixing user stats: {str(e)}")
        return {"error": str(e), "users_processed": results["users_processed"]}


if __name__ == "__main__":
    # This section allows running the commands directly
    import sys
    if len(sys.argv) < 2:
        print("Usage: python -m management.commands.session_commands <command> [args]")
        print("Available commands: standardize, check_sessions, fix_stats")
        sys.exit(1)
        
    command = sys.argv[1]
    
    if command == "standardize":
        standardize_session_modes()
    elif command == "check_sessions":
        if len(sys.argv) < 3:
            print("Usage: python -m management.commands.session_commands check_sessions <username>")
            sys.exit(1)
        check_user_sessions(sys.argv[2])
    elif command == "fix_stats":
        username = sys.argv[2] if len(sys.argv) > 2 else None
        fix_user_stats(username)
    else:
        print(f"Unknown command: {command}")
        print("Available commands: standardize, check_sessions, fix_stats")
        sys.exit(1)
