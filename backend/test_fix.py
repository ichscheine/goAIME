#!/usr/bin/env python3

from services.db_service import get_db
from services.problem_service import get_all_problems

def main():
    # Test the modified get_all_problems function
    filters = {
        'contest_id': 'AMC10A_2022',
        'problem_number': 1
    }
    
    print(f"Testing get_all_problems with filters: {filters}")
    problems, total = get_all_problems(filters=filters)
    print(f"Results: {len(problems)} problems, {total} total")
    
    if problems:
        print("First problem keys:", list(problems[0].keys()))
        print("Has solution:", 'solution' in problems[0])

if __name__ == '__main__':
    main()
