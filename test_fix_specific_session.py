#!/usr/bin/env python
import sys
sys.path.append('/Users/daoming/Documents/Github/goAIME')

from backend.services.db_service import get_db, enhance_session_data

def test_fix_on_specific_session():
    """Test the fix on the specific problematic session"""
    db = get_db()
    
    # Get the specific session
    session = db.sessions.find_one({"session_id": "91e107af-1980-402e-b651-ad895dd2e1c7"})
    
    if not session:
        print("❌ Session not found!")
        return
    
    print("=== BEFORE enhance_session_data ===")
    print(f"Username: '{session.get('username')}'")
    print(f"User ID: '{session.get('user_id')}'")
    
    # Check current metrics
    perf_metrics = session.get('performance_metrics', {})
    topic_metrics = perf_metrics.get('topic_metrics', {})
    difficulty_metrics = perf_metrics.get('difficulty_metrics', {})
    
    print(f"Topic metrics: {len(topic_metrics)} topics")
    print(f"Difficulty metrics: {len(difficulty_metrics)} difficulties")
    
    # Check first problem
    problems = session.get('problems_attempted', [])
    if problems:
        first_problem = problems[0]
        print(f"First problem topics: {first_problem.get('topics')}")
        print(f"First problem difficulty: {first_problem.get('difficulty')}")
    
    print(f"\n=== RUNNING enhance_session_data ===")
    
    # Run enhance_session_data with username
    enhanced_data = enhance_session_data(session, 'goAmy')
    
    print(f"\n=== AFTER enhance_session_data ===")
    print(f"Username: '{enhanced_data.get('username')}'")
    print(f"User ID: '{enhanced_data.get('user_id')}'")
    
    # Check enhanced metrics
    enhanced_perf_metrics = enhanced_data.get('performance_metrics', {})
    enhanced_topic_metrics = enhanced_perf_metrics.get('topic_metrics', {})
    enhanced_difficulty_metrics = enhanced_perf_metrics.get('difficulty_metrics', {})
    
    print(f"Topic metrics: {len(enhanced_topic_metrics)} topics")
    print(f"Difficulty metrics: {len(enhanced_difficulty_metrics)} difficulties")
    
    # Check first enhanced problem
    enhanced_problems = enhanced_data.get('problems_attempted', [])
    if enhanced_problems:
        first_enhanced_problem = enhanced_problems[0]
        print(f"First problem topics: {first_enhanced_problem.get('topics')}")
        print(f"First problem difficulty: {first_enhanced_problem.get('difficulty')}")
    
    if len(enhanced_topic_metrics) > 0:
        print(f"✅ SUCCESS: topic_metrics now has {len(enhanced_topic_metrics)} topics")
        print(f"Sample topics: {list(enhanced_topic_metrics.keys())[:5]}")
    else:
        print(f"❌ STILL EMPTY: topic_metrics is still empty")
    
    if len(enhanced_difficulty_metrics) > 0:
        print(f"✅ SUCCESS: difficulty_metrics now has {len(enhanced_difficulty_metrics)} difficulties")
        print(f"Difficulties: {list(enhanced_difficulty_metrics.keys())}")
    else:
        print(f"❌ STILL EMPTY: difficulty_metrics is still empty")
    
    if enhanced_data.get('user_id') and enhanced_data.get('user_id') != 'None':
        print(f"✅ SUCCESS: user_id is now properly set to: {enhanced_data.get('user_id')}")
    else:
        print(f"❌ STILL MISSING: user_id is still missing or 'None'")

if __name__ == "__main__":
    test_fix_on_specific_session()
