#!/bin/bash

# Script to clean up auxiliary files after integration
# This script moves files to the experimental_backups directory

# Set the current directory to the project root
cd "$(dirname "$0")"

# Get current date for backup directory
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="experimental_backups/backup_$DATE"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# List of auxiliary files to clean up
AUXILIARY_FILES=(
    "check_goamy_sessions.py"
    "debug_goamy_cohort_metrics.py"
    "fix_db_contest_mode.py"
    "set_keys.py"
    "standardize_session_modes.py"
    "test_cohort_metrics.py"
)

# Move auxiliary files to backup directory
echo "Moving auxiliary files to backup directory: $BACKUP_DIR"
for file in "${AUXILIARY_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  Moving $file"
        mv "$file" "$BACKUP_DIR/"
    else
        echo "  $file not found, skipping"
    fi
done

# Print completion message
echo "Cleanup completed. Files moved to $BACKUP_DIR"
echo "The functionality of these files has been integrated into the management commands."
echo "To access this functionality, use the manage.sh script:"
echo "  ./manage.sh <command> [options]"
echo "For more information, see backend/management/README.md"
