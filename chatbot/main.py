#pip install sentence-transformers faiss-cpu PyMuPDF flask-cors requests numpy

import os
import fitz  # PyMuPDF for PDF text extraction
import faiss
import numpy as np
import requests
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer
from werkzeug.utils import secure_filename


# Flask app setup
app = Flask(__name__)
CORS(app)

# Gemini API Key (Replace with actual API key)
GEMINI_API_KEY = "AIzaSyDAtW83yirQRbAv7wiYAkWDFKz1nw5wy74"  # Replace with your actual key

# System prompt for AI
SYSTEM_PROMPT = """You are an AI branch manager voice assistant. Talk like a normal human would. 
Be someone that helps users with loan applications or any other bank-related query. Answer politely 
and concisely. Keep it short and simple. You'll be inside a voice assistant, so avoid formatting 
like using * or ~ like symbols.  If the user asks about a loan, respond to the user. 
If the user is asking to apply for a loan, or wants to begin the loan application process, 
include the function call 'initialize_loan' in your response. Do not explain the function call,
only include it.  
Example of a response: "Sure, I can help you with that, initialize_loan"
Another example: "I can help you with loans. What kind of loan are you interested in?"
"""

# Store conversation history
conversation_history = [{"role": "user", "parts": [{"text": SYSTEM_PROMPT}]}]

# Path to the folder containing PDF policies
POLICY_FOLDER = "./policy_docs"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"  # Efficient transformer model

# Ensure the policy folder exists
os.makedirs(POLICY_FOLDER, exist_ok=True)

# Load the embedding model
model = SentenceTransformer(EMBEDDING_MODEL)

# Function to extract text from all PDFs in the folder
def extract_text_from_pdfs():
    policy_texts = []
    filenames = []

    for file in os.listdir(POLICY_FOLDER):
        if file.endswith(".pdf"):
            file_path = os.path.join(POLICY_FOLDER, file)
            text = extract_text_from_pdf(file_path)
            if text:
                policy_texts.append(text)
                filenames.append(file)

    return policy_texts, filenames

# Function to extract text from a single PDF
def extract_text_from_pdf(pdf_path):
    text = ""
    try:
        with fitz.open(pdf_path) as doc:
            for page in doc:
                text += page.get_text("text") + "\n"
    except Exception as e:
        print(f"Error reading {pdf_path}: {e}")
    return text

# Function to generate embeddings using sentence-transformers
def get_text_embeddings(texts):
    return model.encode(texts, convert_to_numpy=True)

# Function to index embeddings in FAISS for fast search
def create_faiss_index(embeddings):
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings)
    return index

# Load and process policy PDFs
policy_texts, filenames = extract_text_from_pdfs()
policy_embeddings = get_text_embeddings(policy_texts)
faiss_index = create_faiss_index(policy_embeddings)

# Function to find the most relevant policy text based on a query
def search_policy(query, top_k=1):
    query_embedding = get_text_embeddings([query])
    distances, indices = faiss_index.search(query_embedding, top_k)

    results = []
    for i in range(top_k):
        idx = indices[0][i]
        results.append({"filename": filenames[idx], "text": policy_texts[idx], "distance": distances[0][i]})

    return results

# API route for the AI chat function
@app.route("/chat", methods=["POST"])
def chat():
    global conversation_history

    user_input = request.json.get("message")
    if not user_input:
        return jsonify({"error": "No message provided"}), 400

    # Append user input to conversation history
    conversation_history.append({"role": "user", "parts": [{"text": user_input}]})

    # Search for relevant policy text
    policy_results = search_policy(user_input, top_k=1)
    policy_response = policy_results[0]["text"] if policy_results else "No relevant policy found."

    # Prepare API request payload for Gemini
    payload = {"contents": conversation_history + [{"role": "user", "parts": [{"text": policy_response}]}]}

    # Make API request
    url = f"https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"
    headers = {"Content-Type": "application/json"}
    response = requests.post(url, json=payload, headers=headers)

    # Handle API response
    if response.status_code == 200:
        response_data = response.json()

        # Extract AI response text
        try:
            ai_response = response_data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "No response received.")
        except IndexError:
            ai_response = "No response received."

        # Append AI response to conversation history
        conversation_history.append({"role": "model", "parts": [{"text": ai_response}]})

        # Debugging - Print AI response
        print("\n🤖 AI Response:", ai_response)

        return jsonify({"response": ai_response})

    else:
        # Debugging - Print API error details
        print("\n🚨 ERROR: Failed API request -", response.status_code)
        print(response.text)
        return jsonify({"error": "Failed to fetch response", "details": response.text}), response.status_code

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/upload/pan', methods=['POST'])
def upload_pan():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], 'pan_' + filename))
        return jsonify({'message': 'PAN image uploaded successfully'}), 200
    else:
        return jsonify({'error': 'Invalid file type'}), 400

@app.route('/upload/aadhar', methods=['POST'])
def upload_aadhar():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], 'aadhar_' + filename))
        return jsonify({'message': 'Aadhar image uploaded successfully'}), 200
    else:
        return jsonify({'error': 'Invalid file type'}), 400

@app.route('/upload/salary', methods=['POST'])
def upload_salary():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], 'salary_' + filename))
        return jsonify({'message': 'Salary image uploaded successfully'}), 200
    else:
        return jsonify({'error': 'Invalid file type'}), 400

if __name__ == "__main__":
    print("🚀 AI Branch Manager Backend with RAG is running on port 5000...")
    app.run(debug=True, port=5000)
