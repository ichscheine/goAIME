#!/usr/bin/env python
"""
Script to inspect and analyze the JSON data
"""
import json
import os

def inspect_json_file(file_path):
    if not os.path.exists(file_path):
        print(f"File {file_path} not found")
        return
    
    print(f"Analyzing {file_path}...")
    try:
        with open(file_path, "r") as f:
            data = json.load(f)
        
        # Check if the data is nested under a "data" key
        if "data" in data:
            print("Data is nested under 'data' key")
            data = data["data"]
        
        # Extract overall performance
        if "overallPerformance" in data:
            overall = data["overallPerformance"]
            print("\nOVERALL PERFORMANCE:")
            print(f"  Total sessions: {overall.get('totalSessions', 'N/A')}")
            print(f"  Total problems: {overall.get('totalProblems', 'N/A')}")
            print(f"  Total correct: {overall.get('totalCorrect', 'N/A')}")
            print(f"  Accuracy percentage: {overall.get('accuracyPercentage', 'N/A')}")
            
            # Verify accuracy calculation
            if "totalProblems" in overall and "totalCorrect" in overall and overall["totalProblems"] > 0:
                calculated_accuracy = (overall["totalCorrect"] / overall["totalProblems"]) * 100
                print(f"  Calculated accuracy: {calculated_accuracy:.2f}%")
                
                if abs(calculated_accuracy - overall.get("accuracyPercentage", 0)) > 0.01:
                    print("  WARNING: Stored accuracy differs from calculation!")
        
        # Extract and analyze topic performance
        if "topicPerformance" in data:
            topics = data["topicPerformance"]
            topic_count = len(topics)
            print(f"\nTOPIC PERFORMANCE: ({topic_count} topics)")
            
            # Calculate aggregate statistics
            total_attempted = sum(t.get("attempted", 0) for t in topics.values())
            total_correct = sum(t.get("correct", 0) for t in topics.values())
            topics_over_50 = sum(1 for t in topics.values() if t.get("accuracy", 0) > 50)
            
            print(f"  Total attempted from topics: {total_attempted}")
            print(f"  Total correct from topics: {total_correct}")
            if total_attempted > 0:
                calculated_accuracy = (total_correct / total_attempted) * 100
                print(f"  Calculated accuracy from topics: {calculated_accuracy:.2f}%")
            print(f"  Topics with >50% accuracy: {topics_over_50} ({(topics_over_50/topic_count*100):.1f}% of topics)")
            
            # Show top 5 topics
            print("\nTOP 5 TOPICS BY ATTEMPTS:")
            sorted_topics = sorted(topics.items(), key=lambda x: x[1].get("attempted", 0), reverse=True)[:5]
            for i, (topic, data) in enumerate(sorted_topics):
                print(f"  {i+1}. {topic}: {data.get('accuracy', 0):.2f}% ({data.get('correct', 0)}/{data.get('attempted', 0)})")
            
            # Check for potential data inconsistencies
            if total_attempted != overall.get("totalProblems", 0):
                print(f"\nWARNING: Sum of topic attempts ({total_attempted}) differs from overall problems ({overall.get('totalProblems', 0)})!")
            
            if total_correct != overall.get("totalCorrect", 0):
                print(f"WARNING: Sum of topic correct ({total_correct}) differs from overall correct ({overall.get('totalCorrect', 0)})!")
            
    except Exception as e:
        print(f"Error analyzing JSON: {e}")

if __name__ == "__main__":
    inspect_json_file("goamy_progress_data.json")
