def mod_pow(base, exp, mod):
    """Fast exponentiation — g^x mod p in O(log x) steps
    Implements the Square-and-Multiply (binary exponentiation) algorithm.
    """
    if mod == 1:
        return 0
    
    result = 1
    base = base % mod  # Handle base larger than mod
    
    while exp > 0:
        # If the current bit of the exponent is 1, multiply the result
        if exp % 2 == 1:
            result = (result * base) % mod
        
        # Square the base and shift the exponent bit to the right
        base = (base * base) % mod
        exp //= 2  # Equivalent to exp >>= 1
        
    return result

def mod_inverse(a, mod):
    """Extended Euclidean Algorithm — finds a^-1 mod m
    Solves for x in: a * x ≡ 1 (mod m)
    Returns None if the inverse does not exist (i.e., gcd(a, m) != 1).
    """
    m0 = mod
    y = 0
    x = 1

    if mod == 1:
        return None

    # Apply the Extended Euclidean Algorithm
    while a > 1:
        # q is quotient
        if mod == 0:
            break
        q = a // mod
        t = mod

        # mod is remainder now, process same as Euclid's algo
        mod = a % mod
        a = t
        t = y

        # Update x and y
        y = x - q * y
        x = t

    # Make x positive if it's negative
    if x < 0:
        x = x + m0

    # Verification: Ensure that gcd(a_original, mod_original) == 1
    # If the final 'a' is not 1, the inverse doesn't exist.
    if a != 1:
        return None 
        
    return x

# --- Example Usage ---
if __name__ == "__main__":
    # 1. Test Fast Exponentiation (5^3 mod 13)
    # 5^3 = 125 -> 125 % 13 = 8
    print("5^3 mod 13 =", mod_pow(5, 3, 13))  # Output: 8

    # 2. Test Modular Inverse (Find inverse of 3 mod 11)
    # 3 * 4 = 12 ≡ 1 (mod 11), so inverse is 4
    inv = mod_inverse(3, 11)
    print("Inverse of 3 mod 11 =", inv)  # Output: 4