# Implementation Plan — ElGamal Cryptosystem Interactive Dashboard

We are building a highly polished, interactive React dashboard for the ElGamal Cryptosystem. It will connect to the existing Flask backend to provide users with an educational, visually stunning experience demonstrating asymmetric key generation, message encoding/chunking, probabilistic encryption, private key decryption, and core security principles (DLP hardness and ephemeral key reuse vulnerability).

---

## Design System & Visual Aesthetics

To ensure the interface is premium, state-of-the-art, and engaging, we will use a **sleek dark-mode aesthetic** built with **Vanilla CSS**:

- **Color Palette**:
  - Background: Deep slate-black (`#0a0a0c`)
  - Cards & Sections: Dark obsidian (`#121216`) with subtle borders (`#22222a`)
  - Accent colors:
    - Neon Indigo/Blue (`#6366f1` / `#4f46e5`) — primary branding and mathematical highlights
    - Emerald Green (`#10b981`) — success states, decrypted keys, and secure modes
    - Amber/Orange (`#f59e0b`) — educational insights and toy parameters
    - Coral Red (`#ef4444`) — security vulnerability alerts (e.g., ephemeral key reuse)
- **Glassmorphism & Shadows**: Use soft backdrop filters, delicate borders, and custom box-shadows to create layer depth.
- **Typography**: Google Font **Outfit** and **Fira Code** for monospace math outputs.
- **Micro-Animations**: Hover glows on buttons, fading state updates, and smooth collapsible sections for mathematical traces.
- **Interactive Testing**: Every input, button, and selectable element will have a unique and descriptive `id` attribute.

---

## User Review Required

> [!IMPORTANT]
> **API Connection**:
> The Flask backend has CORS enabled and runs on `http://127.0.0.1:5000`. We will configure the React app's API calls to fetch from this address.
> Please ensure you start the backend server with `python app.py` (or your preferred environment manager) when testing.

---

## Open Questions

> [!NOTE]
> 1. **Default Mode**: Would you like the dashboard to initialize in **Toy Mode (p=23, g=5, x=6)** to immediately show small math traces, or **Secure Mode (512-bit)**? *(We recommend initializing in Toy Mode for ease of learning, with a simple toggle to Secure Mode).*
> 2. **DLP Hardness Simulation**: For the DLP brute-forcer, we will implement a browser-side brute-force loop that searches for $x$ given $g^x \equiv y \pmod p$. Since standard JS `BigInt` handles any size, we can let users experience the fast completion for small primes and then show how it hangs for larger primes. Does that fit your educational goals?

---

## Proposed Changes

We will create a Vite-powered React project directly inside the existing `frontend/` directory.

```
frontend/
├── index.html                   # HTML Entry Point
├── package.json                 # React Dependencies (react, lucide-react)
├── vite.config.js               # Vite Configuration
├── src/
│   ├── main.jsx                 # React DOM Root
│   ├── App.jsx                  # Main State Controller
│   ├── index.css                # Global Design Tokens & Vanilla CSS Reset
│   └── components/
│       ├── KeyGenPanel.jsx      # Key generation dashboard controller
│       ├── EncryptPanel.jsx     # Encrypts message blocks, visualizes encoding
│       ├── DecryptPanel.jsx     # Decrypts message blocks, shows step-by-step math
│       ├── DLPDemo.jsx          # Discrete Logarithm brute-force visualizer
│       ├── ProbabilisticDemo.jsx# Explains & demonstrates semantic security
│       └── EphemeralDanger.jsx  # Simulates and explains danger of key reuse
```

---

### Frontend Component Breakdown

#### [NEW] [index.html](file:///c:/Users/Sneha/Desktop/cnt-ppt/ElGamal-Cryptosystem/frontend/index.html)
Initializes standard HTML5 shell, sets title to **ElGamal Cryptosystem — Interactive Dashboard**, loads **Outfit** & **Fira Code** Google Fonts, and mounts the React root.

#### [NEW] [vite.config.js](file:///c:/Users/Sneha/Desktop/cnt-ppt/ElGamal-Cryptosystem/frontend/vite.config.js)
Sets up a clean Vite config for React, with standard dev server settings.

#### [NEW] [package.json](file:///c:/Users/Sneha/Desktop/cnt-ppt/ElGamal-Cryptosystem/frontend/package.json)
Configures dependency versions, including `react`, `react-dom`, and `lucide-react` for beautiful, lightweight vector icons.

#### [NEW] [index.css](file:///c:/Users/Sneha/Desktop/cnt-ppt/ElGamal-Cryptosystem/frontend/src/index.css)
Declares root design variables (colors, fonts, animations) and provides styles for components, layouts, custom scrollbars, and responsiveness.

#### [NEW] [App.jsx](file:///c:/Users/Sneha/Desktop/cnt-ppt/ElGamal-Cryptosystem/frontend/src/App.jsx)
Acts as the global coordinator:
- Manages key pair state (`p`, `g`, `y`, `x`) so they can be seamlessly passed from the key generator to the encryption and decryption panels.
- Manages standard active views (Dashboard/Math Playground, Educational Demos).
- Implements nice sidebar or header tab switcher.

