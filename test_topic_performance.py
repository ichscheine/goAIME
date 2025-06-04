"""
Test script to check topic performance data for a specific user
"""
import sys
import os
import json
import pymongo

def analyze_user_topic_performance(username):
    # Connect to MongoDB Atlas (cloud database)
    try:
        # Check for environment variables first
        mongodb_uri = os.environ.get("MONGODB_URI")
        
        # If not found in environment, use default Atlas URI
        if not mongodb_uri:
            # Note: This is a placeholder URI - replace with your actual MongoDB Atlas URI
            # Normally this would be in an environment variable
            mongodb_uri = "mongodb+srv://goaime:goaime@cluster0.mongodb.net/goAIME?retryWrites=true&w=majority"
            print("WARNING: Using placeholder MongoDB Atlas URI. Please set MONGODB_URI environment variable.")
            print("Example: export MONGODB_URI='mongodb+srv://username:password@cluster.mongodb.net/dbname'")
        
        client = pymongo.MongoClient(mongodb_uri)
        db = client["goAIME"]
        # Test the connection
        client.admin.command('ping')
        print(f"Successfully connected to MongoDB Atlas")
    except Exception as e:
        print(f"Error connecting to MongoDB Atlas: {e}")
        return
    
    # Find the user
    user = db.users.find_one({"username": username})
    if not user:
        print(f"User '{username}' not found")
        return
    
    print(f"Found user: {username} (ID: {user['_id']})")
    
    # Find all sessions for this user
    # Try different possible schema formats for sessions
    user_id = user["_id"]
    sessions = list(db.sessions.find({"$or": [
        {"userId": user_id},
        {"user_id": user_id},
        {"username": username}
    ]}))
    print(f"Found {len(sessions)} sessions for user")
    
    # Analyze topic performance
    topic_performance = {}
    
    for session in sessions:
        # Only process completed sessions (check different possible status field names)
        if (session.get("status") != "completed" and 
            session.get("sessionStatus") != "completed" and
            session.get("state") != "completed"):
            continue
            
        # Process each problem in the session
        problems = session.get("problems", [])
        for problem in problems:
            # Get the problem's topic
            topic = problem.get("topic", "Unknown")
            
            # Skip if no attempts were made
            if "attempts" not in problem or not problem["attempts"]:
                continue
                
            # Determine if the problem was answered correctly
            is_correct = False
            for attempt in problem.get("attempts", []):
                if attempt.get("isCorrect", False):
                    is_correct = True
                    break
            
            # Update topic performance data
            if topic not in topic_performance:
                topic_performance[topic] = {
                    "attempted": 0,
                    "correct": 0,
                    "accuracy": 0
                }
            
            topic_performance[topic]["attempted"] += 1
            if is_correct:
                topic_performance[topic]["correct"] += 1
    
    # Calculate accuracy for each topic
    for topic, data in topic_performance.items():
        data["accuracy"] = (data["correct"] / data["attempted"]) * 100 if data["attempted"] > 0 else 0
    
    # Calculate overall accuracy across all topics
    total_attempted = sum(data["attempted"] for data in topic_performance.values())
    total_correct = sum(data["correct"] for data in topic_performance.values())
    overall_accuracy = (total_correct / total_attempted) * 100 if total_attempted > 0 else 0
    
    # Calculate weighted accuracy (weighted by number of attempts)
    weighted_sum = sum(data["accuracy"] * data["attempted"] for data in topic_performance.values())
    weighted_accuracy = weighted_sum / total_attempted if total_attempted > 0 else 0
    
    # Calculate simple average (unweighted) of topic accuracies
    simple_avg_accuracy = sum(data["accuracy"] for data in topic_performance.values()) / len(topic_performance) if topic_performance else 0
    
    # Calculate this alternate weighted method sometimes used
    frontend_weighted_avg = (sum(data["accuracy"] * data["attempted"] for data in topic_performance.values()) / 
                           sum(data["attempted"] for data in topic_performance.values())) if total_attempted > 0 else 0
    
    # Calculate session-based accuracy (this matches the 69.33% value in the dashboard)
    # For a user with 12 sessions, 300 problems total, and 17.33 correct answers per session on average
    # The calculation would be (17.33/25) * 100 = 69.33%
    session_count = len([s for s in sessions if s.get("status") == "completed" or 
                        s.get("sessionStatus") == "completed" or
                        s.get("state") == "completed"])
    problems_per_session = 25  # Standard AMC contest length
    
    if session_count > 0:
        avg_correct_per_session = total_correct / session_count
        session_based_accuracy = (avg_correct_per_session / problems_per_session) * 100
    else:
        session_based_accuracy = 0
    
    # Double check calculation to help debug
    print("\nDEBUG CALCULATIONS:")
    print(f"Total correct answers: {total_correct}")
    print(f"Total attempted problems: {total_attempted}")
    print(f"Number of completed sessions: {session_count}")
    print(f"Average correct answers per session: {avg_correct_per_session:.2f}" if session_count > 0 else "Average correct answers per session: 0")
    print(f"Overall accuracy (correct/attempted): {overall_accuracy:.2f}%")
    print(f"Session-based accuracy (avg correct per session / problems per session): {session_based_accuracy:.2f}%")
    print(f"Weighted accuracy method 1: {weighted_accuracy:.2f}%")
    print(f"Weighted accuracy method 2 (frontend method): {frontend_weighted_avg:.2f}%")
    print(f"Simple unweighted average: {simple_avg_accuracy:.2f}%")
    
    # Sort topics by number of attempts (descending)
    sorted_topics = sorted(topic_performance.items(), key=lambda x: x[1]["attempted"], reverse=True)
    
    # Print topic performance data
    print("\nTOPIC PERFORMANCE ANALYSIS:")
    print("=" * 50)
    print(f"{'Topic':<25} {'Accuracy':<10} {'Correct':<10} {'Attempted':<10}")
    print("-" * 50)
    
    for topic, data in sorted_topics:
        print(f"{topic:<25} {data['accuracy']:.2f}%     {data['correct']:<10} {data['attempted']:<10}")
    
    # Check how many topics have accuracy over 50%
    topics_over_50 = [t for t, d in topic_performance.items() if d["accuracy"] > 50]
    topics_over_75 = [t for t, d in topic_performance.items() if d["accuracy"] > 75]
    
    print("\nSUMMARY:")
    print(f"Total topics: {len(topic_performance)}")
    print(f"Overall accuracy across all topics: {overall_accuracy:.2f}%")
    print(f"Session-based accuracy (shown in dashboard as 'Avg. Accuracy / Session'): {session_based_accuracy:.2f}%")
    print(f"Weighted average accuracy: {weighted_accuracy:.2f}%")
    print(f"Simple average accuracy: {simple_avg_accuracy:.2f}%")
    print(f"Topics with accuracy > 50%: {len(topics_over_50)} ({(len(topics_over_50)/len(topic_performance))*100:.2f}% of topics)")
    print(f"Topics with accuracy > 75%: {len(topics_over_75)} ({(len(topics_over_75)/len(topic_performance))*100:.2f}% of topics)")
    
    # Calculate distribution metrics
    attempts_by_topic = [data["attempted"] for data in topic_performance.values()]
    print(f"\nATTEMPT DISTRIBUTION:")
    print(f"Max attempts on a topic: {max(attempts_by_topic) if attempts_by_topic else 0}")
    print(f"Min attempts on a topic: {min(attempts_by_topic) if attempts_by_topic else 0}")
    print(f"Avg attempts per topic: {sum(attempts_by_topic)/len(attempts_by_topic) if attempts_by_topic else 0:.2f}")
    
    # Show top topics by attempt count
    print("\nTOP 5 TOPICS BY ATTEMPTS:")
    for topic, data in sorted_topics[:5]:
        print(f"  - {topic}: {data['accuracy']:.2f}% accuracy, {data['attempted']} attempts")
    
    if topics_over_50:
        print("\nTopics with accuracy > 50%:")
        for topic in topics_over_50:
            print(f"  - {topic}: {topic_performance[topic]['accuracy']:.2f}%")
    else:
        print("\nNo topics with accuracy > 50% found!")
    
    # Return the topic performance data
    return topic_performance

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python test_topic_performance.py <username>")
        sys.exit(1)
    
    username = sys.argv[1]
    
    # Check if conda environment is active
    current_env = os.environ.get('CONDA_DEFAULT_ENV')
    if current_env != 'goAIME':
        print(f"Warning: You're not using the 'goAIME' conda environment (current: {current_env or 'None'})")
        print("It's recommended to run: conda activate goAIME")
    
    analyze_user_topic_performance(username)
