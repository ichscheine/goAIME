from datetime import datetime
from bson import ObjectId

class Problem:
    """Problem model representing a coding challenge"""
    
    def __init__(
        self,
        title,
        description,
        difficulty,
        category=None,
        content=None,
        test_cases=None,
        solution=None,
        created_by=None,
        published=False,
        created_at=None,
        updated_at=None,
        _id=None
    ):
        self._id = _id or ObjectId()
        self.title = title
        self.description = description
        self.difficulty = difficulty
        self.category = category
        self.content = content or {}
        self.test_cases = test_cases or []
        self.solution = solution
        self.created_by = created_by
        self.published = published
        self.created_at = created_at or datetime.utcnow()
        self.updated_at = updated_at or datetime.utcnow()
    
    @classmethod
    def from_dict(cls, data):
        """Create a Problem instance from a dictionary"""
        if data is None:
            return None
            
        return cls(
            _id=data.get('_id'),
            title=data.get('title'),
            description=data.get('description'),
            difficulty=data.get('difficulty'),
            category=data.get('category'),
            content=data.get('content'),
            test_cases=data.get('test_cases', []),
            solution=data.get('solution'),
            created_by=data.get('created_by'),
            published=data.get('published', False),
            created_at=data.get('created_at'),
            updated_at=data.get('updated_at')
        )
    
    def to_dict(self, include_solution=False):
        """Convert Problem to dictionary, optionally excluding solution"""
        result = {
            "_id": self._id,
            "title": self.title,
            "description": self.description,
            "difficulty": self.difficulty,
            "category": self.category,
            "content": self.content,
            "test_cases": self.test_cases,
            "created_by": self.created_by,
            "published": self.published,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }
        
        if include_solution and self.solution:
            result["solution"] = self.solution
            
        return result
    
    def to_json(self, include_solution=False):
        """Convert Problem to JSON-serializable dict (for API responses)"""
        result = self.to_dict(include_solution=include_solution)
        
        # Convert ObjectId to string
        result["_id"] = str(result["_id"])
        if result.get("created_by"):
            result["created_by"] = str(result["created_by"])
        
        # Convert datetime objects to ISO format strings
        if result["created_at"]:
            result["created_at"] = result["created_at"].isoformat()
        if result["updated_at"]:
            result["updated_at"] = result["updated_at"].isoformat()
            
        return result