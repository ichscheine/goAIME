"""
Script to show topic-specific performance data for a specific user.
This script makes a direct request to the API endpoint to fetch user progress data.
"""

import requests
import json
import os
from dotenv import load_dotenv

def main():
    """Display topic performance data for a specific user"""
    # Load environment variables
    load_dotenv()
    
    # User to analyze
    username = "test_user_good_performer"
    
    print(f"\n=== Topic Performance Data for {username} ===\n")
    
    # Get API base URL from environment, or use default
    api_base_url = os.getenv("REACT_APP_API_URL") or "http://127.0.0.1:5001"
    
    # Make a request to the API endpoint
    url = f"{api_base_url}/api/user/progress/{username}"
    print(f"Requesting data from: {url}")
    
    try:
        response = requests.get(url)
        response.raise_for_status()  # Raise an exception for 4XX/5XX responses
        
        # Parse the response
        data = response.json()
        
        if not data.get('success'):
            print(f"API Error: {data.get('message', 'Unknown error')}")
            return
        
        # Extract topic performance data
        topic_data = data.get('data', {}).get('topicPerformance', {})
        
        if not topic_data:
            print("No topic performance data found for this user.")
            return
        
        # Print topic performance data in a nicely formatted way
        print(f"{'Topic':<30} {'Attempted':<10} {'Correct':<10} {'Accuracy':<10}")
        print("-" * 60)
        
        for topic, stats in sorted(topic_data.items()):
            attempted = stats.get('attempted', 0)
            correct = stats.get('correct', 0)
            accuracy = stats.get('accuracy', 0)
            
            print(f"{topic:<30} {attempted:<10} {correct:<10} {accuracy:.2f}%")
        
        print("\n=== Overall Performance ===\n")
        
        # Extract overall performance data
        overall = data.get('data', {}).get('overallPerformance', {})
        
        if overall:
            print(f"Total Sessions: {overall.get('totalSessions', 0)}")
            print(f"Total Problems: {overall.get('totalProblems', 0)}")
            print(f"Average Score: {overall.get('averageScore', 0):.2f}")
            print(f"Accuracy: {overall.get('accuracyPercentage', 0):.2f}%")
            if 'averageSpeed' in overall:
                print(f"Average Speed: {overall.get('averageSpeed', 0):.2f}s")
        
        # Also print difficulty performance for completeness
        difficulty_data = data.get('data', {}).get('difficultyPerformance', {})
        
        if difficulty_data:
            print("\n=== Difficulty Performance ===\n")
            print(f"{'Difficulty':<15} {'Attempted':<10} {'Correct':<10} {'Accuracy':<10}")
            print("-" * 45)
            
            for difficulty, stats in sorted(difficulty_data.items()):
                attempted = stats.get('attempted', 0)
                correct = stats.get('correct', 0)
                accuracy = stats.get('accuracy', 0)
                
                print(f"{difficulty:<15} {attempted:<10} {correct:<10} {accuracy:.2f}%")
                
    except requests.exceptions.RequestException as e:
        print(f"Error connecting to API: {e}")
    except json.JSONDecodeError:
        print("Error parsing API response")
    except Exception as e:
        print(f"Unexpected error: {e}")

if __name__ == "__main__":
    main()
