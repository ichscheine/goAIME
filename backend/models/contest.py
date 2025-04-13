from datetime import datetime
from bson import ObjectId

class Contest:
    """Contest model representing a timed competition"""
    
    def __init__(
        self,
        title,
        description,
        start_time,
        end_time,
        problems=None,
        created_by=None,
        published=False,
        registration_end=None,
        created_at=None,
        updated_at=None,
        _id=None
    ):
        self._id = _id or ObjectId()
        self.title = title
        self.description = description
        self.start_time = start_time
        self.end_time = end_time
        self.problems = problems or []
        self.created_by = created_by
        self.published = published
        self.registration_end = registration_end
        self.created_at = created_at or datetime.utcnow()
        self.updated_at = updated_at or datetime.utcnow()
    
    @classmethod
    def from_dict(cls, data):
        """Create a Contest instance from a dictionary"""
        if data is None:
            return None
            
        return cls(
            _id=data.get('_id'),
            title=data.get('title'),
            description=data.get('description'),
            start_time=data.get('start_time'),
            end_time=data.get('end_time'),
            problems=data.get('problems', []),
            created_by=data.get('created_by'),
            published=data.get('published', False),
            registration_end=data.get('registration_end'),
            created_at=data.get('created_at'),
            updated_at=data.get('updated_at')
        )
    
    def to_dict(self):
        """Convert Contest to dictionary"""
        return {
            "_id": self._id,
            "title": self.title,
            "description": self.description,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "problems": self.problems,
            "created_by": self.created_by,
            "published": self.published,
            "registration_end": self.registration_end,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }
    
    def to_json(self):
        """Convert Contest to JSON-serializable dict (for API responses)"""
        result = self.to_dict()
        
        # Convert ObjectId to string
        result["_id"] = str(result["_id"])
        if result.get("created_by"):
            result["created_by"] = str(result["created_by"])
        
        # Convert problem IDs to strings
        result["problems"] = [str(p) for p in result["problems"]]
        
        # Convert datetime objects to ISO format strings
        for date_field in ["start_time", "end_time", "registration_end", "created_at", "updated_at"]:
            if result.get(date_field):
                result[date_field] = result[date_field].isoformat()
            
        return result