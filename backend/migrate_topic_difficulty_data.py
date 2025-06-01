#!/usr/bin/env python3
"""
Script to migrate and populate topic_performance and difficulty_performance 
fields in sessions by merging data from sessions and problems collections.
Run this from the backend directory.
"""

import pandas as pd
import sys
import os
from collections import defaultdict
import json
from datetime import datetime

# Import the database service
try:
    from services.db_service import get_db, get_db_client
except ImportError:
    print("Error: Could not import database service. Make sure to run this from the backend directory.")
    sys.exit(1)

def extract_sessions_data(db):
    """Extract sessions data with problem attempts"""
    print("Extracting sessions data...")
    
    sessions_cursor = db.sessions.find({}, {
        '_id': 1,
        'session_id': 1,
        'username': 1,
        'problems_attempted': 1,  # Changed from 'problems' to 'problems_attempted'
        'topic_performance': 1,
        'difficulty_performance': 1
    })
    
    sessions_data = []
    for session in sessions_cursor:
        session_id = session.get('_id')
        username = session.get('username')
        problems_attempted = session.get('problems_attempted', [])  # Changed field name
        
        # Check if already has topic/difficulty data
        has_topic_data = bool(session.get('topic_performance'))
        has_difficulty_data = bool(session.get('difficulty_performance'))
        
        for problem in problems_attempted:  # Changed variable name
            # Extract data directly from the problem since it already has difficulty and topics
            sessions_data.append({
                'session_id': session_id,
                'username': username,
                'problem_id': problem.get('problem_id'),
                'correct': problem.get('is_correct', False),  # Changed from 'correct' to 'is_correct'
                'difficulty': problem.get('difficulty'),  # Already available in the problem
                'topics': problem.get('topics', []),  # Already available in the problem
                'has_topic_data': has_topic_data,
                'has_difficulty_data': has_difficulty_data
            })
    
    return pd.DataFrame(sessions_data)

def extract_problems_metadata(db):
    """Extract problems metadata with topics and difficulty"""
    print("Extracting problems metadata...")
    
    problems_cursor = db.problems.find({}, {
        'problem_id': 1,
        'difficulty': 1,
        'topics': 1
    })
    
    problems_data = []
    for problem in problems_cursor:
        problem_id = problem.get('problem_id')
        difficulty = problem.get('difficulty', 'Unknown')
        topics = problem.get('topics', [])
        
        # Handle case where topics might be a string or list
        if isinstance(topics, str):
            topics = [topics]
        elif not isinstance(topics, list):
            topics = []
        
        problems_data.append({
            'problem_id': problem_id,
            'difficulty': difficulty,
            'topics': topics
        })
    
    return pd.DataFrame(problems_data)

def calculate_performance_from_sessions(sessions_df):
    """Calculate performance directly from sessions data (no merge needed)"""
    print("Calculating performance from sessions data...")
    
    session_performance = {}
    
    # Group by session_id to calculate performance metrics
    for session_id, session_group in sessions_df.groupby('session_id'):
        # Skip sessions that already have performance data
        if session_group.iloc[0]['has_topic_data'] and session_group.iloc[0]['has_difficulty_data']:
            print(f"Skipping session {session_id} - already has performance data")
            continue
            
        # Calculate topic performance
        topic_performance = defaultdict(lambda: {'attempted': 0, 'correct': 0, 'accuracy': 0})
        
        for _, row in session_group.iterrows():
            topics = row['topics']
            correct = row['correct']
            
            # Handle multiple topics per problem
            if isinstance(topics, list):
                for topic in topics:
                    if topic:  # Skip empty topics
                        topic_performance[topic]['attempted'] += 1
                        if correct:
                            topic_performance[topic]['correct'] += 1
            elif isinstance(topics, str) and topics:
                topic_performance[topics]['attempted'] += 1
                if correct:
                    topic_performance[topics]['correct'] += 1
        
        # Calculate accuracy for each topic
        for topic in topic_performance:
            attempted = topic_performance[topic]['attempted']
            correct = topic_performance[topic]['correct']
            if attempted > 0:
                topic_performance[topic]['accuracy'] = (correct / attempted) * 100
        
        # Calculate difficulty performance
        difficulty_performance = defaultdict(lambda: {'attempted': 0, 'correct': 0, 'accuracy': 0})
        
        for _, row in session_group.iterrows():
            difficulty = row['difficulty']
            correct = row['correct']
            
            if difficulty:  # Skip empty difficulties
                difficulty_performance[difficulty]['attempted'] += 1
                if correct:
                    difficulty_performance[difficulty]['correct'] += 1
        
        # Calculate accuracy for each difficulty
        for difficulty in difficulty_performance:
            attempted = difficulty_performance[difficulty]['attempted']
            correct = difficulty_performance[difficulty]['correct']
            if attempted > 0:
                difficulty_performance[difficulty]['accuracy'] = (correct / attempted) * 100
        
        session_performance[session_id] = {
            'topic_performance': dict(topic_performance),
            'difficulty_performance': dict(difficulty_performance),
            'username': session_group.iloc[0]['username']
        }
        
        print(f"Calculated performance for session {session_id} (user: {session_group.iloc[0]['username']})")
        print(f"  Topics: {len(topic_performance)}")
        print(f"  Difficulties: {len(difficulty_performance)}")
    
    return session_performance

