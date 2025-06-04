"""
Script to show topic-specific performance data for a specific user.
This script fetches user progress data using the same backend API that the
frontend uses and displays the topic performance data in a readable format.
"""

import json
from utils.logging_utils import setup_logging
from utils.response_utils import success_response, error_response
from services.db_service import get_db
from routes.user_progress import get_user_progress

def main():
    """Display topic performance data for a specific user"""
    setup_logging()
    
    # User to analyze
    username = "test_user_good_performer"
    
    print(f"\n=== Topic Performance Data for {username} ===\n")
    
    # Get the progress data using the same function as the API endpoint
    # This simulates calling /api/user/progress/{username}
    response = get_user_progress(username)
    
    # Parse the response
    if hasattr(response, 'get_json'):
        # If it's a Flask response object
        data = response.get_json()
    else:
        # If it's already a dictionary (direct function call)
        data = json.loads(response.get_data(as_text=True))
    
    if not data.get('success'):
        print(f"Error: {data.get('message', 'Unknown error')}")
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
        print(f"Average Speed: {overall.get('averageSpeed', 0):.2f}s")
    
if __name__ == "__main__":
    main()
