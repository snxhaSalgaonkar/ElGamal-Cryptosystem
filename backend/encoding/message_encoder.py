def text_to_blocks(text, p):
    """
    Convert string → list of integers, each < p
    Strategy: encode as UTF-8 bytes → group into chunks
    that fit numerically below p
    """
    if not text:
        return []

    # 1. Convert text to raw bytes
    data_bytes = text.encode('utf-8')
    
    # 2. Calculate safe chunk size in bytes
    # p.bit_length() gives total bits. Subtract 1 to guarantee the value is strictly < p.
    # Divide by 8 to get total safe bytes per block.
    chunk_size = (p.bit_length() - 1) // 8
    if chunk_size < 1:
        raise ValueError("Prime p is too small to encode text characters safely.")

    blocks = []
    
    # 3. Chop bytes into chunks and convert each chunk to an integer
    for i in range(0, len(data_bytes), chunk_size):
        chunk = data_bytes[i:i + chunk_size]
        
        # We prepend a 0x01 byte to every chunk. This acts as a marker 
        # to preserve any leading zero bytes when we reconstruct the text later.
        marked_chunk = b'\x01' + chunk
        
        # Convert byte array to a large integer (Big-Endian)
        block_int = int.from_bytes(marked_chunk, byteorder='big')
        blocks.append(block_int)
        
    return blocks

def blocks_to_text(blocks):
    """Reverse: list of integers → original string"""
    if not blocks:
        return ""
        
    reconstructed_bytes = bytearray()
    
    for block in blocks:
        # Determine how many bytes are needed to represent this integer
        # (Add 7 to handle rounding up during integer division by 8)
        byte_length = (block.bit_length() + 7) // 8
        
        # Convert integer back to bytes
        marked_chunk = block.to_bytes(byte_length, byteorder='big')
        
        # Remove the leading 0x01 marker byte we added during encoding
        if marked_chunk[0] == 1:
            chunk = marked_chunk[1:]
        else:
            # Fallback if the block didn't have a leading 1 byte
            chunk = marked_chunk
            
        reconstructed_bytes.extend(chunk)
        
    # 4. Decode the complete byte array back to a UTF-8 string
    return reconstructed_bytes.decode('utf-8')

# --- Example Usage ---
if __name__ == "__main__":
    # A 512-bit prime example
    p_512 = 13231189315056707324311874271816743956327429189374218937491238472913741293749123749123749123749123749123471923749123741923749123749123749123749123749123749
    #p_512 = 13
    secret_message = (
        "Cryptography is the practice and study of techniques for secure communication "
        "in the presence of adversarial behavior. This message is long enough to span "
        "multiple 512-bit blocks! 🔥"
    )
    
    # Text to Numbers
    encrypted_blocks = text_to_blocks(secret_message, p_512)
    print(f"Message split into {len(encrypted_blocks)} blocks.")
    for idx, b in enumerate(encrypted_blocks):
        print(f"Block {idx + 1}: {b} (Is < p: {b < p_512})")
        
    print("\n" + "="*40 + "\n")
    
    # Numbers back to Text
    decrypted_message = blocks_to_text(encrypted_blocks)
    print("Decoded Message:")
    print(decrypted_message)