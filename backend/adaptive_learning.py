import os
import random
import time
from collections import defaultdict
from openai import OpenAI, OpenAIError
from pymongo import MongoClient

# Configuration
openai_api_key = os.environ.get("OPENAI_API_KEY")
if not openai_api_key:
    raise ValueError("OPENAI_API_KEY environment variable not set.")

client = OpenAI(api_key=openai_api_key)
MODEL_NAME = "gpt-4o-mini"
MAX_RETRIES = 3
REQUEST_DELAY = 1  # Seconds between API requests

# MongoDB setup
mongo_client = MongoClient("mongodb://localhost:27017")
db = mongo_client['amc10_manual']
problem_collection = db['problems_with_answer_keys']
adaptive_collection = db['adaptive_learning']

class RLAgent:
    def __init__(self, actions, epsilon=0.2, alpha=0.5, gamma=0.9):
        self.q_table = defaultdict(float)
        self.actions = actions
        self.epsilon = epsilon
        self.alpha = alpha
        self.gamma = gamma

    def get_q(self, state, action):
        return self.q_table[(state, action)]

    def select_action(self, state):
        if random.random() < self.epsilon:
            return random.choice(self.actions)
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
    Generate a complete detailed solution. The prompt instructs the model to include
    a final marker "Final Answer:" at the end. We check for that marker to verify completeness.
    """
    system_msg = {
        "role": "system",
        "content": "You are an expert AMC 10 tutor. Provide detailed, complete solutions with clear reasoning and a final answer. End your output with 'Final Answer:' followed by the answer."
    }
    prompt = (
        f"Solve this AMC 10 problem comprehensively and end with 'Final Answer:'.\n\n"
        f"Problem:\n{problem_text}\n\n"
        "Solution:"
    )
    messages = [system_msg, {"role": "user", "content": prompt}]
    attempts = 0
    full_solution = ""
    
    while attempts < MAX_RETRIES:
        try:
            response = client.chat.completions.create(
                model=MODEL_NAME,
                messages=messages,
                max_tokens=3000,
                temperature=1
            )
            chunk = response.choices[0].message.content.strip()
            full_solution += chunk + "\n"
            
            # Check if the final marker is present
            if "Final Answer:" in full_solution:
                break
            else:
                messages.append({"role": "assistant", "content": chunk})
                messages.append({"role": "user", "content": "Your previous answer was incomplete. Please continue and ensure you end with 'Final Answer:'."})
                attempts += 1
                time.sleep(REQUEST_DELAY)
        except OpenAIError as e:
            print(f"OpenAI API Error in generate_detailed_solution: {e}")
            break
    return full_solution.strip()

def generate_similar_question(problem_text, difficulty):
    """
    Generate a similar AMC10 problem variation with strict formatting.
    The prompt instructs to include required sections and end with a final answer marker.
    """
    prompt = f"""Create a {difficulty} variation of the following AMC 10 problem.
Include:
1. **Problem**: A new problem statement (include ASCII diagram if needed).
2. **Solution**: A step-by-step solution.
3. **Answer**: Final answer in the format \\boxed{{...}}.
End your output with the text "Final Answer:" followed by the boxed answer.

Original Problem:
{problem_text}

Format exactly as:

**Problem**
[new problem]

**Solution**
[detailed steps]

**Answer**
\\boxed{{...}}

Final Answer:"""
    messages = [
        {"role": "system", "content": "You are an expert AMC 10 tutor who creates detailed practice problems using strict formatting."},
        {"role": "user", "content": prompt}
    ]
    attempts = 0
    full_response = ""
    
    while attempts < MAX_RETRIES:
        try:
            response = client.chat.completions.create(
                model=MODEL_NAME,
                messages=messages,
                max_tokens=2000,
                temperature=1
            )
            chunk = response.choices[0].message.content.strip()
            full_response += chunk + "\n"
            # Verify that all required sections exist and the final marker is present.
            if all(section in full_response for section in ["**Problem**", "**Solution**", "**Answer**", "Final Answer:"]):
                break
            else:
                messages.append({"role": "assistant", "content": chunk})
                messages.append({"role": "user", "content": "Your response is missing some required sections or the final answer marker. Please provide the complete formatted response."})
                attempts += 1
                time.sleep(REQUEST_DELAY)
        except OpenAIError as e:
            print(f"OpenAI API Error in generate_similar_question: {e}")
            break
    return full_response.strip()

def generate_similar_questions(problem_text):
    """
    Generate similar questions for easy, medium, and hard difficulties.
    """
    return {
        "easy": generate_similar_question(problem_text, "easy"),
        "medium": generate_similar_question(problem_text, "medium"),
        "hard": generate_similar_question(problem_text, "hard")
    }

def save_adaptive_data(original_problem, detailed_solution, similar_questions):
    """
    Save the original problem data along with the generated adaptive fields.
    """
    adaptive_doc = original_problem.copy()
    adaptive_doc.update({
        "detailed_solution": detailed_solution,
        "similar_questions": similar_questions,
        "generated_at": time.time()
    })
    
    try:
        result = adaptive_collection.insert_one(adaptive_doc)
        print(f"Saved adaptive data for problem {original_problem.get('problem_number')}")
        return str(result.inserted_id)
    except Exception as e:
        print(f"MongoDB Error: {e}")
        return None

def pre_generate_adaptive_data(problem_doc):
    """
    Orchestrate the generation of adaptive data for a given problem document.
    """
    try:
        problem_text = problem_doc.get("problem_statement", "")
        if not problem_text:
            raise ValueError("Missing problem text")
            
        print(f"Processing problem {problem_doc.get('problem_number')}...")
        detailed_solution = generate_detailed_solution(problem_text)
        similar_questions = generate_similar_questions(problem_text)
        
        return save_adaptive_data(problem_doc, detailed_solution, similar_questions)
    except Exception as e:
        print(f"Error processing problem {problem_doc.get('_id')}: {str(e)}")
        return None

def generate_adaptive_for_all():
    """
    Generate adaptive learning data for every problem in the problems collection.
    Skip any document that is missing required fields or already exists in the adaptive collection.
    """
    count = 0
    total = problem_collection.count_documents({})
    
    for prob in problem_collection.find({}).sort([("year", 1), ("contest", 1)]):
        # Skip if already processed
        existing = adaptive_collection.find_one({
            "year": prob.get("year"),
            "contest": prob.get("contest"),
            "problem_number": prob.get("problem_number")
        })
        if existing:
            continue
            
        # Validate required fields
        required_fields = ["year", "contest", "problem_number", "problem_statement"]
        if not all(prob.get(field) for field in required_fields):
            continue
            
        if pre_generate_adaptive_data(prob):
            count += 1
            time.sleep(REQUEST_DELAY * 2)
            
    print(f"Completed processing. {count}/{total} new adaptive entries created.")

if __name__ == "__main__":
    generate_adaptive_for_all()
