"""
Test script to check cohort metrics API and debug the accuracy values.
"""

import requests
import json
import sys

# Define the base URL - adjust if needed
BASE_URL = "http://localhost:5000"  # Change this if your backend runs on a different port

def test_cohort_metrics(username):
    """Test the cohort metrics API for a specific user."""
    
    url = f"{BASE_URL}/api/cohort/metrics/{username}"
    
    print(f"Testing cohort metrics API for user: {username}")
    print(f"URL: {url}")
    
    try:
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            print("\nAPI Response:")
            print(json.dumps(data, indent=2))
            
            # Extract specific values for analysis
            print("\nKey metrics:")
            print(f"- User accuracy: {data.get('data', {}).get('userAccuracy')}")
            print(f"- Peer max accuracy: {data.get('data', {}).get('peerMaxAccuracy')}")
            print(f"- User accuracy percentile: {data.get('data', {}).get('userAccuracyPercentile')}")
            
            # Check if cohort data exists
            cohort_data = data.get('data', {}).get('cohortData', {})
            accuracies = cohort_data.get('accuracies', [])
            
            if accuracies:
                print(f"\nCohort accuracies summary:")
                print(f"- Count: {len(accuracies)}")
                print(f"- Min: {min(accuracies)}")
                print(f"- Max: {max(accuracies)}")
                print(f"- First few values: {accuracies[:5]}")
            else:
                print("\nNo cohort accuracy data found.")
            
            return data
        else:
            print(f"Error: Received status code {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"Exception occurred: {str(e)}")

if __name__ == "__main__":
    # Use command line argument as username, or default to "test"
    username = sys.argv[1] if len(sys.argv) > 1 else "test"
    test_cohort_metrics(username)
