import logging
import os
from datetime import datetime
import json
import traceback

# Configure logger
logger = logging.getLogger('goaime')

def setup_logging(app):
    """Setup application logging"""
    log_level = getattr(logging, app.config.get('LOG_LEVEL', 'INFO'))
    log_format = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    
    # Clear existing handlers
    logger.handlers.clear()
    
    # Configure logger
    logger.setLevel(log_level)
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(logging.Formatter(log_format))
    logger.addHandler(console_handler)
    
    # File handler (if configured)
    log_file = app.config.get('LOG_FILE')
    if log_file:
        os.makedirs(os.path.dirname(log_file), exist_ok=True)
        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(logging.Formatter(log_format))
        logger.addHandler(file_handler)
    
    # Don't propagate to root logger
    logger.propagate = False
    
    return logger

def log_event(event_type, data=None, user_id=None, level='info'):
    """
    Log an application event with structured data
    
    Args:
        event_type (str): Type of event (e.g., 'user.login', 'problem.create')
        data (dict): Additional event data
        user_id (str): ID of user who triggered the event
        level (str): Log level ('debug', 'info', 'warning', 'error', 'critical')
    """
    event = {
        'event_type': event_type,
        'timestamp': datetime.utcnow().isoformat(),
        'user_id': str(user_id) if user_id else None
    }
    
    if data:
        event['data'] = data
        
    # Log at specified level
    log_method = getattr(logger, level.lower())
    log_method(f"Event: {event_type} - {json.dumps(event)}")
    
    return event

def log_exception(exception, context=None):
    """
    Log an exception with context
    
    Args:
        exception (Exception): The exception
        context (dict): Additional context information
    """
    error_data = {
        'exception_type': type(exception).__name__,
        'exception': str(exception),
        'traceback': traceback.format_exc()
    }
    
    if context:
        error_data['context'] = context
        
    logger.error(f"Exception: {type(exception).__name__} - {json.dumps(error_data)}")