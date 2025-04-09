import os
import random
from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables from .env file if available.
load_dotenv()

app = Flask(__name__)
CORS(app)

# Get MongoDB connection string from environment variables.
mongo_uri = os.getenv("MONGO_URI")
if not mongo_uri:
    raise ValueError("MONGO_URI environment variable is required.")

# Connect to MongoDB.
mongo_client = MongoClient(mongo_uri)
db = mongo_client["AMC10"]
collection = db["2022_amc10a_0409"]

# Global variables to store the current order list and ordering mode.
problem_order = []        # List of problem numbers (as strings)
current_order_mode = None  # False for sequential, True for shuffled

problem_order = list(map(str, range(1, 26))) # Initialize with problem numbers 1 to 25 as strings.
print(f"Initial problem order: {problem_order}")

def initialize_problem_order(shuffle_mode: bool):
    """
    Initializes the global problem_order list based on the desired ordering mode.
    If shuffle_mode is True, the list is randomized. Otherwise, it's sequential.
    """
    global problem_order, current_order_mode
    # Create a sequential list of problem numbers as strings.
    # If shuffle mode is requested, randomize the list.
    if shuffle_mode:
        random.shuffle(problem_order)
    current_order_mode = shuffle_mode

# Explicitly initialize with sequential order by default.
initialize_problem_order(False)

@app.route('/', methods=['GET'])
def get_problem():
    year = request.args.get("year")
    contest = request.args.get("contest")
    background = request.args.get("background")  # might be used for practice mode
    exclude = request.args.get("exclude")
    # Read the shuffle flag; default to False.
    shuffle_flag = request.args.get("shuffle", "false").lower() == "true"

    # If the ordering mode has changed or the order list is empty, reinitialize.
    if current_order_mode != shuffle_flag or not problem_order:
        initialize_problem_order(shuffle_flag)

    # Pop the next problem number from the list.
    current_problem_number = problem_order.pop(0)
    print(f"Current problem number: {current_problem_number}")

    # Retrieve the problem from MongoDB using the problem_number (stored as a string).
    problem = collection.find_one({"problem_number": current_problem_number})
    
    if problem:
        # Convert ObjectId for JSON serialization.
        if '_id' in problem:
            problem['_id'] = str(problem['_id'])
        return jsonify(problem)
    else:
        return jsonify({
            "error": "Problem not found",
            "problem_number": current_problem_number
        }), 404

if __name__ == "__main__":
    app.run(debug=False, port=5001)
