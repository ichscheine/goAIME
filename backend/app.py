import random
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient

app = Flask(__name__)
CORS(app)

# Update your MongoDB connection info as needed
client = MongoClient("mongodb://localhost:27017/")
db = client["amc10_manual"]
collection = db["problems"]

@app.route("/", methods=["GET"])
def get_problem():
    """
    1. Fetch the single document for year=2022, contest="AMC 10A".
    2. Pick one random problem from its "problems" array.
    3. Return that problem in a structure that the React frontend expects,
       including any embedded image data if present.
    """
    # Fetch the single document
    doc = collection.find_one({"year": 2022, "contest": "AMC 10A"})
    if not doc:
        return jsonify({"error": "No document found"}), 404

    # Extract problems
    problems = doc.get("problems", [])
    if not problems:
        return jsonify({"error": "No problems found"}), 404

    # Pick a random problem
    problem = random.choice(problems)

    # Build the response object
    problem_data = {
        "year": doc["year"],
        "contest": doc["contest"],
        "problem_number": problem["number"],
        # The frontend expects "problem_statement"
        "problem_statement": problem["question"],
        # Convert choices dict into a list of "A) choice text", etc.
        "answer_choices": [
            f"{label}) {text}"
            for label, text in problem.get("choices", {}).items()
        ]
    }

    # If the problem has an "image" field, include it.
    # This should be exactly how it's stored in the DB: 
    # e.g. problem["image"] = { "mimeType": "image/png", "base64": "..."}
    if "image" in problem:
        problem_data["image"] = problem["image"]

    # Return JSON
    return jsonify(problem_data), 200



# @app.route("/adaptive_learning", methods=["GET"])
# def get_solution():
#     """
#     Given year, contest, and problem_number as query params,
#     return the solution and follow-up question(s) for that problem.
#     The React frontend expects "solution" and "followup" fields in JSON.
#     """
#     year = request.args.get("year", type=int)
#     contest = request.args.get("contest", type=str)
#     problem_number = request.args.get("problem_number", type=int)

#     doc = collection.find_one({"year": year, "contest": contest})
#     if not doc:
#         return jsonify({"error": "No document found"}), 404

#     problems = doc.get("problems", [])
#     problem = next((p for p in problems if p["number"] == problem_number), None)
#     if not problem:
#         return jsonify({"error": "Problem not found"}), 404

#     # Combine explanation + solutions into one text block
#     explanation = problem.get("explanation", "")
#     solutions_list = problem.get("solutions", [])
#     solutions_text = "\n".join(solutions_list)

#     solution_text = explanation
#     if solutions_text:
#         solution_text += "\n\n" + solutions_text

#     # Combine followUpQuestions into a single block of text
#     followup_questions = problem.get("followUpQuestions", [])
#     followup_text = ""
#     for fq in followup_questions:
#         question_str = fq.get("question", "")
#         difficulty_str = fq.get("difficulty", "")
#         followup_text += f"- {question_str} (Difficulty: {difficulty_str})\n"

#     return jsonify({
#         "solution": solution_text.strip(),
#         "followup": followup_text.strip()
#     }), 200


if __name__ == "__main__":
    app.run(port=5001, debug=True)
