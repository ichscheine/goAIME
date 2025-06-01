#!/usr/bin/env python3
"""
Test the user progress API endpoint directly
"""

import os
import sys
sys.path.append('/Users/daoming/Documents/Github/goAIME/backend')

from routes.user_progress import get_user_progress
from flask import Flask
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/Users/daoming/Documents/Github/goAIME/.env')

def test_api_endpoint(username):
    """Test the API endpoint for a specific user"""
    print(f"\n=== Testing API endpoint for user: {username} ===")
    
    try:
        # Create a minimal Flask app context for testing
        app = Flask(__name__)
        
        with app.app_context():
            # Call the API function directly
            result = get_user_progress(username)
            
            if hasattr(result, 'status_code'):
                print(f"Status code: {result.status_code}")
                if result.status_code == 200:
                    data = result.get_json()
                    print(f"Topic performance keys: {list(data.get('topicPerformance', {}).keys())[:5]}...")
                    print(f"Difficulty performance keys: {list(data.get('difficultyPerformance', {}).keys())}")
                    
                    # Show sample topic data
                    topic_perf = data.get('topicPerformance', {})
                    if topic_perf:
                        sample_topic = list(topic_perf.keys())[0]
                        sample_data = topic_perf[sample_topic]
                        print(f"Sample topic '{sample_topic}': {sample_data}")
                    
                    # Show difficulty data
                    diff_perf = data.get('difficultyPerformance', {})
                    if diff_perf:
                        print(f"Difficulty performance: {diff_perf}")
                        
                else:
                    print(f"Error response: {result.get_data(as_text=True)}")
            else:
                print(f"Unexpected result type: {type(result)}")
                
    except Exception as e:
        print(f"Error testing API for user {username}: {e}")
        import traceback
        traceback.print_exc()

def main():
    """Test the API endpoint for key users"""
    test_users = ['goAmy', 'wongwong', 'dq']
    
    print("=== User Progress API Endpoint Test ===")
    
    for username in test_users:
        test_api_endpoint(username)
        
    print("\n=== API Test Complete ===")

if __name__ == "__main__":
    main()
