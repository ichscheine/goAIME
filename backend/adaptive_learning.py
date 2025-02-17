import os
import random
from collections import defaultdict
from openai import OpenAI, OpenAIError
from pymongo import MongoClient

# Initialize the OpenAI client using the API key from the environment
openai_api_key = os.environ.get("OPENAI_API_KEY")
if not openai_api_key:
    raise ValueError("OPENAI_API_KEY environment variable not set.")

client = OpenAI(api_key=openai_api_key)

# Connect to MongoDB and define collections
mongo_client = MongoClient("mongodb://localhost:27017")
db = mongo_client['amc10_manual']
problem_collection = db['problems_with_answer_keys']  # Original problems collection
adaptive_collection = db['adaptive_learning']          # New collection for adaptive learning data

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

def generate_detailed_solution(problem_text):
    """
    Generate a high-quality, detailed step-by-step solution for the problem.
    The solution should include all reasoning from start to finish.
    """
    prompt = (
        "You are an expert AMC 10 math tutor. Provide a detailed, step-by-step solution "
        "to the following problem. Explain the reasoning behind each step clearly, "
        "and conclude with the final answer choice.\n\n"
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
            temperature=0.9,
        )
        solution = response.choices[0].message.content.strip()
        return solution
    except OpenAIError as e:
        print(f"OpenAI API Error in generate_detailed_solution: {e}")
        return "Error generating solution."

def generate_similar_question(problem_text, difficulty):
    """
    Generate a similar AMC 10 problem with a slight variation based on the original problem.
    The 'difficulty' parameter should be one of: "easy", "medium", or "hard".
    A diagram (in ASCII or textual format) may be included if it helps illustrate the problem.
    """
    prompt = (
        "You are an expert AMC 10 math tutor who creates similar practice problems. "
        "Based solely on the following problem, generate a new problem that tests the same concept "
        f"with a slight variation at {difficulty} difficulty. "
        "If applicable, include a diagram (using ASCII or text) to help illustrate the problem. "
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
    Generate three similar questions at different difficulty levels: easy, medium, and hard.
    Returns a dictionary mapping each difficulty to the generated question.
    """
    difficulties = ["easy", "medium", "hard"]
    questions = {}
    for diff in difficulties:
        question = generate_similar_question(problem_text, diff)
        questions[diff] = question
    return questions

def save_adaptive_data(original_problem, detailed_solution, similar_questions):
    """
    Save the original problem data along with new adaptive learning fields into the adaptive_learning collection.
    The new fields include:
      - detailed_solution
      - similar_questions (a dict with keys "easy", "medium", "hard")
    The answer_key field is already present in the original document.
    """
    # Copy all fields from the original problem document
    adaptive_doc = original_problem.copy()
    # Update with new adaptive fields
    adaptive_doc["detailed_solution"] = detailed_solution
    adaptive_doc["similar_questions"] = similar_questions

    result = adaptive_collection.insert_one(adaptive_doc)
    print(f"Adaptive data saved with ID: {result.inserted_id}")
    return str(result.inserted_id)

def pre_generate_adaptive_data(problem_doc):
    """
    Given a problem document from the problems collection, generate adaptive data using OpenAI:
      1. A detailed, step-by-step solution
      2. Three similar follow-up questions at easy, medium, and hard difficulty
    The answer_key is taken from the original document.
    Save the combined data into the adaptive_learning collection.
    """
    problem_text = problem_doc.get("problem_statement", "")
    if not problem_text:
        print("No problem text available for document:", problem_doc.get("_id"))
        return None

    # Use existing answer_key from the original document.
    # Generate the detailed solution and similar questions.
    detailed_solution = generate_detailed_solution(problem_text)
    similar_questions = generate_similar_questions(problem_text)
    
    adaptive_id = save_adaptive_data(problem_doc, detailed_solution, similar_questions)
    return adaptive_id

def generate_adaptive_for_all():
    """
    Generate adaptive learning data for every problem in the problems collection.
    For each document, generate the detailed solution and similar questions,
    then save all original fields along with these new fields into the adaptive_learning collection.
    Skip any document missing required fields or if adaptive data already exists.
    """
    count = 0
    problems = problem_collection.find({})
    for prob in problems:
        # Ensure required metadata exists
        if not (prob.get("year") and prob.get("contest") and prob.get("problem_number") and prob.get("problem_statement")):
            print(f"Skipping document {prob.get('_id')} due to missing required fields.")
            continue

        # Check if adaptive data already exists for this problem based on unique keys
        existing = adaptive_collection.find_one({
            "year": prob.get("year"),
            "contest": prob.get("contest"),
            "problem_number": prob.get("problem_number")
        })
        if existing:
            print(f"Adaptive data already exists for problem {prob.get('problem_number')} "
                  f"({prob.get('year')} {prob.get('contest')}). Skipping.")
            continue

        adaptive_id = pre_generate_adaptive_data(prob)
        if adaptive_id:
            print(f"Generated adaptive data for problem {prob.get('problem_number')} with ID: {adaptive_id}")
            count += 1
    print(f"Processed {count} new adaptive learning problems.")

# For direct execution, generate adaptive data for all problems.
if __name__ == "__main__":
    generate_adaptive_for_all()
