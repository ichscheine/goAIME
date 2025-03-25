from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
import random
from bson.objectid import ObjectId

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Connect to MongoDB using your actual database
mongo_client = MongoClient("mongodb://localhost:27017")
db = mongo_client["amc10"]
adaptive_collection = db["2022_amc10a"]

def normalize_field(val):
    """
    Recursively convert a value to a string.
    For lists, join the normalized items with newlines.
    For dictionaries, join key-value pairs with a colon.
    """
    if isinstance(val, str):
        return val
    elif isinstance(val, list):
        return "\n\n".join(normalize_field(item) for item in val)
    elif isinstance(val, dict):
        # For a dictionary that represents answer choices (or similar),
        # format each key-value pair as "Key) value"
        return "\n\n".join(f"{k}) {normalize_field(v)}" for k, v in val.items())
    else:
        return str(val)

def normalize_problem(problem):
    """
    Normalize key fields in the problem so that they contain strings (or arrays of strings)
    suitable for the frontend.
    """
    # Normalize problem statement
    if "problem_statement" in problem and not isinstance(problem["problem_statement"], str):
        problem["problem_statement"] = normalize_field(problem["problem_statement"])
    
    # Normalize answer_choices: if it's a dict, convert it to a list of formatted strings;
    # if it's a list, ensure each element is a string.
    if "answer_choices" in problem:
        ac = problem["answer_choices"]
        if isinstance(ac, list):
            problem["answer_choices"] = [normalize_field(item) for item in ac]
        elif isinstance(ac, dict):
            problem["answer_choices"] = [f"{label}) {normalize_field(text)}" for label, text in ac.items()]
        else:
            problem["answer_choices"] = [normalize_field(ac)]
    
    # Normalize detailed_solution: if it's a list of objects, ensure each value is normalized.
    if "detailed_solution" in problem:
        ds = problem["detailed_solution"]
        if isinstance(ds, list):
            normalized_ds = []
            for item in ds:
                if isinstance(item, dict):
                    new_item = {}
                    for k, v in item.items():
                        new_item[k] = normalize_field(v)
                    normalized_ds.append(new_item)
                else:
                    normalized_ds.append(normalize_field(item))
            problem["detailed_solution"] = normalized_ds
        else:
            problem["detailed_solution"] = normalize_field(ds)
    
    # Normalize similar_questions if present.
    if "similar_questions" in problem:
        sq = problem["similar_questions"]
        if isinstance(sq, list):
            normalized_sq = []
            for item in sq:
                if isinstance(item, dict):
                    new_item = {}
                    for k, v in item.items():
                        # For detailed_solution inside similar_questions, handle list/dict accordingly.
                        if k == "detailed_solution":
                            if isinstance(v, list):
                                new_item[k] = [normalize_field(subitem) if not isinstance(subitem, dict)
                                               else {subk: normalize_field(subval) for subk, subval in subitem.items()}
                                               for subitem in v]
                            else:
                                new_item[k] = normalize_field(v)
                        else:
                            new_item[k] = normalize_field(v)
                    normalized_sq.append(new_item)
                else:
                    normalized_sq.append(normalize_field(item))
            problem["similar_questions"] = normalized_sq
        else:
            problem["similar_questions"] = normalize_field(sq)
    
    return problem

@app.route("/", methods=["GET"])
def get_problem():
    """
    Retrieve a problem from the collection along with its details.
    Supports dynamic filters (year, contest) and an "exclude" list.
    Always returns JSON data.
    """
    # Retrieve dynamic filters from query parameters
    year = request.args.get("year")
    contest = request.args.get("contest")
    query = {}
    if year:
        try:
            query["year"] = int(year)
        except ValueError:
            query["year"] = year
    if contest:
        query["contest"] = contest

    # Process the "exclude" parameter to avoid repeating problems.
    exclude_param = request.args.get("exclude", "")
    exclude_ids = []
    if exclude_param:
        try:
            exclude_ids = [ObjectId(id_str) for id_str in exclude_param.split(",") if id_str]
        except Exception as e:
            print("Error processing exclude list:", e)
    if exclude_ids:
        query["_id"] = {"$nin": exclude_ids}

    # Get the total count of documents matching the filters (ignoring exclusion)
    base_query = {k: v for k, v in query.items() if k != "_id"}
    total_count = adaptive_collection.count_documents(base_query)

    # Retrieve documents from the database based on query (with exclusion)
    docs = list(adaptive_collection.find(query))
    if not docs:
        if exclude_ids and len(exclude_ids) >= total_count:
            return jsonify({
                "error": "All problems have been used. Please restart the session.",
                "total": total_count
            }), 404
        else:
            return jsonify({
                "error": "No more problems available matching the filters",
                "query": query
            }), 404

    problem = random.choice(docs)
    
    # Normalize the problem document before sending
    problem = normalize_problem(problem)
    
    # Build problem_data including all necessary fields
    problem_data = {
        "problem_id": str(problem.get("_id")),
        "year": problem.get("year"),
        "contest": problem.get("contest"),
        "problem_number": problem.get("problem_number"),
        "problem_statement": problem.get("problem_statement"),
        "image": problem.get("image", None),
        "answer_choices": problem.get("answer_choices"),
        "answer_key": problem.get("answer_key"),
        "detailed_solution": problem.get("detailed_solution", ""),
        "similar_questions": problem.get("similar_questions", [])
    }

    return jsonify(problem_data), 200

if __name__ == "__main__":
    app.run(debug=True, port=5001)
