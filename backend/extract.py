#!/usr/bin/env python3
import os
import re
import fitz  # PyMuPDF, install via pip install pymupdf
from pymongo import MongoClient

# === Configuration ===
DATA_PATH = "/Users/daoming/Desktop/Steamify/goAIME/AMC10/"
PDF_PATH = os.path.join(DATA_PATH, "2022_AMC10A-Problems.pdf")
IMAGES_FOLDER = os.path.join(DATA_PATH, "images")
MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "amc10_test2"
COLLECTION_NAME = "2022_AMC10A"

# Ensure the images folder exists
os.makedirs(IMAGES_FOLDER, exist_ok=True)

def extract_problems(pdf_path):
    """
    Extracts problems from the PDF.
    Returns a list of dictionaries with keys:
    'problem_number', 'problem_statement', 'options', 'explanation',
    'followup_questions', and 'images'
    """
    doc = fitz.open(pdf_path)
    problems = []
    problem_pattern = re.compile(r"^(\d+)\.\s*(.*)")
    current_problem = None

    for page_num in range(1,len(doc)):
        page = doc[page_num]
        text = page.get_text("text")
        lines = text.splitlines()
        for line in lines:
            line = line.strip()
            match = problem_pattern.match(line)
            if match:
                # Save previous problem if exists
                if current_problem:
                    problems.append(current_problem)
                problem_number = int(match.group(1))
                # Start a new problem document
                current_problem = {
                    "problem_number": problem_number,
                    "problem_statement": match.group(2).strip(),
                    "options": [],
                    "explanation": "",  # to be generated later
                    "followup_questions": [],
                    "images": []
                }
            elif current_problem is not None:
                # Look for answer choices: a simple heuristic matching (A), (B), etc.
                if re.search(r"\([A-E]\)", line):
                    current_problem["options"].append(line)
                else:
                    # Append to problem statement (with a space separator)
                    current_problem["problem_statement"] += " " + line
        # Extract images from the page and associate them with the current problem if one exists
        image_list = page.get_images(full=True)
        if image_list and current_problem is not None:
            for img_index, img in enumerate(image_list):
                xref = img[0]
                base_image = doc.extract_image(xref)
                image_bytes = base_image["image"]
                ext = base_image["ext"]
                image_filename = f"problem_{current_problem['problem_number']}_page{page_num+1}_img{img_index+1}.{ext}"
                image_path = os.path.join(IMAGES_FOLDER, image_filename)
                with open(image_path, "wb") as f:
                    f.write(image_bytes)
                # Store the relative image path for faster front-end access
                current_problem["images"].append(image_path)
    # Append the last problem if it exists
    if current_problem:
        problems.append(current_problem)
    # Only return problems 1 through 25
    return [p for p in problems if p["problem_number"] <= 25]

def generate_explanation(problem):
    """
    Generates an explanation and follow-up questions for a given problem.
    Modify this function to improve the explanation as needed.
    """
    explanation = (f"This problem (#{problem['problem_number']}) can be solved by carefully analyzing "
                   "the given conditions and using step-by-step reasoning. Consider breaking the problem "
                   "into smaller parts and verifying each step along the way.")
    followup_questions = [
        "What alternative methods might be used to solve this problem?",
        "How would the solution change if one of the conditions was altered?"
    ]
    return explanation, followup_questions

def save_to_mongodb(problems):
    """
    Saves the list of problem dictionaries to MongoDB.
    """
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    collection = db[COLLECTION_NAME]
    # Optional: clear the collection before insertion
    collection.delete_many({})
    for problem in problems:
        # Generate explanation and follow-up questions for the problem
        exp, followups = generate_explanation(problem)
        problem["explanation"] = exp
        problem["followup_questions"] = followups
        # Insert the problem document into MongoDB
        collection.insert_one(problem)
    print(f"Inserted {len(problems)} problems into MongoDB.")

if __name__ == "__main__":
    problems = extract_problems(PDF_PATH)
    # Filter to only include the first 25 problems (if extra pages exist)
    problems = [p for p in problems if p["problem_number"] <= 25]
    save_to_mongodb(problems)
    print("Process completed.")
