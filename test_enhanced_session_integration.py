#!/usr/bin/env python3
"""
Test script to verify the enhanced session saving functionality
"""

import sys
import os
sys.path.append('/Users/daoming/Documents/Github/goAIME')

from backend.services.db_service import save_user_session, enhance_session_data, get_db
from datetime import datetime, timezone
from bson import ObjectId
import json

def test_enhanced_session_save():
    """Test the enhanced session saving with realistic data"""
    
    print("🧪 Testing Enhanced Session Save Functionality")
    print("=" * 60)
    
    # Sample enhanced session data from frontend
    sample_session_data = {
        "session_id": "test_enhanced_session_123",
        "score": 3,
        "attempted": 5,  # This should become total_attempted
        "totalTime": 150000,  # This should become total_time_ms
        "year": 2022,
        "contest": "AMC 10A",
        "mode": "practice",
        "completed_at": datetime.now(timezone.utc).isoformat(),
        "solvedProblems": 3,  # This should be removed as redundant
        "problems_attempted": [
            {
                "problem_number": 1,
                "problem_id": "AMC10A_2022_1",
                "correct": True,
                "selected_answer": "A",
                "correct_answer": "A",
                "time_spent": 30000,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "difficulty": "Easy",
                "topics": ["Algebra", "Linear Equations"]
            },
            {
                "problem_number": 2,
                "problem_id": "AMC10A_2022_2",
                "correct": False,
                "selected_answer": "C",
                "correct_answer": "B",
                "time_spent": 45000,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "difficulty": "Medium",
                "topics": ["Geometry", "Triangles"]
            },
            {
                "problem_number": 3,
                "problem_id": "AMC10A_2022_3",
                "correct": True,
                "selected_answer": "D",
                "correct_answer": "D",
                "time_spent": 25000,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "difficulty": "Easy",
                "topics": ["Number Theory"]
            },
            {
                "problem_number": 4,
                "problem_id": "AMC10A_2022_4",
                "correct": True,
                "selected_answer": "B",
                "correct_answer": "B",
                "time_spent": 35000,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "difficulty": "Hard",
                "topics": ["Combinatorics", "Probability"]
            },
            {
                "problem_number": 5,
                "problem_id": "AMC10A_2022_5",
                "correct": False,
                "selected_answer": "A",
                "correct_answer": "C",
                "time_spent": 15000,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "difficulty": "Medium",
                "topics": ["Algebra", "Quadratic Equations"]
            }
        ]
    }
    
    print("📤 Original Session Data:")
    print(json.dumps(sample_session_data, indent=2, default=str))
    print()
    
    # Test the enhancement function
    print("🔧 Testing enhance_session_data function...")
    enhanced_data = enhance_session_data(sample_session_data.copy())
    
    print("📥 Enhanced Session Data:")
    print(json.dumps(enhanced_data, indent=2, default=str))
    print()
    
    # Verify enhancements
    print("✅ Verification Results:")
    
    # Check that redundant fields are removed
    has_solved_problems = 'solvedProblems' in enhanced_data
    print(f"   - Removed redundant 'solvedProblems': {'❌ Still present' if has_solved_problems else '✅ Removed'}")
    
    # Check field renaming
    has_total_attempted = 'total_attempted' in enhanced_data
    has_old_attempted = 'attempted' in enhanced_data
    print(f"   - Renamed 'attempted' to 'total_attempted': {'✅ Renamed' if has_total_attempted and not has_old_attempted else '❌ Not renamed'}")
    
    # Check time field processing
    has_total_time_ms = 'total_time_ms' in enhanced_data
    has_old_total_time = 'totalTime' in enhanced_data
    print(f"   - Renamed 'totalTime' to 'total_time_ms': {'✅ Renamed' if has_total_time_ms and not has_old_total_time else '❌ Not renamed'}")
    
    # Check performance metrics
    has_performance_metrics = 'performance_metrics' in enhanced_data
    print(f"   - Added performance metrics: {'✅ Added' if has_performance_metrics else '❌ Missing'}")
    
    if has_performance_metrics:
        metrics = enhanced_data['performance_metrics']
        print(f"     • Total attempted: {metrics.get('total_attempted', 'Missing')}")
        print(f"     • Total correct: {metrics.get('total_correct', 'Missing')}")
        print(f"     • Accuracy: {metrics.get('accuracy_percentage', 'Missing')}%")
        print(f"     • Avg time per problem: {metrics.get('average_time_per_problem_ms', 'Missing')}ms")
    
    # Check topic performance
    has_topic_performance = 'topic_performance' in enhanced_data
    print(f"   - Added topic performance: {'✅ Added' if has_topic_performance else '❌ Missing'}")
    
    if has_topic_performance:
        topics = enhanced_data['topic_performance']
        for topic, stats in topics.items():
            print(f"     • {topic}: {stats['correct']}/{stats['attempted']} ({stats['accuracy']}%)")
    
    # Check difficulty performance
    has_difficulty_performance = 'difficulty_performance' in enhanced_data
    print(f"   - Added difficulty performance: {'✅ Added' if has_difficulty_performance else '❌ Missing'}")
    
    if has_difficulty_performance:
        difficulties = enhanced_data['difficulty_performance']
        for difficulty, stats in difficulties.items():
            print(f"     • {difficulty}: {stats['correct']}/{stats['attempted']} ({stats['accuracy']}%)")
    
    print()
    
    # Test saving to database
    print("💾 Testing database save...")
    try:
        test_username = "test_enhanced_user"
        document_id = save_user_session(test_username, sample_session_data)
        print(f"✅ Session saved successfully with ID: {document_id}")
        
        # Verify the document was saved with enhanced structure
        from bson import ObjectId
        db = get_db()
        saved_doc = db.sessions.find_one({"_id": ObjectId(document_id)})
        
        if saved_doc:
            print("📋 Saved document verification:")
            print(f"   - Has total_attempted: {'✅' if 'total_attempted' in saved_doc else '❌'}")
            print(f"   - Missing solvedProblems: {'✅' if 'solvedProblems' not in saved_doc else '❌'}")
            print(f"   - Has performance_metrics: {'✅' if 'performance_metrics' in saved_doc else '❌'}")
            print(f"   - Has topic_performance: {'✅' if 'topic_performance' in saved_doc else '❌'}")
            print(f"   - Has difficulty_performance: {'✅' if 'difficulty_performance' in saved_doc else '❌'}")
        else:
            print("❌ Could not find saved document")
            
    except Exception as e:
        print(f"❌ Database save failed: {e}")
    
    print("\n🎉 Enhanced session save test completed!")

if __name__ == "__main__":
    test_enhanced_session_save()
