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
adaptive_collection = db["s2_add_images"]

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

    # Process answer_choices; if not already a list, convert from dictionary to a list of strings.
    answer_choices = problem.get("answer_choices", [])
    if not isinstance(answer_choices, list):
        try:
            answer_choices = [f"{label}) {text}" for label, text in problem.get("answer_choices", {}).items()]
        except Exception as e:
            print(f"Error converting answer_choices: {e}")
            answer_choices = []

    # Build problem_data including all necessary fields
    problem_data = {
        "problem_id": str(problem.get("_id")),
        "year": problem.get("year"),
        "contest": problem.get("contest"),
        "problem_number": problem.get("problem_number"),
        "problem_statement": problem.get("problem_statement"),
        "image": problem.get("image", None),
        "answer_choices": answer_choices,
        "answer_key": problem.get("answer_key"),
        "detailed_solution": problem.get("detailed_solution", ""),
        "similar_questions": problem.get("similar_questions", {})
    }

    return jsonify(problem_data), 200

if __name__ == "__main__":
    app.run(debug=True, port=5001)
