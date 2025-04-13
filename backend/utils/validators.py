import re
from bson import ObjectId, errors

def is_valid_email(email):
    """Validate an email address format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def is_valid_username(username):
    """Validate username format (letters, numbers, underscore, 3-30 chars)"""
    pattern = r'^[a-zA-Z0-9_]{3,30}$'
    return bool(re.match(pattern, username))

def is_strong_password(password):
    """
    Check if password is strong:
    - At least 8 characters
    - Contains uppercase, lowercase, number
    """
    if len(password) < 8:
        return False
        
    patterns = [
        r'[A-Z]',  # uppercase
        r'[a-z]',  # lowercase
        r'[0-9]'   # number
    ]
    
    return all(bool(re.search(pattern, password)) for pattern in patterns)

def is_valid_object_id(id_string):
    """Check if string is a valid MongoDB ObjectId"""
    try:
        ObjectId(id_string)
        return True
    except (errors.InvalidId, TypeError):
        return False

def validate_required_fields(data, required_fields):
    """
    Validate that all required fields are present in the data
    
    Args:
        data (dict): The data to validate
        required_fields (list): List of field names that must be present
        
    Returns:
        tuple: (is_valid, missing_fields)
    """
    missing = [field for field in required_fields if field not in data]
    return (len(missing) == 0, missing)