#### [NEW] [KeyGenPanel.jsx](file:///c:/Users/Sneha/Desktop/cnt-ppt/ElGamal-Cryptosystem/frontend/src/components/KeyGenPanel.jsx)
Allows the user to generate keys.
- **Toy Mode**: Triggers preset values ($p=23, g=5, x=6$) and explains what makes them toy values.
- **Secure Mode**: Standard bits selector (256, 512, 1024). Calls `/api/keygen` and displays the resulting huge parameters.
- Displays mathematical equations ($y = g^x \bmod p$) alongside outputs.
- Highlights private key $x$ as "KEEP SECRET" and public key components $(p, g, y)$ as "SHARE FREELY".
- Automatically propagates these generated parameters to the Encryption and Decryption tabs.

#### [NEW] [EncryptPanel.jsx](file:///c:/Users/Sneha/Desktop/cnt-ppt/ElGamal-Cryptosystem/frontend/src/components/EncryptPanel.jsx)
Takes text inputs, encodes them into block integers, and encrypts:
- Visualizes the encoding bridge step-by-step: String -> UTF-8 Bytes -> Numerical Blocks (each guaranteed $< p$).
- Calls `/api/encrypt` on submit.
- Displays computed values: Ephemeral keys $k$ generated randomly per block, shared secrets $s$, and ciphertext pairs $(c_1, c_2)$.
- Visualizes mathematical traces:
  - $c_1 = g^k \bmod p$
  - $s = y^k \bmod p$
  - $c_2 = M \cdot s \bmod p$
- Includes an option to **"Send to Decryptor"** to automatically load the encrypted blocks into the decrypt panel.

#### [NEW] [DecryptPanel.jsx](file:///c:/Users/Sneha/Desktop/cnt-ppt/ElGamal-Cryptosystem/frontend/src/components/DecryptPanel.jsx)
Accepts ciphertext blocks and private key $x$ to decrypt back to plaintext.
- Visualizes decryption mathematical trace step-by-step for each block:
  - Recover shared secret $s = c_1^x \bmod p$
  - Compute modular inverse $s^{-1} \bmod p$ (Extended Euclidean Algorithm)
  - Recover numerical plaintext $M = c_2 \cdot s^{-1} \bmod p$
- Decodes the final message blocks back to UTF-8 text and displays the successfully recovered message with high-contrast formatting.

#### [NEW] [DLPDemo.jsx](file:///c:/Users/Sneha/Desktop/cnt-ppt/ElGamal-Cryptosystem/frontend/src/components/DLPDemo.jsx)
Demonstrates the **Discrete Logarithm Problem** hardness:
- Offers an interactive brute-forcer where the user can pick small primes and see a JavaScript search loop find the exponent $x$ in real time.
- Measures time taken, steps performed.
- Explains the mathematical scaling (Big O complexity) and explains why brute-forcing a 512-bit prime takes longer than the age of the universe.

#### [NEW] [ProbabilisticDemo.jsx](file:///c:/Users/Sneha/Desktop/cnt-ppt/ElGamal-Cryptosystem/frontend/src/components/ProbabilisticDemo.jsx)
Demonstrates **Semantic Security** and probabilistic properties:
- Lets the user encrypt the same word multiple times using the current public key.
- Displays the generated ciphertexts in a list showing that they are entirely different each time (due to different ephemeral $k$ values).
- Contrasts this visually with deterministic algorithms like RSA (without padding).

#### [NEW] [EphemeralDanger.jsx](file:///c:/Users/Sneha/Desktop/cnt-ppt/ElGamal-Cryptosystem/frontend/src/components/EphemeralDanger.jsx)
Demonstrates the **danger of Ephemeral Key Reuse**:
- Allows users to simulate what happens if the same $k$ is used to encrypt two different blocks $M_1$ and $M_2$, generating $(c_{1a}, c_{2a})$ and $(c_{1b}, c_{2b})$.
- Shows mathematically how an attacker can recover the secret message: since $c_{1a} = c_{1b}$, the shared secret $s$ is identical. Therefore, $c_{2a} / c_{2b} = M_1 / M_2 \bmod p$. If the attacker knows $M_1$ (e.g. a standard header), they can compute $M_2 = M_1 \cdot c_{2b} \cdot c_{2a}^{-1} \bmod p$ and break the scheme entirely!

---

## Verification Plan

### Automated Tests
- Build verification: Run `npm run build` in the `frontend` directory to ensure perfect compilation.
- Console-error checks: We will open the frontend locally using the dev server, verify it loads correctly, and contains zero runtime script exceptions.

### Manual Verification
- **Key Generation**: Generate both Toy and Secure (512-bit) keys. Confirm variables update globally.
- **Encryption**: Enter messages with emojis and punctuation, verify they encode to block ints, encrypt, and render calculations.
- **Decryption**: Click "Send to Decryptor" from the Encryption panel, click Decrypt with the auto-populated private key, and verify the identical text is recovered.
- **Demos**: Interact with DLP, Probabilistic, and Ephemeral Key Reuse tabs to ensure animations, clocks, and mathematical calculations work without bugs.
