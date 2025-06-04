"""
Script to extract and verify the real accuracy values from the database
"""
import json
import os

# Check for a file that contains the progress data
data_file = "goamy_progress_data.json"

if os.path.exists(data_file):
    print(f"Loading data from {data_file}")
    try:
        with open(data_file, "r") as f:
            data = json.load(f)
            
        # Extract key metrics
        if "overallPerformance" in data:
            overall = data["overallPerformance"]
            print(f"Overall accuracy from API: {overall.get('accuracyPercentage', 'N/A')}%")
            print(f"Total problems: {overall.get('totalProblems', 'N/A')}")
            print(f"Total correct: {overall.get('totalCorrect', 'N/A')}")
            
        # Check topic performance
        if "topicPerformance" in data:
            topics = data["topicPerformance"]
            total_attempted = sum(t.get("attempted", 0) for t in topics.values())
            total_correct = sum(t.get("correct", 0) for t in topics.values())
            calc_accuracy = (total_correct / total_attempted * 100) if total_attempted > 0 else 0
            
            print("\nCalculated from topic data:")
            print(f"Total attempted: {total_attempted}")
            print(f"Total correct: {total_correct}")
            print(f"Calculated accuracy: {calc_accuracy:.2f}%")
            
            # Check individual topics
            print("\nTop 5 topics by attempts:")
            sorted_topics = sorted(topics.items(), key=lambda x: x[1].get("attempted", 0), reverse=True)[:5]
            for topic, data in sorted_topics:
                print(f"{topic}: {data.get('accuracy', 0):.2f}% ({data.get('correct', 0)}/{data.get('attempted', 0)})")
    except Exception as e:
        print(f"Error processing data: {e}")
else:
    print(f"Data file {data_file} not found")
