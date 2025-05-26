#!/usr/bin/env python
"""
Migration script to fix real user records in goaime.sessions collection.
This script will:
1. Add missing fields (user_id, shuffle, topic_performance, difficulty_performance)
2. Enhance problem-level records with correct_answer and difficulty
3. Ensure proper field ordering
4. Update existing session records to match the enhanced structure
"""

import sys
import os
sys.path.append('./backend')

from services.db_service import get_db
from bson import ObjectId
from datetime import datetime, timezone
import json

def get_user_by_username(db, username):
    """
    Get user by username from database
    """
    try:
        user = db.users.find_one({'username': username})
        return user
    except Exception as e:
        print(f"Error getting user {username}: {e}")
        return None

def get_problem_metadata(db, problem_id):
    """
    Fetch problem metadata including correct_answer and difficulty
    """
    try:
        if isinstance(problem_id, str):
            problem_id = ObjectId(problem_id)
        
        problem = db.problems.find_one({'_id': problem_id})
        if problem:
            return {
                'correct_answer': problem.get('answer', problem.get('correct_answer')),
                'difficulty': problem.get('difficulty', 'Medium'),
                'topics': problem.get('topics', [])
            }
        else:
            print(f"  Warning: Problem {problem_id} not found in database")
            return {
                'correct_answer': None,
                'difficulty': 'Medium',
                'topics': []
            }
    except Exception as e:
        print(f"  Error fetching problem {problem_id}: {e}")
        return {
            'correct_answer': None,
            'difficulty': 'Medium', 
            'topics': []
        }

def calculate_performance_analytics(problems_attempted):
    """
    Calculate topic_performance and difficulty_performance analytics
    """
    topic_performance = {}
    difficulty_performance = {}
    
    for problem in problems_attempted:
        # Topic performance
        topics = problem.get('topics', [])
        for topic in topics:
            if topic not in topic_performance:
                topic_performance[topic] = {'attempted': 0, 'correct': 0}
            topic_performance[topic]['attempted'] += 1
            if problem.get('is_correct', False):
                topic_performance[topic]['correct'] += 1
        
        # Difficulty performance
        difficulty = problem.get('difficulty', 'Medium')
        if difficulty not in difficulty_performance:
            difficulty_performance[difficulty] = {'attempted': 0, 'correct': 0}
        difficulty_performance[difficulty]['attempted'] += 1
        if problem.get('is_correct', False):
            difficulty_performance[difficulty]['correct'] += 1
    
    # Calculate accuracy percentages
    for topic in topic_performance:
        attempted = topic_performance[topic]['attempted']
        correct = topic_performance[topic]['correct']
        topic_performance[topic]['accuracy'] = round((correct / attempted) * 100, 2) if attempted > 0 else 0
    
    for difficulty in difficulty_performance:
        attempted = difficulty_performance[difficulty]['attempted']
        correct = difficulty_performance[difficulty]['correct']
        difficulty_performance[difficulty]['accuracy'] = round((correct / attempted) * 100, 2) if attempted > 0 else 0
    
    return topic_performance, difficulty_performance

def create_ordered_session_document(session):
    """
    Create a properly ordered session document with all required fields
    """
    ordered_doc = {}
    
    # Ordered field structure
    field_order = [
        'session_id', 'session_status', 'created_at', 'completed_at', 
        'username', 'user_id', 'year', 'contest', 'mode', 'shuffle',
        'score', 'total_attempted', 'problems_attempted', 
        'performance_metrics', 'topic_performance', 'difficulty_performance',
        'total_time_ms', 'total_time_seconds', 'total_time_minutes',
        'updated_at'
    ]
    
    # Copy fields in order
    for field in field_order:
        if field in session:
            ordered_doc[field] = session[field]
    
    # Add any remaining fields not in the ordered list
    for field, value in session.items():
        if field not in ordered_doc and field != '_id':
            ordered_doc[field] = value
    
    return ordered_doc

