import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, current_app
from services.user_service import get_user_by_id
from utils.validators import is_valid_object_id
from utils.logging_utils import log_event, log_exception

# Add any missing imports and functions if needed

def generate_token(user_id):
    """Generate a JWT token for authentication"""
    payload = {
        'user_id': str(user_id),
        'exp': datetime.utcnow() + timedelta(hours=24),
        'iat': datetime.utcnow()
    }
    
    token = jwt.encode(
        payload, 
        current_app.config.get('JWT_SECRET_KEY', 'dev-secret-key'), 
        algorithm='HS256'
    )
    return token

def verify_token(token):
    """Verify and decode a JWT token"""
    try:
        payload = jwt.decode(
            token, 
            current_app.config.get('JWT_SECRET_KEY', 'dev-secret-key'), 
            algorithms=['HS256']
        )
        return payload.get('user_id')
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def login_required(f):
    """Decorator for routes that require authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header[7:]
            
        if not token:
            return jsonify({'error': 'Authentication required'}), 401
            
        user_id = verify_token(token)
        if not user_id:
            return jsonify({'error': 'Invalid or expired token'}), 401
            
        # Add user_id to request object for use in route handlers
        request.user_id = user_id
        
        return f(*args, **kwargs)
    
    return decorated

def admin_required(f):
    """Decorator for routes that require admin privileges"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header[7:]
            
        if not token:
            return jsonify({'error': 'Authentication required'}), 401
            
        user_id = verify_token(token)
        if not user_id:
            return jsonify({'error': 'Invalid or expired token'}), 401
            
        # Check if user is an admin
        try:
            user_data = get_user_by_id(user_id)
            if not user_data or user_data.get('role') != 'admin':
                log_event('auth.admin_access_denied', {'endpoint': request.path}, user_id)
                return jsonify({'error': 'Admin privileges required'}), 403
                
            # Add user_id and role to request object
            request.user_id = user_id
            request.user_role = 'admin'
            
            log_event('auth.admin_access', {'endpoint': request.path}, user_id)
            
            return f(*args, **kwargs)
        except Exception as e:
            log_exception(e, {'user_id': user_id, 'endpoint': request.path})
            return jsonify({'error': 'Authentication error'}), 500
    
    return decorated