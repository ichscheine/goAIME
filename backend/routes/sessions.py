from flask import request, session
from services.user_service import authenticate_user, get_user_by_id, create_user
from services.auth_service import generate_token, verify_token, login_required
from utils.validators import validate_required_fields, is_valid_email, is_strong_password
from utils.response_utils import success_response, error_response
from utils.logging_utils import log_event, log_exception
from utils.security_utils import sanitize_html
from services.db_service import get_db, save_user_session
from datetime import datetime, timezone
import time

# Rate limiting storage (in production, use Redis or database)
session_save_timestamps = {}
RATE_LIMIT_SECONDS = 1  # Reduced from 5 seconds to 1 second between session saves per user

def register_session_routes(app):
    """Register routes for user authentication and session management"""
    
    @app.route('/api/auth/register', methods=['POST'])
    def register():
        try:
            data = request.get_json()
            
            # Validate required fields
            required_fields = ['username', 'email', 'password']
            valid, missing = validate_required_fields(data, required_fields)
            if not valid:
                return error_response(f"Missing required fields: {', '.join(missing)}", 400)
            
            # Sanitize inputs
            username = sanitize_html(data['username'])
            email = data['email'].lower().strip()
            
            # Validate email format
            if not is_valid_email(email):
                return error_response("Invalid email format", 400)
            
            # Validate password strength
            if not is_strong_password(data['password']):
                return error_response(
                    "Password must be at least 8 characters and contain uppercase, lowercase, and numbers", 
                    400
                )
            
            # Create user
            success, message, user_id = create_user(
                username=username,
                email=email,
                password=data['password']
            )
            
            if not success:
                return error_response(message, 400)
                
            log_event('user.register', {'email': email}, user_id)
            
            return success_response(
                {"user_id": user_id},
                "User registered successfully", 
                201
            )
        except Exception as e:
            log_exception(e)
            return error_response("Registration failed", 500)
    
    @app.route('/api/auth/login', methods=['POST'])
    def login():
        try:
            data = request.get_json()
            
            # Validate required fields
            required_fields = ['email', 'password']
            valid, missing = validate_required_fields(data, required_fields)
            if not valid:
                return error_response(f"Missing required fields: {', '.join(missing)}", 400)
            
            # Clean email input
            email = data['email'].lower().strip()
            
            # Authenticate user
            user = authenticate_user(email, data['password'])
            if not user:
                log_event('user.login.failed', {'email': email})
                return error_response("Invalid credentials", 401)
            
            # Generate JWT token
            token = generate_token(user['_id'])
            
            log_event('user.login', {'user_id': user['_id']}, user['_id'])
            
            return success_response({
                "token": token,
                "user": {
                    "id": str(user['_id']),
                    "username": user['username'],
                    "email": user['email'],
                    "role": user.get('role', 'user')
                }
            }, "Login successful")
        except Exception as e:
            log_exception(e)
            return error_response("Login failed", 500)
        
    @app.route('/api/reset-session', methods=['POST'])
    def reset_session():
        try:
            data = request.get_json()
            # Reset any session data as needed
            # This might clear problem history, scores, etc.
            
            # You can add any specific reset logic here
            
            return success_response({}, "Session reset successfully")
        except Exception as e:
            log_exception(e)
            return error_response("Failed to reset session", 500)
            
    @app.route('/api/sessions/update', methods=['POST'])
    def update_session():
        try:
            data = request.get_json()
            if not data:
                log_exception(Exception("Invalid payload: No JSON data"))
                return error_response("Invalid payload", 400)

            username = data.get('username')
            session_data = data.get('sessionData')

            if not username or not session_data:
                log_exception(Exception(f"Missing data: username={username}, sessionData={session_data}"))
                return error_response("Missing username or session data", 400)

            # Rate limiting check
            current_time = time.time()
            last_save_time = session_save_timestamps.get(username, 0)
            
            if current_time - last_save_time < RATE_LIMIT_SECONDS:
                log_event('session.update.rate_limited', {
                    'username': username,
                    'time_since_last': current_time - last_save_time
                })
                return error_response("Rate limit exceeded. Please wait before saving again.", 429)
            
            # Update the timestamp for this user
            session_save_timestamps[username] = current_time

            log_event('session.update.request', {
                'username': username,
                'session_id': session_data.get('session_id')
            })
            
            # Use the dedicated function to save the session
            document_id = save_user_session(username, session_data)
            
            return success_response(
                data={'success': True, 'document_id': document_id}, 
                message='Session updated successfully'
            )
        except Exception as e:
            log_exception(e)
            return error_response(f"Failed to update session: {str(e)}", 500)