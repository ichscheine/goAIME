"""
Script to verify the accuracy values for specific topics (Equations and Triangle Properties).
"""
import requests
import json
import os
from dotenv import load_dotenv

def verify_specific_topics():
    """Check accuracy values for Equations and Triangle Properties"""
    # Load environment variables
    load_dotenv()
    
    # User to check
    username = "test_user_good_performer"
    
    # Get API base URL from environment, or use default
    api_base_url = os.getenv("REACT_APP_API_URL") or "http://127.0.0.1:5001"
    
    # Topics to verify
    target_topics = ["Equations", "Triangle Properties"]
    
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
            return
        
        # Extract topic performance data
        topic_data = data.get('data', {}).get('topicPerformance', {})
        
        print("\n==== VERIFICATION OF SPECIFIC TOPICS ====")
        print(f"{'Topic':<20} {'Accuracy':<10} {'Raw Accuracy':<15} {'Weighted Factor':<15} {'Expected Color':<15} {'Attempted/Correct':<20}")
        print("-" * 90)
        
        for topic_name in target_topics:
            if topic_name in topic_data:
                topic = topic_data[topic_name]
                accuracy = topic.get('accuracy', 0)
                raw_accuracy = topic.get('raw_accuracy', 'N/A')
                weight_factor = topic.get('weighted_factor', 'N/A')
                
                # Determine expected color
                if accuracy >= 75:
                    expected_color = "Green (#10b981)"
                elif accuracy >= 50:
                    expected_color = "Orange (#f59e0b)"
                else:
                    expected_color = "Red (#ef4444)"
                
                raw_acc_str = f"{raw_accuracy:.2f}%" if raw_accuracy != 'N/A' else 'N/A'
                weight_str = f"{weight_factor:.2f}" if weight_factor != 'N/A' else 'N/A'
                
                print(f"{topic_name:<20} {accuracy:.2f}%     {raw_acc_str:<15} {weight_str:<15} {expected_color:<15} {topic.get('correct', 0)}/{topic.get('attempted', 0)}")
            else:
                print(f"{topic_name:<20} Not found in topic data")
        
        # Get top 16 topics by attempt count
        top_topics = sorted(topic_data.items(), key=lambda x: x[1].get('attempted', 0), reverse=True)[:16]
        
        print("\n==== TOP 16 TOPICS BY ATTEMPT COUNT ====")
        print(f"{'#':<3} {'Topic':<30} {'Accuracy':<10} {'Attempted':<10} {'Expected Color':<15}")
        print("-" * 80)
        
        for i, (topic_name, topic) in enumerate(top_topics, 1):
            accuracy = topic.get('accuracy', 0)
            
            # Determine expected color
            if accuracy >= 75:
                expected_color = "Green (#10b981)"
            elif accuracy >= 50:
                expected_color = "Orange (#f59e0b)"
            else:
                expected_color = "Red (#ef4444)"
                
            print(f"{i:<3} {topic_name:<30} {accuracy:.2f}%     {topic.get('attempted', 0):<10} {expected_color:<15}")
            
        # Check if target topics are in top 16
        target_in_top16 = [topic_name for topic_name in target_topics if topic_name in [t[0] for t in top_topics]]
        not_in_top16 = [topic_name for topic_name in target_topics if topic_name not in [t[0] for t in top_topics]]
        
        print("\n==== SUMMARY ====")
        if target_in_top16:
            print(f"Topics in top 16: {', '.join(target_in_top16)}")
        if not_in_top16:
            print(f"Topics NOT in top 16 (won't be displayed in wind rose): {', '.join(not_in_top16)}")
        
        # Suggest frontend fix if needed
        print("\n==== RECOMMENDED ACTION ====")
        if target_in_top16:
            print("If these topics are not displaying with the correct colors in the wind rose chart:")
            print("1. Check that the frontend is using the correct accuracy values")
            print("2. Verify the color thresholds in the ProgressTracking.js file")
            print("3. Ensure the frontend is properly formatting the accuracy values")
        
    except requests.exceptions.RequestException as e:
        print(f"Error connecting to API: {e}")
    except json.JSONDecodeError:
        print("Error parsing API response")
    except Exception as e:
        print(f"Unexpected error: {e}")

if __name__ == "__main__":
    verify_specific_topics()
