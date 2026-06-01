def get_prime_factors(n):
    """Helper function to find all unique prime factors of n"""
    factors = set()
    # Check for 2
    if n % 2 == 0:
        factors.add(2)
        while n % 2 == 0:
            n //= 2
            
    # Check odd numbers up to sqrt(n)
    i = 3
    while i * i <= n:
        if n % i == 0:
            factors.add(i)
            while n % i == 0:
                n //= i
        i += 2
        
    # If n is still greater than 2, then n itself is prime
    if n > 2:
        factors.add(n)
        
    return factors

def is_primitive_root(g, p):
    """Check g generates full group Z_p* — order of g must equal p-1."""
    if g <= 1 or g >= p:
        return False

    # Large moduli: use safe-prime test (secure mode uses generate_safe_prime)
    if p >= 10_000:
        return pow(g, (p - 1) // 2, p) == p - 1

    phi = p - 1
    factors = get_prime_factors(phi)

    for q in factors:
        if pow(g, phi // q, p) == 1:
            return False

    return True

def find_primitive_root(p):
    """Find a valid generator for prime p (fast for large safe primes)."""
    if p <= 1:
        return None
    if p == 2:
        return 1

    # Toy / small primes: exhaustive search is fine
    if p < 10_000:
        for g in range(2, p):
            if is_primitive_root(g, p):
                return g
        return None

    # Large primes (e.g. 128–512 bit safe primes from generate_safe_prime):
    # g is a primitive root mod safe prime p = 2q+1 iff g^((p-1)/2) ≡ -1 (mod p)
    for g in range(2, 256):
        if pow(g, (p - 1) // 2, p) == p - 1:
            return g

    raise ValueError(f"Could not find a primitive root modulo p (bit length {p.bit_length()})")

# --- Example Usage ---
if __name__ == "__main__":
    p = 23
    root = find_primitive_root(p)
    print(p, root)  # Output: 5
    
    # Verify 5 generates Z_23*
    print(is_primitive_root(5, 23))  # Output: True
    print(is_primitive_root(4, 23))  # Output: False