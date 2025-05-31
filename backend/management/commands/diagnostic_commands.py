"""
Database diagnostic commands for analysis and debugging.

This module contains commands for:
- Checking database health and consistency
- Analyzing metrics and statistics
- Debugging issues with data structures
"""

from services.db_service import get_db
import pprint
import json
from datetime import datetime
from utils.logging_utils import log_event, log_exception

def debug_peer_metrics():
    """
    Debug the peer max values for the radar chart.
    This extracts real values from the database and analyzes them.
    
    Returns:
        dict: Peer metrics statistics
    """
    # Get database connection
    db = get_db()
    
    # Get all users with at least one completed session
    pipeline = [
        {"$match": {"total_attempted": {"$gt": 0}}},
        {"$group": {
            "_id": "$username",
            "avg_score": {"$avg": "$score"},
            "total_correct": {"$sum": "$score"},
            "total_attempted": {"$sum": "$total_attempted"},
            "total_time": {"$sum": "$performance_metrics.total_metrics.total_time_seconds"}
        }},
        {"$project": {
            "username": "$_id",
            "average_score": "$avg_score",
            "accuracy": {"$multiply": [{"$divide": ["$total_correct", "$total_attempted"]}, 100]},
            "average_speed": {"$divide": ["$total_time", "$total_attempted"]}
        }}
    ]
    
    cohort_users = list(db.sessions.aggregate(pipeline))
    
    # Generate arrays for metrics
    cohort_scores = []
    cohort_accuracies = []
    cohort_speeds = []
    
    for user in cohort_users:
        if user.get("average_score") is not None:
            cohort_scores.append(user.get("average_score"))
        
        if user.get("accuracy") is not None:
            cohort_accuracies.append(user.get("accuracy"))
        
        if user.get("average_speed") is not None:
            cohort_speeds.append(user.get("average_speed"))
    
    # Calculate statistics
    scores_stats = calculate_stats(cohort_scores, "scores")
    accuracy_stats = calculate_stats(cohort_accuracies, "accuracy")
    speed_stats = calculate_stats(cohort_speeds, "speed")
    
    # Print results
    print("Peer Metrics Statistics:")
    print("------------------------")
    pprint.pprint(scores_stats)
    print("------------------------")
    pprint.pprint(accuracy_stats)
    print("------------------------")
    pprint.pprint(speed_stats)
    
    # Return all stats in a structured format
    return {
        "scores": scores_stats,
        "accuracy": accuracy_stats,
        "speed": speed_stats
    }

