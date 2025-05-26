#!/usr/bin/env python
"""
Final verification script to check that all goAmy sessions have the correct structure:
1. Proper field order
2. total_time_minutes inside performance_metrics
3. No redundant fields
4. All required fields present
"""

import sys
import os
sys.path.append('./backend')

from services.db_service import get_db
from bson import ObjectId
from bson.json_util import dumps
import json

def verify_session_structure():
    """Verify that all goAmy sessions have the correct structure"""
    print("\nFINAL SESSION STRUCTURE VERIFICATION")
    print("=" * 70)
    
    # Connect to database
    db = get_db()
    print("Connected to MongoDB")
    
    # Find sessions for goAmy
    sessions = list(db.sessions.find({'username': 'goAmy'}))
    print(f"Found {len(sessions)} sessions for goAmy")
    
    # Define required fields and their order
    required_fields = [
        'session_id', 'session_status', 'created_at', 'completed_at', 
        'username', 'user_id', 'year', 'contest', 'mode', 'shuffle',
        'score', 'total_attempted', 'problems_attempted', 
        'performance_metrics', 'topic_performance', 'difficulty_performance'
    ]
    
    # Define forbidden top-level fields
    forbidden_fields = ['total_time_ms', 'total_time_seconds', 'total_time_minutes', 'updated_at']
    
    # Define required performance_metrics fields
    required_metrics = ['total_attempted', 'total_correct', 'total_incorrect', 
                      'accuracy_percentage', 'total_time_minutes']
    
    all_passed = True
    
    for i, session in enumerate(sessions):
        session_id = str(session['_id'])
        print(f"\nSession {i+1} (ID: {session_id}):")
        
        session_passed = True
        
        # Check 1: Required fields presence
        missing = [f for f in required_fields if f not in session]
        if missing:
            print(f"❌ Missing required fields: {missing}")
            session_passed = False
            all_passed = False
        else:
            print("✅ All required fields present")
        
        # Check 2: No forbidden fields
        forbidden = [f for f in forbidden_fields if f in session]
        if forbidden:
            print(f"❌ Forbidden fields present: {forbidden}")
            session_passed = False
            all_passed = False
        else:
            print("✅ No forbidden fields present")
        
        # Check 3: Field ordering
        fields = list(session.keys())
        if '_id' in fields:
            fields.remove('_id')
        
        order_correct = True
        for j, required_field in enumerate(required_fields):
            if j >= len(fields) or fields[j] != required_field:
                order_correct = False
                if j < len(fields):
                    print(f"❌ Field ordering incorrect at position {j}: expected '{required_field}', got '{fields[j]}'")
                else:
                    print(f"❌ Field ordering incorrect: missing '{required_field}'")
                break
        
        if order_correct:
            print("✅ Field ordering is correct")
        else:
            session_passed = False
            all_passed = False
        
        # Check 4: total_time_minutes in performance_metrics
        perf_metrics = session.get('performance_metrics', {})
        if 'total_time_minutes' in perf_metrics:
            print(f"✅ total_time_minutes is in performance_metrics: {perf_metrics['total_time_minutes']}")
        else:
            print("❌ total_time_minutes missing from performance_metrics")
            session_passed = False
            all_passed = False
        
        # Check 5: Required performance metrics
        missing_metrics = [m for m in required_metrics if m not in perf_metrics]
        if missing_metrics:
            print(f"❌ Missing required performance metrics: {missing_metrics}")
            session_passed = False
            all_passed = False
        else:
            print("✅ All required performance metrics present")
        
        # Check 6: No redundant fields in performance metrics
        if 'average_time_per_problem_seconds' in perf_metrics:
            print("❌ Redundant average_time_per_problem_seconds present in performance_metrics")
            session_passed = False
            all_passed = False
        
        # Session summary
        if session_passed:
            print("✅ SESSION PASSED ALL CHECKS")
        else:
            print("❌ SESSION FAILED SOME CHECKS")
    
    # Overall summary
    print("\n" + "=" * 70)
    if all_passed:
        print("🎉 ALL SESSIONS HAVE CORRECT STRUCTURE!")
        print("✅ All required fields present")
        print("✅ Field ordering is correct")
        print("✅ total_time_minutes properly inside performance_metrics")
        print("✅ No redundant fields")
    else:
        print("❌ SOME SESSIONS HAVE STRUCTURE ISSUES")
    print("=" * 70)
    
    return all_passed

if __name__ == "__main__":
    try:
        verify_session_structure()
    except Exception as e:
        import traceback
        print(f"Error: {e}")
        traceback.print_exc()
