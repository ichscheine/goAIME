from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
import random

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Connect to MongoDB
mongo_client = MongoClient("mongodb://localhost:27017")
db = mongo_client["amc10_manual"]
problems_collection = db["problems_with_answer_keys"]
adaptive_collection = db["adaptive_learning"]  # Stores answer key, solution, and similar questions

@app.route("/", methods=["GET"])
def get_problem():
    # Using hard-coded filters for 2022 AMC 10A; update if needed.
    docs = list(problems_collection.find({"year": 2022, "contest": "AMC 10A"}))
    if not docs:
        return jsonify({"error": "No problems found for 2022 AMC 10A"}), 404

    problem = random.choice(docs)

    # Retrieve answer_choices from the document.
    answer_choices = problem.get("answer_choices", [])
    
    # If answer_choices is not a list, try to convert it (assuming it might be a dict).
    if not isinstance(answer_choices, list):
        try:
            answer_choices = [f"{label}) {text}" for label, text in answer_choices.items()]
        except Exception as e:
            print(f"Error converting answer_choices: {e}")
            answer_choices = []

    problem_data = {
        "year": problem.get("year"),
        "contest": problem.get("contest"),
        "problem_number": problem.get("problem_number"),
        "problem_statement": problem.get("problem_statement"),
        "answer_choices": answer_choices,
        "answer_key": problem.get("answer_key")  # Added answer_key for checking the answer in the frontend.
    }

    # Include image data if available
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

    # Combine explanation + solutions into one text block
    explanation = problem.get("explanation", "")
    solutions_list = problem.get("solutions", [])
    solutions_text = "\n".join(solutions_list)

    solution_text = explanation
    if solutions_text:
        solution_text += "\n\n" + solutions_text

    # Combine followUpQuestions into a single block of text
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
