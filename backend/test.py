from crypto.keygen import generate_keys
from crypto.encryption import encrypt_message
from crypto.decryption import decrypt_message


# Generate keys
keys = generate_keys(23, 5, 6)

public_key = keys["public_key"]
private_key = keys["private_key"]

# Encrypt
encrypted = encrypt_message(
    p=public_key["p"],
    g=public_key["g"],
    y=public_key["y"],
    message=10,
    k=3
)

cipher = encrypted["ciphertext"]

# Decrypt
decrypted = decrypt_message(
    p=public_key["p"],
    x=private_key,
    c1=cipher["c1"],
    c2=cipher["c2"]
)

print("Original:", 10)
print("Recovered:", decrypted["message"])