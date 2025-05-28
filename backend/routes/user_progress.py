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
                "recentSessions": []
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
                
                # Calculate accuracy for topics
                for topic, data in all_topics.items():
                    if data["attempted"] > 0:
                        data["accuracy"] = (data["correct"] / data["attempted"]) * 100
                    else:
                        data["accuracy"] = 0
                
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
