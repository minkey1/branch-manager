from flask import Flask, send_from_directory
import os

app = Flask(__name__)

@app.route("/")
def serve_index():
    return send_from_directory(os.getcwd(), "index.html")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=443, ssl_context=("localhost.pem", "localhost-key.pem"))
