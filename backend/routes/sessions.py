from flask import request, session
from services.user_service import authenticate_user, get_user_by_id, create_user
from services.auth_service import generate_token, verify_token, login_required
from utils.validators import validate_required_fields, is_valid_email, is_strong_password
from utils.response_utils import success_response, error_response
from utils.logging_utils import log_event, log_exception
from utils.security_utils import sanitize_html

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