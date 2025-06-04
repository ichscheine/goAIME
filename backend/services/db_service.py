from pymongo import MongoClient
import os
import logging
import sys
from datetime import datetime, timezone
from datetime import datetime, timezone
from bson import ObjectId

# Fix the import error by changing from relative to absolute import
sys.path.append('/Users/daoming/Documents/Github/goAIME')
from backend.config import get_config  # Use absolute import instead

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB connection
_client = None
_db = None

def get_db_client():
    """Returns a MongoDB client instance"""
    global _client
    
    if _client is None:
        # Use the config module to get the MongoDB URI
        config = get_config()
        mongodb_uri = config.MONGODB_URI
        
        if not mongodb_uri:
            raise ValueError("MongoDB URI is not configured. Check your .env file.")
            
        logger.info(f"Connecting to MongoDB")
        _client = MongoClient(mongodb_uri)
        
    return _client

def get_db():
    """Returns the database instance"""
    global _db
    
    if _db is None:
        # Use the config module to get the database name
        config = get_config()
        client = get_db_client()
        db_name = config.MONGODB_DB
        
        if not db_name:
            raise ValueError("MongoDB database name is not configured. Check your .env file.")
            
        logger.info(f"Using database: {db_name}")
        _db = client[db_name]
        
    return _db

def init_db():
    """Initialize the database connection and log connection info"""
    db = get_db()
    logger.info(f"Database initialized: {db.name}")
    return db

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
    
    # User Sessions collection indexes
    db.sessions.create_index([('username', 1), ('session_id', 1)])
    db.sessions.create_index('created_at')
    db.sessions.create_index('score')
    db.sessions.create_index('total_attempted')
    db.sessions.create_index([('username', 1), ('created_at', -1)])
    db.sessions.create_index([('username', 1), ('score', -1)])
    db.sessions.create_index([('contest', 1), ('year', 1)])
    db.sessions.create_index('mode')
    db.sessions.create_index('session_status')
    db.sessions.create_index('performance_metrics.total_metrics.total_correct')
    db.sessions.create_index('performance_metrics.average_metrics.accuracy_percentage')
    
    logger.info("Database indexes created successfully")

def save_user_session(username, session_data):
    """
    Save a user session to the database with enhanced problem tracking
    
    Args:
        username (str): The username
        session_data (dict): The session data to save
        
    Returns:
        str: ID of the saved document
    """
    db = get_db()
    logger.info(f"Saving session for user: {username}")
    
    # Get session_id for deduplication
    session_id = session_data.get('session_id')
    if not session_id:
        logger.warning("No session_id provided, generating one")
        session_id = f"auto_{username}_{int(datetime.now(timezone.utc).timestamp())}"
        session_data['session_id'] = session_id
    
    # Check if session already exists with same session_id and username
    existing = db.sessions.find_one({
        'username': username, 
        'session_id': session_id
    })
    
    # Enhance the session data structure
    enhanced_session_data = enhance_session_data(session_data, username)
    
    if existing:
        # Check if this is a duplicate save (same score, attempted, etc.)
        existing_score = existing.get('score', 0)
        existing_attempted = existing.get('total_attempted', 0)
        new_score = enhanced_session_data.get('score', 0)
        new_attempted = enhanced_session_data.get('total_attempted', 0)
        
        if (existing_score == new_score and existing_attempted == new_attempted):
            logger.info(f"Duplicate session save detected, skipping: {session_id}")
            return str(existing['_id'])
        
        # Update existing session if data has changed
        result = db.sessions.update_one(
            {'_id': existing['_id']}, 
            {'$set': {**enhanced_session_data, 'updated_at': datetime.now(timezone.utc)}}
        )
        logger.info(f"Updated session: matched={result.matched_count}, modified={result.modified_count}")
        return str(existing['_id'])
    else:
        # Create new session document with proper field ordering
        document = {
            **enhanced_session_data,
            'created_at': datetime.now(timezone.utc)
        }
        result = db.sessions.insert_one(document)
        logger.info(f"Created new session: {result.inserted_id}")
        return str(result.inserted_id)


