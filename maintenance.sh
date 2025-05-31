#!/bin/bash

# Maintenance script for once-off maintenance tasks
# This script handles database fixes and other maintenance operations

# Set the current directory to the project root
cd "$(dirname "$0")"

# Check if the goAIME conda environment exists and activate it
if conda info --envs | grep -q "goAIME"; then
    echo "Activating goAIME conda environment..."
    source "$(conda info --base)/etc/profile.d/conda.sh"
    conda activate goAIME
else
    echo "Warning: goAIME conda environment not found. Using base environment."
fi

# Function to standardize modes
standardize_modes() {
    echo "Standardizing session modes (contest -> competition)..."
    python backend/manage.py session standardize
}

# Function to fix user stats
fix_user_stats() {
    if [ -z "$1" ]; then
        echo "Fixing stats for all users..."
        python backend/manage.py session fix_stats
    else
        echo "Fixing stats for user: $1..."
        python backend/manage.py session fix_stats --username "$1"
    fi
}

# Function to check database state
check_db_state() {
    echo "Checking database state..."
    python backend/manage.py diagnostic db_state
}

# Process command line arguments
if [ $# -eq 0 ]; then
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Available commands:"
    echo "  standardize-modes    - Standardize session modes (contest -> competition)"
    echo "  fix-stats [username] - Fix user stats for all users or a specific user"
    echo "  check-db             - Check database state"
    echo "  run-all              - Run all maintenance tasks"
    exit 1
fi

command="$1"
shift

case "$command" in
    standardize-modes)
        standardize_modes
        ;;
    fix-stats)
        fix_user_stats "$1"
        ;;
    check-db)
        check_db_state
        ;;
    run-all)
        echo "Running all maintenance tasks..."
        standardize_modes
        fix_user_stats
        check_db_state
        echo "All maintenance tasks completed."
        ;;
    *)
        echo "Unknown command: $command"
        echo "Run '$0' without arguments to see available commands."
        exit 1
        ;;
esac
