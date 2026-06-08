from flask import Flask
from flask_cors import CORS

from routes.api import api_bp
from routes.chat_routes import chat_bp

app = Flask(__name__)

# Enable CORS
CORS(app)

# Register blueprints
app.register_blueprint(api_bp)
app.register_blueprint(chat_bp)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)