def update_sessions_in_db(db, session_performance):
    """Update sessions in database with performance data"""
    print(f"Updating {len(session_performance)} sessions in database...")
    
    updated_count = 0
    for session_id, performance in session_performance.items():
        try:
            result = db.sessions.update_one(
                {'_id': session_id},
                {
                    '$set': {
                        'topic_performance': performance['topic_performance'],
                        'difficulty_performance': performance['difficulty_performance']
                    }
                }
            )
            
            if result.modified_count > 0:
                updated_count += 1
                
        except Exception as e:
            print(f"Error updating session {session_id}: {e}")
    
    print(f"Successfully updated {updated_count} sessions")
    return updated_count

def verify_migration(db):
    """Verify the migration was successful"""
    print("\nVerifying migration...")
    
    # Count sessions with topic and difficulty data
    sessions_with_topic = db.sessions.count_documents({'topic_performance': {'$exists': True, '$ne': {}}})
    sessions_with_difficulty = db.sessions.count_documents({'difficulty_performance': {'$exists': True, '$ne': {}}})
    total_sessions = db.sessions.count_documents({})
    
    print(f"Total sessions: {total_sessions}")
    print(f"Sessions with topic performance: {sessions_with_topic}")
    print(f"Sessions with difficulty performance: {sessions_with_difficulty}")
    
    # Show sample data
    sample_session = db.sessions.find_one({
        'topic_performance': {'$exists': True, '$ne': {}},
        'difficulty_performance': {'$exists': True, '$ne': {}}
    })
    
    if sample_session:
        print(f"\nSample session data for {sample_session.get('username', 'unknown')}:")
        print(f"Topics: {list(sample_session.get('topic_performance', {}).keys())}")
        print(f"Difficulties: {list(sample_session.get('difficulty_performance', {}).keys())}")

def main():
    """Main migration function"""
    print("Starting topic and difficulty performance migration...")
    
    # Connect to database
    try:
        db = get_db()
        client = get_db_client()
        
        if db is None:
            print("Failed to connect to database")
            return
            
        print("Successfully connected to database")
            
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return
    
    try:
        # Extract data
        sessions_df = extract_sessions_data(db)
        
        print(f"Found {len(sessions_df)} session-problem records")
        
        if sessions_df.empty:
            print("No session data found to process")
            return
        
        # Calculate performance directly from sessions (no need to merge with problems)
        session_performance = calculate_performance_from_sessions(sessions_df)
        
        if not session_performance:
            print("No sessions need updating")
            return
        
        # Update database
        updated_count = update_sessions_in_db(db, session_performance)
        
        # Verify migration
        verify_migration(db)
        
        print(f"\nMigration completed successfully! Updated {updated_count} sessions.")
        
    except Exception as e:
        print(f"Error during migration: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
