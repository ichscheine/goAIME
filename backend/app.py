from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
import random
from bson.objectid import ObjectId

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Connect to MongoDB using your actual database
mongo_client = MongoClient("mongodb://localhost:27017")
db = mongo_client["amc10_manual"]
problems_collection = db["problems_with_answer_keys"]
adaptive_collection = db["adaptive_learning"]   # Stores answer key, solution, and similar questions

@app.route("/", methods=["GET"])
def get_problem():
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

    docs = list(problems_collection.find(query))
    if not docs:
        return jsonify({"error": "No more problems available matching the filters", "query": query}), 404

    problem = random.choice(docs)

    # Process answer_choices; if not a list, attempt conversion.
    answer_choices = problem.get("answer_choices", [])
    if not isinstance(answer_choices, list):
        try:
            answer_choices = [f"{label}) {text}" for label, text in answer_choices.items()]
        except Exception as e:
            print(f"Error converting answer_choices: {e}")
            answer_choices = []

    problem_data = {
        "problem_id": str(problem.get("_id")),
        "year": problem.get("year"),
        "contest": problem.get("contest"),
        "problem_number": problem.get("problem_number"),
        "problem_statement": problem.get("problem_statement"),
        "answer_choices": answer_choices,
        "answer_key": problem.get("answer_key")
    }

    if "image" in problem and problem["image"]:
        problem_data["image"] = problem["image"]

    return jsonify(problem_data), 200

@app.route("/adaptive_learning", methods=["GET"])
def get_solution():
    """
    Given year, contest, and problem_number as query params,
    return the solution and follow-up question(s) for that problem.
    The React frontend expects "solution" and "followup" fields in JSON.
    """
    year = request.args.get("year", type=int)
    contest = request.args.get("contest", type=str)
    problem_number = request.args.get("problem_number", type=int)

    doc = adaptive_collection.find_one({"year": year, "contest": contest})
    if not doc:
        return jsonify({"error": "No document found"}), 404

    problems = doc.get("problems", [])
    problem = next((p for p in problems if p.get("number") == problem_number), None)
    if not problem:
        return jsonify({"error": "Problem not found"}), 404

    explanation = problem.get("explanation", "")
    solutions_list = problem.get("solutions", [])
    solutions_text = "\n".join(solutions_list)

    solution_text = explanation
    if solutions_text:
        solution_text += "\n\n" + solutions_text

    followup_questions = problem.get("followUpQuestions", [])
    followup_text = ""
    for fq in followup_questions:
        question_str = fq.get("question", "")
        difficulty_str = fq.get("difficulty", "")
        followup_text += f"- {question_str} (Difficulty: {difficulty_str})\n"

    return jsonify({
        "solution": solution_text.strip(),
        "followup": followup_text.strip()
    }), 200

if __name__ == "__main__":
    app.run(debug=True, port=5001)
