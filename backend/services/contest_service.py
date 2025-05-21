from services.db_service import get_db, get_db_client # Import get_db_client
from bson.objectid import ObjectId
from datetime import datetime
from models.contest import Contest  # Import the model
from models.submission import Submission  # For submissions

def get_contest_by_id(contest_id):
    """Get a specific contest by ID"""
    db = get_db()
    
    try:
        contest_data = db.contests.find_one({'_id': ObjectId(contest_id)})
        contest = Contest.from_dict(contest_data)
        return contest.to_json() if contest else None
    except Exception:
        return None

def get_all_contests(filters=None):
    """Get all contests matching the provided filters"""
    db = get_db()
    
    if filters is None:
        filters = {}
        
    # Only return published contests to regular users
    if 'admin' not in filters.get('_roles', []):
        filters['published'] = True
        
    # Remove internal filter keys
    if '_roles' in filters:
        del filters['_roles']
        
    cursor = db.contests.find(filters)
    contests = list(cursor)
    
    # Convert ObjectId to string for JSON serialization
    for contest in contests:
        contest['_id'] = str(contest['_id'])
        if 'problems' in contest:
            contest['problems'] = [str(p) if isinstance(p, ObjectId) else p for p in contest['problems']]
            
    return contests

def get_contest_by_id(contest_id):
    """Get a specific contest by ID"""
    db = get_db()
    
    try:
        contest = db.contests.find_one({'_id': ObjectId(contest_id)})
        if contest:
            contest['_id'] = str(contest['_id'])
            if 'problems' in contest:
                contest['problems'] = [str(p) if isinstance(p, ObjectId) else p for p in contest['problems']]
        return contest
    except Exception:
        return None

def create_new_contest(contest_data):
    """Create a new contest"""
    db = get_db()
    
    # Add metadata
    contest_data['created_at'] = datetime.utcnow()
    contest_data['updated_at'] = datetime.utcnow()
    contest_data['published'] = contest_data.get('published', False)
    
    # Convert problem IDs to ObjectId if they're strings
    if 'problems' in contest_data and contest_data['problems']:
        contest_data['problems'] = [
            ObjectId(p) if isinstance(p, str) else p 
            for p in contest_data['problems']
        ]
    
    result = db.contests.insert_one(contest_data)
    return str(result.inserted_id)

def update_contest_by_id(contest_id, contest_data):
    """Update a contest by ID"""
    db = get_db()
    
    try:
        # Update timestamp
        contest_data['updated_at'] = datetime.utcnow()
        
        # Convert problem IDs to ObjectId if they're strings
        if 'problems' in contest_data and contest_data['problems']:
            contest_data['problems'] = [
                ObjectId(p) if isinstance(p, str) else p 
                for p in contest_data['problems']
            ]
        
        result = db.contests.update_one(
            {'_id': ObjectId(contest_id)},
            {'$set': contest_data}
        )
        
        return result.matched_count > 0
    except Exception:
        return False

def delete_contest_by_id(contest_id):
    """Delete a contest by ID"""
    db = get_db()
    
    try:
        result = db.contests.delete_one({'_id': ObjectId(contest_id)})
        return result.deleted_count > 0
    except Exception:
        return False

def register_user_for_contest(contest_id, user_id):
    """Register a user for a contest"""
    db = get_db()
    client = get_db_client()

    try:
        with client.start_session() as session:
            with session.start_transaction():
                # Check if contest exists and is open for registration
                contest = db.contests.find_one({'_id': ObjectId(contest_id)}, session=session)
                
                if not contest:
                    return False, "Contest not found"
                    
                now = datetime.utcnow()
                if contest.get('registration_end') and now > contest['registration_end']:
                    return False, "Registration period has ended"
                    
                if now > contest['start_time']:
                    return False, "Contest has already started"
                    
                # Check if user is already registered
                if db.contest_registrations.find_one({
                    'contest_id': ObjectId(contest_id),
                    'user_id': ObjectId(user_id)
                }, session=session):
                    return False, "User is already registered for this contest"
                    
                # Register user
                db.contest_registrations.insert_one({
                    'contest_id': ObjectId(contest_id),
                    'user_id': ObjectId(user_id),
                    'registered_at': now
                }, session=session)
                
                return True, "Registration successful"
    except Exception as e:
        # Consider logging the exception here: log_exception(e)
        return False, f"Registration failed: {str(e)}"

def submit_contest_solution(contest_id, problem_id, user_id, solution):
    """Submit a solution for a contest problem"""
    db = get_db()
    client = get_db_client()
    
    try:
        with client.start_session() as session:
            with session.start_transaction():
                # Check if contest exists and is active
                contest = db.contests.find_one({'_id': ObjectId(contest_id)}, session=session)
                
                if not contest:
                    return False, "Contest not found", None
                    
                now = datetime.utcnow()
                if now < contest['start_time']:
                    return False, "Contest has not started yet", None
                    
                if now > contest['end_time']:
                    return False, "Contest has ended", None
                    
                # Check if problem belongs to contest
                # Note: contest['problems'] contains ObjectIds, so direct comparison is fine
                if ObjectId(problem_id) not in contest.get('problems', []):
                    return False, "Problem is not part of this contest", None
                    
                # Check if user is registered for contest
                if not db.contest_registrations.find_one({
                    'contest_id': ObjectId(contest_id),
                    'user_id': ObjectId(user_id)
                }, session=session):
                    return False, "User is not registered for this contest", None
                    
                # Create submission
                submission = {
                    'contest_id': ObjectId(contest_id),
                    'problem_id': ObjectId(problem_id),
                    'user_id': ObjectId(user_id),
                    'solution': solution,
                    'submitted_at': now,
                    'status': 'pending'  # Will be processed by evaluation service
                }
                
                result = db.submissions.insert_one(submission, session=session)
                
                return True, "Solution submitted successfully", str(result.inserted_id)
    except Exception as e:
        # Consider logging the exception here: log_exception(e)
        return False, f"Submission failed: {str(e)}", None