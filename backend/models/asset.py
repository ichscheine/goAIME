from datetime import datetime
from bson import ObjectId

class Asset:
    """Asset model representing a user-uploaded file or resource"""
    
    def __init__(
        self,
        filename,
        asset_type,  # 'image', 'audio', 'document', etc.
        path,
        url,
        user_id,
        size=None,
        metadata=None,
        created_at=None,
        _id=None
    ):
        self._id = _id or ObjectId()
        self.filename = filename
        self.asset_type = asset_type
        self.path = path
        self.url = url
        self.user_id = user_id
        self.size = size
        self.metadata = metadata or {}
        self.created_at = created_at or datetime.utcnow()
    
    @classmethod
    def from_dict(cls, data):
        """Create an Asset instance from a dictionary"""
        if data is None:
            return None
            
        return cls(
            _id=data.get('_id'),
            filename=data.get('filename'),
            asset_type=data.get('asset_type'),
            path=data.get('path'),
            url=data.get('url'),
            user_id=data.get('user_id'),
            size=data.get('size'),
            metadata=data.get('metadata', {}),
            created_at=data.get('created_at')
        )
    
    def to_dict(self):
        """Convert Asset to dictionary"""
        return {
            "_id": self._id,
            "filename": self.filename,
            "asset_type": self.asset_type,
            "path": self.path,
            "url": self.url,
            "user_id": self.user_id,
            "size": self.size,
            "metadata": self.metadata,
            "created_at": self.created_at
        }
    
    def to_json(self):
        """Convert Asset to JSON-serializable dict (for API responses)"""
        result = self.to_dict()
        
        # Convert ObjectId to string
        result["_id"] = str(result["_id"])
        result["user_id"] = str(result["user_id"])
        
        # Convert datetime objects to ISO format strings
        if result["created_at"]:
            result["created_at"] = result["created_at"].isoformat()
            
        return result