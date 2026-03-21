import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
print(f"API Key found: {'Yes' if GEMINI_API_KEY else 'No'}")

if not GEMINI_API_KEY:
    print("Error: GEMINI_API_KEY not found in .env")
    exit(1)

genai.configure(api_key=GEMINI_API_KEY)

try:
    model = genai.GenerativeModel('gemini-2.5-flash')
    response = model.generate_content("Hello, this is a test from an automated script. Are you there?")
    print("Gemini Response:", response.text)
except Exception as e:
    print("Gemini API Test Failed:", str(e))
