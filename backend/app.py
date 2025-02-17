import os
from flask import Flask, request, jsonify
from pymongo import MongoClient
from bson.objectid import ObjectId

app = Flask(__name__)

# Connect to MongoDB
mongo_client = MongoClient("mongodb://localhost:27017")
db = mongo_client['amc10_manual']
adaptive_collection = db['adaptive_learning']
problem_collection = db['problems_with_answer_keys']

# (Other endpoints for serving problems already exist here.)

@app.route('/', methods=['GET'])
def get_problem():
    # Example endpoint: this should return a problem document
    year = request.args.get('year')
    contest = request.args.get('contest')
    exclude = request.args.get('exclude', '')
    exclude_ids = exclude.split(",") if exclude else []
    
    query = {
        "year": year,
        "contest": contest,
        "problem_id": {"$nin": exclude_ids}
    }
    problem = problem_collection.find_one(query)
    if problem:
        # Convert ObjectId to string if needed
        problem['_id'] = str(problem['_id'])
        # Ensure the problem has a unique identifier field "problem_id"
        return jsonify(problem)
    else:
        return jsonify({"error": "No problem found."}), 404

@app.route('/get_adaptive_details', methods=['GET'])
def get_adaptive_details():
    """
    Given a problem_id, return the adaptive details from the adaptive_learning collection,
    including the detailed solution and similar questions.
    """
    problem_id = request.args.get("problem_id")
    if not problem_id:
        return jsonify({"error": "Missing problem_id parameter."}), 400

    # Query using the provided problem_id.
    adaptive_doc = adaptive_collection.find_one({"problem_id": problem_id})
    if adaptive_doc:
        adaptive_doc['_id'] = str(adaptive_doc['_id'])
        # Return only the adaptive fields along with the basic problem info
        result = {
            "problem_id": adaptive_doc.get("problem_id"),
            "year": adaptive_doc.get("year"),
            "contest": adaptive_doc.get("contest"),
            "problem_number": adaptive_doc.get("problem_number"),
            "problem_statement": adaptive_doc.get("problem_statement"),
            "detailed_solution": adaptive_doc.get("detailed_solution"),
            "similar_questions": adaptive_doc.get("similar_questions")
        }
        return jsonify(result)
    else:
        return jsonify({"error": "Adaptive details not found for problem_id " + problem_id}), 404

if __name__ == '__main__':
    app.run(port=5001, debug=True)
