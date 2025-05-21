from pymongo import MongoClient
import os

# MongoDB connection
_client = None
_db = None

def get_db_client():
    """Returns a MongoDB client instance"""
    global _client
    
    if _client is None:
        mongodb_uri = os.environ.get('MONGODB_URI')
        _client = MongoClient(mongodb_uri)
        
    return _client

def get_db():
    """Returns the database instance"""
    global _db
    
    if _db is None:
        client = get_db_client()
        db_name = os.environ.get('MONGODB_DB', 'goaime')
        _db = client[db_name]
        
    return _db

def init_db():
    """Initialize the database connection"""
    get_db()
    
def close_db():
    """Close the database connection"""
    global _client
    if _client:
        _client.close()
        _client = None

def create_indexes():
    """Create necessary database indexes"""
    db = get_db()
    
    # Users collection indexes
    db.users.create_index('email', unique=True)
    db.users.create_index('username', unique=True)
    
    # Problems collection indexes
    db.problems.create_index('title')
    db.problems.create_index('difficulty')
    db.problems.create_index('category')
    db.problems.create_index([('created_at', -1)])
    db.problems.create_index('contest_id')
    db.problems.create_index('problem_number')
    db.problems.create_index([('contest_id', 1), ('problem_number', 1)])
    
    # Contests collection indexes
    db.contests.create_index('title')
    db.contests.create_index('start_time')
    db.contests.create_index('end_time')
    db.contests.create_index('published')
    
    # Submissions collection indexes
    db.submissions.create_index([('user_id', 1), ('problem_id', 1)])
    db.submissions.create_index([('contest_id', 1), ('problem_id', 1)])
    
    # Problem Sessions collection indexes
    # TTL index for automatic cleanup of old sessions after 48 hours of inactivity
    db.problem_sessions.create_index("last_updated_at", expireAfterSeconds=172800)