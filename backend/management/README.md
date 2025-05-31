# goAIME Management Commands

This directory contains management commands for administrative operations, maintenance, and diagnostics.

## Usage

From the project root, use the management script:

```bash
./manage.sh <command> [options]
```

Or directly run the Python script:

```bash
python backend/manage.py <command> [options]
```

## Available Commands

### Session Commands

Commands for managing user sessions and related data:

```bash
# Standardize session modes (contest -> competition)
./manage.sh session standardize

# Check sessions for a specific user
./manage.sh session check <username>

# Fix user stats based on session data
./manage.sh session fix_stats [--username USERNAME]
```

### Diagnostic Commands

Commands for diagnostics and analysis:

```bash
# Analyze and debug peer metrics
./manage.sh diagnostic peer_metrics

# Check overall database state
./manage.sh diagnostic db_state

# Check detailed stats for a specific user
./manage.sh diagnostic user_stats <username>
```

## Adding New Commands

To add new management commands:

1. Add a new module in `backend/management/commands/`
2. Update the CLI interface in `backend/manage.py`
3. Document the new commands in this README

## Development Notes

- All commands should be idempotent (safe to run multiple times)
- Include proper error handling and reporting
- Add logging for important operations
- Always verify changes after execution
