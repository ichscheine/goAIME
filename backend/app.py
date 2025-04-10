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

# Global state
problem_order = []  # list of string IDs, e.g. ["1", "2", ..., "25"]
current_order_mode = None  # False for sequential, True for shuffled

ALL_PROBLEMS = [str(i) for i in range(1, 26)]  # "1" through "25"

def initialize_problem_order(shuffle_mode: bool):
    global problem_order, current_order_mode
    # Always build the full list from "1" to "25."
    problem_order = ALL_PROBLEMS.copy()
    if shuffle_mode:
        random.shuffle(problem_order)
    current_order_mode = shuffle_mode
    print("Initialized new problem_order:", problem_order)

@app.route('/', methods=['GET'])
def get_problem():
    global problem_order, current_order_mode

    # 1) Check shuffle param
    shuffle_param = request.args.get('shuffle', 'false').lower()
    shuffle_mode = (shuffle_param in ['true', '1'])

    # 2) Check restart param
    restart_param = request.args.get('restart', 'false').lower()
    restart_flag = (restart_param in ['true', '1'])

    # 3) If restart=true, forcibly reinitialize problem_order from scratch:
    if restart_flag:
        initialize_problem_order(shuffle_mode)
    # 4) Otherwise, reinitialize if empty or if the mode changed
    elif not problem_order or (current_order_mode != shuffle_mode):
        initialize_problem_order(shuffle_mode)

    if not problem_order:
        return jsonify({"error": "No problems available. Reinitialize needed."}), 500

    # Pop the next problem from the order
    current_problem_number = problem_order.pop(0)
    print("Serving problem", current_problem_number, "; remaining:", problem_order)

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
