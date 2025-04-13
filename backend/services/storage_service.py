import os
import boto3
from botocore.exceptions import ClientError
from models.asset import Asset  # Import Asset from models
from services.db_service import get_db
from utils.validators import is_valid_object_id
from utils.logging_utils import log_event, log_exception
from utils.security_utils import sanitize_html
import mimetypes
    
# AWS S3 Configuration
def get_s3_client():
    return boto3.client(
        's3',
        aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY'),
        region_name=os.environ.get('AWS_REGION', 'us-east-1')
    )

BUCKET_NAME = os.environ.get('S3_BUCKET_NAME', 'goaime-users')

def create_user_folders(username):
    """Create S3 folder structure for a new user"""
    try:
        s3 = get_s3_client()
        s3.put_object(Bucket=BUCKET_NAME, Key=f'{username}/assets/')
        s3.put_object(Bucket=BUCKET_NAME, Key=f'{username}/problems/')
        
        log_event('storage.folders_created', {'username': username})
        return True
    except Exception as e:
        log_exception(e, {'username': username})
        return False

def upload_asset(user_id, username, file, asset_type, asset_name):
    """Upload user asset (image or sound) to S3 and store metadata in DB"""
    if not is_valid_object_id(user_id):
        return None
        
    # Sanitize inputs
    asset_name = sanitize_html(asset_name)
    username = sanitize_html(username)
    
    db = get_db()
    
    try:
        # Determine file extension
        filename = file.filename
        file_extension = filename.split(".")[-1]
        
        # Create S3 path
        file_path = f'{username}/assets/{asset_type}s/{asset_name}.{file_extension}'
        
        # Get file size
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)  # Reset file pointer
        
        # Determine mime type
        mime_type = mimetypes.guess_type(filename)[0] or 'application/octet-stream'
        
        # Upload to S3
        s3 = get_s3_client()
        s3.upload_fileobj(
            file, 
            BUCKET_NAME, 
            file_path,
            ExtraArgs={
                'ContentType': mime_type,
                'ACL': 'public-read'  # Make the file publicly accessible
            }
        )
        
        # Generate URL
        asset_url = f'https://{BUCKET_NAME}.s3.amazonaws.com/{file_path}'
        
        # Create asset record
        asset = Asset(
            filename=filename,
            asset_type=asset_type,
            path=file_path,
            url=asset_url,
            user_id=user_id,
            size=file_size,
            metadata={'original_name': filename, 'mime_type': mime_type}
        )
        
        # Store in database
        db.assets.insert_one(asset.to_dict())
        
        log_event('storage.asset_uploaded', {
            'asset_type': asset_type,
            'size': file_size,
            'path': file_path
        }, user_id)
        
        return asset.to_json()
    except Exception as e:
        log_exception(e, {
            'user_id': user_id,
            'asset_type': asset_type,
            'filename': getattr(file, 'filename', 'unknown')
        })
        return None