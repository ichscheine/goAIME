#!/usr/bin/env python3

import requests
import json
import sys

# Print Python version and path
print(f"Python version: {sys.version}")
print(f"Python executable: {sys.executable}")

# Test the session update endpoint
def test_session_update():
    test_url = "http://127.0.0.1:5001/api/sessions/update"
    
    # Valid test case
    payload = {
        'username': 'test_user',
        'sessionData': {
            'session_id': '12345',
            'score': 10,
            'attempted': 15,
            'totalTime': 1200,
            'solvedProblems': [1, 2, 3]
        }
    }
    
    try:
        print(f"Sending request to: {test_url}")
        print(f"Payload: {json.dumps(payload, indent=2)}")
        
        # Test if the server is running
        response = requests.post(test_url, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Session update successful!")
        else:
            print("❌ Session update failed!")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection error: Is the backend server running?")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    test_session_update()
