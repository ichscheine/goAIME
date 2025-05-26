#!/usr/bin/env python
"""
Verify field ordering for migrated sessions in goaime.sessions collection
"""

import sys
import os
sys.path.append('./backend')

from services.db_service import get_db
import json

def verify_field_ordering():
    """
    Verify that sessions have the correct field ordering
    """
    print("VERIFYING FIELD ORDERING FOR MIGRATED SESSIONS")
    print("="*70)
    
    # Required field order
    required_order = [
        'session_id', 'session_status', 'created_at', 'completed_at', 
        'username', 'user_id', 'year', 'contest', 'mode', 'shuffle',
        'score', 'total_attempted', 'problems_attempted', 
        'performance_metrics', 'topic_performance', 'difficulty_performance'
    ]
    
    # Connect to database
    db = get_db()
    print("✅ Connected to MongoDB")
    
    # Check goAmy's sessions
    username = 'goAmy'
    sessions = list(db.sessions.find({'username': username}))
    
    print(f"\nFound {len(sessions)} sessions for {username}")
    
    for i, session in enumerate(sessions):
        print(f"\n{'='*50}")
        print(f"SESSION {i+1} (ID: {session['_id']})")
        print(f"{'='*50}")
        
        # Get field order (excluding _id)
        actual_fields = [field for field in session.keys() if field != '_id']
        
        print("ACTUAL FIELD ORDER:")
        for j, field in enumerate(actual_fields):
            print(f"  {j+1:2d}. {field}")
        
        print("\nREQUIRED FIELD ORDER:")
        for j, field in enumerate(required_order):
            print(f"  {j+1:2d}. {field}")
        
        # Check if required fields are at the beginning in the right order
        missing_fields = []
        order_issues = []
        
        for j, required_field in enumerate(required_order):
            if required_field not in session:
                missing_fields.append(required_field)
            elif j < len(actual_fields) and actual_fields[j] != required_field:
                if required_field in actual_fields:
                    actual_pos = actual_fields.index(required_field)
                    order_issues.append(f"{required_field} (expected pos {j+1}, actual pos {actual_pos+1})")
        
        print("\nVERIFICATION RESULTS:")
        if missing_fields:
            print(f"  ❌ Missing fields: {missing_fields}")
        else:
            print(f"  ✅ All required fields present")
        
        if order_issues:
            print(f"  ⚠️  Field ordering issues: {order_issues}")
        else:
            print(f"  ✅ Field ordering correct")
        
        # Check enhanced problem structure
        problems = session.get('problems_attempted', [])
        if problems:
            sample_problem = problems[0]
            required_problem_fields = ['problem_number', 'problem_id', 'is_correct', 
                                     'selected_answer', 'correct_answer', 'difficulty', 'topics']
            
            missing_problem_fields = [f for f in required_problem_fields if f not in sample_problem]
            
            print(f"\nPROBLEM STRUCTURE:")
            if missing_problem_fields:
                print(f"  ❌ Missing problem fields: {missing_problem_fields}")
            else:
                print(f"  ✅ Problem structure complete")
        
        # Check performance analytics
        topic_perf = session.get('topic_performance', {})
        diff_perf = session.get('difficulty_performance', {})
        
        print(f"\nPERFORMANCE ANALYTICS:")
        print(f"  Topics tracked: {len(topic_perf)}")
        print(f"  Difficulties tracked: {len(diff_perf)}")
        
        # Sample topic/difficulty structure
        if topic_perf:
            sample_topic = list(topic_perf.keys())[0]
            topic_data = topic_perf[sample_topic]
            expected_topic_fields = ['attempted', 'correct', 'accuracy']
            missing_topic_fields = [f for f in expected_topic_fields if f not in topic_data]
            
            if missing_topic_fields:
                print(f"  ❌ Missing topic analytics fields: {missing_topic_fields}")
            else:
                print(f"  ✅ Topic analytics structure complete")
        
        if diff_perf:
            sample_diff = list(diff_perf.keys())[0]
            diff_data = diff_perf[sample_diff]
            expected_diff_fields = ['attempted', 'correct', 'accuracy']
            missing_diff_fields = [f for f in expected_diff_fields if f not in diff_data]
            
            if missing_diff_fields:
                print(f"  ❌ Missing difficulty analytics fields: {missing_diff_fields}")
            else:
                print(f"  ✅ Difficulty analytics structure complete")

if __name__ == "__main__":
    verify_field_ordering()
