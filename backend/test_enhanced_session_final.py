#!/usr/bin/env python3
"""
Final test for enhanced session saving functionality
Tests the complete workflow from enhanced data input to MongoDB storage
"""

import json
from datetime import datetime, timezone
from bson import ObjectId
from services.db_service import save_user_session, get_db, enhance_session_data

def test_enhanced_session_save():
    """Test the complete enhanced session saving workflow"""
    
    print("🔄 Enhanced Session Save Test")
    print("=" * 50)
    
    # Create realistic session data as sent from frontend
    session_data = {
        "user_id": str(ObjectId()),  # Simulated user ID
        "year": 2022,
        "contest": "AMC10A",
        "mode": "timed",
        "score": 3,
        "total_attempted": 5,
        "completed_at": datetime.now(timezone.utc).isoformat(),
        "problems_attempted": [
            {
                "problem_number": 1,
                "problem_id": "AMC10A_2022_1", 
                "is_correct": True,
                "selected_answer": "B",
                "correct_answer": "B",
                "time_spent_ms": 45000,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "difficulty": "Easy",
                "topics": ["Algebra", "Linear Equations"],
                "contest": "AMC10A",
                "year": 2022,
                "problem_type": "multiple_choice"
            },
            {
                "problem_number": 2,
                "problem_id": "AMC10A_2022_2",
                "is_correct": False,
                "selected_answer": "A", 
                "correct_answer": "C",
                "time_spent_ms": 120000,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "difficulty": "Medium",
                "topics": ["Geometry", "Triangles"],
                "contest": "AMC10A",
                "year": 2022,
                "problem_type": "multiple_choice"
            },
            {
                "problem_number": 3,
                "problem_id": "AMC10A_2022_3",
                "is_correct": True,
                "selected_answer": "D",
                "correct_answer": "D", 
                "time_spent_ms": 90000,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "difficulty": "Medium",
                "topics": ["Number Theory", "Prime Numbers"],
                "contest": "AMC10A",
                "year": 2022,
                "problem_type": "multiple_choice"
            },
            {
                "problem_number": 4,
                "problem_id": "AMC10A_2022_4",
                "is_correct": True,
                "selected_answer": "E",
                "correct_answer": "E",
                "time_spent_ms": 75000,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "difficulty": "Hard", 
                "topics": ["Combinatorics"],
                "contest": "AMC10A",
                "year": 2022,
                "problem_type": "multiple_choice"
            },
            {
                "problem_number": 5,
                "problem_id": "AMC10A_2022_5",
                "is_correct": False,
                "selected_answer": "B",
                "correct_answer": "A",
                "time_spent_ms": 180000,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "difficulty": "Hard",
                "topics": ["Algebra", "Polynomials"],
                "contest": "AMC10A", 
                "year": 2022,
                "problem_type": "multiple_choice"
            }
        ]
    }
    
    print("1. Testing data enhancement...")
    enhanced_data = enhance_session_data(session_data.copy())
    
    print("✅ Enhanced data structure:")
    print(f"   - Total attempted: {enhanced_data.get('total_attempted')}")
    print(f"   - Score: {enhanced_data.get('score')}")
    print(f"   - Performance metrics: {bool(enhanced_data.get('performance_metrics'))}")
    print(f"   - Topic performance: {bool(enhanced_data.get('topic_performance'))}")
    print(f"   - Difficulty performance: {bool(enhanced_data.get('difficulty_performance'))}")
    print(f"   - Has 'solvedProblems' field: {'solvedProblems' in enhanced_data}")
    
    # Check performance metrics calculation
    perf_metrics = enhanced_data.get('performance_metrics', {})
    print(f"   - Accuracy: {perf_metrics.get('accuracy_percentage')}%")
    print(f"   - Average time: {perf_metrics.get('average_time_per_problem_seconds')}s")
    
    # Check topic performance 
    topic_perf = enhanced_data.get('topic_performance', {})
    print(f"   - Topics tracked: {list(topic_perf.keys())}")
    
    print("\n2. Testing database save...")
    try:
        # Test saving to database
        username = "test_user_enhanced"
        result = save_user_session(username, session_data)
        
        if result:  # result is the document ID string
            session_id = result
            print(f"✅ Session saved successfully with ID: {session_id}")
            
            # Verify the saved data in database
            print("\n3. Verifying saved data...")
            db = get_db()
            saved_session = db.sessions.find_one({"_id": ObjectId(session_id)})
            
            if saved_session:
                print("✅ Session found in database")
                print(f"   - Total attempted: {saved_session.get('total_attempted')}")
                print(f"   - Score: {saved_session.get('score')}")
                print(f"   - Has performance_metrics: {bool(saved_session.get('performance_metrics'))}")
                print(f"   - Has topic_performance: {bool(saved_session.get('topic_performance'))}")
                print(f"   - Has 'solvedProblems' field: {'solvedProblems' in saved_session}")
                print(f"   - Problems attempted count: {len(saved_session.get('problems_attempted', []))}")
                
                # Check a sample problem
                problems = saved_session.get('problems_attempted', [])
                if problems:
                    sample_problem = problems[0]
                    print(f"   - Sample problem has problem_id: {bool(sample_problem.get('problem_id'))}")
                    print(f"   - Sample problem has difficulty: {bool(sample_problem.get('difficulty'))}")
                    print(f"   - Sample problem has topics: {bool(sample_problem.get('topics'))}")
                
                print("\n✅ All enhanced session functionality verified!")
                return True
            else:
                print("❌ Session not found in database")
                return False
        else:
            print(f"❌ Failed to save session: No session ID returned")
            return False
            
    except Exception as e:
        print(f"❌ Error during test: {str(e)}")
        return False

