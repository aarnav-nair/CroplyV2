import urllib.request
import json
import os
from dotenv import load_dotenv

load_dotenv()

def test_gemini():
    key = os.getenv("GEMINI_API_KEY")
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        res = urllib.request.urlopen(req)
        data = json.loads(res.read())
        print("Gemini Available Models:", [m['name'] for m in data.get('models', []) if 'flash' in m['name']])
    except Exception as e:
        print("Gemini Error:", e.read().decode('utf-8'))

def test_groq():
    key = os.getenv("VITE_GROQ_API_KEY") or "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"
    url = "https://api.groq.com/openai/v1/chat/completions"
    data = json.dumps({'model': 'llama-3.1-8b-instant', 'messages': [{'role':'user','content':'hi'}]}).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {key}', 'User-Agent': 'curl/7.68.0'})
    try:
        res = urllib.request.urlopen(req)
        print("Groq:", json.loads(res.read())['choices'][0]['message']['content'])
    except Exception as e:
        print("Groq Error:", getattr(e, 'read', lambda: str(e))().decode('utf-8') if hasattr(e, 'read') else str(e))

test_gemini()
test_groq()
