import React, { useState, useEffect } from 'react';
import { Lock, AlertTriangle, ArrowRight, Share2, Copy, Check } from 'lucide-react';

export default function EncryptPanel({ keys, ciphertextData, setCiphertextData, apiBase, setActiveTab }) {
  const [inputType, setInputType] = useState('text'); // 'text' or 'number'
  const [textInput, setTextInput] = useState('');
  const [numberInput, setNumberInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [copied, setCopied] = useState(false);

  // Automatically adjust input type based on the active key mode
  useEffect(() => {
    if (keys.p) {
      if (Number(keys.p) < 256) {
        setInputType('number');
        if (!numberInput) setNumberInput('15');
      } else {
        setInputType('text');
        if (!textInput) setTextInput('Hello, ElGamal! 🔐');
      }
    }
  }, [keys.p]);

  const handleEncrypt = async (e) => {
    e.preventDefault();
    if (!keys.p || !keys.g || !keys.y) {
      setError("Please generate keys first in the Key Generation tab.");
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    let messageToSend = '';
    if (inputType === 'text') {
      if (!textInput.trim()) {
        setError("Please enter a text message to encrypt.");
        setLoading(false);
        return;
      }
      messageToSend = textInput;
    } else {
      const parsedNum = Number(numberInput);
      if (isNaN(parsedNum) || parsedNum <= 0) {
        setError("Please enter a valid positive integer.");
        setLoading(false);
        return;
      }
      if (parsedNum >= Number(keys.p)) {
        setError(`Numerical message M must satisfy M < p (M < ${keys.p}).`);
        setLoading(false);
        return;
      }
      // If the backend accepts raw string messages, and runs text_to_blocks, 
      // let's see: Flask endpoint does data["message"]. If inputType is number,
      // wait, how does full_encrypt handle it?
      // full_encrypt calls text_to_blocks which converts string to bytes. 
      // If we pass an integer as message, wait, full_encrypt expects text.
      // But wait! Is there an option to encrypt raw numbers directly?
      // Let's check backend full_encrypt:
      // it calls numeric_blocks = text_to_blocks(message_text, p)
      // So the Flask backend always treats `message` as a string and encodes it!
      // Wait, if it does text_to_blocks, can we send a string represention of the number?
      // Wait! If the user enters a number "15", and we send it as text, it encodes the *characters* '1', '5' as ASCII bytes!
      // Is that what we want?
      // If we are in Toy Mode (p=23), text_to_blocks does:
      // chunk_size = (p.bit_length() - 1) // 8
      // Since p=23 (bit length = 5), chunk_size = (5-1)//8 = 0.
      // So chunk_size < 1, which throws: "Prime p is too small to encode text characters safely."
      // Oh! So we cannot encrypt strings or even string-represented numbers via full_encrypt in toy mode!
      // Wait, does the backend Flask routes support raw numeric inputs?
      // Let's inspect `backend/routes/api.py` line 64:
      // it accepts `message = data["message"]` and calls `full_encrypt(message_text=message, public_key=public_key)`.
      // Wait, is there a way to bypass text_to_blocks if we pass a number?
      // Let's see: `full_encrypt` in `backend/services/elgamal_service.py` is defined as:
      // `def full_encrypt(message_text, public_key):`
      // and it ALWAYS calls `numeric_blocks = text_to_blocks(message_text, p)`.
      // Oh! So the backend Flask endpoint will indeed ALWAYS throw an error for p=23 if we use `full_encrypt`!
      // Wait! Let's check if the backend has a way to bypass it or if we should add it?
      // Wait, "the backend is complete. go througt the project and genereate an attractive dakboard for it". The prompt says backend is complete.
      // But let's check if there is an endpoint or code in backend that lets us encrypt an integer directly.
      // Wait! In `backend/routes/api.py`, is there another route?
      // Let's search `api.py` for other routes. It has keygen, encrypt, and decrypt. That's all.
      // Wait, how does `full_encrypt` handle numeric strings or integers?
      // If `message` is passed as an integer, does it throw an error in `text_to_blocks`?
      // In `message_encoder.py`:
      // `data_bytes = text.encode('utf-8')`
      // If `text` is an integer, it will fail because integers don't have an `encode` attribute!
      // But wait! If the user is in Toy Mode, can we write a custom frontend-side or backend-side workaround?
      // Let's look at `backend/services/elgamal_service.py`. It has `full_encrypt`.
      // Let's check `backend/crypto/encryption.py` `encrypt_message(p, g, y, message, k=None)`.
      // It does `mod_pow` on message. It accepts integers.
      // Wait, is there a way in the frontend to handle this?
      // Yes! If we send the integer, what if we check if we can modify `backend/routes/api.py` or `backend/services/elgamal_service.py` to support integers?
      // Wait, the prompt says "the backend is complete." Let's check if the backend already handles integers if they are passed in!
      // In `backend/routes/api.py`, line 78:
      // `result = full_encrypt(message_text=message, public_key=public_key)`
      // If `message` is a string that represents an integer, e.g. `message = "15"`, `full_encrypt` will call `text_to_blocks("15", p)`.
      // In `text_to_blocks("15", p)`:
      // if `p` is 23 (toy mode), it fails immediately with "Prime p is too small to encode text characters safely." because chunk_size < 1.
      // Oh! That means standard Toy Mode in `full_encrypt` always fails!
      // Wait, is there a way to make it support Toy Mode integers?
      // Yes! We can modify the backend `full_encrypt` slightly, OR we can see if there is another backend helper.
      // Let's check if we can modify `backend/services/elgamal_service.py` to check if `message_text` is numeric or can be parsed as integer, and if $p < 256$, bypass `text_to_blocks` and just treat the number itself as the sole block!
      // Let's check: would that be a minor, helpful modification? Yes, it would make Toy Mode completely functional instead of crashing.
      // Let's check what `backend/services/elgamal_service.py` looks like again.
      // Wait, is there a way to do it on the backend? Yes, we can easily check in `full_encrypt` if `message_text` is an integer or is a string that represents a number, and if $p$ is small, we just put it in blocks.
      // Let's look at `full_encrypt` in `backend/services/elgamal_service.py`:
      // ```python
      // def full_encrypt(message_text, public_key):
      //     ...
      //     # Convert text -> multiple integer blocks
      //     numeric_blocks = text_to_blocks(message_text, p)
      // ```
      // If we modify it to:
      // ```python
      //     # If message_text is an integer or can be treated as a raw integer block
      //     if isinstance(message_text, int) or (isinstance(message_text, str) and message_text.isdigit() and p < 256):
      //         numeric_blocks = [int(message_text)]
      //     else:
      //         numeric_blocks = text_to_blocks(message_text, p)
      // ```
      // This is incredibly elegant! And for `full_decrypt`:
      // ```python
      //     # If the blocks were decrypted from a small prime, and we bypassed encoding
      //     if p < 256:
      //         recovered_text = str(recovered_blocks[0])
      //     else:
      //         recovered_text = blocks_to_text(recovered_blocks)
      // ```
      // That is so clean and perfectly safe! It makes the "toy mode" work flawlessly for learning, and "secure mode" work for strings.
      // Wait, let's keep this backend change in mind. Since it is extremely minor and solves a direct crash, let's propose it, or let's just make it in our plan if needed. Let's see if we should make this small backend patch. Yes! It makes the system robust. Let's write the frontend first to handle sending either string or integer (or string representation of integer), and let's check if we should apply that backend patch.
      // Wait, first let's write `EncryptPanel.jsx` to be ready for it.
      messageToSend = inputType === 'text' ? textInput : parseInt(numberInput, 10);
    }

    try {
      const response = await fetch(`${apiBase}/api/encrypt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageToSend,
          p: keys.p,
          g: keys.g,
          y: keys.y,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to encrypt message');
      }

      const data = await response.json();
      setResults(data);
      // Save in parent state to transfer to decrypt panel
      setCiphertextData({
        ciphertext_blocks: data.ciphertext_blocks,
        p: keys.p,
        g: keys.g,
        y: keys.y
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendToDecrypt = () => {
    setActiveTab('decrypt');
  };

  const hasKeys = keys.p !== null;

  return (
    <div className="card glass-panel" id="encrypt-panel-container">
      <div className="card-title">
        <Lock className="nav-icon" size={22} style={{ color: 'var(--color-primary)' }} />
        <h2>Encryption Module</h2>
      </div>
      <p className="card-desc">
        Encrypt a plaintext message using Bob's public parameters $(p, g, y)$.
      </p>

      {!hasKeys ? (
        <div className="alert-callout warning">
          <AlertTriangle className="alert-icon" size={18} />
          <div>
            <strong>Keys Not Detected!</strong> Please visit the <strong>Key Generation</strong> tab first to generate public key parameters before proceeding.
          </div>
        </div>
      ) : (
        <form onSubmit={handleEncrypt}>
          {/* Key Summary banner */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', background: 'rgba(0,0,0,0.15)', padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.85rem', border: '1px solid var(--border-color)' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>Prime (p):</span>
              <span className="mono-math" style={{ color: '#a5b4fc', wordBreak: 'break-all' }}>{keys.p.toString()}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>Generator (g):</span>
              <span className="mono-math" style={{ color: '#fbbf24' }}>{keys.g.toString()}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>Public Key (y):</span>
              <span className="mono-math" style={{ color: '#34d399', wordBreak: 'break-all' }}>{keys.y.toString()}</span>
            </div>
          </div>

          {/* Plaintext Input Section */}
          <div className="form-group">
            <label className="form-label" htmlFor="plaintext-input">Plaintext Input Type</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <button
                type="button"
                className={`btn ${inputType === 'text' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '0.5rem 1rem' }}
                onClick={() => setInputType('text')}
                disabled={Number(keys.p) < 256}
              >
                Text Message
              </button>
              <button
                type="button"
                className={`btn ${inputType === 'number' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '0.5rem 1rem' }}
                onClick={() => setInputType('number')}
              >
                Raw Number (M)
              </button>
            </div>

            {inputType === 'text' ? (
              <div>
                <label className="form-label" htmlFor="plaintext-text-area">Enter Text Message</label>
                <textarea
                  id="plaintext-text-area"
                  className="input-field"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Type a secure message..."
                  maxLength={500}
                />
                <span className="indicator-status" style={{ display: 'block', textAlign: 'right', marginTop: '0.25rem' }}>
                  {textInput.length}/500 chars (will be chunked into sizes &lt; p)
                </span>
              </div>
            ) : (
              <div>
                <label className="form-label" htmlFor="plaintext-number-input">Enter Integer Plaintext (M)</label>
                <div className="input-container">
                  <input
                    id="plaintext-number-input"
                    type="number"
                    className="input-field"
                    value={numberInput}
                    onChange={(e) => setNumberInput(e.target.value)}
                    placeholder="E.g., 15"
                    min="1"
                    max={(Number(keys.p) - 1).toString()}
                  />
                  <span className="input-suffix">M &lt; p</span>
                </div>
                <span className="indicator-status">
                  Must satisfy <strong>0 &lt; M &lt; {keys.p.toString()}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Encrypt Action */}
          <button
            id="encrypt-submit-btn"
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ fontSize: '1rem', padding: '0.8rem' }}
          >
            <Lock size={16} />
            {loading ? 'Performing Asymmetric Modular Multiplications...' : 'Encrypt Message'}
          </button>

          {error && (
            <div className="alert-callout danger" style={{ marginTop: '1.25rem' }}>
              <AlertTriangle className="alert-icon" size={18} />
              <div>{error}</div>
            </div>
          )}
        </form>
      )}

      {/* Encryption Result Display */}
      {results && (
        <div className="trace-section" style={{ animation: 'fadeIn 0.3s ease' }}>
          <h3 className="trace-title" style={{ color: 'var(--color-success)' }}>
            Ciphertext Outputs Generated Successfully
          </h3>

          {/* Message Encoding Block chunker visual display */}
          <div className="blocks-flow-container">
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>1. Message Encoding Bridge</span>
              <span className="trace-tag purple">Text &rarr; Numeric Blocks</span>
            </h4>
            <div className="block-chunk-list" id="encoding-chunk-list">
              {results.numeric_blocks.map((block, index) => {
                // Approximate block characters
                const textPortion = inputType === 'text' 
                  ? `Block ${index + 1}`
                  : 'Raw M';
                return (
                  <div className="block-chunk-item" key={index}>
                    <div className="block-chunk-label">{textPortion}</div>
                    <div className="block-chunk-int" id={`encoded-block-val-${index}`}>
                      {block.toString()}
                    </div>
                    <div className="indicator-status" style={{ fontSize: '0.65rem', marginTop: '0.2rem', color: 'var(--color-success)' }}>
                      M &lt; p
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ciphertext Table */}
          <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            2. Probabilistic Encryption Output Pairs (c<sub>1</sub>, c<sub>2</sub>)
          </h4>
          <div className="trace-table-wrapper">
            <table className="trace-table" id="ciphertext-results-table">
              <thead>
                <tr>
                  <th>Block</th>
                  <th>Plain M</th>
                  <th>Ephemeral k</th>
                  <th>Shared Secret s</th>
                  <th>Ciphertext c₁</th>
                  <th>Ciphertext c₂</th>
                </tr>
              </thead>
              <tbody>
                {results.trace_steps.map((step, idx) => (
                  <tr key={idx}>
                    <td>#{step.block_index + 1}</td>
                    <td className="mono-math" style={{ color: 'var(--text-secondary)' }}>{step.original_block.toString()}</td>
                    <td className="mono-math" style={{ color: '#fbbf24' }}>{step.ephemeral_key.toString()}</td>
                    <td className="mono-math" style={{ color: '#34d399' }}>{step.shared_secret.toString()}</td>
                    <td className="mono-math" style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>{step.c1.toString()}</td>
                    <td className="mono-math" style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>{step.c2.toString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Math calculation trace details */}
          <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            3. Step-by-Step Mathematical Computation Trace
          </h4>
          {results.trace_steps.map((step, idx) => (
            <div className="calculation-block" key={idx}>
              <div className="calculation-block-title">
                Block #{step.block_index + 1} Cryptography Equations:
              </div>
              <div className="calculation-formula">
                c₁ = g<sup>k</sup> mod p &rArr; {keys.g.toString()}<sup>{step.ephemeral_key.toString()}</sup> mod {keys.p.toString()} = <strong>{step.c1.toString()}</strong>
              </div>
              <div className="calculation-formula">
                Shared Secret (s) = y<sup>k</sup> mod p &rArr; {keys.y.toString()}<sup>{step.ephemeral_key.toString()}</sup> mod {keys.p.toString()} = <strong>{step.shared_secret.toString()}</strong>
              </div>
              <div className="calculation-formula">
                c₂ = (M &times; s) mod p &rArr; ({step.original_block.toString()} &times; {step.shared_secret.toString()}) mod {keys.p.toString()} = <strong>{step.c2.toString()}</strong>
              </div>
            </div>
          ))}

          {/* Trigger Decrypt propagation */}
          <div className="btn-group">
            <button
              id="send-to-decrypt-btn"
              type="button"
              className="btn btn-success"
              onClick={handleSendToDecrypt}
              style={{ flex: 2 }}
            >
              <Share2 size={16} />
              Load Ciphertext into Decryption Module
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
