from services.db_service import get_db
from bson.objectid import ObjectId
import bcrypt
from datetime import datetime
from models.user import User
from utils.validators import is_valid_email, is_valid_username
from utils.logging_utils import log_exception, log_event

def authenticate_user(email, password):
    """Authenticate a user by email and password"""
    db = get_db()
    
    try:
        # Find user with the given email
        user_data = db.users.find_one({'email': email.lower().strip()})
        if not user_data:
            return None
            
        # Check password
        stored_password = user_data.get('password')
        if not stored_password:
            return None
            
        if bcrypt.checkpw(password.encode('utf-8'), stored_password):
            # Update last login time
            db.users.update_one(
                {'_id': user_data['_id']},
                {'$set': {'last_login': datetime.utcnow()}}
            )
            
            # Log successful login
            log_event('user.authenticated', {'user_id': str(user_data['_id'])})
            
            # Return user without password
            user_data.pop('password', None)
            return user_data
        else:
            # Log failed login attempt
            log_event('user.authentication_failed', {'email': email}, level='warning')
            return None
    except Exception as e:
        log_exception(e, {'email': email})
        return None

# Existing functions remain the same
def get_user_by_id(user_id):
    """Get a user by ID"""
    db = get_db()
    
    try:
        user_data = db.users.find_one({'_id': ObjectId(user_id)})
        if not user_data:
            return None
            
        user = User.from_dict(user_data)
        return user.to_json()
    except Exception as e:
        log_exception(e, {'user_id': user_id})
        return None

def create_user(username, email, password, role='user'):
    """Create a new user"""
    db = get_db()
    
    # Validate inputs
    if not is_valid_email(email):
        return False, "Invalid email format", None
        
    if not is_valid_username(username):
        return False, "Username must be 3-30 characters and contain only letters, numbers, and underscores", None
    
    # Check if user with this email or username already exists
    if db.users.find_one({'email': email.lower().strip()}):
        return False, "Email already registered", None
        
    if db.users.find_one({'username': username}):
        return False, "Username already taken", None
    
    try:
        # Hash the password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        # Create user model instance
        user = User(
            username=username,
            email=email.lower().strip(),
            password=hashed_password,
            role=role
        )
        
        # Insert into database
        result = db.users.insert_one(user.to_dict(include_password=True))
        user_id = str(result.inserted_id)
        
        log_event('user.created', {'user_id': user_id, 'username': username})
        return True, "User created successfully", user_id
    except Exception as e:
        log_exception(e, {'username': username, 'email': email})
        return False, f"User creation failed: {str(e)}", None