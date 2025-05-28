#!/bin/bash

# Script to verify mode standardization changes
echo "=== Mode Standardization Verification ==="
echo "Checking frontend files for any remaining 'contest' mode references..."

# Check for mode='contest' or mode="contest" in frontend files
grep -r "mode\s*=\s*['\"]contest['\"]" --include="*.js" --include="*.jsx" frontend/src

# Check for mode === 'contest' or mode === "contest" in frontend files
grep -r "mode\s*===\s*['\"]contest['\"]" --include="*.js" --include="*.jsx" frontend/src

echo ""
echo "=== DB Verification ==="
echo "Running database check to verify all sessions use 'competition' mode..."

# Execute the Python script to check database
python3 - << EOF
from backend.services.db_service import get_db

# Get database connection
db = get_db()

# Count sessions with 'contest' mode
contest_count = db.sessions.count_documents({"mode": "contest"})
print(f"Sessions with mode='contest': {contest_count}")

# Count sessions with 'competition' mode
competition_count = db.sessions.count_documents({"mode": "competition"})
print(f"Sessions with mode='competition': {competition_count}")

# List any sessions with 'contest' mode for manual verification
if contest_count > 0:
    print("\nSessions still using 'contest' mode:")
    for session in db.sessions.find({"mode": "contest"}).limit(5):
        print(f"  Session ID: {session.get('_id')} - Created: {session.get('created_at')}")
    if contest_count > 5:
        print(f"  ... and {contest_count - 5} more")
EOF

echo ""
echo "=== Verification Complete ==="
echo "If any instances of 'contest' mode were found, please run the standardize_modes.sh script"
echo "to ensure all modes are properly standardized to 'competition'."
