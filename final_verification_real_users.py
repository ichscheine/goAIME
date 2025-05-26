#!/usr/bin/env python
"""
Final verification that the two issues for real users are resolved:
1. user_name, user_id are properly set
2. topic_metrics and difficulty_metrics are populated
"""
import sys
sys.path.append('/Users/daoming/Documents/Github/goAIME')

from backend.services.db_service import get_db

def final_verification():
    """Final verification that both issues are resolved"""
    db = get_db()
    
    print("🔍 FINAL VERIFICATION FOR REAL USER ISSUES")
    print("=" * 50)
    
    # Get goAmy session
    goamy_session = db.sessions.find_one({"username": "goAmy"})
    
    if not goamy_session:
        print("❌ No goAmy session found!")
        return
    
    print(f"📋 Checking goAmy session: {goamy_session.get('session_id')}")
    print()
    
    # Issue 1: Check username and user_id
    print("🔍 ISSUE 1: Username and User ID")
    username = goamy_session.get('username')
    user_id = goamy_session.get('user_id')
    
    if username and username != 'None':
        print(f"✅ Username: '{username}' (properly set)")
    else:
        print(f"❌ Username: '{username}' (missing or None)")
    
    if user_id and user_id != 'None':
        print(f"✅ User ID: '{user_id}' (properly set)")
    else:
        print(f"❌ User ID: '{user_id}' (missing or None)")
    
    print()
    
    # Issue 2: Check topic_metrics and difficulty_metrics
    print("🔍 ISSUE 2: Topic and Difficulty Metrics")
    perf_metrics = goamy_session.get('performance_metrics', {})
    topic_metrics = perf_metrics.get('topic_metrics', {})
    difficulty_metrics = perf_metrics.get('difficulty_metrics', {})
    
    if topic_metrics and len(topic_metrics) > 0:
        print(f"✅ Topic metrics: {len(topic_metrics)} topics populated")
        sample_topics = list(topic_metrics.keys())[:5]
        print(f"   Sample topics: {sample_topics}")
    else:
        print(f"❌ Topic metrics: empty or missing")
    
    if difficulty_metrics and len(difficulty_metrics) > 0:
        print(f"✅ Difficulty metrics: {len(difficulty_metrics)} difficulties populated")
        print(f"   Difficulties: {list(difficulty_metrics.keys())}")
    else:
        print(f"❌ Difficulty metrics: empty or missing")
    
    print()
    
    # Overall assessment
    print("📊 OVERALL ASSESSMENT")
    issues_resolved = 0
    
    if username and username != 'None' and user_id and user_id != 'None':
        print("✅ Issue 1 RESOLVED: Username and User ID are properly set")
        issues_resolved += 1
    else:
        print("❌ Issue 1 NOT RESOLVED: Username or User ID missing")
    
    if topic_metrics and difficulty_metrics and len(topic_metrics) > 0 and len(difficulty_metrics) > 0:
        print("✅ Issue 2 RESOLVED: Topic and Difficulty metrics are populated")
        issues_resolved += 1
    else:
        print("❌ Issue 2 NOT RESOLVED: Metrics are empty")
    
    print()
    print(f"🎯 RESULT: {issues_resolved}/2 issues resolved")
    
    if issues_resolved == 2:
        print("🎉 ALL ISSUES RESOLVED! Ready for production use.")
    else:
        print("⚠️  Some issues remain. Further investigation needed.")

if __name__ == "__main__":
    final_verification()
