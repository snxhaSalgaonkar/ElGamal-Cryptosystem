import random

from math_engine.mod_arithmetic import mod_pow
from math_engine.primality import miller_rabin
from math_engine.primitive_root import is_primitive_root


def generate_keys(p, g, x=None):
    """
    Generate ElGamal public/private keys.

    Public Key  = (p, g, y)
    Private Key = x
    """

    # Validate prime
    if not miller_rabin(p):
        raise ValueError("p must be prime")

    # Validate primitive root
    if not is_primitive_root(g, p):
        raise ValueError("g is not a primitive root modulo p")

    # Generate random private key if not provided
    if x is None:
        x = random.randint(2, p - 2)

    # Validate private key range
    if not (1 < x < p - 1):
        raise ValueError("Private key x must satisfy 1 < x < p-1")

    # Compute public key
    y = mod_pow(g, x, p)

    return {
        "public_key": {
            "p": p,
            "g": g,
            "y": y
        },
        "private_key": x
    }