#!/usr/bin/env python
"""
Final migration script to apply the improved field structure to all goAmy sessions:
1. Move total_time_minutes to performance_metrics
2. Remove redundant fields (total_time_ms, total_time_seconds, updated_at)
3. Ensure proper field ordering
"""

import sys
import os
sys.path.append('./backend')

from services.db_service import get_db
from bson import ObjectId
from datetime import datetime
import json

def log(message):
    """Print a timestamped log message"""
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")

def get_all_goamy_sessions():
    """Get all sessions for goAmy from the database"""
    db = get_db()
    return list(db.sessions.find({'username': 'goAmy'}))

def fix_session_structure(session_id):
    """Fix the structure of a single session"""
    db = get_db()
    session = db.sessions.find_one({'_id': ObjectId(session_id)})
    
    if not session:
        log(f"❌ Session {session_id} not found")
        return False
    
    log(f"Processing session {session_id}")
    
    # Move total_time_minutes to performance_metrics
    if 'total_time_minutes' in session:
        time_minutes = session.pop('total_time_minutes')
        
        # Ensure performance_metrics exists
        if 'performance_metrics' not in session:
            session['performance_metrics'] = {}
            
        session['performance_metrics']['total_time_minutes'] = time_minutes
        log(f"  Moved total_time_minutes ({time_minutes}) to performance_metrics")
    
    # Remove redundant fields
    redundant_fields = ['total_time_ms', 'total_time_seconds', 'updated_at']
    for field in redundant_fields:
        if field in session:
            session.pop(field)
            log(f"  Removed redundant field: {field}")
    
    # Remove average_time_per_problem_seconds if present (redundant with ms version)
    if 'performance_metrics' in session and 'average_time_per_problem_seconds' in session['performance_metrics']:
        session['performance_metrics'].pop('average_time_per_problem_seconds')
        log("  Removed redundant average_time_per_problem_seconds from performance_metrics")
    
    # Create ordered document
    ordered = create_ordered_document(session)
    
    # Update session in database
    result = db.sessions.replace_one({'_id': ObjectId(session_id)}, ordered)
    
    if result.modified_count > 0:
        log(f"✅ Successfully updated session {session_id}")
        return True
    else:
        log(f"⚠️ No changes made to session {session_id}")
        return False

def create_ordered_document(session):
    """Create a properly ordered document according to the required field order"""
    # Define ordered fields
    ordered_fields = [
        'session_id', 'session_status', 'created_at', 'completed_at', 
        'username', 'user_id', 'year', 'contest', 'mode', 'shuffle',
        'score', 'total_attempted', 'problems_attempted', 
        'performance_metrics', 'topic_performance', 'difficulty_performance'
    ]
    
    # Create new ordered document
    ordered_doc = {}
    
    # Add fields in specified order (if they exist)
    for field in ordered_fields:
        if field in session:
            ordered_doc[field] = session[field]
    
    # Add any remaining fields
    for field in session:
        if field != '_id' and field not in ordered_doc:
            ordered_doc[field] = session[field]
    
    return ordered_doc

def verify_session_structure(session_id):
    """Verify the structure of a single session"""
    db = get_db()
    session = db.sessions.find_one({'_id': ObjectId(session_id)})
    
    if not session:
        log(f"❌ Session {session_id} not found")
        return False
    
    log(f"Verifying session {session_id}")
    
    # Check top-level field presence
    required_fields = [
        'session_id', 'session_status', 'created_at', 'completed_at', 
        'username', 'user_id', 'year', 'contest', 'mode', 'shuffle',
        'score', 'total_attempted', 'problems_attempted', 
        'performance_metrics', 'topic_performance', 'difficulty_performance'
    ]
    
    missing = [f for f in required_fields if f not in session]
    if missing:
        log(f"❌ Missing required fields: {missing}")
        return False
    
    # Check for absence of redundant fields
    redundant_fields = ['total_time_ms', 'total_time_seconds', 'updated_at', 'total_time_minutes']
    for field in redundant_fields:
        if field in session:
            log(f"❌ Redundant field still present: {field}")
            return False
    
    # Check that total_time_minutes is in performance_metrics
    if 'performance_metrics' in session:
        if 'total_time_minutes' not in session['performance_metrics']:
            log("❌ total_time_minutes not in performance_metrics")
            return False
    else:
        log("❌ performance_metrics missing")
        return False
    
    # Check field ordering
    fields = list(session.keys())
    if '_id' in fields:
        fields.remove('_id')
    
    # Check the first fields are in the right order
    correct_order = True
    for i, field in enumerate(required_fields):
        if i >= len(fields) or fields[i] != field:
            correct_order = False
            log(f"❌ Field ordering incorrect - expected {field} at position {i}, got {fields[i] if i < len(fields) else 'missing'}")
            break
    
    if not correct_order:
        log("❌ Field ordering is incorrect")
        return False
    
    log("✅ Session structure is correct")
    return True

def main():
    """Main function to fix all goAmy session structures"""
    log("IMPROVED SESSION STRUCTURE MIGRATION")
    log("=" * 70)
    
    # Get all goAmy sessions
    sessions = get_all_goamy_sessions()
    log(f"Found {len(sessions)} sessions for goAmy")
    
    # Fix each session structure
    fixed_count = 0
    for session in sessions:
        if fix_session_structure(str(session['_id'])):
            fixed_count += 1
    
    log(f"\nFixed {fixed_count}/{len(sessions)} sessions")
    
    # Verify each session structure
    verified_count = 0
    for session in sessions:
        if verify_session_structure(str(session['_id'])):
            verified_count += 1
    
    log(f"\nVerified {verified_count}/{len(sessions)} sessions")
    
    # Summary
    if fixed_count == len(sessions) and verified_count == len(sessions):
        log("\n🎉 ALL SESSIONS HAVE CORRECT STRUCTURE!")
    else:
        log("\n⚠️ SOME SESSIONS HAVE STRUCTURE ISSUES")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        import traceback
        print(f"ERROR: {e}")
        traceback.print_exc()
