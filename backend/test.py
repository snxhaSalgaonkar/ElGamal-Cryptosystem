from crypto.encryption import encrypt_message
from crypto.decryption import decrypt_message

p = 212123585328088672567285756060968609017
g = 3
y = 210115104279602974102087901695141143557
x = 43412256668853100349837655730863918041

M = 1410450877551

enc = encrypt_message(p, g, y, M)

cipher = enc["ciphertext"]

dec = decrypt_message(
    p,
    x,
    cipher["c1"],
    cipher["c2"]
)

print("Original:", M)
print("Recovered:", dec["message"])
# from encoding.message_encoder import blocks_to_text

# print(blocks_to_text([1410450877551]))