from flask import Flask
from flask_cors import CORS

from routes.api import api_bp

app = Flask(__name__)

# Enable CORS
CORS(app)

# Register blueprint
app.register_blueprint(api_bp)

if __name__ == "__main__":
    app.run(debug=True)