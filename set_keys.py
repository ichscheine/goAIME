import os
from dotenv import load_dotenv
import openai

# Load environment variables from the .env file
load_dotenv()

# Retrieve the API key from the environment variable
openai.api_key = os.environ.get("OPENAI_API_KEY")

if not openai.api_key:
    raise ValueError("OPENAI_API_KEY environment variable is not set.")
else:
    print(f"Raw OPENAI_API_KEY: {os.environ.get('OPENAI_API_KEY')}")