#!/usr/bin/env python3

from services.db_service import get_db

def main():
    db = get_db()
    
    # Check if any documents have published field
    published_docs = db.problems.count_documents({'published': {'$exists': True}})
    total_docs = db.problems.count_documents({})
    print(f'Documents with published field: {published_docs}')
    print(f'Total documents: {total_docs}')
    
    # Check what happens when we query without the published filter
    result_with_published = list(db.problems.find({'contest_id': 'AMC10A_2022', 'problem_number': 1, 'published': True}))
    result_without_published = list(db.problems.find({'contest_id': 'AMC10A_2022', 'problem_number': 1}))
    
    print(f'Results with published=True filter: {len(result_with_published)}')
    print(f'Results without published filter: {len(result_without_published)}')
    
    if result_without_published:
        print('Sample document fields:', list(result_without_published[0].keys()))

if __name__ == '__main__':
    main()
