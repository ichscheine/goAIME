import os
from dotenv import load_dotenv
from pymongo import MongoClient
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from root directory
import os.path
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(dotenv_path=env_path)
print(f"Loading environment variables from: {env_path}")

# MongoDB connection (moved from db_service)
_client = None
_db = None

class Config:
    """Base configuration"""
    SECRET_KEY = os.environ.get('SECRET_KEY', os.urandom(24))
    DEBUG = False
    TESTING = False
    
    # MongoDB
    MONGODB_URI = os.environ.get('MONGODB_URI')
    MONGODB_DB = os.environ.get('MONGODB_DB', 'goaime')
    
    # JWT
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'dev-secret-key-change-in-production')
    JWT_EXPIRATION_HOURS = int(os.environ.get('JWT_EXPIRATION_HOURS', 24))
    
    # AWS S3
    S3_BUCKET_NAME = os.environ.get('S3_BUCKET_NAME', 'goaime-users')
    AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY')
    AWS_REGION = os.environ.get('AWS_REGION', 'us-east-1')
    
    # API settings
    PAGE_SIZE = int(os.environ.get('PAGE_SIZE', 20))

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    
class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    MONGODB_DB = 'goaime_test'
    
class ProductionConfig(Config):
    """Production configuration"""
    # Production should use strong secret keys from environment variables
    pass

# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}

# Get configuration based on environment
def get_config():
    env = os.environ.get('FLASK_ENV', 'development')
    return config.get(env, config['default'])

def get_db_client():
    """Returns a MongoDB client instance"""
    global _client
    
    if _client is None:
        # Get configuration based on the current environment
        config = get_config()
        mongodb_uri = config.MONGODB_URI
        
        if not mongodb_uri:
            raise ValueError("MongoDB URI is not configured. Check your .env file.")
        
        logger.info(f"Connecting to MongoDB at {mongodb_uri.split('@')[1].split('/')[0] if mongodb_uri else 'unknown'}")
        _client = MongoClient(mongodb_uri)
        
    return _client

def get_db():
    """Returns the database instance"""
    global _db
    
    if _db is None:
        # Get configuration based on the current environment
        config = get_config()
        client = get_db_client()
        db_name = config.MONGODB_DB
        
        if not db_name:
            raise ValueError("MongoDB database name is not configured. Check your .env file.")
        
        logger.info(f"Using database: {db_name}")
        _db = client[db_name]
        
    return _db

def close_db():
    """Close the database connection"""
    global _client
    if _client:
        logger.info("Closing MongoDB connection")
        _client.close()
        _client = None

def get_db_info():
    """Returns current database connection information (for debugging)"""
    curr_config = get_config()
    connection_info = {
        'host': curr_config.MONGODB_URI.split('@')[1].split('/')[0] if curr_config.MONGODB_URI else 'Not configured',
        'database': curr_config.MONGODB_DB,
        'provider': 'MongoDB Atlas (Cloud)' if 'mongodb+srv://' in (curr_config.MONGODB_URI or '') else 'Local MongoDB',
        'env': os.environ.get('FLASK_ENV', 'development')
    }
    return connection_info