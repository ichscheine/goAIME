from flask import jsonify, request, session
from services.db_service import get_db_collections

def register_general_routes(app):
    @app.route('/', methods=['GET'])
    def index():
        """Root endpoint, currently returns a welcome message."""
        # Consider serving API documentation or a static frontend entry point here.
        return jsonify({"message": "Welcome to the goAIME API!"})