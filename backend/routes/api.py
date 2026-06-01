from flask import Blueprint, request, jsonify

from crypto.keygen import generate_keys
from services.elgamal_service import (
    full_encrypt,
    full_decrypt
)

from math_engine.primality import generate_safe_prime
from math_engine.primitive_root import find_primitive_root
from utils.json_codec import to_int, stringify_large_ints

api_bp = Blueprint("api", __name__)


def _coerce_ciphertext_blocks(blocks):
    return [
        {"c1": to_int(b["c1"]), "c2": to_int(b["c2"])}
        for b in blocks
    ]


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

            bits = int(data.get("bits", 256))

            if bits not in (128, 256, 512):
                return jsonify({"error": "bits must be 128, 256, or 512"}), 400

            p = generate_safe_prime(bits)

            g = find_primitive_root(p)

            x = None

        else:
            return jsonify({
                "error": "Invalid mode"
            }), 400

        # Generate keys
        result = generate_keys(p, g, x)

        return jsonify(stringify_large_ints(result))

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
            "p": to_int(data["p"]),
            "g": to_int(data["g"]),
            "y": to_int(data["y"]),
        }

        result = full_encrypt(
            message_text=message,
            public_key=public_key
        )

        return jsonify(stringify_large_ints({

            "original_text":
                result["original_text"],

            "numeric_blocks":
                result["numeric_blocks"],

            "ciphertext_blocks":
                result["ciphertext_blocks"],

            "trace_steps":
                result["trace_steps"]

        }))

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

        ciphertext_blocks = _coerce_ciphertext_blocks(data["ciphertext_blocks"])

        private_key = to_int(data["x"])

        p = to_int(data["p"])

        result = full_decrypt(
            ciphertext_blocks=ciphertext_blocks,
            private_key=private_key,
            p=p
        )

        return jsonify(stringify_large_ints({

            "recovered_text":
                result["recovered_text"],

            "recovered_blocks":
                result["recovered_blocks"],

            "trace_steps":
                result["trace_steps"]

        }))

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500