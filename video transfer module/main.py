from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)  # Ensure folder exists

@app.route('/upload', methods=['POST'])
def upload_image():
    try:
        data = request.json
        image_data = data.get("image", "").replace("data:image/png;base64,", "")
        image_bytes = base64.b64decode(image_data)

        # Ensure the folder exists before saving
        if not os.path.exists(UPLOAD_FOLDER):
            os.makedirs(UPLOAD_FOLDER)

        # Generate timestamped filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")  # e.g., 20250318_153045_123456
        file_path = os.path.join(UPLOAD_FOLDER, f"capture_{timestamp}.png")

        with open(file_path, "wb") as f:
            f.write(image_bytes)

        return jsonify({"message": "Image saved successfully", "file": file_path})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True)
