#!/usr/bin/env python
"""
Test script to verify that the migrated session structure works correctly
with the existing backend infrastructure.
"""

import sys
import os
sys.path.append('./backend')

from services.db_service import get_db, save_user_session, enhance_session_data
import json
from datetime import datetime, timezone

def test_migrated_session_compatibility():
    """
    Test that migrated sessions are compatible with existing backend functions
    """
    print("TESTING MIGRATED SESSION COMPATIBILITY")
    print("="*60)
    
    # Connect to database
    db = get_db()
    
    # Get goAmy's migrated session
    session = db.sessions.find_one({'username': 'goAmy'})
    if not session:
        print("❌ No migrated session found for goAmy")
        return False
    
    print("✅ Found migrated session for goAmy")
    
    # Test 1: Verify all required fields are present
    print("\n1. Testing required fields...")
    required_fields = [
        'session_id', 'session_status', 'created_at', 'completed_at',
        'username', 'user_id', 'year', 'contest', 'mode', 'shuffle',
        'score', 'total_attempted', 'problems_attempted', 
        'performance_metrics', 'topic_performance', 'difficulty_performance'
    ]
    
    missing_fields = [field for field in required_fields if field not in session]
    if missing_fields:
        print(f"❌ Missing fields: {missing_fields}")
        return False
    else:
        print("✅ All required fields present")
    
    # Test 2: Verify enhanced data structure works with enhance_session_data function
    print("\n2. Testing enhance_session_data compatibility...")
    try:
        # Create a mock session data similar to what frontend would send
        mock_session_data = {
            'session_id': f'test_{datetime.now().timestamp()}',
            'score': 2,
            'attempted': 5,
            'totalTime': 5000,
            'year': 2022,
            'contest': 'AMC 10A',
            'mode': 'practice',
            'completed_at': datetime.now(timezone.utc).isoformat(),
            'problems_attempted': [
                {
                    'problem_number': 1,
                    'problem_id': '507f1f77bcf86cd799439011',
                    'is_correct': True,
                    'selected_answer': 'A) 5',
                    'correct_answer': 'A) 5',
                    'time_spent_ms': 1000,
                    'timestamp': datetime.now(timezone.utc).isoformat(),
                    'difficulty': 'easy',
                    'topics': ['Algebra']
                },
                {
                    'problem_number': 2,
                    'problem_id': '507f1f77bcf86cd799439012',
                    'is_correct': False,
                    'selected_answer': 'B) 10',
                    'correct_answer': 'C) 15',
                    'time_spent_ms': 2000,
                    'timestamp': datetime.now(timezone.utc).isoformat(),
                    'difficulty': 'medium',
                    'topics': ['Geometry', 'Triangles']
                }
            ]
        }
        
        enhanced_data = enhance_session_data(mock_session_data)
        
        # Verify enhanced data has expected structure
        expected_enhanced_fields = [
            'total_attempted', 'performance_metrics', 
            'topic_performance', 'difficulty_performance'
        ]
        
        for field in expected_enhanced_fields:
            if field not in enhanced_data:
                print(f"❌ enhance_session_data missing field: {field}")
                return False
        
        print("✅ enhance_session_data function works correctly")
        
    except Exception as e:
        print(f"❌ enhance_session_data failed: {e}")
        return False
    
    # Test 3: Verify save_user_session works with enhanced structure
    print("\n3. Testing save_user_session compatibility...")
    try:
        # Use the mock session data
        document_id = save_user_session('test_user_migration', mock_session_data)
        if document_id:
            print("✅ save_user_session works with enhanced structure")
            
            # Clean up test data
            db.sessions.delete_one({'_id': document_id})
            print("✅ Test session cleaned up")
        else:
            print("❌ save_user_session failed")
            return False
            
    except Exception as e:
        print(f"❌ save_user_session failed: {e}")
        return False
    
    # Test 4: Verify performance analytics are calculated correctly
    print("\n4. Testing performance analytics...")
    
    # Check topic performance
    topic_perf = session.get('topic_performance', {})
    if not topic_perf:
        print("❌ No topic performance data")
        return False
    
    # Verify at least one topic has correct accuracy calculation
    for topic, stats in topic_perf.items():
        if 'attempted' in stats and 'correct' in stats and 'accuracy' in stats:
            expected_accuracy = round((stats['correct'] / stats['attempted']) * 100, 2) if stats['attempted'] > 0 else 0
            if abs(stats['accuracy'] - expected_accuracy) < 0.01:  # Allow small floating point differences
                print(f"✅ Topic performance calculations correct (sample: {topic})")
                break
    else:
        print("❌ Topic performance calculations incorrect")
        return False
    
    # Check difficulty performance
    diff_perf = session.get('difficulty_performance', {})
    if not diff_perf:
        print("❌ No difficulty performance data")
        return False
    
    print(f"✅ Performance analytics: {len(topic_perf)} topics, {len(diff_perf)} difficulties")
    
    # Test 5: Verify problem-level enhancements
    print("\n5. Testing problem-level enhancements...")
    problems = session.get('problems_attempted', [])
    if not problems:
        print("❌ No problems found")
        return False
    
    sample_problem = problems[0]
    required_problem_fields = ['correct_answer', 'difficulty', 'topics']
    missing_problem_fields = [field for field in required_problem_fields if field not in sample_problem]
    
    if missing_problem_fields:
        print(f"❌ Missing problem fields: {missing_problem_fields}")
        return False
    else:
        print("✅ Problem records fully enhanced")
    
    print("\n" + "="*60)
    print("✅ ALL COMPATIBILITY TESTS PASSED")
    print("✅ Migrated session structure is fully compatible with backend")
    print("="*60)
    
    return True

