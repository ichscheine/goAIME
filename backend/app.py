from flask import Flask
from flask_cors import CORS
from flask_caching import Cache
from flask_compress import Compress
import os
import sys
from config import get_config

# Initialize caching and compression
cache = Cache(config={'CACHE_TYPE': 'SimpleCache'})
compress = Compress()

def create_app(testing=False):
    app = Flask(__name__)
    CORS(app)

    # Initialize caching and compression
    cache.init_app(app)
    compress.init_app(app)

    # Load appropriate configuration
    config = get_config()
    if testing:
        app.config.from_object('config.TestingConfig')
    else:
        app.config.from_object(config)
    
    # Set secret key for sessions
    app.secret_key = app.config['SECRET_KEY']
    
    if not testing:
        # Import services and routes after config is loaded
        from services.db_service import init_db, create_indexes
        from routes import register_routes
        from routes.problems import register_problem_routes
        from routes.contests import register_contest_routes
        from routes.sessions import register_session_routes
        from routes.user_stats import register_user_stats_routes
        from routes.user_progress import register_user_progress_routes
    
        # Initialize database
        try:
            init_db()
            create_indexes()
            print("Database initialization successful")
        except Exception as e:
            print(f"ERROR: Database initialization failed: {e}")
            if os.environ.get('FLASK_ENV') == 'production':
                sys.exit(1)

        # Register routes - register all routes in one place
        register_routes(app)
        register_problem_routes(app)
        register_contest_routes(app)
        register_session_routes(app)
        register_user_stats_routes(app)
        register_user_progress_routes(app)
        
        # Register maintenance routes if in development mode
        if os.environ.get('FLASK_ENV') == 'development':
            register_maintenance_routes(app)
    
    @app.route('/api/data')
    @cache.cached(timeout=300)
    def get_data():
        # Example endpoint with caching
        return {'data': 'This is cached data'}

    return app

def register_maintenance_routes(app):
    """
    Register maintenance routes for development/admin use.
    These routes provide direct API access to management commands.
    """
    from flask import jsonify
    from management.commands.session_commands import standardize_session_modes, check_user_sessions, fix_user_stats
    from management.commands.diagnostic_commands import debug_peer_metrics, debug_database_state, check_user_stats
    
    @app.route('/api/admin/maintenance/standardize_modes', methods=['POST'])
    def api_standardize_modes():
        """API endpoint to standardize session modes"""
        result = standardize_session_modes()
        return jsonify({"message": "Session modes standardized", "result": result})
    
    @app.route('/api/admin/maintenance/db_state', methods=['GET'])
    def api_db_state():
        """API endpoint to get database state"""
        result = debug_database_state()
        return jsonify({"message": "Database state", "result": result})
    
    @app.route('/api/admin/maintenance/fix_stats', methods=['POST'])
    def api_fix_stats():
        """API endpoint to fix user stats"""
        from flask import request
        username = request.json.get('username') if request.json else None
        result = fix_user_stats(username)
        return jsonify({"message": "User stats fixed", "result": result})
    
    print("Maintenance routes registered in development mode")

if __name__ == "__main__":
    app = create_app()
    port = int(os.environ.get('PORT', 5001))  # Changed from 5002 to match start_backend.sh
    app.run(host='0.0.0.0', port=port)