from crypto.encryption import encrypt_message
from crypto.decryption import decrypt_message

from encoding.message_encoder import (
    text_to_blocks,
    blocks_to_text
)
from encoding.message_encoder import (
    text_to_blocks,
    blocks_to_text
)




def full_encrypt(message_text, public_key):

    p = public_key["p"]
    g = public_key["g"]
    y = public_key["y"]

    # Convert text → multiple integer blocks
    numeric_blocks = text_to_blocks(message_text, p)

    ciphertext_blocks = []

    trace_steps = []

    # Encrypt every block separately
    for index, block in enumerate(numeric_blocks):

        encrypted = encrypt_message(
            p=p,
            g=g,
            y=y,
            message=block
        )

        cipher = encrypted["ciphertext"]

        ciphertext_blocks.append(cipher)

        # Store educational trace info
        trace_steps.append({
            "block_index": index,
            "original_block": block,
            "c1": cipher["c1"],
            "c2": cipher["c2"],
            "ephemeral_key": encrypted["ephemeral_key"],
            "shared_secret": encrypted["shared_secret"]
        })

    return {
        "original_text": message_text,

        "numeric_blocks": numeric_blocks,

        "ciphertext_blocks": ciphertext_blocks,

        "trace_steps": trace_steps
    }
def full_decrypt(ciphertext_blocks, private_key, p):

    recovered_blocks = []

    trace_steps = []

    # Decrypt every ciphertext block
    for index, cipher in enumerate(ciphertext_blocks):

        decrypted = decrypt_message(
            p=p,
            x=private_key,
            c1=cipher["c1"],
            c2=cipher["c2"]
        )

        recovered_blocks.append(
            decrypted["message"]
        )

        trace_steps.append({
            "block_index": index,
            "recovered_block": decrypted["message"],
            "shared_secret": decrypted["shared_secret"],
            "shared_secret_inverse":
                decrypted["shared_secret_inverse"]
        })

    # Convert integer blocks → text
    recovered_text = blocks_to_text(
        recovered_blocks
    )

    return {
        "recovered_text": recovered_text,

        "recovered_blocks": recovered_blocks,

        "trace_steps": trace_steps
    }