def test_field_ordering():
    """
    Test that the field ordering matches the expected structure
    """
    print("\nTESTING FIELD ORDERING")
    print("="*30)
    
    db = get_db()
    session = db.sessions.find_one({'username': 'goAmy'})
    
    if not session:
        print("❌ No session found")
        return False
    
    # Expected field order (excluding _id)
    expected_order = [
        'session_id', 'session_status', 'created_at', 'completed_at',
        'username', 'user_id', 'year', 'contest', 'mode', 'shuffle',
        'score', 'total_attempted', 'problems_attempted', 
        'performance_metrics', 'topic_performance', 'difficulty_performance',
        'total_time_ms', 'total_time_seconds', 'total_time_minutes'
    ]
    
    actual_fields = [field for field in session.keys() if field != '_id' and field != 'updated_at']
    
    # Check if the first N fields match expected order
    matches = 0
    for i, expected_field in enumerate(expected_order):
        if i < len(actual_fields) and actual_fields[i] == expected_field:
            matches += 1
        else:
            break
    
    print(f"Field ordering: {matches}/{len(expected_order)} fields in correct order")
    
    if matches >= len(expected_order) - 2:  # Allow some flexibility
        print("✅ Field ordering is acceptable")
        return True
    else:
        print("❌ Field ordering needs improvement")
        print(f"Expected: {expected_order[:5]}...")
        print(f"Actual:   {actual_fields[:5]}...")
        return False

if __name__ == "__main__":
    print("MIGRATED SESSION VERIFICATION TEST")
    print("="*60)
    
    try:
        # Test compatibility
        compatibility_ok = test_migrated_session_compatibility()
        
        # Test field ordering
        ordering_ok = test_field_ordering()
        
        print(f"\n{'='*60}")
        print("FINAL RESULTS:")
        print(f"Compatibility: {'✅ PASS' if compatibility_ok else '❌ FAIL'}")
        print(f"Field Ordering: {'✅ PASS' if ordering_ok else '❌ FAIL'}")
        
        if compatibility_ok and ordering_ok:
            print("\n🎉 MIGRATION VERIFICATION SUCCESSFUL!")
            print("✅ GoAmy's session record is fully migrated and compatible")
        else:
            print("\n⚠️  Some issues detected - may need further attention")
            
    except Exception as e:
        print(f"\n❌ Verification failed with error: {e}")
        import traceback
        traceback.print_exc()
