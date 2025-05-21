from datetime import datetime
from bson import ObjectId

class Problem:
    """Problem model representing a coding challenge"""

    def __init__(
        self,
        # existing args…
        title,
        description,
        difficulty,
        # new fields
        year=None,
        contest=None,
        problem_number=None,
        detailed_solution=None,
        similar_questions=None,
        # rest of existing args…
        category=None,
        content=None,
        test_cases=None,
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

        # wire in new fields
        self.year = year
        self.contest = contest
        self.problem_number = problem_number
        self.solution = detailed_solution         # front-end uses `.solution`
        self.similar_questions = similar_questions or []

        # existing fields...
        self.category = category
        self.content = content or {}
        self.test_cases = test_cases or []
        self.created_by = created_by
        self.published = published
        self.created_at = created_at or datetime.utcnow()
        self.updated_at = updated_at or datetime.utcnow()

    @classmethod
    def from_dict(cls, data):
        if data is None:
            return None
        return cls(
            _id=data.get('_id'),
            title=data.get('title'),
            description=data.get('problem_statement'),
            difficulty=data.get('difficulty'),
            year=data.get('year'),
            contest=data.get('contest'),
            problem_number=data.get('problem_number'),
            detailed_solution=data.get('detailed_solution'),
            similar_questions=data.get('similar_questions', []),
            category=data.get('category'),
            content=data.get('content'),
            test_cases=data.get('test_cases', []),
            created_by=data.get('created_by'),
            published=data.get('published', False),
            created_at=data.get('created_at'),
            updated_at=data.get('updated_at'),
        )

    def to_dict(self, include_solution=False):
        result = {
            "_id": str(self._id),
            "title": self.title,
            "description": self.description,
            "difficulty": self.difficulty,
            "year": self.year,
            "contest": self.contest,
            "problem_number": self.problem_number,
            "content": self.content,
            "test_cases": self.test_cases,
            # emit the real similar_questions array:
            "similar_questions": [
                {
                  "difficulty": p.get("difficulty"),
                  "question": p.get("question"),
                  "detailed_solution": p.get("detailed_solution")
                }
                for p in self.similar_questions
            ],
            "created_by": str(self.created_by) if self.created_by else None,
            "published": self.published,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
        if include_solution and self.solution:
            result["solution"] = self.solution
        return result