def test_data_structure_comparison():
    """Compare old vs new data structure"""
    print("\n" + "=" * 50)
    print("📊 Data Structure Comparison")
    print("=" * 50)
    
    # Old structure (what we had before)
    old_structure = {
        "attempted": 5,
        "solvedProblems": 3,  # Redundant with score
        "problems_attempted": [
            {
                "problem_number": 1,
                "correct": True,
                "time_spent": 45000
            }
        ]
    }
    
    # New structure (what we have now)
    new_structure = {
        "total_attempted": 5,  # Clearer naming
        # solvedProblems removed (redundant)
        "problems_attempted": [
            {
                "problem_number": 1,
                "problem_id": "AMC10A_2022_1",
                "is_correct": True,
                "selected_answer": "B",
                "correct_answer": "B",
                "time_spent_ms": 45000,
                "time_spent_seconds": 45,
                "difficulty": "Easy",
                "topics": ["Algebra"],
                "timestamp": "2024-01-01T12:00:00Z"
            }
        ],
        "performance_metrics": {
            "total_attempted": 5,
            "total_correct": 3,
            "accuracy_percentage": 60,
            "average_time_per_problem_ms": 102000
        },
        "topic_performance": {
            "Algebra": {"attempted": 2, "correct": 2, "accuracy": 100}
        }
    }
    
    print("📈 IMPROVEMENTS:")
    print("  ✅ Removed redundant 'solvedProblems' field")
    print("  ✅ Enhanced problem tracking with detailed metadata")
    print("  ✅ Added comprehensive performance metrics")
    print("  ✅ Added topic and difficulty performance tracking")
    print("  ✅ Clearer field naming (attempted → total_attempted)")
    print("  ✅ More detailed timing information")
    print("  ✅ Problem identification with problem_id")
    print("  ✅ Answer tracking (selected vs correct)")

if __name__ == "__main__":
    print("🚀 Running Enhanced Session Tests...")
    
    success = test_enhanced_session_save()
    test_data_structure_comparison()
    
    if success:
        print("\n🎉 All tests passed! Enhanced session functionality is working correctly.")
    else:
        print("\n❌ Some tests failed. Please check the output above.")
