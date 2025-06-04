"""
Script to verify that the weighted accuracy values are being correctly returned by the API
"""
import requests
import json
import sys
import os
from dotenv import load_dotenv

def verify_weighted_accuracy():
    """Check if the topic performance data includes the weighted accuracy fields"""
    # Load environment variables
    load_dotenv()
    
    # User to check
    username = "test_user_good_performer"
    
    # Get API base URL from environment, or use default
    api_base_url = os.getenv("REACT_APP_API_URL") or "http://127.0.0.1:5001"
    
    # Make a request to the API endpoint
    url = f"{api_base_url}/api/user/progress/{username}"
    print(f"Requesting data from: {url}")
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        
        # Parse the response
        data = response.json()
        
        if not data.get('success'):
            print(f"API Error: {data.get('message', 'Unknown error')}")
            return False
        
        # Extract topic performance data
        topic_data = data.get('data', {}).get('topicPerformance', {})
        
        if not topic_data:
            print("No topic performance data found")
            return False
        
        # Check if the first topic has the weighted accuracy fields
        sample_topic = next(iter(topic_data.values()))
        
        has_raw_accuracy = 'raw_accuracy' in sample_topic
        has_weighted_factor = 'weighted_factor' in sample_topic
        
        print("\n==== VERIFICATION RESULTS ====")
        print(f"raw_accuracy field exists: {has_raw_accuracy}")
        print(f"weighted_factor field exists: {has_weighted_factor}")
        
        if has_raw_accuracy and has_weighted_factor:
            print("\n✅ The backend is correctly calculating and returning weighted accuracy values")
        else:
            print("\n❌ The backend is NOT returning the weighted accuracy fields")
            print("This suggests the updated backend code may not be deployed or running")
        
        # Print a sample of topics showing both raw and weighted accuracies
        print("\n==== SAMPLE TOPIC ACCURACIES ====")
        print(f"{'Topic':<30} {'Accuracy':<10} {'Raw Accuracy':<15} {'Weight Factor':<15}")
        print("-" * 70)
        
        for topic, stats in list(topic_data.items())[:5]:  # Show first 5 topics
            accuracy = stats.get('accuracy', 0)
            raw_accuracy = stats.get('raw_accuracy', 'N/A')
            weight_factor = stats.get('weighted_factor', 'N/A')
            
            raw_acc_str = f"{raw_accuracy:.2f}%" if raw_accuracy != 'N/A' else 'N/A'
            weight_str = f"{weight_factor:.2f}" if weight_factor != 'N/A' else 'N/A'
            
            print(f"{topic:<30} {accuracy:.2f}%     {raw_acc_str:<15} {weight_str:<15}")
        
        return has_raw_accuracy and has_weighted_factor
    
    except requests.exceptions.RequestException as e:
        print(f"Error connecting to API: {e}")
        return False
    except json.JSONDecodeError:
        print("Error parsing API response")
        return False
    except Exception as e:
        print(f"Unexpected error: {e}")
        return False

if __name__ == "__main__":
    print("Verifying weighted accuracy implementation...")
    verify_weighted_accuracy()
