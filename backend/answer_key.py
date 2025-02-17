import os
from pymongo import MongoClient

# Connect to MongoDB and define collections
mongo_client = MongoClient("mongodb://localhost:27017")
db = mongo_client['amc10_manual']
problem_collection = db['problems']                    # Original problems collection
answer_key_collection = db['problems_with_answer_keys']  # New collection for enriched documents

def get_static_answer_key(year, contest, problem_number, static_answers):
    """
    Look up the answer key from the provided static_answers dictionary.
    Convert year and problem_number to integers to ensure matching.
    The dictionary should map (year, contest, problem_number) to a letter.
    """
    try:
        # Convert year and problem_number from strings to integers
        year_int = int(year)
        pnum_int = int(problem_number)
    except (ValueError, TypeError):
        print(f"Could not convert year ({year}) or problem_number ({problem_number}) to int.")
        return None

    key = (year_int, contest.strip(), pnum_int)
    return static_answers.get(key)

def save_answer_key_data(original_problem, answer_key):
    """
    Copy all fields from the original problem document and add an 'answer_key' field.
    Save the enriched document into the problems_with_answer_keys collection.
    """
    new_doc = original_problem.copy()
    new_doc["answer_key"] = answer_key
    result = answer_key_collection.insert_one(new_doc)
    print(f"Saved document with ID: {result.inserted_id}")
    return str(result.inserted_id)

def generate_answer_keys_for_all(static_answers=None):
    """
    For every document in the 'problems' collection, look up the answer key using the
    provided static_answers dictionary. If a key exists, save a copy of the document
    with the appended answer key into the problems_with_answer_keys collection.
    
    :param static_answers: A dictionary mapping (year, contest, problem_number) to a letter.
                           For example: {(2022, "AMC 10A", 1): "D", ...}
    """
    if static_answers is None:
        static_answers = {}
    count = 0
    problems = problem_collection.find({})
    for prob in problems:
        # Ensure required fields exist
        if not (prob.get("year") and prob.get("contest") and 
                prob.get("problem_number") and prob.get("problem_statement")):
            print(f"Skipping document {prob.get('_id')} due to missing required fields.")
            continue

        # Check if this document has already been processed
        existing = answer_key_collection.find_one({
            "year": prob.get("year"),
            "contest": prob.get("contest"),
            "problem_number": prob.get("problem_number")
        })
        if existing:
            print(f"Answer key already exists for problem {prob.get('problem_number')} "
                  f"({prob.get('year')} {prob.get('contest')}). Skipping.")
            continue

        year = prob.get("year")
        contest = prob.get("contest")
        pnum = prob.get("problem_number")

        static_key = get_static_answer_key(year, contest, pnum, static_answers)
        if static_key:
            answer_key = static_key
            print(f"Using static key for {year} {contest}, Problem {pnum}: {answer_key}")
        else:
            print(f"No static key found for {year} {contest}, Problem {pnum}. Skipping document.")
            continue

        save_answer_key_data(prob, answer_key)
        count += 1
    print(f"Processed {count} documents into problems_with_answer_keys.")

if __name__ == "__main__":
    # Supply your static answer keys here.
    USER_STATIC_ANSWERS = {
        (2022, "AMC 10A", 1): "D",
        (2022, "AMC 10A", 2): "B",
        (2022, "AMC 10A", 3): "E",
        (2022, "AMC 10A", 4): "E",
        (2022, "AMC 10A", 5): "C",
        (2022, "AMC 10A", 6): "A",
        (2022, "AMC 10A", 7): "B",
        (2022, "AMC 10A", 8): "D",
        (2022, "AMC 10A", 9): "D",
        (2022, "AMC 10A", 10): "E",
        (2022, "AMC 10A", 11): "C",
        (2022, "AMC 10A", 12): "A",
        (2022, "AMC 10A", 13): "E",
        (2022, "AMC 10A", 14): "E",
        (2022, "AMC 10A", 15): "D",
        (2022, "AMC 10A", 16): "B",
        (2022, "AMC 10A", 17): "D",
        (2022, "AMC 10A", 18): "A",
        (2022, "AMC 10A", 19): "C",
        (2022, "AMC 10A", 20): "E",
        (2022, "AMC 10A", 21): "B",
        (2022, "AMC 10A", 22): "D",
        (2022, "AMC 10A", 23): "B",
        (2022, "AMC 10A", 24): "E",
        (2022, "AMC 10A", 25): "B"
    }
    generate_answer_keys_for_all(static_answers=USER_STATIC_ANSWERS)
