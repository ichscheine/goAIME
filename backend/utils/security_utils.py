import secrets
import string
import re
import html

def generate_secure_token(length=32):
    """Generate a cryptographically secure random token"""
    return secrets.token_urlsafe(length)

def generate_password(length=12):
    """Generate a secure random password"""
    # Include at least one of each character type
    lowercase = string.ascii_lowercase
    uppercase = string.ascii_uppercase
    digits = string.digits
    symbols = "!@#$%^&*()-_=+"
    
    # Ensure one character of each type
    pwd = [
        secrets.choice(lowercase),
        secrets.choice(uppercase),
        secrets.choice(digits),
        secrets.choice(symbols)
    ]
    
    # Fill the rest with random choices from all characters
    all_chars = lowercase + uppercase + digits + symbols
    pwd.extend(secrets.choice(all_chars) for _ in range(length - 4))
    
    # Shuffle the characters
    secrets.SystemRandom().shuffle(pwd)
    
    return ''.join(pwd)

def sanitize_html(content):
    """
    Remove potentially dangerous HTML tags and attributes
    """
    if not content:
        return content
        
    # Simple sanitizer - replace < and > with entities
    return html.escape(content)

def normalize_string(value):
    """Normalize a string (trim whitespace, convert to lowercase)"""
    if not value:
        return value
        
    return str(value).strip().lower()

def obfuscate_email(email):
    """Partially obfuscate an email address for display"""
    if not email or '@' not in email:
        return email
        
    username, domain = email.split('@', 1)
    
    # Show first and last character of username
    if len(username) <= 2:
        obfuscated_username = username
    else:
        obfuscated_username = username[0] + '*' * (len(username) - 2) + username[-1]
        
    return f"{obfuscated_username}@{domain}"