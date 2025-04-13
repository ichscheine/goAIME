from datetime import datetime
from bson import ObjectId

class User:
    """User model for authentication and profile information"""
    
    def __init__(
        self, 
        username, 
        email, 
        password=None, 
        role="user", 
        created_at=None,
        last_login=None,
        _id=None
    ):
        self._id = _id or ObjectId()
        self.username = username
        self.email = email
        self.password = password  # Stored as hashed value
        self.role = role
        self.created_at = created_at or datetime.utcnow()
        self.last_login = last_login
    
    @classmethod
    def from_dict(cls, data):
        """Create a User instance from a dictionary"""
        if data is None:
            return None
            
        return cls(
            _id=data.get('_id'),
            username=data.get('username'),
            email=data.get('email'),
            password=data.get('password'),
            role=data.get('role', 'user'),
            created_at=data.get('created_at'),
            last_login=data.get('last_login')
        )
    
    def to_dict(self, include_password=False):
        """Convert User to dictionary, optionally excluding password"""
        result = {
            "_id": self._id,
            "username": self.username,
            "email": self.email,
            "role": self.role,
            "created_at": self.created_at,
            "last_login": self.last_login
        }
        
        if include_password and self.password:
            result["password"] = self.password
            
        return result
    
    def to_json(self):
        """Convert User to JSON-serializable dict (for API responses)"""
        result = self.to_dict(include_password=False)
        result["_id"] = str(result["_id"])
        
        # Convert datetime objects to ISO format strings
        if result["created_at"]:
            result["created_at"] = result["created_at"].isoformat()
        if result["last_login"]:
            result["last_login"] = result["last_login"].isoformat()
            
        return result