def enhance_session_data(session_data, username=None):
    """
    Enhance session data with improved problem tracking following required field structure and ordering
    
    Args:
        session_data (dict): Original session data
        username (str, optional): Username to ensure it's properly set
        
    Returns:
        dict: Enhanced session data with proper field ordering and structure
    """
    # Get database connection to fetch missing problem data
    db = get_db()
    
    # Process time data first
    total_time_ms = session_data.get('total_time_ms', session_data.get('totalTime', 0))
    
    # Process problems attempted data
    problems_attempted = session_data.get('problems_attempted', [])
    enhanced_problems = []
    
    if problems_attempted:
        for problem in problems_attempted:
            enhanced_problem = {
                'problem_number': problem.get('problem_number'),
                'problem_id': problem.get('problem_id'),
                'is_correct': problem.get('is_correct', problem.get('correct', False)),
                'selected_answer': problem.get('selected_answer'),
                'correct_answer': problem.get('correct_answer'),
                'time_spent_ms': problem.get('time_spent_ms', problem.get('time_spent', 0)),
                'time_spent_seconds': round((problem.get('time_spent_ms', problem.get('time_spent', 0)) / 1000), 2),
                'attempt_timestamp': problem.get('timestamp', datetime.now(timezone.utc).isoformat()),
                'difficulty': problem.get('difficulty'),
                'topics': problem.get('topics', []),
            }
            
            # If topics or difficulty are missing, fetch from problems collection
            problem_id = enhanced_problem.get('problem_id')
            if problem_id and (not enhanced_problem.get('topics') or not enhanced_problem.get('difficulty')):
                try:
                    db_problem = db.problems.find_one({"_id": ObjectId(problem_id)})
                    if db_problem:
                        if not enhanced_problem.get('topics'):
                            enhanced_problem['topics'] = db_problem.get('topics', [])
                        if not enhanced_problem.get('difficulty'):
                            enhanced_problem['difficulty'] = db_problem.get('difficulty')
                except Exception:
                    # Try with string ID if ObjectId fails
                    try:
                        db_problem = db.problems.find_one({"_id": problem_id})
                        if db_problem:
                            if not enhanced_problem.get('topics'):
                                enhanced_problem['topics'] = db_problem.get('topics', [])
                            if not enhanced_problem.get('difficulty'):
                                enhanced_problem['difficulty'] = db_problem.get('difficulty')
                    except Exception:
                        pass
                    try:
                        db_problem = db.problems.find_one({"_id": problem_id})
                        if db_problem:
                            if not enhanced_problem.get('topics'):
                                enhanced_problem['topics'] = db_problem.get('topics', [])
                            if not enhanced_problem.get('difficulty'):
                                enhanced_problem['difficulty'] = db_problem.get('difficulty')
                    except Exception:
                        # If all else fails, keep the original data
                        pass
            
            # Remove None values to keep the document clean
            enhanced_problem = {k: v for k, v in enhanced_problem.items() if v is not None}
            enhanced_problems.append(enhanced_problem)
    
    # Calculate performance data
    correct_problems = [p for p in enhanced_problems if p.get('is_correct', False)]
    incorrect_problems = [p for p in enhanced_problems if not p.get('is_correct', False)]
    
    # Build topic metrics
    topic_metrics = {}
    for problem in enhanced_problems:
        topics = problem.get('topics', [])
        if topics:  # Only process if topics exist
            for topic in topics:
                if topic and topic.strip():  # Ensure topic is not empty
                    if topic not in topic_metrics:
                        topic_metrics[topic] = {'attempted': 0, 'correct': 0}
                    topic_metrics[topic]['attempted'] += 1
                    if problem.get('is_correct', False):
                        topic_metrics[topic]['correct'] += 1
    
    # Add accuracy to topic metrics
    for topic in topic_metrics:
        attempted = topic_metrics[topic]['attempted']
        correct = topic_metrics[topic]['correct']
        topic_metrics[topic]['accuracy'] = round((correct / attempted) * 100, 2) if attempted > 0 else 0
    
    # Build difficulty metrics
    difficulty_metrics = {}
    for problem in enhanced_problems:
        difficulty = problem.get('difficulty')
        if difficulty and difficulty.strip():  # Ensure difficulty is not empty
            if difficulty not in difficulty_metrics:
                difficulty_metrics[difficulty] = {'attempted': 0, 'correct': 0}
            difficulty_metrics[difficulty]['attempted'] += 1
            if problem.get('is_correct', False):
                difficulty_metrics[difficulty]['correct'] += 1
    
    # Add accuracy to difficulty metrics
    for difficulty in difficulty_metrics:
        attempted = difficulty_metrics[difficulty]['attempted']
        correct = difficulty_metrics[difficulty]['correct']
        difficulty_metrics[difficulty]['accuracy'] = round((correct / attempted) * 100, 2) if attempted > 0 else 0
    
    # Ensure username is properly set - use parameter if provided, otherwise try session_data
    final_username = username or session_data.get('username')
    
    # Ensure user_id is properly set - try multiple sources and handle 'None' string
    user_id = session_data.get('user_id') or session_data.get('userId') or session_data.get('_user_id')
    
    # Handle case where user_id is the string 'None' - treat it as missing
    if user_id == 'None' or user_id == 'null':
        user_id = None
    
    # If user_id is still missing, try to look it up by username
    if not user_id and final_username:
        try:
            user_doc = db.users.find_one({"username": final_username})
            if user_doc:
                user_id = str(user_doc.get('_id'))
        except Exception:
            pass
    
    # Create the enhanced data with required field ordering
    enhanced_data = {
        'session_id': session_data.get('session_id'),
        'session_status': session_data.get('session_status', 'completed'),
        'created_at': session_data.get('created_at', datetime.now(timezone.utc)),
        'completed_at': session_data.get('completed_at', datetime.now(timezone.utc).isoformat()),
        'username': final_username,
        'user_id': user_id,
        'year': session_data.get('year'),
        'contest': session_data.get('contest'),
        'mode': 'competition' if session_data.get('mode') == 'contest' else session_data.get('mode'),
        'shuffle': session_data.get('shuffle', False),
        'score': session_data.get('score', 0),
        'total_attempted': session_data.get('total_attempted', session_data.get('attempted', len(enhanced_problems))),
        'problems_attempted': enhanced_problems,
        'performance_metrics': {
            'total_metrics': {
                'total_attempted': len(enhanced_problems),
                'total_correct': len(correct_problems),
                'total_incorrect': len(incorrect_problems),
                'total_time_ms': total_time_ms,
                'total_time_seconds': round(total_time_ms / 1000, 2),
                'total_time_minutes': round(total_time_ms / 60000, 2)
            },
            'average_metrics': {
                'accuracy_percentage': round((len(correct_problems) / len(enhanced_problems)) * 100, 2) if enhanced_problems else 0,
                'average_time_per_problem_ms': round(sum(p.get('time_spent_ms', 0) for p in enhanced_problems) / len(enhanced_problems), 2) if enhanced_problems else 0,
                'average_time_per_problem_seconds': round(sum(p.get('time_spent_ms', 0) for p in enhanced_problems) / len(enhanced_problems) / 1000, 2) if enhanced_problems else 0,
                'average_time_correct_problems_ms': round(sum(p.get('time_spent_ms', 0) for p in correct_problems) / len(correct_problems), 2) if correct_problems else 0,
                'average_time_incorrect_problems_ms': round(sum(p.get('time_spent_ms', 0) for p in incorrect_problems) / len(incorrect_problems), 2) if incorrect_problems else 0
            },
            'speed_metrics': {
                'fastest_correct_time_ms': min(p.get('time_spent_ms', float('inf')) for p in correct_problems) if correct_problems else None,
                'slowest_correct_time_ms': max(p.get('time_spent_ms', 0) for p in correct_problems) if correct_problems else None
            },
            'topic_metrics': topic_metrics,
            'difficulty_metrics': difficulty_metrics
        },
        # Use the properly calculated topic metrics for topic_performance instead of any manually set data
        'topic_performance': topic_metrics,
        # Use the properly calculated difficulty metrics for difficulty_performance
        'difficulty_performance': difficulty_metrics,
        'total_correct': len(correct_problems),
        'accuracy': round((len(correct_problems) / len(enhanced_problems)) * 100, 2) if enhanced_problems else 0
    }
    
    # Remove None values from top level
    enhanced_data = {k: v for k, v in enhanced_data.items() if v is not None}
    
    return enhanced_data