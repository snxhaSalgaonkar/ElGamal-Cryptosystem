import socket
from datetime import datetime
from flask import Blueprint, request, jsonify

from crypto.keygen import generate_keys
from utils.json_codec import to_int, stringify_large_ints
from math_engine.primality import generate_safe_prime
from math_engine.primitive_root import find_primitive_root

chat_bp = Blueprint("chat", __name__)

# In-memory store for active chat rooms
# Format:
# {
#     "ROOM_ID": {
#         "p": int,
#         "g": int,
#         "mode": str,  # "toy" or "secure"
#         "participants": {
#             "username": {
#                 "y": int
#             }
#         },
#         "messages": [
#             {
#                 "id": int,
#                 "sender": str,
#                 "receiver": str,
#                 "ciphertext_blocks": [{"c1": int, "c2": int}],
#                 "timestamp": str
#             }
#         ]
#     }
# }
rooms = {}


def get_local_ip():
    """Finds the local network IP address of the host machine."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # Doesn't need to be reachable, just triggers OS interface lookup
        s.connect(('10.255.255.255', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP


# =========================================
# GET /api/chat/ip
# =========================================
@chat_bp.route("/api/chat/ip", methods=["GET"])
def chat_ip():
    return jsonify({
        "ip": get_local_ip(),
        "port": 5000
    })


# =========================================
# POST /api/chat/join
# =========================================
@chat_bp.route("/api/chat/join", methods=["POST"])
def chat_join():
    try:
        data = request.get_json() or {}
        room_id = data.get("room_id", "").strip().upper()
        username = data.get("username", "").strip()
        mode = data.get("mode", "toy")
        bits = int(data.get("bits", 256))

        if not room_id or not username:
            return jsonify({"error": "room_id and username are required"}), 400

        # If room does not exist, initialize it
        if room_id not in rooms:
            if mode == "toy":
                p = 23
                g = 5
            else:
                if bits not in (128, 256, 512):
                    return jsonify({"error": "bits must be 128, 256, or 512"}), 400
                p = generate_safe_prime(bits)
                g = find_primitive_root(p)

            rooms[room_id] = {
                "p": p,
                "g": g,
                "mode": mode,
                "participants": {},
                "messages": []
            }

        room = rooms[room_id]

        # Check room occupancy (limit of 2 participants for ElGamal)
        if username not in room["participants"] and len(room["participants"]) >= 2:
            return jsonify({
                "error": "Room is full. Secure ElGamal chat supports a maximum of 2 participants."
            }), 400

        # Generate public/private keys for the user based on room's p and g
        p = room["p"]
        g = room["g"]
        keys = generate_keys(p, g)

        # Register user's public key y
        room["participants"][username] = {
            "y": keys["public_key"]["y"]
        }

        response = {
            "p": p,
            "g": g,
            "y": keys["public_key"]["y"],
            "x": keys["private_key"],
            "mode": room["mode"],
            "participants": {u: p_data["y"] for u, p_data in room["participants"].items()}
        }

        return jsonify(stringify_large_ints(response))

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =========================================
# GET /api/chat/status
# =========================================
@chat_bp.route("/api/chat/status", methods=["GET", "POST"])
def chat_status():
    room_id = request.args.get("room_id", "").strip().upper()
    if not room_id:
        return jsonify({"error": "room_id is required"}), 400

    if room_id not in rooms:
        return jsonify({"error": "Room not found"}), 404

    room = rooms[room_id]
    data = {
        "room_id": room_id,
        "p": room["p"],
        "g": room["g"],
        "mode": room["mode"],
        "participants": {u: p_data["y"] for u, p_data in room["participants"].items()}
    }
    return jsonify(stringify_large_ints(data))


# =========================================
# POST /api/chat/send
# =========================================
@chat_bp.route("/api/chat/send", methods=["POST"])
def chat_send():
    try:
        data = request.get_json() or {}
        room_id = data.get("room_id", "").strip().upper()
        sender = data.get("sender", "").strip()
        ciphertext_blocks = data.get("ciphertext_blocks", [])

        if not room_id or not sender:
            return jsonify({"error": "room_id and sender are required"}), 400

        if room_id not in rooms:
            return jsonify({"error": "Room not found"}), 404

        room = rooms[room_id]

        # Determine the recipient
        receivers = [u for u in room["participants"].keys() if u != sender]
        receiver = receivers[0] if receivers else None

        # Clean/coerce block formatting
        coerced_blocks = [
            {"c1": to_int(b["c1"]), "c2": to_int(b["c2"])}
            for b in ciphertext_blocks
        ]

        msg_id = len(room["messages"]) + 1
        new_msg = {
            "id": msg_id,
            "sender": sender,
            "receiver": receiver,
            "ciphertext_blocks": coerced_blocks,
            "timestamp": datetime.now().strftime("%H:%M:%S")
        }

        room["messages"].append(new_msg)

        return jsonify(stringify_large_ints({
            "status": "sent",
            "message": new_msg
        }))

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =========================================
# GET /api/chat/messages
# =========================================
@chat_bp.route("/api/chat/messages", methods=["GET", "POST"])
def chat_messages():
    room_id = request.args.get("room_id", "").strip().upper()
    if not room_id:
        return jsonify({"error": "room_id is required"}), 400

    if room_id not in rooms:
        return jsonify({"error": "Room not found"}), 404

    room = rooms[room_id]

    # Previews for server database visualization logs
    db_records = []
    for m in room["messages"]:
        c_previews = []
        for b in m["ciphertext_blocks"]:
            c1_str = str(b["c1"])
            c2_str = str(b["c2"])
            c1_trunc = c1_str[:12] + "..." if len(c1_str) > 12 else c1_str
            c2_trunc = c2_str[:12] + "..." if len(c2_str) > 12 else c2_str
            c_previews.append({"c1": c1_trunc, "c2": c2_trunc})
        
        db_records.append({
            "id": m["id"],
            "sender": m["sender"],
            "receiver": m["receiver"] or "Pending",
            "ciphertext_blocks_preview": c_previews,
            "timestamp": m["timestamp"]
        })

    return jsonify(stringify_large_ints({
        "messages": room["messages"],
        "server_db_view": {
            "p": room["p"],
            "g": room["g"],
            "participants": list(room["participants"].keys()),
            "message_count": len(room["messages"]),
            "raw_records": db_records
        }
    }))


# =========================================
# POST /api/chat/leave
# =========================================
@chat_bp.route("/api/chat/leave", methods=["POST"])
def chat_leave():
    data = request.get_json() or {}
    room_id = data.get("room_id", "").strip().upper()
    username = data.get("username", "").strip()

    if not room_id or not username:
        return jsonify({"error": "room_id and username are required"}), 400

    if room_id in rooms:
        room = rooms[room_id]
        if username in room["participants"]:
            del room["participants"][username]
        # Clean up empty room
        if not room["participants"]:
            del rooms[room_id]

    return jsonify({"status": "left"})
