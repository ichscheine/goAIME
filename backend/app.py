from flask import Flask
from flask_cors import CORS
import os
import sys
from config import get_config
# Remove this import from top level - it's causing the conflict
# from routes.problems import register_problem_routes

def create_app(testing=False):
    app = Flask(__name__)
    CORS(app)
    
    # Remove this line - we'll register all routes together later
    # register_problem_routes(app)

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
    
    return app

if __name__ == "__main__":
    app = create_app()
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port)