#!/usr/bin/env python
"""
Migration script to fix existing sessions with old performance metrics structure
and ensure topic_metrics and difficulty_metrics are populated.
"""
import sys
sys.path.append('/Users/daoming/Documents/Github/goAIME')

from backend.services.db_service import get_db, enhance_session_data
from datetime import datetime, timezone
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate_existing_sessions():
    """Migrate existing sessions to new performance metrics structure"""
    db = get_db()
    
    # Find sessions with old performance metrics structure
    old_sessions = list(db.sessions.find({
        "$or": [
            {"performance_metrics.totals": {"$exists": True}},
            {"performance_metrics.averages": {"$exists": True}},
            {"performance_metrics.topic_performance": {"$exists": True}},
            {"performance_metrics.difficulty_performance": {"$exists": True}},
            {"performance_metrics.topic_metrics": {"$exists": False}},
            {"performance_metrics.difficulty_metrics": {"$exists": False}}
        ]
    }))
    
    logger.info(f"Found {len(old_sessions)} sessions that need migration")
    
    successful_migrations = 0
    failed_migrations = 0
    
    for session in old_sessions:
        try:
            logger.info(f"Migrating session {session.get('session_id')} for user {session.get('username')}")
            
            # Use enhance_session_data to rebuild the session with proper structure
            enhanced_data = enhance_session_data(session)
            
            # Update the session in database
            result = db.sessions.update_one(
                {'_id': session['_id']},
                {
                    '$set': {
                        **enhanced_data,
                        'migrated_at': datetime.now(timezone.utc),
                        'migration_version': '2.0'
                    }
                }
            )
            
            if result.modified_count > 0:
                successful_migrations += 1
                logger.info(f"Successfully migrated session {session.get('session_id')}")
                
                # Log the metrics that were created
                perf_metrics = enhanced_data.get('performance_metrics', {})
                topic_metrics = perf_metrics.get('topic_metrics', {})
                difficulty_metrics = perf_metrics.get('difficulty_metrics', {})
                logger.info(f"  - Topic metrics: {len(topic_metrics)} topics")
                logger.info(f"  - Difficulty metrics: {len(difficulty_metrics)} difficulties")
            else:
                failed_migrations += 1
                logger.warning(f"Failed to migrate session {session.get('session_id')}")
                
        except Exception as e:
            failed_migrations += 1
            logger.error(f"Error migrating session {session.get('session_id')}: {str(e)}")
    
    logger.info(f"Migration completed: {successful_migrations} successful, {failed_migrations} failed")
    return successful_migrations, failed_migrations

def verify_migration():
    """Verify that migration was successful"""
    db = get_db()
    
    # Check goAmy sessions specifically
    goamy_sessions = list(db.sessions.find({"username": "goAmy"}).limit(3))
    
    print("=== Post-Migration Verification ===")
    for i, session in enumerate(goamy_sessions, 1):
        print(f"\n--- Session {i} ---")
        print(f"Session ID: {session.get('session_id')}")
        print(f"Username: {session.get('username')}")
        print(f"User ID: {session.get('user_id')}")
        
        perf_metrics = session.get('performance_metrics', {})
        topic_metrics = perf_metrics.get('topic_metrics', {})
        difficulty_metrics = perf_metrics.get('difficulty_metrics', {})
        
        print(f"Performance metrics keys: {list(perf_metrics.keys())}")
        print(f"Topic metrics: {len(topic_metrics)} topics")
        print(f"Difficulty metrics: {len(difficulty_metrics)} difficulties")
        
        if topic_metrics:
            print(f"Sample topics: {list(topic_metrics.keys())[:5]}")
        if difficulty_metrics:
            print(f"Difficulties: {list(difficulty_metrics.keys())}")

if __name__ == "__main__":
    print("Starting migration of existing sessions...")
    successful, failed = migrate_existing_sessions()
    print(f"\nMigration results: {successful} successful, {failed} failed")
    
    print("\nVerifying migration...")
    verify_migration()
