#!/usr/bin/env python3
"""
Script to verify the fix for the wind rose chart update issue by testing API data
This script connects to the backend API, fetches user progress data, and verifies
that the topic performance data is correctly structured for the wind rose chart.
"""

import os
import sys
import json
import requests
from datetime import datetime

def test_wind_rose_data(username):
    """Test the wind rose chart data for a specific user"""
    print(f"\n=== Testing Wind Rose Chart Data for {username} ===\n")
    
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
        
        # Analyze topic data for wind rose chart
        print(f"Found {len(topic_data)} topics with performance data")
        
        # Sort topics by attempts (same as in the wind rose chart logic)
        sorted_topics = sorted(topic_data.items(), key=lambda x: x[1].get('attempted', 0), reverse=True)
        top_topics = sorted_topics[:8] # Wind rose chart shows top 8 topics
        
        print(f"\nTop {len(top_topics)} topics that should be displayed in wind rose chart:")
        print(f"{'Topic':<30} {'Accuracy':<10} {'Correct':<10} {'Attempted':<10}")
        print("-" * 70)
        
        for topic, stats in top_topics:
            attempted = stats.get('attempted', 0)
            correct = stats.get('correct', 0)
            accuracy = stats.get('accuracy', 0)
            
            # Determine color based on accuracy (same logic as in ProgressTracking.js)
            color = "🔴"  # Red
            if accuracy >= 75:
                color = "🟢"  # Green
            elif accuracy >= 50:
                color = "🟡"  # Yellow
                
            print(f"{topic:<30} {accuracy:.2f}% {color:<4} {correct:<10} {attempted:<10}")
        
        # Verify that each topic has the required properties for the chart
        print("\nVerifying topic data structure for wind rose chart:")
        all_valid = True
        
        for topic, stats in top_topics:
            if 'attempted' not in stats or 'correct' not in stats or 'accuracy' not in stats:
                print(f"❌ Topic '{topic}' is missing required properties")
                all_valid = False
                continue
                
            if not isinstance(stats['attempted'], (int, float)) or not isinstance(stats['correct'], (int, float)):
                print(f"❌ Topic '{topic}' has invalid data types")
                all_valid = False
                continue
                
            print(f"✅ Topic '{topic}' has valid data structure")
            
        if all_valid:
            print("\n✅ All topic data is correctly structured for the wind rose chart")
        else:
            print("\n❌ Some topics have invalid data that may prevent the chart from updating")
        
        # Create a diagnostic report
        report = {
            "timestamp": datetime.now().isoformat(),
            "username": username,
            "num_topics": len(topic_data),
            "top_topics": [{
                "name": topic,
                "accuracy": stats.get('accuracy', 0),
                "correct": stats.get('correct', 0),
                "attempted": stats.get('attempted', 0)
            } for topic, stats in top_topics],
            "all_valid": all_valid
        }
        
        # Save the report to a file
        filename = f"windrose_diagnostic_{username}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(filename, 'w') as f:
            json.dump(report, f, indent=2)
            
        print(f"\nDiagnostic report saved to {filename}")
        
        return report
        
    except requests.exceptions.RequestException as e:
        print(f"Error connecting to API: {e}")
    except json.JSONDecodeError:
        print("Error parsing API response")
    except Exception as e:
        print(f"Unexpected error: {e}")
        
if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python verify_windrose_update.py <username>")
        sys.exit(1)
        
    username = sys.argv[1]
    test_wind_rose_data(username)
