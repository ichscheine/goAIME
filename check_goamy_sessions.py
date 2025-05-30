from backend.services.db_service import get_db

# Get database connection
db = get_db()

# Get goAmy's sessions
sessions = list(db.sessions.find({'username': 'goAmy'}))
print(f'Found {len(sessions)} sessions')

# Print details of each session
for idx, session in enumerate(sessions):
    print(f"Session {idx+1}:")
    print(f"  Score: {session.get('score')}")
    print(f"  Attempted: {session.get('total_attempted')}")
    print(f"  Performance metrics: {session.get('performance_metrics')}")
    print()
