#!/usr/bin/env python3
"""
Test script to demonstrate the enhanced session data structure
"""

import json
from datetime import datetime, timezone
import sys
import os

# Add the backend path to Python path
sys.path.append('/Users/daoming/Documents/Github/goAIME')

from backend.services.db_service import save_user_session, enhance_session_data

def create_sample_session_data():
    """Create sample session data to demonstrate the enhanced structure"""
    
    # Sample attempt records with detailed information
    sample_problems = [
        {
            'problem_number': 1,
            'problem_id': 'AMC10A_2022_1',
            'correct': True,
            'selected_answer': 'A',
            'correct_answer': 'A',
            'time_spent': 45000,  # 45 seconds in ms
            'timestamp': '2025-05-26T10:15:30.123Z',
            'difficulty': 'Easy',
            'topics': ['Algebra', 'Linear Equations']
        },
        {
            'problem_number': 2,
            'problem_id': 'AMC10A_2022_2',
            'correct': False,
            'selected_answer': 'C',
            'correct_answer': 'B',
            'time_spent': 120000,  # 2 minutes in ms
            'timestamp': '2025-05-26T10:17:30.456Z',
            'difficulty': 'Medium',
            'topics': ['Geometry', 'Triangles']
        },
        {
            'problem_number': 3,
            'problem_id': 'AMC10A_2022_3',
            'correct': True,
            'selected_answer': 'D',
            'correct_answer': 'D',
            'time_spent': 90000,  # 90 seconds in ms
            'timestamp': '2025-05-26T10:19:30.789Z',
            'difficulty': 'Medium',
            'topics': ['Number Theory', 'Divisibility']
        },
        {
            'problem_number': 4,
            'problem_id': 'AMC10A_2022_4',
            'correct': True,
            'selected_answer': 'E',
            'correct_answer': 'E',
            'time_spent': 30000,  # 30 seconds in ms
            'timestamp': '2025-05-26T10:20:30.012Z',
            'difficulty': 'Easy',
            'topics': ['Algebra', 'Polynomials']
        },
        {
            'problem_number': 5,
            'problem_id': 'AMC10A_2022_5',
            'correct': False,
            'selected_answer': 'A',
            'correct_answer': 'C',
            'time_spent': 180000,  # 3 minutes in ms
            'timestamp': '2025-05-26T10:23:30.345Z',
            'difficulty': 'Hard',
            'topics': ['Combinatorics', 'Probability']
        }
    ]
    
    session_data = {
        'session_id': 'test_session_enhanced_2025_05_26',
        'score': 3,  # 3 correct out of 5
        'attempted': 5,
        'totalTime': 465000,  # Total time in ms (7 min 45 sec)
        'year': 2022,
        'contest': 'AMC 10A',
        'mode': 'practice',
        'completed_at': '2025-05-26T10:25:00.000Z',
        'problems_attempted': sample_problems,
        'solvedProblems': 3  # This should be removed by enhancement
    }
    
    return session_data

def test_session_enhancement():
    """Test the session data enhancement"""
    
    print("=" * 60)
    print("TESTING ENHANCED SESSION DATA STRUCTURE")
    print("=" * 60)
    
    # Create sample data
    original_data = create_sample_session_data()
    
    print("\n1. ORIGINAL SESSION DATA:")
    print("-" * 30)
    print(json.dumps(original_data, indent=2, default=str))
    
    # Enhance the data
    enhanced_data = enhance_session_data(original_data)
    
    print("\n2. ENHANCED SESSION DATA:")
    print("-" * 30)
    print(json.dumps(enhanced_data, indent=2, default=str))
    
    print("\n3. KEY IMPROVEMENTS:")
    print("-" * 30)
    
    # Show removed redundant fields
    if 'solvedProblems' not in enhanced_data:
        print("✅ Removed redundant 'solvedProblems' field")
    
    # Show renamed fields
    if 'total_attempted' in enhanced_data and 'attempted' not in enhanced_data:
        print("✅ Renamed 'attempted' to 'total_attempted' for clarity")
    
    # Show enhanced problem tracking
    if 'problems_attempted' in enhanced_data:
        enhanced_problems = enhanced_data['problems_attempted']
        print(f"✅ Enhanced {len(enhanced_problems)} problem records with:")
        for problem in enhanced_problems[:2]:  # Show first 2 as examples
            print(f"   - Problem {problem['problem_number']}: {list(problem.keys())}")
    
    # Show performance metrics
    if 'performance_metrics' in enhanced_data:
        metrics = enhanced_data['performance_metrics']
        print("✅ Added performance metrics:")
        for key, value in metrics.items():
            print(f"   - {key}: {value}")
    
    # Show topic performance
    if 'topic_performance' in enhanced_data:
        print("✅ Added topic-level performance tracking:")
        for topic, stats in enhanced_data['topic_performance'].items():
            print(f"   - {topic}: {stats['correct']}/{stats['attempted']} ({stats['accuracy']}%)")
    
    # Show difficulty performance
    if 'difficulty_performance' in enhanced_data:
        print("✅ Added difficulty-level performance tracking:")
        for difficulty, stats in enhanced_data['difficulty_performance'].items():
            print(f"   - {difficulty}: {stats['correct']}/{stats['attempted']} ({stats['accuracy']}%)")
    
    # Show time tracking improvements
    if 'total_time_seconds' in enhanced_data:
        print("✅ Added multiple time formats:")
        print(f"   - Milliseconds: {enhanced_data.get('total_time_ms', 0)}")
        print(f"   - Seconds: {enhanced_data.get('total_time_seconds', 0)}")
        print(f"   - Minutes: {enhanced_data.get('total_time_minutes', 0)}")
    
    return enhanced_data

