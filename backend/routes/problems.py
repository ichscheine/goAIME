from flask import request, session
from services.db_service import get_db  # Import the function that provides MongoDB access
from services.problem_service import get_all_problems, get_problem_by_id, create_new_problem, update_problem_by_id, delete_problem_by_id
from services.auth_service import login_required, admin_required
from utils.validators import validate_required_fields, is_valid_object_id
from utils.response_utils import success_response, error_response, paginated_response
from utils.logging_utils import log_event, log_exception
from utils.response_utils import success_response, error_response
from utils.logging_utils import log_exception
import random  # For random.choice()
import uuid

def register_problem_routes(app):
    """Register routes for problem management"""
    
    @app.route('/api/debug/env', methods=['GET'])
    def debug_env():
        import os
        from flask import jsonify
        
        return jsonify({
            'MONGODB_URI': os.environ.get('MONGODB_URI', 'Not set'),
            'MONGODB_DB': os.environ.get('MONGODB_DB', 'Default: goaime')
        })

    @app.route('/api/problems', methods=['GET'])
    def list_problems():
        try:
            # Extract query parameters
            page = int(request.args.get('page', 1))
            per_page = int(request.args.get('per_page', 20))
            difficulty = request.args.get('difficulty')
            category = request.args.get('category')
            
            filters = {}
            if difficulty:
                filters['difficulty'] = difficulty
            if category:
                filters['category'] = category
                
            # Get paginated problems
            problems, total = get_all_problems(
                filters=filters,
                page=page,
                per_page=per_page
            )
            
            return success_response(
                paginated_response(problems, page, total, per_page)
            )
        except Exception as e:
            log_exception(e)
            return error_response("Failed to retrieve problems", 500)
    
    # MOVED UP: This more specific route must come BEFORE the generic <problem_id> route
    @app.route('/api/problems/random', methods=['GET'])
    def get_random_problem():
        try:
            # Extract filter parameters
            contest = request.args.get('contest')
            year = request.args.get('year')
            difficulty = request.args.get('difficulty')
            exclude_ids = request.args.getlist('excludeIds')
            
            print(f"Random problem request - contest: {contest}, year: {year}")
            
            # Get database connection
            db = get_db()

            # collections = db.list_collection_names()
            # print(f"Available collections: {collections}")

            # Build query for MongoDB
            query = {}
            if contest and year:
                # If both contest and year are provided, search for exact match
                contest_prefix = contest.replace(' ', '')
                query['contest_id'] = f"{contest_prefix}_{year}"
            elif contest:
                # Just contest, no year
                contest_prefix = contest.replace(' ', '')
                query['contest_id'] = {'$regex': f'^{contest_prefix}'}
            elif year:
                # Just year, no contest
                query['contest_id'] = {'$regex': f'.*_{year}$'}

            if difficulty:
                query['difficulty'] = difficulty
                
            if exclude_ids:
                problem_nums = [int(pid) for pid in exclude_ids if pid.isdigit()]
                if problem_nums:
                    query['problem_number'] = {'$nin': problem_nums}

            print(f"MongoDB Query: {query}")
            
            # Get random problem from MongoDB
            problems = list(db.problems.find(query))
            print(f"Found {len(problems)} matching problems")
            
            if not problems:
                return error_response("No problems match the filter criteria", 404)
                
            # Select random problem
            problem = random.choice(problems)
            
            # Convert ObjectId to string
            problem['_id'] = str(problem['_id'])
            
            return success_response(problem)
            
        except Exception as e:
            log_exception(e)
            return error_response(f"Error retrieving random problem: {str(e)}", 500)
    
    # MOVED DOWN: Now this generic route won't capture /api/problems/random
    @app.route('/api/problems/<problem_id>', methods=['GET'])
    def get_problem(problem_id):
        if not is_valid_object_id(problem_id):
            return error_response("Invalid problem ID format", 400)
        
        try:
            problem = get_problem_by_id(problem_id)
            if not problem:
                return error_response("Problem not found", 404)
            
            return success_response(problem)
        except Exception as e:
            log_exception(e, {'problem_id': problem_id})
            return error_response("Failed to retrieve problem", 500)
    
    @app.route('/api/problems', methods=['POST'])
    @admin_required
    def create_problem():
        try:
            data = request.get_json()
            
            # Validate required fields
            required_fields = ['title', 'description', 'difficulty']
            valid, missing = validate_required_fields(data, required_fields)
            if not valid:
                return error_response(
                    f"Missing required fields: {', '.join(missing)}", 
                    400
                )
            
            # Add user ID from auth middleware
            data['created_by'] = request.user_id
            
            problem_id = create_new_problem(data)
            
            log_event('problem.create', {'problem_id': problem_id}, request.user_id)
            
            return success_response(
                {"problem_id": problem_id},
                "Problem created successfully", 
                201
            )
        except Exception as e:
            log_exception(e, {'data': data})
            return error_response("Failed to create problem", 500)
        
    session_problem_orders = {}  # Store by session ID

    @app.route('/api/problems/session', methods=['POST'])
    def initialize_session():
        """Initialize or restart a problem session with specified order"""
        try:
            data = request.get_json()
            session_id = data.get('session_id') or str(uuid.uuid4())
            shuffle = data.get('shuffle', False)
            contest = data.get('contest')
            year = data.get('year')
            
            # Get database connection
            db = get_db()
            
            # Build query for MongoDB to find all relevant problems
            query = {}
            if contest and year:
                contest_prefix = contest.replace(' ', '')
                query['contest_id'] = f"{contest_prefix}_{year}"
            
            # Find all matching problems
            problems = list(db.problems.find(query, {"problem_number": 1}))
            problem_numbers = [str(p.get('problem_number')) for p in problems]
            
            if not problem_numbers:
                return error_response("No problems found for the specified criteria", 404)
                
            # Sort numerically
            problem_numbers.sort(key=lambda x: int(x) if x.isdigit() else 0)
            
            # Shuffle if requested
            if shuffle:
                random.shuffle(problem_numbers)
            
            # Store the problem order for this session
            session_problem_orders[session_id] = {
                'problem_numbers': problem_numbers,
                'current_index': 0,
                'shuffle': shuffle,
                'contest': contest,
                'year': year
            }
            
            return success_response({
                'session_id': session_id, 
                'total_problems': len(problem_numbers),
                'shuffle': shuffle
            })
            
        except Exception as e:
            log_exception(e)
            return error_response(f"Error initializing session: {str(e)}", 500)

    @app.route('/api/problems/next', methods=['GET'])
    def get_next_problem():
        """Get the next problem in the session order"""
        try:
            session_id = request.args.get('session_id')
            if not session_id or session_id not in session_problem_orders:
                return error_response("Invalid or expired session", 400)
                
            session_data = session_problem_orders[session_id]
            problem_numbers = session_data['problem_numbers']
            current_index = session_data['current_index']
            
            # Check if we've reached the end
            if current_index >= len(problem_numbers):
                return error_response("End of problem set reached", 404)
                
            # Get the next problem number
            problem_number = problem_numbers[current_index]
            
            # Increment the index for next time
            session_data['current_index'] += 1
            
            # Get database connection
            db = get_db()
            
            # Get the problem
            query = {
                'problem_number': int(problem_number) if problem_number.isdigit() else problem_number
            }
            if session_data.get('contest') and session_data.get('year'):
                contest_prefix = session_data['contest'].replace(' ', '')
                query['contest_id'] = f"{contest_prefix}_{session_data['year']}"
            
            problem = db.problems.find_one(query)
            
            if not problem:
                return error_response(f"Problem not found: {problem_number}", 404)
                
            # Convert ObjectId to string
            problem['_id'] = str(problem['_id'])
            
            # Add session progress info
            problem['session_progress'] = {
                'current': current_index,
                'total': len(problem_numbers),
                'remaining': len(problem_numbers) - current_index
            }
            
            return success_response(problem)
            
        except Exception as e:
            log_exception(e)
            return error_response(f"Error getting next problem: {str(e)}", 500)