def migrate_session(db, session_id):
    """
    Migrate a single session record to the enhanced structure
    """
    try:
        session = db.sessions.find_one({'_id': ObjectId(session_id)})
        if not session:
            print(f"Session {session_id} not found")
            return False
        
        print(f"\nMigrating session {session_id} for user {session.get('username', 'unknown')}")
        
        # Get user_id if missing
        if 'user_id' not in session or not session['user_id']:
            username = session.get('username')
            if username:
                user = get_user_by_username(db, username)
                if user:
                    session['user_id'] = str(user['_id'])
                    print(f"  Added user_id: {session['user_id']}")
                else:
                    print(f"  Warning: User {username} not found, setting user_id to None")
                    session['user_id'] = None
        
        # Add shuffle field if missing (default to False for existing sessions)
        if 'shuffle' not in session:
            session['shuffle'] = False
            print("  Added shuffle: False")
        
        # Enhance problems_attempted with missing metadata
        problems_attempted = session.get('problems_attempted', [])
        enhanced_problems = []
        
        print(f"  Enhancing {len(problems_attempted)} problem records...")
        for i, problem in enumerate(problems_attempted):
            enhanced_problem = problem.copy()
            
            # Add correct_answer if missing
            if 'correct_answer' not in enhanced_problem:
                problem_id = enhanced_problem.get('problem_id')
                if problem_id:
                    metadata = get_problem_metadata(db, problem_id)
                    enhanced_problem['correct_answer'] = metadata['correct_answer']
                    
                    # Also add difficulty and topics if missing
                    if 'difficulty' not in enhanced_problem:
                        enhanced_problem['difficulty'] = metadata['difficulty']
                    if 'topics' not in enhanced_problem or not enhanced_problem['topics']:
                        enhanced_problem['topics'] = metadata['topics']
                        
                    print(f"    Problem {i+1}: Added metadata")
            
            enhanced_problems.append(enhanced_problem)
        
        session['problems_attempted'] = enhanced_problems
        
        # Calculate topic_performance and difficulty_performance
        topic_performance, difficulty_performance = calculate_performance_analytics(enhanced_problems)
        session['topic_performance'] = topic_performance
        session['difficulty_performance'] = difficulty_performance
        
        print(f"  Added topic_performance: {len(topic_performance)} topics")
        print(f"  Added difficulty_performance: {len(difficulty_performance)} difficulties")
        
        # Ensure session_status exists
        if 'session_status' not in session:
            session['session_status'] = 'completed'
        
        # Update timestamp
        session['updated_at'] = datetime.now(timezone.utc)
        
        # Create ordered document
        ordered_session = create_ordered_session_document(session)
        
        # Update the session in database
        result = db.sessions.replace_one(
            {'_id': ObjectId(session_id)}, 
            ordered_session
        )
        
        if result.modified_count > 0:
            print(f"  ✅ Successfully migrated session {session_id}")
            return True
        else:
            print(f"  ⚠️  No changes made to session {session_id}")
            return False
            
    except Exception as e:
        print(f"  ❌ Error migrating session {session_id}: {e}")
        return False

def migrate_user_sessions(db, username):
    """
    Migrate all sessions for a specific user
    """
    print(f"\n{'='*60}")
    print(f"MIGRATING SESSIONS FOR USER: {username}")
    print(f"{'='*60}")
    
    sessions = list(db.sessions.find({'username': username}))
    print(f"Found {len(sessions)} sessions for {username}")
    
    if not sessions:
        print(f"No sessions found for user {username}")
        return 0
    
    success_count = 0
    for session in sessions:
        if migrate_session(db, str(session['_id'])):
            success_count += 1
    
    print(f"\n✅ Successfully migrated {success_count}/{len(sessions)} sessions for {username}")
    return success_count

def verify_migration(db, username):
    """
    Verify that the migration was successful
    """
    print(f"\n{'='*60}")
    print(f"VERIFYING MIGRATION FOR USER: {username}")
    print(f"{'='*60}")
    
    sessions = list(db.sessions.find({'username': username}))
    
    required_fields = [
        'session_id', 'session_status', 'created_at', 'completed_at',
        'username', 'user_id', 'year', 'contest', 'mode', 'shuffle',
        'score', 'total_attempted', 'problems_attempted', 
        'performance_metrics', 'topic_performance', 'difficulty_performance'
    ]
    
    for i, session in enumerate(sessions):
        print(f"\nSession {i+1} (ID: {session['_id']}):")
        
        # Check required fields
        missing_fields = []
        for field in required_fields:
            if field not in session:
                missing_fields.append(field)
        
        if missing_fields:
            print(f"  ❌ Missing fields: {missing_fields}")
        else:
            print(f"  ✅ All required fields present")
        
        # Check problems_attempted enhancement
        problems = session.get('problems_attempted', [])
        if problems:
            sample_problem = problems[0]
            if 'correct_answer' in sample_problem and 'difficulty' in sample_problem:
                print(f"  ✅ Problem records enhanced (correct_answer, difficulty)")
            else:
                print(f"  ❌ Problem records not fully enhanced")
        
        # Check performance analytics
        if session.get('topic_performance') and session.get('difficulty_performance'):
            topic_count = len(session['topic_performance'])
            diff_count = len(session['difficulty_performance'])
            print(f"  ✅ Performance analytics: {topic_count} topics, {diff_count} difficulties")
        else:
            print(f"  ❌ Performance analytics missing")

def main():
    """
    Main migration function
    """
    print("REAL USER SESSION MIGRATION SCRIPT")
    print("="*60)
    print("This script will migrate existing session records to the enhanced structure")
    print()
    
    # Connect to database
    print("Connecting to database...")
    db = get_db()
    print("✅ Connected to MongoDB")
    
    # List of users to migrate (add more as needed)
    users_to_migrate = ['goAmy']  # Add other usernames here
    
    total_migrated = 0
    
    for username in users_to_migrate:
        migrated_count = migrate_user_sessions(db, username)
        total_migrated += migrated_count
        
        # Verify migration
        verify_migration(db, username)
    
    print(f"\n{'='*60}")
    print("MIGRATION COMPLETE")
    print(f"{'='*60}")
    print(f"Total sessions migrated: {total_migrated}")
    print()
    
    # Show a sample of the migrated data
    if total_migrated > 0:
        print("Sample of migrated session structure:")
        sample_session = db.sessions.find_one({'username': {'$in': users_to_migrate}})
        if sample_session:
            # Remove _id for cleaner display
            sample_session.pop('_id', None)
            print(json.dumps(sample_session, indent=2, default=str))

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nMigration interrupted by user")
    except Exception as e:
        print(f"\n\nMigration failed: {e}")
        import traceback
        traceback.print_exc()
