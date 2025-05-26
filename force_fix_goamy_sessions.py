#!/usr/bin/env python
"""
Fixed migration script to properly update goAmy's session with correct field order
and add missing topic_performance and difficulty_performance fields.

This fixes issues observed in the screenshot where the actual user sessions
weren't properly migrated despite verification reports indicating success.
"""

import sys
import os
sys.path.append('./backend')

from services.db_service import get_db
from bson import ObjectId
import pymongo
from datetime import datetime, timezone
import json
from pprint import pprint

# Ensure we log at each step for clarity
def log(message):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")

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
            log(f"  Warning: Problem {problem_id} not found in database")
            return {
                'correct_answer': None,
                'difficulty': 'medium',  # lowercase for consistency
                'topics': []
            }
    except Exception as e:
        log(f"  Error fetching problem {problem_id}: {e}")
        return {
            'correct_answer': None,
            'difficulty': 'medium',  # lowercase for consistency
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
        difficulty = problem.get('difficulty', 'medium').lower()  # normalize to lowercase
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
    Create a properly ordered session document according to the required field order
    """
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

def force_migrate_session_for_user(db, username, session_id=None):
    """
    Force migrate a session for the specified user, fixing all issues
    including proper field order and missing analytics fields
    """
    log(f"Force migrating sessions for {username}")
    
    # Find sessions (specific one or all)
    if session_id:
        query = {'username': username, '_id': ObjectId(session_id)}
    else:
        query = {'username': username}
    
    sessions = list(db.sessions.find(query))
    log(f"Found {len(sessions)} sessions to migrate")
    
    # Process each session
    successful = 0
    for session in sessions:
        session_id = str(session['_id'])
        log(f"\nProcessing session {session_id}")
        
        # STEP 1: Enhance problems_attempted with metadata
        log("Step 1: Enhancing problem attempts with metadata")
        problems_attempted = session.get('problems_attempted', [])
        enhanced_problems = []
        
        for problem in problems_attempted:
            problem_copy = problem.copy()
            
            # Get problem ID
            problem_id = problem_copy.get('problem_id')
            
            # Add metadata if available
            if problem_id:
                metadata = get_problem_metadata(db, problem_id)
                
                if 'correct_answer' not in problem_copy:
                    problem_copy['correct_answer'] = metadata['correct_answer']
                
                if 'difficulty' not in problem_copy:
                    problem_copy['difficulty'] = metadata['difficulty']
                
                if 'topics' not in problem_copy or not problem_copy['topics']:
                    problem_copy['topics'] = metadata['topics']
            
            # Ensure is_correct is a boolean
            if 'is_correct' in problem_copy:
                problem_copy['is_correct'] = bool(problem_copy['is_correct'])
            
            enhanced_problems.append(problem_copy)
        
        # Update with enhanced problems
        session['problems_attempted'] = enhanced_problems
        
        # STEP 2: Add user_id if missing
        log("Step 2: Ensuring user_id is present")
        if 'user_id' not in session or not session['user_id']:
            user = db.users.find_one({'username': username})
            if user:
                session['user_id'] = str(user['_id'])
                log(f"  Added user_id: {session['user_id']}")
            else:
                log("  Creating user since none exists")
                user_doc = {
                    'username': username,
                    'email': f"{username}@example.com",
                    'created_at': datetime.now(timezone.utc),
                    'is_active': True
                }
                result = db.users.insert_one(user_doc)
                session['user_id'] = str(result.inserted_id)
                log(f"  Created user with ID: {session['user_id']}")
        
        # STEP 3: Add required fields if missing
        log("Step 3: Adding missing required fields")
        
        # Add session_status if missing
        if 'session_status' not in session:
            session['session_status'] = 'completed'
            log("  Added session_status: completed")
        
        # Add shuffle if missing
        if 'shuffle' not in session:
            session['shuffle'] = False
            log("  Added shuffle: False")
        
        # Add total_attempted if only attempted exists
        if 'attempted' in session and 'total_attempted' not in session:
            session['total_attempted'] = session['attempted']
            log(f"  Renamed attempted to total_attempted: {session['total_attempted']}")
        
        # Store total_time_ms if needed for performance_metrics calculation
        if 'total_time_ms' not in session and 'totalTime' in session:
            session['total_time_ms'] = session['totalTime']
            log(f"  Stored totalTime for metrics calculation: {session['total_time_ms']}")
        
        # Calculate total_time_minutes for performance_metrics
        if 'total_time_ms' in session and 'total_time_minutes' not in session:
            session['total_time_minutes'] = round(session['total_time_ms'] / 60000, 2) 
            log(f"  Calculated total_time_minutes for metrics: {session['total_time_minutes']}")
        
        # STEP 4: Generate performance metrics if missing
        log("Step 4: Generating performance metrics")
        if 'performance_metrics' not in session:
            correct_problems = [p for p in enhanced_problems if p.get('is_correct', False)]
            incorrect_problems = [p for p in enhanced_problems if not p.get('is_correct', False)]
            
            time_values = [p.get('time_spent_ms', 0) for p in enhanced_problems if p.get('time_spent_ms', 0) > 0]
            average_time = sum(time_values) / len(time_values) if time_values else 0
            
            correct_times = [p.get('time_spent_ms', 0) for p in correct_problems if p.get('time_spent_ms', 0) > 0]
            incorrect_times = [p.get('time_spent_ms', 0) for p in incorrect_problems if p.get('time_spent_ms', 0) > 0]
            
            # Get total_time_minutes from existing field or calculate it
            total_time_minutes = None
            if 'total_time_minutes' in session:
                total_time_minutes = session.pop('total_time_minutes')
            elif 'total_time_ms' in session:
                total_time_minutes = round(session.get('total_time_ms', 0) / 60000, 2)
            
            session['performance_metrics'] = {
                'total_attempted': len(enhanced_problems),
                'total_correct': len(correct_problems),
                'total_incorrect': len(incorrect_problems),
                'accuracy_percentage': round((len(correct_problems) / len(enhanced_problems)) * 100, 2) if enhanced_problems else 0,
                'average_time_per_problem_ms': round(average_time, 2),
                'average_time_correct_problems_ms': round(sum(correct_times) / len(correct_times), 2) if correct_times else 0,
                'average_time_incorrect_problems_ms': round(sum(incorrect_times) / len(incorrect_times), 2) if incorrect_times else 0,
                'fastest_correct_time_ms': min(correct_times) if correct_times else None,
                'slowest_correct_time_ms': max(correct_times) if correct_times else None,
                'total_time_minutes': total_time_minutes
            }
            log("  Added performance_metrics")
        
        # STEP 5: Generate topic and difficulty performance analytics
        log("Step 5: Generating topic and difficulty performance analytics")
        topic_performance, difficulty_performance = calculate_performance_analytics(enhanced_problems)
        
        session['topic_performance'] = topic_performance
        log(f"  Added topic_performance: {len(topic_performance)} topics")
        
        session['difficulty_performance'] = difficulty_performance
        log(f"  Added difficulty_performance: {len(difficulty_performance)} difficulties")
        
        # STEP 6: Fix field structure
        log("Step 6: Fixing field structure and removing redundant fields")
        # Move total_time_minutes to performance_metrics if it's at the top level
        if 'total_time_minutes' in session:
            time_minutes = session.pop('total_time_minutes')
            if 'performance_metrics' in session and isinstance(session['performance_metrics'], dict):
                session['performance_metrics']['total_time_minutes'] = time_minutes
                log(f"  Moved total_time_minutes ({time_minutes}) to performance_metrics")
            else:
                log("  Cannot move total_time_minutes - performance_metrics not available")
        
        # Remove redundant fields that aren't needed in final document
        redundant_fields = ['total_time_ms', 'total_time_seconds', 'updated_at']
        for field in redundant_fields:
            if field in session:
                session.pop(field)
                log(f"  Removed redundant field: {field}")
        
        # STEP 7: Create ordered document and update database
        log("Step 7: Creating ordered document and updating database")
        ordered_session = create_ordered_session_document(session)
        
        # Print first few fields to check ordering
        log("  First 10 fields in order:")
        for i, (key, value) in enumerate(ordered_session.items()):
            if i < 10:
                log(f"    {i+1}. {key}")
        
        # Update the session in database
        result = db.sessions.replace_one(
            {'_id': ObjectId(session_id)}, 
            ordered_session
        )
        
        if result.modified_count > 0:
            log(f"  ✅ Successfully updated session {session_id}")
            successful += 1
        else:
            log(f"  ⚠️ No changes made to session {session_id}")
    
    log(f"\nSuccessfully migrated {successful}/{len(sessions)} sessions")
    return successful

def verify_migration(db, username):
    """
    Verify that the migration was successful by checking
    for required fields and proper ordering
    """
    log(f"\n{'='*70}")
    log(f"VERIFYING MIGRATION FOR {username}")
    log(f"{'='*70}")
    
    sessions = list(db.sessions.find({'username': username}))
    log(f"Found {len(sessions)} sessions to verify")
    
    # Define required fields
    required_fields = [
        'session_id', 'session_status', 'created_at', 'completed_at', 
        'username', 'user_id', 'year', 'contest', 'mode', 'shuffle',
        'score', 'total_attempted', 'problems_attempted', 
        'performance_metrics', 'topic_performance', 'difficulty_performance'
    ]
    
    all_sessions_passed = True
    
    for session in sessions:
        session_id = str(session['_id'])
        log(f"\nVerifying session {session_id}")
        
        # Check for missing fields
        missing_fields = [field for field in required_fields if field not in session]
        if missing_fields:
            log(f"  ❌ Missing fields: {missing_fields}")
            all_sessions_passed = False
        else:
            log("  ✅ All required fields present")
        
        # Check field ordering
        actual_fields = list(session.keys())
        if '_id' in actual_fields:
            actual_fields.remove('_id')
        
        order_correct = True
        for i, required_field in enumerate(required_fields):
            if i >= len(actual_fields) or actual_fields[i] != required_field:
                if required_field in actual_fields:
                    log(f"  ❌ Field '{required_field}' out of order (expected pos {i}, found at {actual_fields.index(required_field)})")
                    order_correct = False
                
        if order_correct:
            log("  ✅ Field ordering is correct")
        else:
            log("  ❌ Field ordering is incorrect")
            all_sessions_passed = False
        
        # Check topic_performance
        if 'topic_performance' in session:
            topics = session['topic_performance']
            if topics and len(topics) > 0:
                log(f"  ✅ topic_performance present with {len(topics)} topics")
                
                # Sample topic to verify structure
                sample_topic = next(iter(topics.items()))
                if 'attempted' in sample_topic[1] and 'correct' in sample_topic[1] and 'accuracy' in sample_topic[1]:
                    log("  ✅ topic_performance has correct structure")
                else:
                    log("  ❌ topic_performance has incorrect structure")
                    all_sessions_passed = False
            else:
                log("  ❌ topic_performance is empty")
                all_sessions_passed = False
        else:
            log("  ❌ topic_performance is missing")
            all_sessions_passed = False
        
        # Check difficulty_performance
        if 'difficulty_performance' in session:
            difficulties = session['difficulty_performance']
            if difficulties and len(difficulties) > 0:
                log(f"  ✅ difficulty_performance present with {len(difficulties)} difficulties")
                
                # Sample difficulty to verify structure
                sample_diff = next(iter(difficulties.items()))
                if 'attempted' in sample_diff[1] and 'correct' in sample_diff[1] and 'accuracy' in sample_diff[1]:
                    log("  ✅ difficulty_performance has correct structure")
                else:
                    log("  ❌ difficulty_performance has incorrect structure")
                    all_sessions_passed = False
            else:
                log("  ❌ difficulty_performance is empty")
                all_sessions_passed = False
        else:
            log("  ❌ difficulty_performance is missing")
            all_sessions_passed = False
    
    # Print overall result
    log(f"\n{'='*70}")
    if all_sessions_passed:
        log(f"✅ MIGRATION SUCCESSFUL: All sessions for {username} are properly migrated")
    else:
        log(f"❌ MIGRATION INCOMPLETE: Some issues remain with {username}'s sessions")
    log(f"{'='*70}")
    
    return all_sessions_passed

def main():
    """
    Main migration function
    """
    log("FIXED REAL USER SESSION MIGRATION")
    log("="*70)
    
    # Connect to database
    log("Connecting to database...")
    db = get_db()
    log("✅ Connected to MongoDB")
    
    # Target user
    username = "goAmy"
    log(f"Target user: {username}")
    
    # Force migrate the sessions
    success_count = force_migrate_session_for_user(db, username)
    
    # Verify the migration
    migration_success = verify_migration(db, username)
    
    # Final output
    log("\nMIGRATION SUMMARY:")
    log(f"  Sessions updated: {success_count}")
    log(f"  Migration status: {'✅ SUCCESS' if migration_success else '❌ FAILED'}")
    
    if migration_success:
        log("\n🎉 MIGRATION COMPLETE!")
        
        # Print a sample of the migrated data
        log("\nSample of migrated session structure:")
        sample_session = db.sessions.find_one({'username': username})
        if sample_session:
            # Remove _id for cleaner display
            sample_id = sample_session.pop('_id', None)
            
            # Print basic info
            log(f"Session ID: {sample_id}")
            log(f"Fields: {list(sample_session.keys())[:15]}...")
            log(f"Topic performance: {len(sample_session.get('topic_performance', {}))} topics")
            log(f"Difficulty performance: {len(sample_session.get('difficulty_performance', {}))} difficulties")
    else:
        log("\n❌ MIGRATION FAILED - Manual intervention required")

if __name__ == "__main__":
    main()
