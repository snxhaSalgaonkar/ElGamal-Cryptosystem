# ElGamal Cryptosystem

An interactive learning application for the **ElGamal public-key cryptosystem**. Explore key generation, encryption, and decryption with step-by-step modular arithmetic traces, toy parameters you can verify by hand, and secure primes for real UTF-8 messages—all grounded in the **Discrete Logarithm Problem (DLP)**.

## Features

### Landing page
- **Hero** with guided entry points: *Learn & Explore* and *Get Started Wizard*
- **Learn section** with concept cards for key generation, encryption, and decryption
- **Security laboratories** (tabbed):
  - **DLP Hardness** — brute-force discrete log to see complexity scale
  - **Probabilistic Security** — same plaintext, different ciphertexts (random ephemeral `k`)
  - **Key Reuse Threat** — why reusing ephemeral keys breaks security

### Interactive wizard (4 steps)
1. **Parameters & message** — Toy mode (`p = 23`, integer message) or Secure mode (128 / 256 / 512-bit safe primes, UTF-8 text)
2. **Key generation** — public `(p, g, y)` and private `x`, with optional private-key reveal
3. **Encryption** — block chunking, ephemeral key `k`, ciphertext `(c₁, c₂)`, full math trace
4. **Decryption** — shared secret recovery, modular inverse (EEA), plaintext recovery

### Backend
- Miller–Rabin primality testing and **safe prime** generation for secure mode
- Fast primitive-root discovery for large moduli
- Message encoding/decoding for multi-character strings
- Large integers returned as **strings** in JSON (safe for JavaScript)

## Tech stack

| Layer    | Stack                                      |
|----------|--------------------------------------------|
| Frontend | React 19, Vite 8, Lucide icons, vanilla CSS |
| Backend  | Python 3, Flask, Flask-CORS                |
| Crypto   | Custom modular arithmetic (no external crypto libs) |

## Project structure

```
ElGamal-Cryptosystem/
├── backend/
│   ├── app.py                 # Flask entry point
│   ├── routes/api.py          # REST API
│   ├── crypto/                # Keygen, encrypt, decrypt
│   ├── math_engine/           # Primality, primitive roots, mod arithmetic
│   ├── encoding/              # Text ↔ integer blocks
│   ├── services/              # Full encrypt/decrypt orchestration
│   └── utils/json_codec.py    # Big-int JSON helpers
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Landing page + labs
│   │   ├── api/client.js      # API client (proxy, timeout, errors)
│   │   └── components/
│   │       ├── CryptoWizard.jsx
│   │       ├── DLPDemo.jsx
│   │       ├── ProbabilisticDemo.jsx
│   │       └── EphemeralDanger.jsx
│   └── vite.config.js         # Dev proxy: /api → Flask
└── implementation_plan.md     # Design notes
```

## Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+

## Installation

### Backend

```bash
cd backend
pip install flask flask-cors
```

### Frontend

```bash
cd frontend
npm install
```

## Running the application

Start **both** servers. The frontend proxies API calls to Flask in development.

**Terminal 1 — Backend (port 5000):**

```bash
cd backend
python app.py
```

**Terminal 2 — Frontend (port 5173):**

```bash
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

> **Note:** Secure key generation (especially 512-bit) may take several seconds. Ensure Flask is running before using the wizard; otherwise the UI will show a connection error.

### Production build (frontend only)

```bash
cd frontend
npm run build
npm run preview
```

Point the frontend at the backend by setting the API base in `frontend/src/api/client.js` (production uses `http://127.0.0.1:5000` by default).

## API reference

Base URL: `http://127.0.0.1:5000` (or `/api` via Vite proxy in dev)

### `POST /api/keygen`

Generate ElGamal key pair.

**Request body:**

```json
{
  "mode": "toy"
}
```

```json
{
  "mode": "secure",
  "bits": 256
}
```

| Field  | Values                          | Description                    |
|--------|---------------------------------|--------------------------------|
| `mode` | `"toy"` \| `"secure"`           | Toy uses fixed `p=23, g=5`     |
| `bits` | `128`, `256`, `512` (secure only) | Safe prime bit length        |

**Response:**

```json
{
  "public_key": { "p": "...", "g": "...", "y": "..." },
  "private_key": "..."
}
```

### `POST /api/encrypt`

**Request body:**

```json
{
  "message": "Hello",
  "p": "...",
  "g": "...",
  "y": "..."
}
```

For toy mode, `message` may be an integer (e.g. `15`). Returns `ciphertext_blocks`, `numeric_blocks`, and `trace_steps`.

### `POST /api/decrypt`

**Request body:**

```json
{
  "ciphertext_blocks": [{ "c1": "...", "c2": "..." }],
  "x": "...",
  "p": "..."
}
```

Returns `recovered_text`, `recovered_blocks`, and `trace_steps`.

## Modes explained

| Mode   | Modulus        | Message input        | Use case                          |
|--------|----------------|----------------------|-----------------------------------|
| **Toy**  | `p = 23`, `g = 5` | Integer `1 … 22`     | Trace math on paper               |
| **Secure** | 128–512-bit safe prime | UTF-8 text strings | Realistic encoding & chunking |

## ElGamal overview (quick reference)

**Key generation:** private `x`, public `y ≡ g^x (mod p)`

**Encryption** (ephemeral `k`):

- `c₁ = g^k mod p`
- `s = y^k mod p`
- `c₂ = (M · s) mod p`

**Decryption** (private `x`):

- `s = c₁^x mod p`
- `M = c₂ · s⁻¹ mod p`

Security relies on the hardness of the **discrete logarithm**: given `g`, `y`, and `p`, finding `x` is infeasible for large primes.

## Development

```bash
# Frontend lint
cd frontend && npm run lint

# Backend smoke test (optional)
cd backend && python test.py
```

## License

Educational project for learning public-key cryptography. Use responsibly—not for production secrets.
