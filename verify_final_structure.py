#!/usr/bin/env python
"""
Verify the final structure of goAmy's sessions with changes:
1. total_time_minutes is inside performance_metrics
2. Redundant fields (total_time_ms, total_time_seconds, updated_at) are removed
"""

import sys
import os
sys.path.append('./backend')

from services.db_service import get_db
from bson import ObjectId
from bson.json_util import dumps
import json

def verify_final_structure():
    """
    Verify that the sessions have the correct final structure
    """
    print("\nVERIFYING FINAL SESSION STRUCTURE")
    print("=" * 70)
    
    # Connect to database
    db = get_db()
    print("Connected to MongoDB")
    
    # Find sessions for goAmy
    sessions = list(db.sessions.find({'username': 'goAmy'}))
    print(f"Found {len(sessions)} sessions for goAmy")
    
    for i, session in enumerate(sessions):
        print(f"\nSession {i+1} (ID: {session['_id']}):")
        
        # 1. Check top-level field structure
        fields = list(session.keys())
        if '_id' in fields:
            fields.remove('_id')
        
        print(f"\nTop-level fields ({len(fields)} total):")
        print(f"  {fields}")
        
        # 2. Check for absence of redundant fields
        redundant_fields = ['total_time_ms', 'total_time_seconds', 'updated_at']
        for field in redundant_fields:
            if field in session:
                print(f"❌ Redundant field {field} is still present")
            else:
                print(f"✅ Redundant field {field} correctly removed")
        
        # 3. Check that total_time_minutes is in performance_metrics
        perf_metrics = session.get('performance_metrics', {})
        if 'total_time_minutes' in perf_metrics:
            print(f"✅ total_time_minutes moved to performance_metrics: {perf_metrics['total_time_minutes']}")
        elif 'total_time_minutes' in session:
            print(f"❌ total_time_minutes still at top level: {session['total_time_minutes']}")
        else:
            print("❌ total_time_minutes is missing entirely")
        
        # 4. Check for other required fields
        required_fields = [
            'session_id', 'session_status', 'created_at', 'completed_at', 
            'username', 'user_id', 'year', 'contest', 'mode', 'shuffle',
            'score', 'total_attempted', 'problems_attempted', 
            'performance_metrics', 'topic_performance', 'difficulty_performance'
        ]
        
        missing = [f for f in required_fields if f not in session]
        if missing:
            print(f"❌ Missing required fields: {missing}")
        else:
            print("✅ All required fields present")
        
        # 5. Examine performance_metrics structure
        if 'performance_metrics' in session:
            print("\nPerformance metrics keys:")
            print(f"  {list(session['performance_metrics'].keys())}")
        
        # 6. Examine a sample of the document structure
        try:
            sample_json = dumps(session, indent=2)
            lines = sample_json.splitlines()
            print("\nSample JSON structure (first 30 lines):")
            for i, line in enumerate(lines):
                if i < 30:
                    print(line)
                else:
                    print("  ...")
                    break
        except Exception as e:
            print(f"Error formatting session: {e}")

if __name__ == "__main__":
    verify_final_structure()
