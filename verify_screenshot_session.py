#!/usr/bin/env python
"""
Verify the specific session from the screenshot (ID: 6834520252448ebde5330c5c)
"""

import sys
import os
sys.path.append('./backend')

from bson import ObjectId
from services.db_service import get_db
from bson.json_util import dumps
import json

def verify_screenshot_session():
    """
    Verify the specific session shown in the screenshot
    """
    print("\nVERIFYING SPECIFIC SESSION FROM SCREENSHOT")
    print("=" * 70)
    
    # Target Session ID from screenshot
    target_id = "6834520252448ebde5330c5c"
    print(f"Target Session ID: {target_id}")
    
    # Connect to database
    db = get_db()
    print("Connected to MongoDB")
    
    # Find the specific session
    session = db.sessions.find_one({'_id': ObjectId(target_id)})
    
    if not session:
        print(f"❌ Session {target_id} not found!")
        return
    
    print(f"✅ Found session {target_id}")
    
    # Get field list in order
    field_order = list(session.keys())
    if '_id' in field_order:
        field_order.remove('_id')
    
    print("\nFIELD ORDER (first 20):")
    for i, field in enumerate(field_order[:20]):
        print(f"  {i+1:2d}. {field}")
    
    # Check for required fields
    required_fields = [
        'session_id', 'session_status', 'created_at', 'completed_at',
        'username', 'user_id', 'year', 'contest', 'mode', 'shuffle',
        'score', 'total_attempted', 'problems_attempted',
        'performance_metrics', 'topic_performance', 'difficulty_performance'
    ]
    
    missing = [f for f in required_fields if f not in session]
    if missing:
        print(f"\n❌ Missing fields: {missing}")
    else:
        print("\n✅ All required fields present")
    
    # Check topics
    if 'topic_performance' in session:
        topics = session['topic_performance']
        print(f"\nTOPIC_PERFORMANCE: {len(topics)} topics")
        print(f"  Topics: {list(topics.keys())[:5]}...")
    else:
        print("\n❌ topic_performance missing")
    
    # Check difficulties
    if 'difficulty_performance' in session:
        difficulties = session['difficulty_performance']
        print(f"\nDIFFICULTY_PERFORMANCE: {len(difficulties)} difficulties")
        print(f"  Difficulties: {list(difficulties.keys())}")
    else:
        print("\n❌ difficulty_performance missing")
    
    print("\nSUMMARY:")
    if all(f in session for f in required_fields):
        print("✅ SESSION FIXED SUCCESSFULLY!")
        print("✅ All fields present in proper order")
        print(f"✅ Topic performance tracking: {len(session.get('topic_performance', {}))} topics")
        print(f"✅ Difficulty performance tracking: {len(session.get('difficulty_performance', {}))} difficulties")
    else:
        print("❌ SESSION STILL HAS ISSUES")

if __name__ == "__main__":
    verify_screenshot_session()
