import random

from math_engine.mod_arithmetic import mod_pow


def encrypt_message(p, g, y, message, k=None):
    """
    Encrypt a numeric plaintext using ElGamal.
    """

    # Message must be smaller than p
    if not (0 < message < p):
        raise ValueError("Message must satisfy 0 < M < p")

    # Generate random ephemeral key
    if k is None:
        k = random.randint(2, p - 2)

    # Compute c1
    c1 = mod_pow(g, k, p)

    # Shared secret
    s = mod_pow(y, k, p)

    # Compute c2
    c2 = (message * s) % p

    return {
        "ciphertext": {
            "c1": c1,
            "c2": c2
        },
        "ephemeral_key": k,
        "shared_secret": s
    }