from services.db_service import get_db
from bson.objectid import ObjectId
from datetime import datetime
from models.problem import Problem
from utils.logging_utils import log_exception, log_event

def get_all_problems(filters=None, page=1, per_page=20):
    """Get paginated problems matching the provided filters"""
    db = get_db()
    
    if filters is None:
        filters = {}
        
    # Only return published problems to regular users
    if 'admin' not in filters.get('_roles', []):
        filters['published'] = True
        
    # Remove internal filter keys
    if '_roles' in filters:
        del filters['_roles']
        
    try:
        # Calculate pagination
        skip = (page - 1) * per_page
        
        # Get total count for pagination
        total = db.problems.count_documents(filters)
        
        # Get paginated problems
        cursor = db.problems.find(filters) \
            .sort('created_at', -1) \
            .skip(skip) \
            .limit(per_page)
        
        problems = []
        for problem_data in cursor:
            problem = Problem.from_dict(problem_data)
            if problem:  # Make sure problem is not None
                problems.append(problem.to_json())
            
        return problems, total
    except Exception as e:
        log_exception(e, {'filters': filters, 'page': page})
        return [], 0

def get_problem_by_id(problem_id):
    """Get a specific problem by ID"""
    db = get_db()
    
    try:
        problem_data = db.problems.find_one({'_id': ObjectId(problem_id)})
        if not problem_data:
            return None
            
        problem = Problem.from_dict(problem_data)
        return problem.to_json()
    except Exception as e:
        log_exception(e, {'problem_id': problem_id})
        return None

def create_new_problem(problem_data):
    """Create a new problem"""
    db = get_db()
    
    try:
        # Create Problem model instance
        problem = Problem(
            title=problem_data['title'],
            description=problem_data['description'],
            difficulty=problem_data['difficulty'],
            category=problem_data.get('category'),
            content=problem_data.get('content', {}),
            test_cases=problem_data.get('test_cases', []),
            solution=problem_data.get('solution'),
            created_by=ObjectId(problem_data['created_by']) if problem_data.get('created_by') else None,
            published=problem_data.get('published', False)
        )
        
        # Insert into database
        result = db.problems.insert_one(problem.to_dict(include_solution=True))
        problem_id = str(result.inserted_id)
        
        log_event('problem.created', {
            'problem_id': problem_id,
            'title': problem_data['title']
        }, problem_data.get('created_by'))
        
        return problem_id
    except Exception as e:
        log_exception(e, {'title': problem_data.get('title')})
        raise

def update_problem_by_id(problem_id, problem_data):
    """Update a problem by ID"""
    db = get_db()
    
    try:
        # First check if problem exists
        existing = db.problems.find_one({'_id': ObjectId(problem_id)})
        if not existing:
            return False
            
        # Update timestamp
        problem_data['updated_at'] = datetime.utcnow()
        
        # Update in database
        result = db.problems.update_one(
            {'_id': ObjectId(problem_id)},
            {'$set': problem_data}
        )
        
        if result.modified_count > 0:
            log_event('problem.updated', {
                'problem_id': problem_id
            }, problem_data.get('updated_by'))
            
        return result.modified_count > 0
    except Exception as e:
        log_exception(e, {'problem_id': problem_id})
        return False

def delete_problem_by_id(problem_id):
    """Delete a problem by ID"""
    db = get_db()
    
    try:
        # First check if problem exists
        existing = db.problems.find_one({'_id': ObjectId(problem_id)})
        if not existing:
            return False
            
        # Delete from database
        result = db.problems.delete_one({'_id': ObjectId(problem_id)})
        
        if result.deleted_count > 0:
            log_event('problem.deleted', {
                'problem_id': problem_id
            })
            
        return result.deleted_count > 0
    except Exception as e:
        log_exception(e, {'problem_id': problem_id})
        return False