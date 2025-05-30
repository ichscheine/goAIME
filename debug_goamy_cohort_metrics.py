from backend.services.db_service import get_db
import pprint

# Get database connection
db = get_db()

# Mock the cohort metrics call manually
def calculate_cohort_metrics_for_user(username):
    # Get user data
    user_data = db.users.find_one({"username": username})
    
    if not user_data:
        return {"error": f"User {username} not found"}
    
    # Get user sessions
    user_sessions = list(db.sessions.find(
        {"username": username},
        {
            "score": 1,
            "total_attempted": 1,
            "performance_metrics": 1
        }
    ))
    
    if not user_sessions:
        return {"error": f"No sessions found for user {username}"}
    
    # Calculate user metrics
    total_score = sum(session.get("score", 0) for session in user_sessions)
    total_attempted = sum(session.get("total_attempted", 0) for session in user_sessions)
    total_time = sum(
        session.get("performance_metrics", {}).get("total_metrics", {}).get("total_time_seconds", 0) 
        for session in user_sessions
    )
    
    user_metrics = {
        "average_score": total_score / len(user_sessions) if len(user_sessions) > 0 else 0,
        "accuracy": (total_score / total_attempted * 100) if total_attempted > 0 else 0,
        "average_speed": (total_time / total_attempted) if total_attempted > 0 else 0
    }
    
    # Get cohort data (all users)
    all_sessions = list(db.sessions.find(
        {"total_attempted": {"$gt": 0}},
        {
            "username": 1,
            "score": 1,
            "total_attempted": 1,
            "performance_metrics.total_metrics.total_time_seconds": 1
        }
    ))
    
    # Group by username
    users_data = {}
    for session in all_sessions:
        username = session.get("username")
        if username not in users_data:
            users_data[username] = {
                "sessions": [],
                "total_score": 0,
                "total_attempted": 0,
                "total_time": 0
            }
        
        users_data[username]["sessions"].append(session)
        users_data[username]["total_score"] += session.get("score", 0)
        users_data[username]["total_attempted"] += session.get("total_attempted", 0)
        users_data[username]["total_time"] += session.get("performance_metrics", {}).get("total_metrics", {}).get("total_time_seconds", 0) or 0
    
    # Calculate averages for each user
    cohort_scores = []
    cohort_accuracies = []
    cohort_speeds = []
    
    for user, data in users_data.items():
        if data["total_attempted"] > 0 and len(data["sessions"]) > 0:
            avg_score = data["total_score"] / len(data["sessions"])
            accuracy = (data["total_score"] / data["total_attempted"]) * 100
            avg_speed = data["total_time"] / data["total_attempted"] if data["total_attempted"] > 0 else 0
            
            cohort_scores.append(avg_score)
            cohort_accuracies.append(accuracy)
            if avg_speed > 0:
                cohort_speeds.append(avg_speed)
    
    # Sort for percentile calculation
    cohort_scores.sort()
    cohort_accuracies.sort()
    cohort_speeds.sort()
    
    # Calculate percentiles
    score_percentile = 0
    if cohort_scores:
        score_percentile = (
            len([score for score in cohort_scores if score < user_metrics["average_score"]]) / 
            len(cohort_scores) * 100
        )
    
    accuracy_percentile = 0
    if cohort_accuracies:
        accuracy_percentile = (
            len([acc for acc in cohort_accuracies if acc < user_metrics["accuracy"]]) / 
            len(cohort_accuracies) * 100
        )
    
    speed_percentile = 0
    if cohort_speeds and user_metrics["average_speed"] > 0:
        speed_percentile = (
            len([speed for speed in cohort_speeds if speed > user_metrics["average_speed"]]) / 
            len(cohort_speeds) * 100
        )
    
    # Calculate peer max values (95th percentile)
    peer_max_score = (
        cohort_scores[int(len(cohort_scores) * 0.95)] 
        if cohort_scores and len(cohort_scores) >= 20 
        else (max(cohort_scores) if cohort_scores else 100)
    )
    
    peer_max_accuracy = (
        cohort_accuracies[int(len(cohort_accuracies) * 0.95)] 
        if cohort_accuracies and len(cohort_accuracies) >= 20 
        else (max(cohort_accuracies) if cohort_accuracies else 100)
    )
    
    # For speed, lower is better, so we use the 5th percentile
    peer_max_speed = (
        cohort_speeds[int(len(cohort_speeds) * 0.05)] 
        if cohort_speeds and len(cohort_speeds) >= 20 
        else (min(cohort_speeds) if cohort_speeds else 5)
    )
    
    # Create results object
    results = {
        "userScore": user_metrics["average_score"],
        "userAccuracy": user_metrics["accuracy"],
        "userSpeed": user_metrics["average_speed"],
        
        "peerMaxScore": peer_max_score,
        "peerMaxAccuracy": peer_max_accuracy,
        "peerMaxSpeed": peer_max_speed,
        
        "userScorePercentile": score_percentile,
        "userAccuracyPercentile": accuracy_percentile,
        "userSpeedPercentile": speed_percentile,
        
        "userPercentile": (score_percentile + accuracy_percentile + speed_percentile) / 3,
        
        "debug": {
            "userSessionCount": len(user_sessions),
            "cohortUserCount": len(users_data),
            "cohortScoresCount": len(cohort_scores),
            "cohortAccuraciesCount": len(cohort_accuracies),
            "cohortSpeedsCount": len(cohort_speeds),
            "userMetrics": user_metrics
        }
    }
    
    return results

# Calculate metrics for goAmy
result = calculate_cohort_metrics_for_user("goAmy")
pprint.pprint(result)
