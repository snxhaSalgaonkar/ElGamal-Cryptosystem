from math_engine.mod_arithmetic import mod_pow, mod_inverse


def decrypt_message(p, x, c1, c2):
    """
    Decrypt ElGamal ciphertext.
    """

    # Recover shared secret
    s = mod_pow(c1, x, p)

    # Compute inverse
    s_inverse = mod_inverse(s, p)

    # Recover plaintext
    message = (c2 * s_inverse) % p

    return {
        "message": message,
        "shared_secret": s,
        "shared_secret_inverse": s_inverse
    }