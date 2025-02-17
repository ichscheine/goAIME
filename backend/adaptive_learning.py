import os
import random
from collections import defaultdict
from openai import OpenAI, OpenAIError
from pymongo import MongoClient

# Initialize the OpenAI client using the API key from the environment
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# Connect to MongoDB and define collections
mongo_client = MongoClient("mongodb://localhost:27017")
db = mongo_client['amc10_manual']
problem_collection = db['problems']           # Original problems collection
adaptive_collection = db['adaptive_learning']   # New collection for adaptive learning data

# (Optional) Retain the RLAgent for future use.
class RLAgent:
    def __init__(self, actions, epsilon=0.2, alpha=0.5, gamma=0.9):
        self.q_table = defaultdict(float)  # Default value for non-existent keys
        self.actions = actions
        self.epsilon = epsilon
        self.alpha = alpha
        self.gamma = gamma

    def get_q(self, state, action):
        return self.q_table[(state, action)]

    def select_action(self, state):
        if random.random() < self.epsilon:
            return random.choice(self.actions)
        else:
            q_values = [self.get_q(state, a) for a in self.actions]
            max_q = max(q_values)
            best_actions = [a for a, q in zip(self.actions, q_values) if q == max_q]
            return random.choice(best_actions)

    def update(self, state, action, reward, next_state):
        current_q = self.get_q(state, action)
        next_max = max([self.get_q(next_state, a) for a in self.actions])
        new_q = current_q + self.alpha * (reward + self.gamma * next_max - current_q)
        self.q_table[(state, action)] = new_q

def generate_answer_key(problem_text):
    """
    Generate the correct answer choice (A, B, C, D, or E) for the problem.
    The output should be exactly one of these letters.
    """
    prompt = (
        "You are an expert AMC 10 math tutor. "
        "Based on the following AMC 10 problem, determine the correct answer choice. "
        "Return only one letter from the set {A, B, C, D, E} without any extra text or explanation.\n\n"
        f"Problem:\n{problem_text}\n\n"
        "Answer:"
    )
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert AMC 10 math tutor."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=10,
            temperature=0.0,  # Use low temperature for factual output
        )
        answer_key = response.choices[0].message.content.strip().upper()
        # Validate that the answer key is a single letter from {A, B, C, D, E}
        if answer_key and answer_key[0] in {"A", "B", "C", "D", "E"}:
            return answer_key[0]
        else:
            print("Generated answer key does not match expected format:", answer_key)
            return "Error"
    except OpenAIError as e:
        print(f"OpenAI API Error in generate_answer_key: {e}")
        return "Error"

def generate_detailed_solution(problem_text):
    """
    Generate a high-quality, detailed step-by-step solution for the problem.
    """
    prompt = (
        "You are an expert AMC 10 math tutor. Provide a detailed, step-by-step solution "
        "to the following problem. Explain the reasoning behind each step clearly.\n\n"
        f"Problem:\n{problem_text}\n\n"
        "Solution:"
    )
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert AMC 10 math tutor."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            temperature=0.7,
        )
        solution = response.choices[0].message.content.strip()
        return solution
    except OpenAIError as e:
        print(f"OpenAI API Error in generate_detailed_solution: {e}")
        return "Error generating solution."

def generate_similar_question(problem_text, difficulty):
    """
    Generate a similar AMC 10 problem with a slight variation at the specified difficulty.
    Difficulty should be one of: "easy", "medium", or "hard".
    """
    prompt = (
        "You are an expert AMC 10 math tutor who creates similar practice problems. "
        "Based solely on the following problem, generate a new problem that tests the same concept "
        f"with a slight variation at {difficulty} difficulty. "
        "Include a diagram (in ASCII or textual format) if it helps illustrate the problem. "
        "Be concise.\n\n"
        f"Original Problem:\n{problem_text}\n\n"
        "New Problem:"
    )
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert AMC 10 math tutor who creates detailed practice problems."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=400,
            temperature=0.7,
        )
        similar_question = response.choices[0].message.content.strip()
        return similar_question
    except OpenAIError as e:
        print(f"OpenAI API Error in generate_similar_question: {e}")
        return "Error generating similar question."

def generate_similar_questions(problem_text):
    """
    Generate three similar questions with difficulty levels: easy, medium, and hard.
    Returns a dictionary mapping each difficulty to the generated question.
    """
    difficulties = ["easy", "medium", "hard"]
    questions = {}
    for diff in difficulties:
        question = generate_similar_question(problem_text, diff)
        questions[diff] = question
    return questions

def save_adaptive_data(original_problem, answer_key, detailed_solution, similar_questions):
    """
    Save the original problem data (all fields) along with the new adaptive learning fields:
      - answer_key
      - detailed_solution
      - similar_questions (a dictionary with keys "easy", "medium", "hard")
    into the adaptive_learning collection.
    """
    # Copy all fields from the original problem document
    adaptive_doc = original_problem.copy()
    # Add the new adaptive fields
    adaptive_doc["answer_key"] = answer_key
    adaptive_doc["detailed_solution"] = detailed_solution
    adaptive_doc["similar_questions"] = similar_questions

    result = adaptive_collection.insert_one(adaptive_doc)
    print(f"Adaptive data saved with ID: {result.inserted_id}")
    return str(result.inserted_id)

def pre_generate_adaptive_data(problem_doc):
    """
    Given a problem document from the problems collection, generate the following using OpenAI:
      1. The correct answer choice (answer_key)
      2. A detailed solution (detailed_solution)
      3. Three similar follow-up questions (similar_questions) at easy, medium, and hard difficulty
    Save all fields from the original problem along with these new fields into the adaptive_learning collection.
    """
    problem_text = problem_doc.get("problem_statement", "")
    if not problem_text:
        print("No problem text available for document:", problem_doc.get("_id"))
        return None

    # Generate adaptive data components
    answer_key = generate_answer_key(problem_text)
    detailed_solution = generate_detailed_solution(problem_text)
    similar_questions = generate_similar_questions(problem_text)
    
    adaptive_id = save_adaptive_data(problem_doc, answer_key, detailed_solution, similar_questions)
    return adaptive_id

def generate_adaptive_for_all():
    """
    Generate adaptive learning data for every problem in the problems collection.
    For each document, generate the answer key, detailed solution, and similar questions,
    then save all original fields along with these new fields into the adaptive_learning collection.
    Skip any document missing required fields.
    """
    count = 0
    problems = problem_collection.find({})
    for prob in problems:
        # Ensure required metadata exists
        if not (prob.get("year") and prob.get("contest") and prob.get("problem_number") and prob.get("problem_statement")):
            print(f"Skipping document {prob.get('_id')} due to missing required fields.")
            continue

        # Check if adaptive data already exists for this problem (based on unique keys)
        existing = adaptive_collection.find_one({
            "year": prob.get("year"),
            "contest": prob.get("contest"),
            "problem_number": prob.get("problem_number")
        })
        if existing:
            print(f"Adaptive data already exists for problem {prob.get('problem_number')} ({prob.get('year')} {prob.get('contest')}). Skipping.")
            continue

        adaptive_id = pre_generate_adaptive_data(prob)
        if adaptive_id:
            print(f"Generated adaptive data for problem {prob.get('problem_number')} with ID: {adaptive_id}")
            count += 1
    print(f"Processed {count} new adaptive learning problems.")

# For direct execution, generate adaptive data for all problems.
if __name__ == "__main__":
    generate_adaptive_for_all()
