"""
Script to diagnose the discrepancy between overall accuracy and topic average
This script extracts real data from MongoDB Atlas to verify the calculations
"""
import os
import sys
import json
import pymongo
from collections import defaultdict

def analyze_accuracy_discrepancy(username):
    # Connect to MongoDB Atlas (cloud database)
    try:
        # Check for environment variables first
        mongodb_uri = os.environ.get("MONGODB_URI")
        
        # If not found in environment, use default Atlas URI
        if not mongodb_uri:
            # Note: This is a placeholder URI - replace with your actual MongoDB Atlas URI
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
    user_id = user["_id"]
    sessions = list(db.sessions.find({"$or": [
        {"userId": user_id},
        {"user_id": user_id},
        {"username": username}
    ]}))
    print(f"Found {len(sessions)} sessions for user")
    
    # Get the actual backend calculation for comparison
    try:
        # Try to get the calculated values from the progress API data
        progress_data = db.user_progress.find_one({"username": username})
        if progress_data:
            print("\nExisting progress data in database:")
            if "overallPerformance" in progress_data:
                print(f"Overall accuracy from API: {progress_data['overallPerformance'].get('accuracyPercentage', 'N/A')}%")
            if "topicPerformance" in progress_data:
                topic_count = len(progress_data["topicPerformance"])
                print(f"Topics in API data: {topic_count}")
    except Exception as e:
        print(f"Error getting progress data: {e}")
    
    # Extract all problems across all sessions
    all_problems = []
    completed_sessions = 0
    
    for session in sessions:
        # Only process completed sessions
        if (session.get("status") == "completed" or
            session.get("sessionStatus") == "completed" or
            session.get("state") == "completed"):
            completed_sessions += 1
            problems = session.get("problems", [])
            all_problems.extend(problems)
    
    print(f"Processed {completed_sessions} completed sessions with {len(all_problems)} total problems")
    
    # Now analyze all problems at once to get topic accuracy
    topic_performance = defaultdict(lambda: {"attempted": 0, "correct": 0, "accuracy": 0})
    total_attempted = 0
    total_correct = 0
    
    # Process each problem
    for problem in all_problems:
        topic = problem.get("topic", "Unknown")
        
        # Skip if no attempts
        if "attempts" not in problem or not problem["attempts"]:
            continue
        
        # Check if any attempt was correct
        is_correct = False
        for attempt in problem.get("attempts", []):
            if attempt.get("isCorrect", False):
                is_correct = True
                break
        
        # Update counters
        topic_performance[topic]["attempted"] += 1
        total_attempted += 1
        
        if is_correct:
            topic_performance[topic]["correct"] += 1
            total_correct += 1
    
    # Calculate accuracy for each topic
    for topic, data in topic_performance.items():
        if data["attempted"] > 0:
            data["accuracy"] = (data["correct"] / data["attempted"]) * 100
        else:
            data["accuracy"] = 0
    
    # Calculate different ways of computing overall accuracy
    overall_accuracy = (total_correct / total_attempted) * 100 if total_attempted > 0 else 0
    
    # Weighted average (by attempts per topic)
    weighted_sum = sum(data["accuracy"] * data["attempted"] for data in topic_performance.values())
    weighted_accuracy = weighted_sum / total_attempted if total_attempted > 0 else 0
    
    # Simple average across topics
    simple_avg = sum(data["accuracy"] for data in topic_performance.values()) / len(topic_performance) if topic_performance else 0
    
    # Print results
    print("\n" + "=" * 60)
    print("ACCURACY CALCULATION COMPARISON")
    print("=" * 60)
    print(f"Overall accuracy (total correct / total attempted): {overall_accuracy:.2f}%")
    print(f"Weighted average of topic accuracies: {weighted_accuracy:.2f}%")
    print(f"Simple average of topic accuracies: {simple_avg:.2f}%")
    
    # Print individual topic accuracies
    print("\n" + "=" * 60)
    print("TOPIC ACCURACIES (sorted by # of attempts)")
    print("=" * 60)
    print(f"{'Topic':<30} {'Accuracy':<10} {'Correct':<10} {'Attempted':<10}")
    print("-" * 60)
    
    sorted_topics = sorted(topic_performance.items(), key=lambda x: x[1]["attempted"], reverse=True)
    for topic, data in sorted_topics:
        print(f"{topic:<30} {data['accuracy']:.2f}%     {data['correct']:<10} {data['attempted']:<10}")
    
    # Check distribution of attempts and accuracy
    high_attempt_topics = [t for t, d in topic_performance.items() if d["attempted"] > 10]
    low_attempt_topics = [t for t, d in topic_performance.items() if d["attempted"] <= 10]
    
    high_accuracy_topics = [t for t, d in topic_performance.items() if d["accuracy"] > 50]
    low_accuracy_topics = [t for t, d in topic_performance.items() if d["accuracy"] <= 50]
    
    print("\n" + "=" * 60)
    print("DISTRIBUTION ANALYSIS")
    print("=" * 60)
    print(f"Total topics: {len(topic_performance)}")
    print(f"Topics with > 10 attempts: {len(high_attempt_topics)} ({len(high_attempt_topics)/len(topic_performance)*100:.1f}%)")
    print(f"Topics with <= 10 attempts: {len(low_attempt_topics)} ({len(low_attempt_topics)/len(topic_performance)*100:.1f}%)")
    print(f"Topics with > 50% accuracy: {len(high_accuracy_topics)} ({len(high_accuracy_topics)/len(topic_performance)*100:.1f}%)")
    print(f"Topics with <= 50% accuracy: {len(low_accuracy_topics)} ({len(low_accuracy_topics)/len(topic_performance)*100:.1f}%)")
    
    # See if high-attempt topics have higher accuracy
    high_attempt_avg = sum(topic_performance[t]["accuracy"] for t in high_attempt_topics) / len(high_attempt_topics) if high_attempt_topics else 0
    low_attempt_avg = sum(topic_performance[t]["accuracy"] for t in low_attempt_topics) / len(low_attempt_topics) if low_attempt_topics else 0
    
    print(f"\nAverage accuracy for high-attempt topics (>10): {high_attempt_avg:.2f}%")
    print(f"Average accuracy for low-attempt topics (<=10): {low_attempt_avg:.2f}%")
    
    # Calculate total attempts and correct answers for high vs low attempt topics
    high_attempt_total = sum(topic_performance[t]["attempted"] for t in high_attempt_topics)
    high_attempt_correct = sum(topic_performance[t]["correct"] for t in high_attempt_topics)
    
    low_attempt_total = sum(topic_performance[t]["attempted"] for t in low_attempt_topics)
    low_attempt_correct = sum(topic_performance[t]["correct"] for t in low_attempt_topics)
    
    high_attempt_overall = (high_attempt_correct / high_attempt_total * 100) if high_attempt_total > 0 else 0
    low_attempt_overall = (low_attempt_correct / low_attempt_total * 100) if low_attempt_total > 0 else 0
    
    print(f"Overall accuracy for high-attempt topics: {high_attempt_overall:.2f}% ({high_attempt_correct}/{high_attempt_total})")
    print(f"Overall accuracy for low-attempt topics: {low_attempt_overall:.2f}% ({low_attempt_correct}/{low_attempt_total})")
    
    # Compare the contribution to overall accuracy
    high_attempt_contribution = (high_attempt_correct / total_correct * 100) if total_correct > 0 else 0
    high_attempt_portion = (high_attempt_total / total_attempted * 100) if total_attempted > 0 else 0
    
    print(f"\nHigh-attempt topics represent {high_attempt_portion:.2f}% of all attempts")
    print(f"High-attempt topics contribute {high_attempt_contribution:.2f}% of all correct answers")
    
    # Return the analysis results
    return {
        "overall_accuracy": overall_accuracy,
        "weighted_accuracy": weighted_accuracy,
        "simple_avg": simple_avg,
        "topic_performance": dict(topic_performance),
        "total_attempted": total_attempted,
        "total_correct": total_correct
    }

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python analyze_accuracy_discrepancy.py <username>")
        sys.exit(1)
    
    username = sys.argv[1]
    
    # Check if conda environment is active
    current_env = os.environ.get('CONDA_DEFAULT_ENV')
    if current_env != 'goAIME':
        print(f"Warning: You're not using the 'goAIME' conda environment (current: {current_env or 'None'})")
        print("It's recommended to run: conda activate goAIME")
    
    analyze_accuracy_discrepancy(username)
