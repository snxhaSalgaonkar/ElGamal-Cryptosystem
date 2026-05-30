def mod_pow(base, exp, mod):
    if mod == 1:
        return 0
    result = 1
    base = base % mod  
    
    while exp > 0:
        if exp % 2 == 1:
            result = (result * base) % mod
        base = (base * base) % mod
        exp //= 2  
        
    return result

def mod_inverse(a, mod):
    m0 = mod
    y = 0
    x = 1

    if mod == 1:
        return None
    while a > 1:
        # q is quotient
        if mod == 0:
            break
        q = a // mod
        t = mod
        mod = a % mod
        a = t
        t = y

        y = x - q * y
        x = t

    if x < 0:
        x = x + m0

    if a != 1:
        return None 
        
    return x


if __name__ == "__main__":
    # 1. Test Fast Exponentiation (5^3 mod 13)
    # 5^3 = 125 -> 125 % 13 = 8
    print("5^3 mod 13 =", mod_pow(5, 3, 13))  # Output: 8

    # 2. Test Modular Inverse (Find inverse of 3 mod 11)
    # 3 * 4 = 12 ≡ 1 (mod 11), so inverse is 4
    inv = mod_inverse(3, 11)
    print("Inverse of 3 mod 11 =", inv)  # Output: 4