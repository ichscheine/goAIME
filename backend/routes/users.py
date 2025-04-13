import random
from flask import jsonify, request
from datetime import datetime
import re  # Import re for email validation
from models.user import USER_SCHEMA
from services.db_service import users, settings
from services.storage_service import create_user_folders

def register_user_routes(app):
    @app.route('/api/users/register', methods=['POST'])
    def register_user():
        try:
            data = request.json
            username = data.get('username')
            email = data.get('email')

            # Input validation
            if not username or not email:
                return jsonify({'message': 'Username and email are required'}), 400

            # Username format validation
            if not username.replace('_', '').isalnum():
                return jsonify({'message': 'Username can only contain letters, numbers, and underscores'}), 400

            # Basic email format validation
            email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_regex, email):
                return jsonify({'message': 'Invalid email format'}), 400

            # Check if username exists with case-insensitive search
            existing_user = users.find_one({
                'username': {'$regex': f'^{username}$', '$options': 'i'}
            })
            
            if existing_user:
                return jsonify({
                    'message': 'Username already exists',
                    'suggestion': f'{username}{random.randint(1,999)}'
                }), 409

            # Create new user document
            new_user = USER_SCHEMA.copy()
            new_user.update({
                'username': username.lower(),
                'email': email.lower(),
                'created_at': datetime.utcnow().isoformat()
            })

            # Create user settings
            settings_doc = {
                'username': username.lower(),
                'created_at': datetime.utcnow().isoformat(),
                'settings': {
                    'shuffle': False,
                    'show_solutions': False
                }
            }

            # Insert into MongoDB
            user_result = users.insert_one(new_user)
            settings_result = settings.insert_one(settings_doc)
            
            if not user_result.inserted_id or not settings_result.inserted_id:
                # Rollback if either insert fails
                if user_result.inserted_id:
                    users.delete_one({'_id': user_result.inserted_id})
                if settings_result.inserted_id:
                    settings.delete_one({'_id': settings_result.inserted_id})
                return jsonify({'message': 'Failed to create user'}), 500

            # Create S3 folder structure
            create_user_folders(username)

            # Return success response
            new_user['_id'] = str(user_result.inserted_id)
            return jsonify(new_user), 201

        except Exception as e:
            print(f"Registration error: {str(e)}")
            return jsonify({'message': 'Internal server error', 'error': str(e)}), 500

    @app.route('/api/assets/upload/<username>', methods=['POST'])
    def upload_user_asset(username):
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
        
        file = request.files['file']
        asset_type = request.form.get('type')  # 'sound' or 'image'
        asset_name = request.form.get('name')  # 'correct' or 'incorrect'
        
        if not file:
            return jsonify({'error': 'No file selected'}), 400
        
        from services.storage_service import upload_asset
        
        # Upload to S3
        asset_url = upload_asset(username, file, asset_type, asset_name)
        if not asset_url:
            return jsonify({'error': 'Failed to upload asset'}), 500
        
        # Update user's asset URL in MongoDB
        update_field = f'assets.{asset_type}s.{asset_name}'
        
        users.update_one(
            {'username': username.lower()},
            {'$set': {update_field: asset_url}}
        )
        
        return jsonify({
            'message': 'Asset uploaded successfully',
            'url': asset_url
        }), 200
