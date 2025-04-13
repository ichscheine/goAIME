from datetime import datetime
from bson import ObjectId

class Submission:
    """Submission model representing a user's solution to a problem"""
    
    def __init__(
        self,
        user_id,
        problem_id,
        solution,
        status="pending",
        results=None,
        contest_id=None,
        submitted_at=None,
        execution_time=None,
        _id=None
    ):
        self._id = _id or ObjectId()
        self.user_id = user_id
        self.problem_id = problem_id
        self.solution = solution
        self.status = status  # pending, evaluating, accepted, rejected
        self.results = results or {}
        self.contest_id = contest_id
        self.submitted_at = submitted_at or datetime.utcnow()
        self.execution_time = execution_time
    
    @classmethod
    def from_dict(cls, data):
        """Create a Submission instance from a dictionary"""
        if data is None:
            return None
            
        return cls(
            _id=data.get('_id'),
            user_id=data.get('user_id'),
            problem_id=data.get('problem_id'),
            solution=data.get('solution'),
            status=data.get('status', 'pending'),
            results=data.get('results', {}),
            contest_id=data.get('contest_id'),
            submitted_at=data.get('submitted_at'),
            execution_time=data.get('execution_time')
        )
    
    def to_dict(self):
        """Convert Submission to dictionary"""
        return {
            "_id": self._id,
            "user_id": self.user_id,
            "problem_id": self.problem_id,
            "solution": self.solution,
            "status": self.status,
            "results": self.results,
            "contest_id": self.contest_id,
            "submitted_at": self.submitted_at,
            "execution_time": self.execution_time
        }
    
    def to_json(self):
        """Convert Submission to JSON-serializable dict (for API responses)"""
        result = self.to_dict()
        
        # Convert ObjectId to string
        result["_id"] = str(result["_id"])
        result["user_id"] = str(result["user_id"])
        result["problem_id"] = str(result["problem_id"])
        if result.get("contest_id"):
            result["contest_id"] = str(result["contest_id"])
        
        # Convert datetime objects to ISO format strings
        if result["submitted_at"]:
            result["submitted_at"] = result["submitted_at"].isoformat()
            
        return result