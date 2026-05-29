import secrets

def miller_rabin(n, rounds=40):
    """
    Probabilistic primality test — rounds=40 gives cryptographic confidence.
    Returns True if n is probably prime, False if n is definitely composite.
    """
    # Handle small base cases
    if n <= 1:
        return False
    if n <= 3:
        return True
    if n % 2 == 0:
        return False

    # Factor out powers of 2 from n - 1
    # Find d and s such that n - 1 = d * 2^s
    d = n - 1
    s = 0
    while d % 2 == 0:
        d //= 2
        s += 1

    # Witness loop
    for _ in range(rounds):
        # Choose a random security witness 'a' in the range [2, n - 2]
        a = secrets.randbelow(n - 3) + 2
        
        # Compute a^d % n
        x = pow(a, d, n)
        
        if x == 1 or x == n - 1:
            continue
            
        # Repeat s - 1 times
        composite_flag = True
        for _ in range(s - 1):
            x = pow(x, 2, n)
            if x == n - 1:
                composite_flag = False
                break
                
        # If no witness found it to be probably prime, it's definitely composite
        if composite_flag:
            return False

    return True

def generate_prime(bits):
    """
    Generate a random cryptographically secure prime of a given bit length.
    """
    if bits < 2:
        raise ValueError("Prime size must be at least 2 bits.")
        
    while True:
        # Generate a random number with the exact bit length specified
        # (n >= 2^(bits-1)) ensures it doesn't drop in bit length
        # (n | 1) ensures the number is odd
        n = secrets.randbits(bits)
        n |= (1 << (bits - 1)) | 1
        
        if miller_rabin(n):
            return n

# Example Usage:
if __name__ == "__main__":
    bit_length = 8
    print(f"Generating a {bit_length}-bit prime...")
    large_prime = generate_prime(bit_length)
    print(f"\nSuccess! Generated Prime:\n{large_prime}")