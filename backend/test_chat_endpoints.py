import urllib.request
import urllib.parse
import json
import time

BASE_URL = "http://127.0.0.1:5000"

def make_request(path, method="GET", data=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    
    req_data = None
    if data:
        req_data = json.dumps(data).encode("utf-8")
        
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            return response.status, json.loads(res_body) if res_body else None
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        print(f"HTTP Error {e.code} for {path}: {err_body}")
        return e.code, json.loads(err_body) if err_body else None
    except Exception as e:
        print(f"Network Error for {path}: {e}")
        return None, None

def run_tests():
    print("--- Starting Secure Chat API Endpoint Tests ---")
    
    # 1. Test IP endpoint
    print("\n1. Testing /api/chat/ip...")
    status, res = make_request("/api/chat/ip")
    assert status == 200, "IP route failed"
    print(" [OK] Local IP:", res.get("ip"), "Port:", res.get("port"))
    
    # 2. Test Join Room (Alice)
    print("\n2. Testing Alice Joining 'TEST_ROOM' in Toy Mode...")
    join_data = {
        "room_id": "TEST_ROOM",
        "username": "Alice",
        "mode": "toy"
    }
    status, res = make_request("/api/chat/join", "POST", join_data)
    assert status == 200, f"Join Alice failed: {res}"
    assert int(res["p"]) == 23 and int(res["g"]) == 5, "Invalid parameters for Toy mode"
    alice_x = res["x"]
    alice_y = res["y"]
    print(f" [OK] Alice joined. Keys generated: x_A={alice_x}, y_A={alice_y}")
    
    # 3. Test Room Status
    print("\n3. Testing /api/chat/status for 'TEST_ROOM'...")
    status, res = make_request("/api/chat/status?room_id=TEST_ROOM")
    assert status == 200, "Room status failed"
    assert "Alice" in res["participants"], "Alice not registered"
    print(" [OK] Participants registered:", res["participants"])
    
    # 4. Test Join Room (Bob)
    print("\n4. Testing Bob Joining 'TEST_ROOM'...")
    join_data = {
        "room_id": "TEST_ROOM",
        "username": "Bob",
        "mode": "toy"
    }
    status, res = make_request("/api/chat/join", "POST", join_data)
    assert status == 200, "Join Bob failed"
    bob_x = res["x"]
    bob_y = res["y"]
    print(f" [OK] Bob joined. Keys generated: x_B={bob_x}, y_B={bob_y}")
    
    # Check status again to verify both present
    status, res = make_request("/api/chat/status?room_id=TEST_ROOM")
    assert len(res["participants"]) == 2, "Should have exactly 2 participants"
    print(" [OK] Room status now shows both users:", res["participants"])
    
    # 5. Test Room Cap (Charlie should be blocked)
    print("\n5. Testing Room size constraint (Charlie joins)...")
    join_data = {
        "room_id": "TEST_ROOM",
        "username": "Charlie",
        "mode": "toy"
    }
    status, res = make_request("/api/chat/join", "POST", join_data)
    assert status == 400, "Should have rejected third participant"
    print(" [OK] Charlie successfully blocked. Error message:", res.get("error"))
    
    # 6. Test Message Encryption and Sending (Alice encrypts for Bob)
    print("\n6. Simulating Alice sending encrypted message to Bob...")
    # Bob public key is bob_y, generator g=5, prime p=23
    # Let's call the official encrypt API helper to get ciphertext blocks
    enc_data = {
        "message": 15, # Toy mode payload
        "p": 23,
        "g": 5,
        "y": int(bob_y)
    }
    status, enc_res = make_request("/api/encrypt", "POST", enc_data)
    assert status == 200, "Encryption helper failed"
    ciphertext = enc_res["ciphertext_blocks"]
    print(f" [OK] Alice encrypted 15 using Bob's public key y_B={bob_y}. Ciphertext blocks: {ciphertext}")
    
    # Post to chat
    send_data = {
        "room_id": "TEST_ROOM",
        "sender": "Alice",
        "ciphertext_blocks": ciphertext
    }
    status, send_res = make_request("/api/chat/send", "POST", send_data)
    assert status == 200, "Send message failed"
    print(" [OK] Ciphertext message sent to server.")
    
    # 7. Test Message Polling and Decryption (Bob polls and decrypts)
    print("\n7. Simulating Bob polling and decrypting Alice's message...")
    status, res = make_request("/api/chat/messages?room_id=TEST_ROOM")
    assert status == 200, "Poll messages failed"
    assert len(res["messages"]) == 1, "Should have 1 message"
    received_msg = res["messages"][0]
    print(f" [OK] Bob received ciphertext: {received_msg['ciphertext_blocks']}")
    
    # Bob decrypts using his private key bob_x
    dec_data = {
        "ciphertext_blocks": received_msg["ciphertext_blocks"],
        "x": int(bob_x),
        "p": 23
    }
    status, dec_res = make_request("/api/decrypt", "POST", dec_data)
    assert status == 200, "Decryption failed"
    assert dec_res["recovered_text"] == "15", "Decryption recovered incorrect message"
    print(f" [OK] Bob successfully decrypted message: {dec_res['recovered_text']}")
    
    # 8. Clean up (Alice and Bob leave)
    print("\n8. Testing leaving rooms...")
    status, _ = make_request("/api/chat/leave", "POST", {"room_id": "TEST_ROOM", "username": "Alice"})
    assert status == 200
    status, _ = make_request("/api/chat/leave", "POST", {"room_id": "TEST_ROOM", "username": "Bob"})
    assert status == 200
    
    # Verify room is deleted from memory
    status, _ = make_request("/api/chat/status?room_id=TEST_ROOM")
    assert status == 404, "Room should be deleted after both participants leave"
    print(" [OK] Both participants left. Room successfully cleaned up.")
    
    print("\n--- All Backend Chat API Tests Passed Successfully! ---")

if __name__ == "__main__":
    run_tests()
