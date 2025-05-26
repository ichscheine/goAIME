#!/usr/bin/env python
"""
Debug script to check the actual current state of the goaime.sessions database
"""

import sys
import os
sys.path.append('./backend')

from services.db_service import get_db
import json
from bson import ObjectId

def check_database_state():
    """
    Check the current state of the goaime.sessions collection
    """
    print("DEBUGGING DATABASE STATE")
    print("="*60)
    
    # Connect to database
    db = get_db()
    print("✅ Connected to MongoDB")
    
    # Check goAmy's sessions
    username = 'goAmy'
    sessions = list(db.sessions.find({'username': username}))
    
    print(f"\nFound {len(sessions)} sessions for {username}")
    
    for i, session in enumerate(sessions):
        print(f"\n{'='*40}")
        print(f"SESSION {i+1} (ID: {session['_id']})")
        print(f"{'='*40}")
        
        # Show all top-level fields
        print("TOP-LEVEL FIELDS:")
        for field in sorted(session.keys()):
            if field == '_id':
                continue
            value = session[field]
            if isinstance(value, (dict, list)) and len(str(value)) > 100:
                print(f"  {field}: {type(value).__name__} (length: {len(value)})")
            else:
                print(f"  {field}: {value}")
        
        # Check for missing critical fields
        required_fields = ['topic_performance', 'difficulty_performance']
        missing_fields = [f for f in required_fields if f not in session]
        
        if missing_fields:
            print(f"\n❌ MISSING REQUIRED FIELDS: {missing_fields}")
        else:
            print(f"\n✅ All required fields present")
        
        # Check problems_attempted structure
        problems = session.get('problems_attempted', [])
        if problems:
            print(f"\nPROBLEMS_ATTEMPTED ({len(problems)} problems):")
            sample = problems[0] if problems else {}
            print(f"  Sample problem fields: {list(sample.keys())}")
            
            # Check if problems have the required metadata
            has_correct_answer = any('correct_answer' in p for p in problems)
            has_difficulty = any('difficulty' in p for p in problems)
            has_topics = any('topics' in p and p['topics'] for p in problems)
            
            print(f"  Has correct_answer: {has_correct_answer}")
            print(f"  Has difficulty: {has_difficulty}")
            print(f"  Has topics: {has_topics}")
        
        # Check performance analytics
        topic_perf = session.get('topic_performance', {})
        diff_perf = session.get('difficulty_performance', {})
        
        print(f"\nPERFORMANCE ANALYTICS:")
        print(f"  topic_performance: {len(topic_perf)} topics")
        print(f"  difficulty_performance: {len(diff_perf)} difficulties")
        
        if topic_perf:
            print(f"  Topics: {list(topic_perf.keys())}")
        if diff_perf:
            print(f"  Difficulties: {list(diff_perf.keys())}")

if __name__ == "__main__":
    check_database_state()
