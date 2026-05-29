from flask import Blueprint, request, jsonify

from crypto.keygen import generate_keys
from services.elgamal_service import (
    full_encrypt,
    full_decrypt
)

from math_engine.primality import generate_prime
from math_engine.primitive_root import find_primitive_root

api_bp = Blueprint("api", __name__)


# =========================================
# POST /api/keygen
# =========================================
@api_bp.route("/api/keygen", methods=["POST"])
def keygen():

    try:
        data = request.get_json()

        mode = data.get("mode", "toy")

        # TOY MODE
        if mode == "toy":

            p = 23
            g = 5
            x = 6

        # SECURE MODE
        elif mode == "secure":

            bits = data.get("bits", 512)

            p = generate_prime(bits)

            g = find_primitive_root(p)

            x = None

        else:
            return jsonify({
                "error": "Invalid mode"
            }), 400

        # Generate keys
        result = generate_keys(p, g, x)

        return jsonify(result)

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500


# =========================================
# POST /api/encrypt
# =========================================
@api_bp.route("/api/encrypt", methods=["POST"])
def encrypt():

    try:
        data = request.get_json()

        message = data["message"]

        public_key = {
            "p": data["p"],
            "g": data["g"],
            "y": data["y"]
        }

        result = full_encrypt(
            message_text=message,
            public_key=public_key
        )

        return jsonify({

            "original_text":
                result["original_text"],

            "numeric_blocks":
                result["numeric_blocks"],

            "ciphertext_blocks":
                result["ciphertext_blocks"],

            "trace_steps":
                result["trace_steps"]

        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500


# =========================================
# POST /api/decrypt
# =========================================
@api_bp.route("/api/decrypt", methods=["POST"])
def decrypt():

    try:
        data = request.get_json()

        ciphertext_blocks = data["ciphertext_blocks"]

        private_key = data["x"]

        p = data["p"]

        result = full_decrypt(
            ciphertext_blocks=ciphertext_blocks,
            private_key=private_key,
            p=p
        )

        return jsonify({

            "recovered_text":
                result["recovered_text"],

            "recovered_blocks":
                result["recovered_blocks"],

            "trace_steps":
                result["trace_steps"]

        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500