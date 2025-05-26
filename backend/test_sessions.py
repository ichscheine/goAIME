import pytest
from flask import Flask
from routes.sessions import register_session_routes
from services.db_service import get_db

def create_app():
    app = Flask(__name__)
    register_session_routes(app)
    return app

@pytest.fixture
def app():
    app = create_app()
    app.config['TESTING'] = True
    return app

@pytest.fixture
def client(app):
    return app.test_client()

def test_update_session(client):
    db = get_db()
    db.sessions.delete_many({})  # Clear the sessions collection before testing

    # Test data
    username = "test_user"
    session_data = {
        "session_id": "12345",
        "score": 10,
        "attempted": 15,
        "totalTime": 1200,
        "solvedProblems": [1, 2, 3]
    }

    # Test inserting a new session
    response = client.post('/api/sessions/update', json={
        "username": username,
        "sessionData": session_data
    })
    assert response.status_code == 200
    assert response.json['message'] == 'Session updated successfully'

    # Verify the session was inserted
    session_doc = db.sessions.find_one({"username": username, "session_id": session_data["session_id"]})
    assert session_doc is not None
    assert session_doc["score"] == session_data["score"]

    # Test updating the same session
    session_data["score"] = 20  # Update the score
    response = client.post('/api/sessions/update', json={
        "username": username,
        "sessionData": session_data
    })
    assert response.status_code == 200
    assert response.json['message'] == 'Session updated successfully'

    # Verify the session was updated
    session_doc = db.sessions.find_one({"username": username, "session_id": session_data["session_id"]})
    assert session_doc is not None
    assert session_doc["score"] == session_data["score"]
