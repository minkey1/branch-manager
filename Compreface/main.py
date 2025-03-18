from compreface import CompreFace
from compreface.service import VerificationService
import os
import sys

# CompreFace Configuration
DOMAIN = 'http://localhost'
PORT = '8000'
VERIFICATION_API_KEY = 'aa89f97b-b58a-4a89-ad92-aca6aea9854a'

# Initialize CompreFace
compre_face = CompreFace(DOMAIN, PORT, {
    "limit": 0,
    "det_prob_threshold": 0.8,
    "face_plugins": "age,gender",
    "status": "true"
})
verify = compre_face.init_face_verification(VERIFICATION_API_KEY)

UPLOADS_DIR = "uploads"
initial_image = "me.jpg"

# Ensure initial image exists
if not os.path.exists(initial_image):
    print(f"❌ Error: Initial image '{initial_image}' not found. Please provide a valid reference image.")
    sys.exit(1)

# Ensure the uploads folder exists
if not os.path.exists(UPLOADS_DIR):
    print(f"❌ Error: Uploads folder '{UPLOADS_DIR}' not found. Please create the folder and add images.")
    sys.exit(1)

# Get image files from the uploads directory
image_files = sorted(
    [f for f in os.listdir(UPLOADS_DIR) if f.lower().endswith(('.jpg', '.jpeg', '.png'))], 
    key=lambda f: os.path.getmtime(os.path.join(UPLOADS_DIR, f)),
    reverse=True  # Sort by modification time, latest first
)

if not image_files:
    print(f"❌ Error: No image files found in '{UPLOADS_DIR}'. Please upload an image and try again.")
    sys.exit(1)

# Use the most recent image
image_path = os.path.join(UPLOADS_DIR, image_files[0])
print(f"✅ Using latest uploaded image: {image_path}")

# Perform Face Verification
response = verify.verify(initial_image, image_path)

# Extract face matches
face_matches = response.get("result", [{}])[0].get("face_matches", [])

if face_matches:
    # Find the highest similarity
    max_similarity = max(match.get("similarity", 0) for match in face_matches)
    print(f"🔹 Highest Similarity Score: {max_similarity:.2f}")
else:
    print("⚠️ No face matches found. The uploaded image may not contain a recognizable face.")

