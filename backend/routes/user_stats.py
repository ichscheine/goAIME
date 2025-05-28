"""
User stats API endpoint for retrieving accurate user statistics from the database
"""

from flask import request
from services.db_service import get_db
from utils.response_utils import success_response, error_response
from utils.logging_utils import log_event, log_exception
from utils.security_utils import sanitize_html

def register_user_stats_routes(app):
    """Register routes for user statistics"""
    
    @app.route('/api/user/stats/<username>', methods=['GET'])
    def get_user_stats(username):
        """Get user stats from the database"""
        try:
            if not username:
                return error_response("Username is required", 400)
                
            # Sanitize username
            username = sanitize_html(username)
            
            # Get the database connection
            db = get_db()
            
            # Get session count
            session_count = db.sessions.count_documents({"username": username})
            
            # Find best score
            best_score = 0
            cursor = db.sessions.find({"username": username})
            
            for session in cursor:
                score = session.get('score', 0)
                if score and isinstance(score, (int, float)) and score > best_score:
                    best_score = score
            
            log_event('user.stats.retrieved', {
                'username': username,
                'session_count': session_count,
                'best_score': best_score
            })
            
            return success_response(
                data={
                    'sessionCount': session_count,
                    'bestScore': best_score
                },
                message='User stats retrieved successfully'
            )
        except Exception as e:
            log_exception(e)
            return error_response(f"Failed to get user stats: {str(e)}", 500)
