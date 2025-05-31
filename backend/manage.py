#!/usr/bin/env python
"""
Command-line interface for goAIME management commands.

Usage:
    python manage.py <command> [options]

Examples:
    python manage.py session standardize
    python manage.py diagnostic db_state
    python manage.py help
"""

import sys
import os
import argparse

# Add the project root to the Python path to enable imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def setup_session_parser(subparsers):
    """Set up the parser for session commands"""
    session_parser = subparsers.add_parser(
        'session', 
        help='Commands for managing user sessions'
    )
    session_subparsers = session_parser.add_subparsers(dest='session_command')
    
    # Standardize mode command
    standardize_parser = session_subparsers.add_parser(
        'standardize', 
        help='Standardize session modes (contest -> competition)'
    )
    
    # Check sessions command
    check_parser = session_subparsers.add_parser(
        'check', 
        help='Check sessions for a specific user'
    )
    check_parser.add_argument('username', help='Username to check sessions for')
    
    # Fix stats command
    fix_stats_parser = session_subparsers.add_parser(
        'fix_stats', 
        help='Fix user stats based on session data'
    )
    fix_stats_parser.add_argument(
        '--username', 
        help='Username to fix stats for (if omitted, fixes all users)'
    )

def setup_diagnostic_parser(subparsers):
    """Set up the parser for diagnostic commands"""
    diag_parser = subparsers.add_parser(
        'diagnostic', 
        help='Commands for diagnostics and analysis'
    )
    diag_subparsers = diag_parser.add_subparsers(dest='diag_command')
    
    # Peer metrics command
    diag_subparsers.add_parser(
        'peer_metrics', 
        help='Analyze and debug peer metrics'
    )
    
    # Database state command
    diag_subparsers.add_parser(
        'db_state', 
        help='Check overall database state'
    )
    
    # User stats command
    user_stats_parser = diag_subparsers.add_parser(
        'user_stats', 
        help='Check detailed stats for a specific user'
    )
    user_stats_parser.add_argument('username', help='Username to check stats for')

def main():
    """Main entry point for the CLI"""
    parser = argparse.ArgumentParser(description='goAIME Management Commands')
    subparsers = parser.add_subparsers(dest='command')
    
    # Set up command parsers
    setup_session_parser(subparsers)
    setup_diagnostic_parser(subparsers)
    
    # Add help command
    subparsers.add_parser('help', help='Show this help message')
    
    # Parse arguments
    args = parser.parse_args()
    
    # Show help if no command specified
    if args.command is None or args.command == 'help':
        parser.print_help()
        return
    
    # Import the right modules based on command
    if args.command == 'session':
        from management.commands.session_commands import (
            standardize_session_modes,
            check_user_sessions,
            fix_user_stats
        )
        
        if args.session_command == 'standardize':
            standardize_session_modes()
        elif args.session_command == 'check':
            check_user_sessions(args.username)
        elif args.session_command == 'fix_stats':
            fix_user_stats(args.username)
        else:
            parser.parse_args(['session', '--help'])
            
    elif args.command == 'diagnostic':
        from management.commands.diagnostic_commands import (
            debug_peer_metrics,
            debug_database_state,
            check_user_stats
        )
        
        if args.diag_command == 'peer_metrics':
            debug_peer_metrics()
        elif args.diag_command == 'db_state':
            debug_database_state()
        elif args.diag_command == 'user_stats':
            check_user_stats(args.username)
        else:
            parser.parse_args(['diagnostic', '--help'])

if __name__ == '__main__':
    main()
