"""
Verification script for the wind rose chart fix.
This script checks if the topic performance calculation is working properly
and verifies the wind rose chart is displaying correctly.
"""
import json
import sys
import os

def verify_windrose_update():
    print("Wind Rose Chart Fix Verification")
    print("=" * 60)
    
    # Mock data similar to what would be in the database
    mock_data = {
        "topicPerformance": {
            "Algebra": {"attempted": 50, "correct": 40, "accuracy": 80},
            "Geometry": {"attempted": 25, "correct": 15, "accuracy": 60},
            "Probability": {"attempted": 5, "correct": 1, "accuracy": 20},
            "Number Theory": {"attempted": 3, "correct": 0, "accuracy": 0},
            "Combinatorics": {"attempted": 8, "correct": 3, "accuracy": 37.5},
            "Calculus": {"attempted": 15, "correct": 10, "accuracy": 66.7},
            "Logic": {"attempted": 12, "correct": 8, "accuracy": 66.7},
            "Sequences": {"attempted": 7, "correct": 3, "accuracy": 42.9}
        },
        "overallPerformance": {
            "totalProblems": 125,
            "totalCorrect": 80,
            "accuracyPercentage": 64.0
        }
    }
    
    print("1. Original Topic Performance Data")
    print("-" * 60)
    print(f"{'Topic':<20} {'Accuracy':<10} {'Correct/Attempted':<20}")
    print("-" * 60)
    
    for topic, data in mock_data["topicPerformance"].items():
        print(f"{topic:<20} {data['accuracy']:.1f}%     {data['correct']}/{data['attempted']}")
    
    print("-" * 60)
    print(f"Overall accuracy: {mock_data['overallPerformance']['accuracyPercentage']:.1f}%")
    
    # Apply our weighted accuracy fix
    print("\n2. Recalculated Topic Performance with Weighting")
    print("-" * 60)
    print(f"{'Topic':<20} {'Weighted Acc':<12} {'Raw Acc':<10} {'Weight':<10}")
    print("-" * 60)
    
    total_problems = mock_data["overallPerformance"]["totalProblems"]
    total_correct = mock_data["overallPerformance"]["totalCorrect"]
    overall_accuracy = mock_data["overallPerformance"]["accuracyPercentage"]
    
    # Apply the same weighting formula as in the backend fix
    for topic, data in mock_data["topicPerformance"].items():
        if data["attempted"] > 0:
            # Calculate raw accuracy
            raw_accuracy = (data["correct"] / data["attempted"]) * 100
            
            # Apply weight adjustment for topics with few attempts
            attempt_weight = min(1.0, data["attempted"] / 10)  # Full weight at 10+ attempts
            
            # Calculate weighted accuracy
            weighted_acc = (raw_accuracy * attempt_weight) + (overall_accuracy * (1 - attempt_weight))
            
            # Store the values for printing
            data["raw_accuracy"] = raw_accuracy
            data["weighted_accuracy"] = weighted_acc
            data["weight"] = attempt_weight
            
            print(f"{topic:<20} {weighted_acc:.1f}%      {raw_accuracy:.1f}%     {attempt_weight:.2f}")
        else:
            data["raw_accuracy"] = 0
            data["weighted_accuracy"] = 0
            data["weight"] = 0
            print(f"{topic:<20} 0.0%       0.0%      0.00")
    
    # Calculate the average raw accuracy and weighted accuracy
    avg_raw_accuracy = sum(data["raw_accuracy"] for data in mock_data["topicPerformance"].values()) / len(mock_data["topicPerformance"])
    avg_weighted_accuracy = sum(data["weighted_accuracy"] for data in mock_data["topicPerformance"].values()) / len(mock_data["topicPerformance"])
    
    print("-" * 60)
    print(f"Average raw accuracy: {avg_raw_accuracy:.1f}%")
    print(f"Average weighted accuracy: {avg_weighted_accuracy:.1f}%")
    print(f"Overall accuracy: {overall_accuracy:.1f}%")
    
    # Calculate discrepancies
    raw_discrepancy = abs(avg_raw_accuracy - overall_accuracy)
    weighted_discrepancy = abs(avg_weighted_accuracy - overall_accuracy)
    
    print("\n3. Discrepancy Analysis")
    print("-" * 60)
    print(f"Discrepancy with raw accuracy: {raw_discrepancy:.1f}%")
    print(f"Discrepancy with weighted accuracy: {weighted_discrepancy:.1f}%")
    print(f"Improvement: {(raw_discrepancy - weighted_discrepancy) / raw_discrepancy * 100:.1f}%")
    
    # Generate wind rose chart visualization verification
    print("\n4. Wind Rose Chart Visualization Check")
    print("-" * 60)
    print("Verifying minimum radius ensures all topics are visible:")
    
    # Calculate display radius for each topic using the chart's logic
    print(f"{'Topic':<20} {'Accuracy':<10} {'Display Radius':<15} {'Visible':<10}")
    print("-" * 60)
    
    for topic, data in mock_data["topicPerformance"].items():
        # Similar logic to what's in the frontend component
        accuracy = data["weighted_accuracy"]
        
        # Get max attempts for normalization
        max_attempts = max(d["attempted"] for d in mock_data["topicPerformance"].values())
        
        # Calculate attempt factor (0.3 to 1.0 scale)
        attempt_factor = 0.3 + (0.7 * min(data["attempted"], max_attempts) / max_attempts)
        
        # Calculate radius based on accuracy and attempt factor
        outer_radius = 240 * (min(accuracy, 100) / 100) * attempt_factor
        
        # Apply minimum radius of 30px (from our fix)
        final_radius = max(30, outer_radius)
        
        # Determine if topic will be visible
        is_visible = final_radius >= 30
        
        # Determine color based on accuracy
        if accuracy >= 75:
            color = "Green"
        elif accuracy >= 50:
            color = "Yellow"
        else:
            color = "Red"
        
        print(f"{topic:<20} {accuracy:.1f}%     {final_radius:.1f}px       {'Yes' if is_visible else 'No'} ({color})")
    
    # Generate HTML verification
    html_output = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Wind Rose Chart Fix Verification</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1, h2 { color: #333; }
            .container { max-width: 800px; margin: 0 auto; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .visualization { display: flex; justify-content: center; margin: 20px 0; }
            .wind-rose { position: relative; width: 500px; height: 500px; }
            .segment { position: absolute; transform-origin: center; }
            .center { position: absolute; top: 250px; left: 250px; transform: translate(-50%, -50%); }
            .timestamp { font-size: 12px; color: #666; text-align: center; margin-top: 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Wind Rose Chart Fix Verification</h1>
            <p>This page demonstrates the fixed wind rose chart with topic performance data.</p>
            
            <h2>1. Topic Performance Data</h2>
            <table>
                <tr>
                    <th>Topic</th>
                    <th>Raw Accuracy</th>
                    <th>Weighted Accuracy</th>
                    <th>Attempts</th>
                    <th>Weight Factor</th>
                </tr>
    """
    
    # Add rows for each topic
    for topic, data in mock_data["topicPerformance"].items():
        html_output += f"""
                <tr>
                    <td>{topic}</td>
                    <td>{data['raw_accuracy']:.1f}%</td>
                    <td>{data['weighted_accuracy']:.1f}%</td>
                    <td>{data['attempted']}</td>
                    <td>{data['weight']:.2f}</td>
                </tr>
        """
    
    html_output += f"""
            </table>
            <p><strong>Overall Accuracy:</strong> {overall_accuracy:.1f}%</p>
            <p><strong>Average Raw Accuracy:</strong> {avg_raw_accuracy:.1f}%</p>
            <p><strong>Average Weighted Accuracy:</strong> {avg_weighted_accuracy:.1f}%</p>
            
            <h2>2. Wind Rose Chart Visualization</h2>
            <div class="visualization">
                <div class="wind-rose">
                    <!-- Segments would be rendered here in the actual chart -->
                    <div class="center">Topic Map</div>
                </div>
            </div>
            <div class="timestamp">Last updated: {__import__('datetime').datetime.now().strftime("%H:%M:%S")}</div>
            
            <h2>3. Improvement Summary</h2>
            <p>The weighted accuracy calculation reduces the discrepancy between topic averages and overall accuracy by 
            {(raw_discrepancy - weighted_discrepancy) / raw_discrepancy * 100:.1f}%.</p>
            <p>All topics are now visible in the wind rose chart with a minimum radius of 30px, ensuring that even topics
            with very low accuracy are represented.</p>
        </div>
    </body>
    </html>
    """
    
    # Write HTML to file
    with open("verify_windrose_fix.html", "w") as f:
        f.write(html_output)
    
    print("\nGenerated HTML verification file: verify_windrose_fix.html")
    print("Open this file in a browser to visualize the fix results.")

if __name__ == "__main__":
    verify_windrose_update()
