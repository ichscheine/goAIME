from flask import jsonify, request
from utils.response_utils import success_response
from utils.logging_utils import log_event

def register_routes(app):
    """Register basic application routes"""
    
    @app.route('/')
    def index():
        log_event('api.access', {'endpoint': '/'})
        return success_response({
            "name": "GoAIME API",
            "version": "1.0.0",
            "status": "running"
        })
    
    @app.route('/health')
    def health_check():
        # Log health check with lower level to avoid log spam
        log_event('api.health_check', level='debug')
        return success_response({"status": "healthy"})