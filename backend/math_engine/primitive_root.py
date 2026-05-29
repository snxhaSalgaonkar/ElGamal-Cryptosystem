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
    """Check g generates full group Z_p* — order of g must equal p-1"""
    if g <= 1 or g >= p:
        return False
        
    phi = p - 1
    factors = get_prime_factors(phi)
    
    # Check g^((p-1)/q) mod p for each prime factor q
    for q in factors:
        if pow(g, phi // q, p) == 1:
            return False
            
    return True

def find_primitive_root(p):
    """Find smallest valid generator for prime p"""
    if p <= 1:
        return None
    if p == 2:
        return 1
        
    # Iterate through possible generators starting from 2
    for g in range(2, p):
        if is_primitive_root(g, p):
            return g
            
    return None

# --- Example Usage ---
if __name__ == "__main__":
    p = 23
    root = find_primitive_root(p)
    print(p, root)  # Output: 5
    
    # Verify 5 generates Z_23*
    print(is_primitive_root(5, 23))  # Output: True
    print(is_primitive_root(4, 23))  # Output: False