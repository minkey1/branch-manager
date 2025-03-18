import os
import sys
from compreface import CompreFace
from compreface.service import VerificationService

def initialize_compre_face(domain: str, port: str, api_key: str):
    compre_face = CompreFace(domain, port, {
        "limit": 0,
        "det_prob_threshold": 0.8,
        "face_plugins": "age,gender",
        "status": "true"
    })
    return compre_face.init_face_verification(api_key)

def get_latest_image(uploads_dir: str):
    if not os.path.exists(uploads_dir):
        return [1, f"Error: Uploads folder '{uploads_dir}' not found. Please create the folder and add images."]
    
    image_files = sorted(
        [f for f in os.listdir(uploads_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))], 
        key=lambda f: os.path.getmtime(os.path.join(uploads_dir, f)),
        reverse=True
    )
    
    if not image_files:
        return [2, f"Error: No image files found in '{uploads_dir}'. Please upload an image and try again."]
    
    return [0, os.path.join(uploads_dir, image_files[0])]

def verify_face(verify: VerificationService, reference_image: str, target_image: str):
    if not os.path.exists(reference_image):
        return [3, f"Error: Reference image '{reference_image}' not found."]
    
    response = verify.verify(reference_image, target_image)
    face_matches = response.get("result", [{}])[0].get("face_matches", [])
    
    if face_matches:
        max_similarity = max(match.get("similarity", 0) for match in face_matches)
        return [0, f"Highest Similarity Score: {max_similarity:.2f}"]
    
    return [4, "No face matches found. The uploaded image may not contain a recognizable face."]

# Example Usage
if __name__ == "__main__":
    DOMAIN = 'http://localhost'
    PORT = '8000'
    VERIFICATION_API_KEY = 'aa89f97b-b58a-4a89-ad92-aca6aea9854a'
    UPLOADS_DIR = "uploads"
    INITIAL_IMAGE = "me.jpg"
    
    verify_service = initialize_compre_face(DOMAIN, PORT, VERIFICATION_API_KEY)
    latest_image_result = get_latest_image(UPLOADS_DIR)
    
    if latest_image_result[0] != 0:
        print(latest_image_result[1])
        sys.exit(1)
    
    verification_result = verify_face(verify_service, INITIAL_IMAGE, latest_image_result[1])
    print(verification_result[1])
