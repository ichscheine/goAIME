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
MODEL_NAME = "gpt-4-turbo-preview"
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
    """Generate complete step-by-step solution with verification"""
    system_msg = {
        "role": "system",
        "content": "You are an expert AMC 10 tutor. Provide detailed, complete solutions with clear reasoning and final answer."
    }
    
    messages = [
        system_msg,
        {"role": "user", "content": f"Solve this problem comprehensively:\n\n{problem_text}"}
    ]
    
    full_solution = ""
    attempts = 0
    
    while attempts < MAX_RETRIES:
        try:
            response = client.chat.completions.create(
                model=MODEL_NAME,
                messages=messages,
                max_tokens=3000,
                temperature=0.5
            )
            chunk = response.choices[0].message.content.strip()
            full_solution += chunk + "\n"
            
            if response.choices[0].finish_reason == "stop":
                # Verify solution completeness
                verify_msg = [
                    system_msg,
                    {"role": "user", "content": f"Does this solution completely answer the problem? If not, explain what's missing:\n\n{full_solution}"}
                ]
                verify_response = client.chat.completions.create(
                    model=MODEL_NAME,
                    messages=verify_msg,
                    max_tokens=500,
                    temperature=0.2
                )
                
                if "incomplete" in verify_response.choices[0].message.content.lower():
                    messages.append({"role": "assistant", "content": chunk})
                    messages.append({"role": "user", "content": "Please complete the missing parts."})
                    attempts += 1
                else:
                    break
            else:
                messages.append({"role": "assistant", "content": chunk})
                messages.append({"role": "user", "content": "Continue the solution from where you left off."})
                attempts += 1
                
            time.sleep(REQUEST_DELAY)
            
        except OpenAIError as e:
            print(f"OpenAI API Error: {e}")
            break
    
    return full_solution.strip()

def generate_similar_question(problem_text, difficulty):
    """Generate structured similar problem with validation"""
    prompt = f"""Create a {difficulty} variation of this AMC10 problem. Follow exactly:
    
1. Problem statement (with ASCII diagram if needed)
2. Step-by-step solution
3. Final answer boxed as \\boxed{{answer}}

Original Problem:
{problem_text}

Format strictly as:
**Problem**
[new problem]

**Solution**
[detailed steps]

**Answer**
\\boxed{{answer}}"""

    messages = [
        {"role": "system", "content": "Expert AMC10 problem creator using strict formatting"},
        {"role": "user", "content": prompt}
    ]
    
    full_response = ""
    attempts = 0
    
    while attempts < MAX_RETRIES:
        try:
            response = client.chat.completions.create(
                model=MODEL_NAME,
                messages=messages,
                max_tokens=2000,
                temperature=0.6
            )
            chunk = response.choices[0].message.content.strip()
            full_response += chunk + "\n"
            
            # Check for required sections
            if all(section in full_response for section in ["**Problem**", "**Solution**", "**Answer**"]):
                break
            else:
                messages.append({"role": "assistant", "content": chunk})
                messages.append({"role": "user", "content": "Missing required sections. Please include all: **Problem**, **Solution**, **Answer**"})
                attempts += 1
                
            time.sleep(REQUEST_DELAY)
            
        except OpenAIError as e:
            print(f"OpenAI API Error: {e}")
            break
    
    return full_response.strip()

def generate_similar_questions(problem_text):
    """Generate questions with quality control"""
    return {
        "easy": generate_similar_question(problem_text, "easy"),
        "medium": generate_similar_question(problem_text, "medium"),
        "hard": generate_similar_question(problem_text, "hard")
    }

def save_adaptive_data(original_problem, detailed_solution, similar_questions):
    """Save enhanced data to MongoDB"""
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
    """Orchestrate data generation with error handling"""
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
    """Batch processor with rate limiting"""
    count = 0
    total = problem_collection.count_documents({})
    
    for prob in problem_collection.find({}).sort([("year", 1), ("contest", 1)]):
        # Skip existing entries
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
            
        # Process and rate limit
        if pre_generate_adaptive_data(prob):
            count += 1
            time.sleep(REQUEST_DELAY * 2)  # Extra delay between problems
            
    print(f"Completed processing. {count}/{total} new adaptive entries created.")

if __name__ == "__main__":
    generate_adaptive_for_all()