import os
import glob
import json

# Define input and output paths
input_folder = "/Users/daoming/Desktop/Steamify/goAIME/AMC10/2022_amc10a/v2/json"
output_file = "/Users/daoming/Desktop/Steamify/goAIME/AMC10/2022_amc10a.json"

# List to collect all JSON data
all_data = []

# Function to extract problem number from filename
def get_problem_number(filename):
    base = os.path.basename(filename)
    number = ''.join(filter(str.isdigit, base))
    return int(number) if number.isdigit() else float('inf')

# Loop over all JSON files in the input folder, sorted by problem number
for json_path in sorted(glob.glob(os.path.join(input_folder, "*.json")), key=get_problem_number):
    with open(json_path, "r") as file:
        data = json.load(file)
        all_data.append(data)

# Write the collected data to the output file
with open(output_file, "w") as out_file:
    json.dump(all_data, out_file, indent=2)

print(f"Combined {len(all_data)} JSON files into {output_file}")
