#!/usr/bin/env python3

from services.db_service import get_db
from services.problem_service import get_all_problems
from flask import Flask
from routes.sessions import register_session_routes

def main():
    # Test the modified get_all_problems function
    filters = {
        'contest_id': 'AMC10A_2022',
        'problem_number': 1
    }
    
    print(f"Testing get_all_problems with filters: {filters}")
    problems, total = get_all_problems(filters=filters)
    print(f"Results: {len(problems)} problems, {total} total")
    
    if problems:
        print("First problem keys:", list(problems[0].keys()))
        print("Has solution:", 'solution' in problems[0])

def test_update_session():
    app = Flask(__name__)
    register_session_routes(app)

    with app.test_client() as client:
        # Test case: Valid session update
        response = client.post('/api/sessions/update', json={
            'username': 'test_user',
            'sessionData': {
                'session_id': '12345',
                'score': 10,
                'attempted': 15,
                'totalTime': 1200,
                'solvedProblems': [1, 2, 3]
            }
        })
        print("Response for valid session update:", response.json)

        # Test case: Missing username
        response = client.post('/api/sessions/update', json={
            'sessionData': {
                'session_id': '12345',
                'score': 10,
                'attempted': 15,
                'totalTime': 1200,
                'solvedProblems': [1, 2, 3]
            }
        })
        print("Response for missing username:", response.json)

        # Test case: Missing sessionData
        response = client.post('/api/sessions/update', json={
            'username': 'test_user'
        })
        print("Response for missing sessionData:", response.json)

if __name__ == '__main__':
    main()
    test_update_session()
