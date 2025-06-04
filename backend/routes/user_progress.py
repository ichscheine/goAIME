"""
User progress API endpoint for retrieving comprehensive performance analytics from the database.
This module provides endpoints to retrieve progress data for tracking user performance
across sessions, topics, and difficulty levels.
"""

from flask import request
from services.db_service import get_db
from utils.response_utils import success_response, error_response
from utils.logging_utils import log_event, log_exception
from utils.security_utils import sanitize_html
from datetime import datetime

def register_user_progress_routes(app):
    """Register routes for user progress tracking"""
    
    @app.route('/api/user/progress/<username>', methods=['GET'])
    def get_user_progress(username):
        """Get comprehensive progress data for a user"""
        try:
            if not username:
                return error_response("Username is required", 400)
                
            # Sanitize username
            username = sanitize_html(username)
            
            # Get the database connection
            db = get_db()
            
            # Query to find all sessions for the user
            user_sessions = list(db.sessions.find(
                {"username": username},
                {
                    "session_id": 1,
                    "completed_at": 1,
                    "year": 1,
                    "contest": 1,
                    "mode": 1,
                    "score": 1,
                    "total_attempted": 1,
                    "topic_performance": 1,
                    "difficulty_performance": 1,
                    "performance_metrics": 1
                }
            ).sort("completed_at", -1))  # Sort by completion date, newest first
            
            # Initialize the response data
            progress_data = {
                "topicPerformance": {},
                "difficultyPerformance": {},
                "overallPerformance": {
                    "totalSessions": len(user_sessions),
                    "totalProblems": 0,
                    "totalCorrect": 0,
                    "accuracyPercentage": 0,
                    "averageScore": 0
                },
                "recentSessions": [],
                # Add trend data and cohort comparison for enhanced dashboard
                "trendData": {
                    "accuracy": [],
                    "score": [],
                    "dates": []
                },
                "cohortComparison": {
                    "userPercentile": 0,
                    "averageAccuracy": 0,
                    "topPerformerAccuracy": 0,
                    "userAccuracy": 0
                }
            }
            
            # Process sessions to aggregate data
            if user_sessions:
                # Calculate aggregate performance metrics
                total_problems = 0
                total_correct = 0
                total_score = 0
                
                # Aggregate topic performance across all sessions
                all_topics = {}
                all_difficulties = {}
                
                # Process each session
                for session in user_sessions:
                    # Basic session data for recent sessions list
                    session_data = {
                        "completedAt": session.get("completed_at"),
                        "year": session.get("year"),
                        "contest": session.get("contest"),
                        "mode": session.get("mode"),
                        "score": session.get("score", 0),
                        "totalAttempted": session.get("total_attempted", 0),
                        "accuracy": 0
                    }
                    
                    # Calculate accuracy for the session
                    if session_data["totalAttempted"] > 0:
                        session_data["accuracy"] = (session_data["score"] / session_data["totalAttempted"]) * 100
                    
                    # Add to recent sessions list (limit to first 5)
                    if len(progress_data["recentSessions"]) < 5:
                        progress_data["recentSessions"].append(session_data)
                    
                    # Aggregate topic performance
                    session_topics = session.get("topic_performance", {})
                    for topic, data in session_topics.items():
                        if topic not in all_topics:
                            all_topics[topic] = {"attempted": 0, "correct": 0}
                        
                        all_topics[topic]["attempted"] += data.get("attempted", 0)
                        all_topics[topic]["correct"] += data.get("correct", 0)
                    
                    # Aggregate difficulty performance
                    session_difficulties = session.get("difficulty_performance", {})
                    for difficulty, data in session_difficulties.items():
                        if difficulty not in all_difficulties:
                            all_difficulties[difficulty] = {"attempted": 0, "correct": 0}
                        
                        all_difficulties[difficulty]["attempted"] += data.get("attempted", 0)
                        all_difficulties[difficulty]["correct"] += data.get("correct", 0)
                    
                    # Aggregate overall metrics
                    total_problems += session_data["totalAttempted"]
                    total_correct += session_data["score"]
                    total_score += session_data["score"]
                
                # Calculate accuracy for topics with improved weighting
                for topic, data in all_topics.items():
                    if data["attempted"] > 0:
                        # Base calculation
                        raw_accuracy = (data["correct"] / data["attempted"]) * 100
                        
                        # Apply weight adjustment for topics with few attempts
                        # This helps align with overall accuracy by giving more confidence to topics with more attempts
                        attempt_weight = min(1.0, data["attempted"] / 10)  # Full weight at 10+ attempts
                        
                        # Calculate weighted accuracy that's closer to overall accuracy
                        # For topics with very few attempts, this will pull values closer to the overall accuracy
                        overall_accuracy = (total_correct / total_problems * 100) if total_problems > 0 else 0
                        data["accuracy"] = (raw_accuracy * attempt_weight) + (overall_accuracy * (1 - attempt_weight))
                        
                        # Ensure we log both values for diagnostic purposes
                        data["raw_accuracy"] = raw_accuracy
                        data["weighted_factor"] = attempt_weight
                    else:
                        data["accuracy"] = 0
                        data["raw_accuracy"] = 0
                        data["weighted_factor"] = 0
                
                # Calculate accuracy for difficulties
                for difficulty, data in all_difficulties.items():
                    if data["attempted"] > 0:
                        data["accuracy"] = (data["correct"] / data["attempted"]) * 100
                    else:
                        data["accuracy"] = 0
                
                # Set overall performance metrics
                progress_data["overallPerformance"]["totalProblems"] = total_problems
                progress_data["overallPerformance"]["totalCorrect"] = total_correct
                
                # Calculate overall accuracy
                if total_problems > 0:
                    progress_data["overallPerformance"]["accuracyPercentage"] = (total_correct / total_problems) * 100
                
                # Calculate average score
                if len(user_sessions) > 0:
                    progress_data["overallPerformance"]["averageScore"] = total_score / len(user_sessions)
                
                # Set aggregated topic and difficulty performance
                progress_data["topicPerformance"] = all_topics
                progress_data["difficultyPerformance"] = all_difficulties
                
                # Populate trend data from recent sessions (up to 10)
                for session in user_sessions[:10]:
                    accuracy = 0
                    if session.get("total_attempted", 0) > 0:
                        accuracy = (session.get("score", 0) / session.get("total_attempted", 0)) * 100
                    
                    progress_data["trendData"]["accuracy"].append(accuracy)
                    progress_data["trendData"]["score"].append(session.get("score", 0))
                    progress_data["trendData"]["dates"].append(session.get("completed_at"))
                
                # Populate cohort comparison (basic implementation)
                if total_problems > 0:
                    user_accuracy = (total_correct / total_problems) * 100
                    progress_data["cohortComparison"]["userAccuracy"] = user_accuracy
                    progress_data["cohortComparison"]["averageAccuracy"] = 60  # Default value
                    progress_data["cohortComparison"]["topPerformerAccuracy"] = 85  # Default value
                    
                    # Simple percentile calculation (will be enhanced later)
                    if user_accuracy <= 50:
                        progress_data["cohortComparison"]["userPercentile"] = user_accuracy / 50 * 40
                    elif user_accuracy <= 75:
                        progress_data["cohortComparison"]["userPercentile"] = 40 + (user_accuracy - 50) / 25 * 30
                    else:
                        progress_data["cohortComparison"]["userPercentile"] = 70 + (user_accuracy - 75) / 25 * 30
            
            log_event('user.progress.retrieved', {
                'username': username,
                'session_count': len(user_sessions)
            })
            
            return success_response(
                data=progress_data,
                message='User progress data retrieved successfully'
            )
        except Exception as e:
            log_exception(e)
            return error_response(f"Failed to get user progress: {str(e)}", 500)
            
    @app.route('/api/cohort/metrics/<username>', methods=['GET'])
    def get_cohort_metrics(username):
        """Get cohort comparison metrics for a user"""
        try:
            if not username:
                return error_response("Username is required", 400)
                
            # Sanitize username
            username = sanitize_html(username)
            
            # Get the database connection
            db = get_db()
            
            # Step 1: Get user performance data for comparison
            user_data = db.users.find_one(
                {"username": username},
                {"performance_metrics": 1}
            )
            
            if not user_data:
                return error_response(f"User {username} not found", 404)
            
            # Get user performance metrics or calculate from sessions if not available
            user_metrics = user_data.get("performance_metrics", {})
            
            if not user_metrics:
                # Calculate from recent sessions if user profile doesn't have aggregated metrics
                user_sessions = list(db.sessions.find(
                    {"username": username},
                    {
                        "score": 1,
                        "total_attempted": 1,
                        "performance_metrics": 1
                    }
                ).sort("completed_at", -1).limit(10))
                
                if user_sessions:
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
            
            # Step 2: Get cohort data for statistical comparison
            # We'll fetch basic metrics for all users who have completed sessions
            # For privacy and performance reasons, we're not fetching all user data,
            # just the aggregated metrics needed for percentile calculations
            
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
            
            # Step 3: Generate arrays for percentile calculation
            cohort_scores = []
            cohort_accuracies = []
            cohort_speeds = []
            
            for user in cohort_users:
                if user.get("average_score") is not None:
                    cohort_scores.append(user.get("average_score"))
                
                if user.get("accuracy") is not None:
                    cohort_accuracies.append(user.get("accuracy"))
                
                if user.get("average_speed") is not None and user.get("average_speed") > 0:
                    cohort_speeds.append(user.get("average_speed"))
            
            # Sort arrays for percentile calculation
            cohort_scores.sort()
            cohort_accuracies.sort()
            cohort_speeds.sort()  # For speed, lower is better
            
            # Step 4: Calculate user percentiles
            user_score = user_metrics.get("average_score", 0)
            user_accuracy = user_metrics.get("accuracy", 0)
            user_speed = user_metrics.get("average_speed", 0)
            
            # Calculate score percentile (higher is better)
            score_percentile = 0
            if cohort_scores:
                score_percentile = (
                    len([score for score in cohort_scores if score < user_score]) / 
                    len(cohort_scores) * 100
                )
            
            # Calculate accuracy percentile (higher is better)
            accuracy_percentile = 0
            if cohort_accuracies:
                accuracy_percentile = (
                    len([acc for acc in cohort_accuracies if acc < user_accuracy]) / 
                    len(cohort_accuracies) * 100
                )
            
            # Calculate speed percentile (lower is better)
            speed_percentile = 0
            if cohort_speeds and user_metrics.get("average_speed", 0) > 0:
                speed_percentile = (
                    len([speed for speed in cohort_speeds if speed > user_metrics["average_speed"]]) / 
                    len(cohort_speeds) * 100
                )
                print(f"Speed percentile calculation: {len([speed for speed in cohort_speeds if speed > user_metrics['average_speed']])} out of {len(cohort_speeds)} are slower than {user_metrics['average_speed']} seconds")
            
            # Step 5: Calculate peer max values (absolute values)
            peer_max_score = max(cohort_scores) if cohort_scores else 100
            peer_max_accuracy = max(cohort_accuracies) if cohort_accuracies else 100
            # For speed, lower is better, so we use the minimum value
            peer_max_speed = min(cohort_speeds) if cohort_speeds else 5
            
            print(f"DEBUG: Cohort accuracy values length: {len(cohort_accuracies)}")
            print(f"DEBUG: Cohort accuracy values: {cohort_accuracies[:10]}...") # Print just the first 10 values
            print(f"DEBUG: Peer max accuracy: {peer_max_accuracy}")
            print(f"DEBUG: Is peer max accuracy default value? {peer_max_accuracy == 100 and not cohort_accuracies}")
            
            # Step 6: Prepare response data
            cohort_metrics = {
                # User metrics
                "userScore": user_metrics.get("average_score", 0),
                "userAccuracy": user_metrics.get("accuracy", 0),
                "userSpeed": user_metrics.get("average_speed", 0),
                
                # Peer max values
                "peerMaxScore": peer_max_score,
                "peerMaxAccuracy": peer_max_accuracy,
                "peerMaxSpeed": peer_max_speed,
                
                # User percentiles
                "userScorePercentile": score_percentile,
                "userAccuracyPercentile": accuracy_percentile,
                "userSpeedPercentile": speed_percentile,
                
                # Overall percentile (average of the three)
                "userPercentile": (score_percentile + accuracy_percentile + speed_percentile) / 3,
                
                # Cohort data for client-side calculations if needed
                "cohortData": {
                    "scores": cohort_scores,
                    "accuracies": cohort_accuracies,
                    "speeds": cohort_speeds
                }
            }
            
            log_event('user.cohort_metrics.retrieved', {
                'username': username,
                'cohort_size': len(cohort_users)
            })
            
            return success_response(
                data=cohort_metrics,
                message='Cohort comparison metrics retrieved successfully'
            )
        except Exception as e:
            log_exception(e)
            return error_response(f"Failed to get cohort metrics: {str(e)}", 500)
