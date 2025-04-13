from datetime import datetime, timedelta
import pytz

def now():
    """Get current UTC datetime"""
    return datetime.now(pytz.UTC)

def format_iso(dt):
    """Format datetime as ISO string"""
    if not dt:
        return None
    return dt.isoformat()

def parse_iso(date_string):
    """Parse ISO date string to datetime"""
    if not date_string:
        return None
        
    try:
        # Handle dates with and without timezone
        if 'T' in date_string:
            if date_string.endswith('Z'):
                date_string = date_string[:-1] + '+00:00'
            return datetime.fromisoformat(date_string)
        else:
            # Date only
            return datetime.strptime(date_string, '%Y-%m-%d')
    except ValueError:
        return None

def is_future_date(dt):
    """Check if date is in the future"""
    if not dt:
        return False
    return dt > now()

def time_remaining(end_time):
    """Calculate time remaining until a deadline"""
    if not end_time:
        return None
        
    remaining = end_time - now()
    
    # Return None if already passed
    if remaining.total_seconds() < 0:
        return None
        
    return remaining

def time_elapsed(start_time):
    """Calculate elapsed time since a start time"""
    if not start_time:
        return None
        
    elapsed = now() - start_time
    
    # Don't return negative time
    if elapsed.total_seconds() < 0:
        return timedelta(0)
        
    return elapsed

def duration_format(td):
    """Format a timedelta in a human-readable format"""
    if not td:
        return None
        
    seconds = int(td.total_seconds())
    
    days, seconds = divmod(seconds, 86400)
    hours, seconds = divmod(seconds, 3600)
    minutes, seconds = divmod(seconds, 60)
    
    parts = []
    
    if days > 0:
        parts.append(f"{days}d")
    if hours > 0:
        parts.append(f"{hours}h")
    if minutes > 0:
        parts.append(f"{minutes}m")
    if seconds > 0 or not parts:
        parts.append(f"{seconds}s")
        
    return " ".join(parts)