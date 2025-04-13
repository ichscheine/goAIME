# # Script to update the topics field for all problems

# import json

# # Define topic mappings based on problem content
# topic_mappings = {
#     1: ["Algebra", "Continued Fractions"],              # Continued fractions
#     2: ["Algebra", "Ratios and Proportions"], # Ratio and rate problem
#     3: ["Algebra", "System of Linear Equations"],       # System of linear equations
#     4: ["Algebra", "Unit Conversion"],        # Unit conversion problem
#     5: ["Geometry", "Polygons"],              # Square and hexagon geometry
#     6: ["Algebra", "Absolute Value"],         # Absolute value expressions
#     7: ["Number Theory", "GCD and LCM"],      # LCM and GCD problem
#     8: ["Algebra", "Mean"],                   # Arithmetic mean
#     9: ["Counting and Probability", "Graph Theory"], # Graph coloring
#     10: ["Geometry", "Coordinate Geometry"],  # Rectangle geometry problem
#     11: ["Algebra", "Exponents"],             # Exponents and roots
#     12: ["Logic", "Truth Tables"],            # Logic problem with truth-tellers
#     13: ["Geometry", "Triangle Properties"],  # Triangle geometry
#     14: ["Counting and Probability", "Combinatorics"], # Pairing problem
#     15: ["Geometry", "Cyclic Quadrilateral"],              # Cyclic quadrilateral
#     16: ["Algebra", "Polynomials - Vieta's formulas"],           # Vieta's formulas
#     17: ["Number Theory", "Repeating Decimals"],        # Repeating decimals
#     18: ["Geometry", "3D Transformations"],      # Geometric transformations
#     19: ["Number Theory", "Modular Arithmetic"], # Modular arithmetic
#     20: ["Algebra", "Arithmetic and Geometric Sequences"],             # Arithmetic and geometric sequences
#     21: ["Geometry", "Area of Polygons"],             # Area of polygon
#     22: ["Counting and Probability", "Permutation"], # Permutation problem
#     23: ["Geometry", "Isosceles Trapezoid"],  # Trapezoid geometry
#     24: ["Counting and Probability", "String Counting"], # String counting
#     25: ["Geometry", "Lattice Points"]  # Lattice points
# }

# # Load the JSON file
# with open('/Users/daoming/Documents/Github/goAIME/converted_data/problems.json', 'r') as f:
#     problems = json.load(f)

# # Update the topics field for each problem
# for problem in problems:
#     problem_number = problem.get('problem_number')
#     if problem_number in topic_mappings:
#         problem['topics'] = topic_mappings[problem_number]

# # Save the updated JSON back to file
# with open('/Users/daoming/Documents/Github/goAIME/converted_data/problems.json', 'w') as f:
#     json.dump(problems, f, indent=2)

# print("Topics have been updated successfully!")


# # run below from terminal to update to database
# mongoimport --uri="$(grep -v '^#' .env | grep MONGO_URI | cut -d '=' -f2- | tr -d ' ')" --db=goaime --collection=contests --file=converted_data/contests.json --jsonArray
# mongoimport --uri="$(grep -v '^#' .env | grep MONGO_URI | cut -d '=' -f2- | tr -d ' ')" --db=goaime --collection=problems --file=converted_data/problems.json --jsonArray


# # test MongoDB Atlas connection
# from pymongo import MongoClient
# import os
# from dotenv import load_dotenv

# load_dotenv()

# try:
#     client = MongoClient(os.getenv("MONGO_URI"))
#     print("Connected to MongoDB!")
#     # List all databases
#     print("Databases:", client.list_database_names())
# except Exception as e:
#     print("Error:", e)

