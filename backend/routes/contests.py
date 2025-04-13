from flask import request, jsonify
from services.contest_service import get_all_contests, get_contest_by_id, create_new_contest, update_contest_by_id
from services.contest_service import delete_contest_by_id, register_user_for_contest, submit_contest_solution
from services.auth_service import login_required, admin_required
from datetime import datetime

def register_contest_routes(app):
    """Register routes for contest management"""
    
    @app.route('/api/contests', methods=['GET'])
    def list_contests():
        """Get all contests with optional filtering"""
        filters = {}
        
        # Filter by status (upcoming, active, completed)
        status = request.args.get('status')
        if status:
            now = datetime.now()
            if status == 'upcoming':
                filters['start_time'] = {'$gt': now}
            elif status == 'active':
                filters['start_time'] = {'$lte': now}
                filters['end_time'] = {'$gte': now}
            elif status == 'completed':
                filters['end_time'] = {'$lt': now}
        
        contests = get_all_contests(filters)
        return jsonify({"contests": contests})
    
    @app.route('/api/contests/<contest_id>', methods=['GET'])
    def get_contest(contest_id):
        """Get a specific contest by ID"""
        contest = get_contest_by_id(contest_id)
        if not contest:
            return jsonify({"error": "Contest not found"}), 404
        
        return jsonify(contest)
    
    @app.route('/api/contests', methods=['POST'])
    @admin_required
    def create_contest():
        """Create a new contest"""
        data = request.get_json()
        
        required_fields = ['title', 'description', 'start_time', 'end_time', 'problems']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Validate date format and logic
        try:
            start_time = datetime.fromisoformat(data['start_time'].replace('Z', '+00:00'))
            end_time = datetime.fromisoformat(data['end_time'].replace('Z', '+00:00'))
            
            if start_time >= end_time:
                return jsonify({"error": "Start time must be before end time"}), 400
                
        except ValueError:
            return jsonify({"error": "Invalid date format"}), 400
        
        contest_id = create_new_contest(data)
        return jsonify({"message": "Contest created successfully", "contest_id": contest_id}), 201
    
    @app.route('/api/contests/<contest_id>', methods=['PUT'])
    @admin_required
    def update_contest(contest_id):
        """Update an existing contest"""
        data = request.get_json()
        
        success = update_contest_by_id(contest_id, data)
        if not success:
            return jsonify({"error": "Contest not found"}), 404
        
        return jsonify({"message": "Contest updated successfully"})
    
    @app.route('/api/contests/<contest_id>', methods=['DELETE'])
    @admin_required
    def delete_contest(contest_id):
        """Delete a contest"""
        success = delete_contest_by_id(contest_id)
        if not success:
            return jsonify({"error": "Contest not found"}), 404
        
        return jsonify({"message": "Contest deleted successfully"})
    
    @app.route('/api/contests/<contest_id>/register', methods=['POST'])
    @login_required
    def register_for_contest(contest_id):
        """Register current user for a contest"""
        user_id = request.user_id  # Assuming auth middleware sets this
        
        success, message = register_user_for_contest(contest_id, user_id)
        if not success:
            return jsonify({"error": message}), 400
        
        return jsonify({"message": message})
    
    @app.route('/api/contests/<contest_id>/submit', methods=['POST'])
    @login_required
    def submit_solution(contest_id):
        """Submit a solution for a contest problem"""
        data = request.get_json()
        user_id = request.user_id
        
        if 'problem_id' not in data or 'solution' not in data:
            return jsonify({"error": "Missing problem_id or solution"}), 400
        
        success, message, submission_id = submit_contest_solution(
            contest_id=contest_id,
            problem_id=data['problem_id'],
            user_id=user_id,
            solution=data['solution']
        )
        
        if not success:
            return jsonify({"error": message}), 400
        
        return jsonify({
            "message": message,
            "submission_id": submission_id
        })