#!/usr/bin/env python
import sys
sys.path.append('/Users/daoming/Documents/Github/goAIME')

from backend.services.db_service import get_db

def verify_all_sessions_fixed():
    """Verify that all sessions now have proper username and user_id"""
    db = get_db()
    
    # Get all sessions
    all_sessions = list(db.sessions.find())
    
    print(f"=== Checking all {len(all_sessions)} sessions ===")
    
    sessions_with_issues = []
    sessions_ok = []
    
    for session in all_sessions:
        username = session.get('username')
        user_id = session.get('user_id')
        session_id = session.get('session_id')
        
        issues = []
        if username is None or username == 'None':
            issues.append("username is None")
        if user_id is None or user_id == 'None':
            issues.append("user_id is None")
        
        if issues:
            sessions_with_issues.append({
                'session_id': session_id,
                'username': username,
                'user_id': user_id,
                'issues': issues
            })
        else:
            sessions_ok.append({
                'session_id': session_id,
                'username': username,
                'user_id': user_id
            })
    
    print(f"\n✅ Sessions OK: {len(sessions_ok)}")
    for session in sessions_ok:
        print(f"  - {session['username']}: {session['session_id']}")
    
    print(f"\n❌ Sessions with issues: {len(sessions_with_issues)}")
    for session in sessions_with_issues:
        print(f"  - {session['username']}: {session['session_id']} - Issues: {session['issues']}")
    
    # Check performance metrics structure
    print(f"\n=== Performance Metrics Structure Check ===")
    for session in all_sessions:
        perf_metrics = session.get('performance_metrics', {})
        topic_metrics = perf_metrics.get('topic_metrics', {})
        difficulty_metrics = perf_metrics.get('difficulty_metrics', {})
        
        print(f"Session {session.get('username')}: topics={len(topic_metrics)}, difficulties={len(difficulty_metrics)}")

if __name__ == "__main__":
    verify_all_sessions_fixed()