def demonstrate_database_schema():
    """Demonstrate the new database schema structure"""
    
    print("\n" + "=" * 60)
    print("RECOMMENDED DATABASE SCHEMA FOR goaime.sessions")
    print("=" * 60)
    
    schema = {
        "_id": "ObjectId",
        "username": "string (indexed)",
        "session_id": "string (indexed with username)",
        "created_at": "datetime (indexed)",
        "updated_at": "datetime",
        
        # Basic session info
        "score": "number (indexed)",
        "total_attempted": "number (indexed) - renamed from 'attempted'",
        "total_time_ms": "number - total time in milliseconds",
        "total_time_seconds": "number - total time in seconds",
        "total_time_minutes": "number - total time in minutes",
        
        # Contest context
        "year": "number",
        "contest": "string (indexed with year)",
        "mode": "string (indexed) - 'practice' or 'contest'",
        "completed_at": "datetime",
        "session_status": "string - 'completed', 'paused', 'abandoned'",
        
        # Enhanced problem tracking
        "problems_attempted": [
            {
                "problem_number": "number",
                "problem_id": "string",
                "is_correct": "boolean",
                "selected_answer": "string",
                "correct_answer": "string", 
                "time_spent_ms": "number",
                "time_spent_seconds": "number",
                "attempt_timestamp": "datetime",
                "difficulty": "string",
                "topics": ["array of strings"]
            }
        ],
        
        # Performance analytics
        "performance_metrics": {
            "total_attempted": "number",
            "total_correct": "number",
            "total_incorrect": "number",
            "accuracy_percentage": "number (indexed)",
            "average_time_per_problem_ms": "number",
            "average_time_correct_problems_ms": "number",
            "average_time_incorrect_problems_ms": "number",
            "fastest_correct_time_ms": "number",
            "slowest_correct_time_ms": "number"
        },
        
        # Topic-level performance
        "topic_performance": {
            "topic_name": {
                "attempted": "number",
                "correct": "number", 
                "accuracy": "number"
            }
        },
        
        # Difficulty-level performance
        "difficulty_performance": {
            "difficulty_level": {
                "attempted": "number",
                "correct": "number",
                "accuracy": "number"
            }
        }
    }
    
    print("\nRECOMMENDED SCHEMA STRUCTURE:")
    print(json.dumps(schema, indent=2))
    
    print("\n" + "=" * 60)
    print("REMOVED FIELDS")
    print("=" * 60)
    print("❌ 'solvedProblems' - Redundant with 'score'")
    print("❌ 'attempted' - Renamed to 'total_attempted' for clarity")
    
    print("\n" + "=" * 60)
    print("NEW PERFORMANCE TRACKING CAPABILITIES")
    print("=" * 60)
    print("✅ Individual problem correctness tracking")
    print("✅ Time spent per problem (ms and seconds)")
    print("✅ Topic-level performance analytics")
    print("✅ Difficulty-level performance analytics")
    print("✅ Speed metrics (fastest/slowest correct answers)")
    print("✅ Average time analysis by correctness")
    print("✅ Comprehensive accuracy percentages")

if __name__ == "__main__":
    print("Enhanced Session Data Structure Demonstration")
    print("This script shows the improvements to the goaime.sessions collection")
    
    # Test the enhancement
    enhanced_data = test_session_enhancement()
    
    # Show the recommended schema
    demonstrate_database_schema()
    
    print(f"\n{'='*60}")
    print("SUMMARY OF IMPROVEMENTS")
    print("="*60)
    print("1. Removed redundant 'solvedProblems' field")
    print("2. Enhanced 'attempted' field with detailed problem tracking")
    print("3. Added comprehensive performance metrics")
    print("4. Added topic and difficulty level analytics")
    print("5. Improved time tracking with multiple formats")
    print("6. Better data structure for querying and analysis")
    print("7. Maintained backward compatibility where possible")
    
    print(f"\n✅ Enhanced session data is ready for database storage!")
