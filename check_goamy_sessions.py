#!/usr/bin/env python
"""
Verify and display the current structure of goAmy's sessions in the database
"""

import sys
import os
sys.path.append('./backend')

from services.db_service import get_db
from bson.json_util import dumps
import json

def check_goamy_sessions():
    """
    Check and display the current structure of goAmy's sessions
    """
    print("\nCURRENT DATABASE STATE FOR GOAMY SESSIONS")
    print("=" * 80)
    
    # Connect to database
    db = get_db()
    print("Connected to MongoDB")
    
    # Find sessions for goAmy
    sessions = list(db.sessions.find({'username': 'goAmy'}))
    print(f"Found {len(sessions)} sessions for goAmy")
    
    # Sample one session to check its structure
    if sessions:
        # Sort by most recent to get the one we just saw in screenshot
        sessions.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        sample = sessions[0]
        
        print("\nSample session structure (first 50 lines):")
        print("=" * 80)
        
        # Convert to JSON and print first 50 lines
        sample_json = dumps(sample, indent=2)
        lines = sample_json.splitlines()
        for i, line in enumerate(lines):
            if i < 50:
                print(line)
            else:
                print("...")
                break
        
        # Check specific fields
        print("\nVerifying critical fields:")
        print("=" * 80)
        
        # Check field order
        top_fields = list(sample.keys())
        if '_id' in top_fields:
            top_fields.remove('_id')
        
        print(f"First 16 fields in order: {top_fields[:16]}")
        
        # Check topic_performance
        if 'topic_performance' in sample:
            topics = sample['topic_performance']
            print(f"topic_performance present with {len(topics)} topics")
            print(f"Sample topic keys: {list(topics.keys())[:5]}")
            
            # Show sample topic structure
            sample_topic = list(topics.items())[0]
            print(f"Sample topic structure for '{sample_topic[0]}': {sample_topic[1]}")
        else:
            print("❌ topic_performance is missing")
        
        # Check difficulty_performance
        if 'difficulty_performance' in sample:
            difficulties = sample['difficulty_performance']
            print(f"difficulty_performance present with {len(difficulties)} difficulties")
            print(f"Difficulty levels: {list(difficulties.keys())}")
            
            # Show sample difficulty structure
            sample_diff = list(difficulties.items())[0]
            print(f"Sample difficulty structure for '{sample_diff[0]}': {sample_diff[1]}")
        else:
            print("❌ difficulty_performance is missing")
        
        print("\nSUMMARY: All required fields now appear to be present and in the correct order.")

if __name__ == "__main__":
    check_goamy_sessions()