def calculate_stats(values, metric_name):
    """Helper function to calculate statistics for an array of values"""
    if not values:
        return {
            "name": metric_name,
            "count": 0,
            "min": None,
            "max": None,
            "avg": None,
            "median": None
        }
    
    values.sort()
    count = len(values)
    
    # Calculate median
    if count % 2 == 0:
        median = (values[count//2 - 1] + values[count//2]) / 2
    else:
        median = values[count//2]
    
    return {
        "name": metric_name,
        "count": count,
        "min": min(values),
        "max": max(values),
        "avg": sum(values) / count,
        "median": median,
        "p90": values[int(count * 0.9)] if count >= 10 else None,
        "p95": values[int(count * 0.95)] if count >= 20 else None
    }

def debug_database_state():
    """
    Check the overall state of the database and report key metrics.
    
    Returns:
        dict: Database state summary
    """
    db = get_db()
    
    # Collect counts for main collections
    users_count = db.users.count_documents({})
    problems_count = db.problems.count_documents({})
    sessions_count = db.sessions.count_documents({})
    
    # Get users with the most sessions
    top_users_pipeline = [
        {"$group": {
            "_id": "$username",
            "session_count": {"$sum": 1}
        }},
        {"$sort": {"session_count": -1}},
        {"$limit": 5}
    ]
    
    top_users = list(db.sessions.aggregate(top_users_pipeline))
    
    # Get sessions per month
    sessions_by_month_pipeline = [
        {"$match": {"created_at": {"$exists": True}}},
        {"$group": {
            "_id": {
                "year": {"$year": {"$toDate": "$created_at"}},
                "month": {"$month": {"$toDate": "$created_at"}}
            },
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id.year": 1, "_id.month": 1}}
    ]
    
    try:
        sessions_by_month = list(db.sessions.aggregate(sessions_by_month_pipeline))
    except Exception as e:
        # Handle case where created_at might not be in date format
        sessions_by_month = []
        log_exception(e, {"error": "Failed to aggregate sessions by month"})
    
    # Format results
    state = {
        "collections": {
            "users": users_count,
            "problems": problems_count,
            "sessions": sessions_count
        },
        "top_users": top_users,
        "sessions_by_month": sessions_by_month
    }
    
    # Print report
    print(f"Database State Summary ({datetime.now().isoformat()})")
    print("=============================================")
    print(f"Users: {users_count}")
    print(f"Problems: {problems_count}")
    print(f"Sessions: {sessions_count}")
    print("\nTop users by session count:")
    for user in top_users:
        print(f"  {user['_id']}: {user['session_count']} sessions")
    
    print("\nSessions by month:")
    for month_data in sessions_by_month:
        year = month_data["_id"]["year"]
        month = month_data["_id"]["month"]
        count = month_data["count"]
        print(f"  {year}-{month:02d}: {count} sessions")
    
    return state

def check_user_stats(username):
    """
    Check detailed stats for a specific user.
    
    Args:
        username (str): Username to check stats for
        
    Returns:
        dict: User stats and session summary
    """
    db = get_db()
    
    # Get user document
    user = db.users.find_one({"username": username})
    if not user:
        print(f"User '{username}' not found")
        return None
    
    # Get user sessions
    sessions = list(db.sessions.find({"username": username}))
    
    # Calculate actual stats from sessions
    total_sessions = len(sessions)
    total_score = sum(session.get("score", 0) for session in sessions)
    total_attempted = sum(session.get("total_attempted", 0) for session in sessions)
    best_score = max((session.get("score", 0) for session in sessions), default=0)
    
    accuracy = 0
    if total_attempted > 0:
        accuracy = (total_score / total_attempted) * 100
    
    # Format results
    stored_stats = user.get("stats", {})
    actual_stats = {
        "session_count": total_sessions,
        "best_score": best_score,
        "accuracy": accuracy
    }
    
    # Check for discrepancies
    discrepancies = {}
    for key in actual_stats:
        stored_value = stored_stats.get(key)
        actual_value = actual_stats[key]
        if stored_value != actual_value:
            discrepancies[key] = {
                "stored": stored_value,
                "actual": actual_value
            }
    
    result = {
        "username": username,
        "stored_stats": stored_stats,
        "actual_stats": actual_stats,
        "discrepancies": discrepancies,
        "session_count": total_sessions
    }
    
    # Print report
    print(f"Stats Report for User: {username}")
    print("=================================")
    print("Stored Stats:")
    pprint.pprint(stored_stats)
    print("\nActual Stats (calculated from sessions):")
    pprint.pprint(actual_stats)
    
    if discrepancies:
        print("\nDiscrepancies Found:")
        pprint.pprint(discrepancies)
    else:
        print("\nNo discrepancies found between stored and actual stats.")
    
    return result

if __name__ == "__main__":
    # This section allows running the commands directly
    import sys
    if len(sys.argv) < 2:
        print("Usage: python -m management.commands.diagnostic_commands <command> [args]")
        print("Available commands: peer_metrics, db_state, check_user_stats")
        sys.exit(1)
        
    command = sys.argv[1]
    
    if command == "peer_metrics":
        debug_peer_metrics()
    elif command == "db_state":
        debug_database_state()
    elif command == "check_user_stats":
        if len(sys.argv) < 3:
            print("Usage: python -m management.commands.diagnostic_commands check_user_stats <username>")
            sys.exit(1)
        check_user_stats(sys.argv[2])
    else:
        print(f"Unknown command: {command}")
        print("Available commands: peer_metrics, db_state, check_user_stats")
        sys.exit(1)
