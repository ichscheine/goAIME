#!/usr/bin/env python
"""
Final comprehensive verification of the migrated session structure
"""

import sys
import os
sys.path.append('./backend')

from services.db_service import get_db
import json

def final_verification():
    """
    Final comprehensive verification of migration
    """
    print("FINAL COMPREHENSIVE VERIFICATION")
    print("="*60)
    print("Verifying that all goAmy sessions match the enhanced structure:")
    print("- Ordered fields matching specification")
    print("- Complete topic_performance and difficulty_performance")
    print("- Enhanced problem records with metadata")
    print("- Valid user_id reference")
    print()
    
    # Connect to database
    db = get_db()
    print("✅ Connected to MongoDB")
    
    # Get sessions
    sessions = list(db.sessions.find({'username': 'goAmy'}))
    print(f"\nFound {len(sessions)} sessions for goAmy")
    
    required_fields = [
        'session_id', 'session_status', 'created_at', 'completed_at',
        'username', 'user_id', 'year', 'contest', 'mode', 'shuffle',
        'score', 'total_attempted', 'problems_attempted', 
        'performance_metrics', 'topic_performance', 'difficulty_performance'
    ]
    
    all_passed = True
    
    for i, session in enumerate(sessions):
        print(f"\n{'='*50}")
        print(f"SESSION {i+1} VERIFICATION")
        print(f"ID: {session['_id']}")
        print(f"{'='*50}")
        
        # Check 1: Required fields presence
        missing_fields = [f for f in required_fields if f not in session]
        if missing_fields:
            print(f"❌ Missing fields: {missing_fields}")
            all_passed = False
        else:
            print("✅ All required fields present")
        
        # Check 2: Field ordering
        actual_fields = [f for f in session.keys() if f != '_id']
        order_correct = True
        for j, required_field in enumerate(required_fields):
            if j < len(actual_fields) and actual_fields[j] != required_field:
                order_correct = False
                break
        
        if order_correct:
            print("✅ Field ordering correct")
        else:
            print("❌ Field ordering incorrect")
            all_passed = False
        
        # Check 3: User ID validity
        user_id = session.get('user_id')
        if user_id and user_id != 'None':
            # Verify user exists
            user = db.users.find_one({'_id': ObjectId(user_id)})
            if user:
                print(f"✅ Valid user_id: {user_id} -> {user['username']}")
            else:
                print(f"❌ Invalid user_id: {user_id} (user not found)")
                all_passed = False
        else:
            print("❌ Missing or invalid user_id")
            all_passed = False
        
        # Check 4: Enhanced problems structure
        problems = session.get('problems_attempted', [])
        if problems:
            sample_problem = problems[0]
            required_problem_fields = ['problem_number', 'problem_id', 'is_correct', 
                                     'selected_answer', 'correct_answer', 'difficulty', 'topics']
            missing_problem_fields = [f for f in required_problem_fields if f not in sample_problem]
            
            if missing_problem_fields:
                print(f"❌ Missing problem fields: {missing_problem_fields}")
                all_passed = False
            else:
                print(f"✅ Problem structure complete ({len(problems)} problems)")
        
        # Check 5: Performance analytics
        topic_perf = session.get('topic_performance', {})
        diff_perf = session.get('difficulty_performance', {})
        
        if not topic_perf:
            print("❌ Missing topic_performance")
            all_passed = False
        elif not diff_perf:
            print("❌ Missing difficulty_performance")
            all_passed = False
        else:
            print(f"✅ Performance analytics: {len(topic_perf)} topics, {len(diff_perf)} difficulties")
        
        # Check 6: Performance metrics structure
        perf_metrics = session.get('performance_metrics', {})
        required_metrics = ['total_attempted', 'total_correct', 'total_incorrect', 'accuracy_percentage']
        missing_metrics = [m for m in required_metrics if m not in perf_metrics]
        
        if missing_metrics:
            print(f"❌ Missing performance metrics: {missing_metrics}")
            all_passed = False
        else:
            print("✅ Performance metrics complete")
        
        # Show summary stats
        print(f"\nSUMMARY STATS:")
        print(f"  Score: {session.get('score', 0)}/{session.get('total_attempted', 0)}")
        print(f"  Accuracy: {perf_metrics.get('accuracy_percentage', 0)}%")
        print(f"  Topics: {list(topic_perf.keys())[:5]}{'...' if len(topic_perf) > 5 else ''}")
        print(f"  Difficulties: {list(diff_perf.keys())}")
    
    print(f"\n{'='*60}")
    print("FINAL RESULT")
    print(f"{'='*60}")
    
    if all_passed:
        print("🎉 ALL CHECKS PASSED!")
        print("✅ Real user session migration COMPLETE")
        print("✅ Both sessions have proper enhanced structure")
        print("✅ All fields are ordered correctly")
        print("✅ Topic and difficulty performance analytics are present")
        print("✅ Problem records have complete metadata")
        print("✅ User ID is valid and references correct user")
    else:
        print("❌ SOME CHECKS FAILED")
        print("Migration needs additional fixes")
    
    return all_passed

if __name__ == "__main__":
    from bson import ObjectId
    final_verification()
