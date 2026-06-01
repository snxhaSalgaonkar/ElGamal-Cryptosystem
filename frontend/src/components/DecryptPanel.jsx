import React, { useState, useEffect } from 'react';
import { Unlock, AlertTriangle, Check, RefreshCw, Key } from 'lucide-react';

export default function DecryptPanel({ keys, ciphertextData, apiBase }) {
  const [privateKeyInput, setPrivateKeyInput] = useState('');
  const [ciphertextInput, setCiphertextInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  // Auto-fill private key and ciphertexts if available from global state
  useEffect(() => {
    if (keys.x) {
      setPrivateKeyInput(keys.x.toString());
    }
  }, [keys.x]);

  useEffect(() => {
    if (ciphertextData.ciphertext_blocks) {
      setCiphertextInput(JSON.stringify(ciphertextData.ciphertext_blocks, null, 2));
    }
  }, [ciphertextData.ciphertext_blocks]);

  const handleDecrypt = async (e) => {
    e.preventDefault();
    if (!keys.p) {
      setError("Please generate keys in the Key Generation tab first.");
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    let parsedBlocks = null;
    try {
      parsedBlocks = JSON.parse(ciphertextInput);
      if (!Array.isArray(parsedBlocks)) {
        throw new Error("Ciphertext must be a valid JSON array of block objects.");
      }
      // Simple format check
      for (const block of parsedBlocks) {
        if (block.c1 === undefined || block.c2 === undefined) {
          throw new Error("Each block must contain both 'c1' and 'c2' properties.");
        }
      }
    } catch (err) {
      setError(`Invalid Ciphertext JSON format: ${err.message}`);
      setLoading(false);
      return;
    }

    const privateKey = Number(privateKeyInput);
    if (isNaN(privateKey) || privateKey <= 1) {
      setError("Please enter a valid private key x (x > 1).");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${apiBase}/api/decrypt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ciphertext_blocks: parsedBlocks,
          x: privateKey,
          p: keys.p,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to decrypt ciphertext');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const hasKeys = keys.p !== null;

  return (
    <div className="card glass-panel" id="decrypt-panel-container">
      <div className="card-title">
        <Unlock className="nav-icon" size={22} style={{ color: 'var(--color-primary)' }} />
        <h2>Decryption Module</h2>
      </div>
      <p className="card-desc">
        Decrypt Bob's ciphertext blocks back into plaintext message blocks using the private exponent $x$.
      </p>

      {!hasKeys ? (
        <div className="alert-callout warning">
          <AlertTriangle className="alert-icon" size={18} />
          <div>
            <strong>Prime Parameters Not Detected!</strong> Please visit the <strong>Key Generation</strong> tab first so the system knows the modulo prime arithmetic boundary.
          </div>
        </div>
      ) : (
        <form onSubmit={handleDecrypt}>
          {/* Key Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(0,0,0,0.15)', padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.85rem', border: '1px solid var(--border-color)' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>Prime Modulus (p):</span>
              <span className="mono-math" style={{ color: '#a5b4fc', wordBreak: 'break-all' }}>{keys.p.toString()}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>Bob's Private Key (x):</span>
              <span className="mono-math" style={{ color: '#fca5a5' }}>
                {keys.x ? 'Loaded dynamically' : 'Not generated yet'}
              </span>
            </div>
          </div>

          {/* Inputs */}
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="decrypt-private-key-input">Bob's Private Key (x)</label>
              <div className="input-container">
                <input
                  id="decrypt-private-key-input"
                  type="password"
                  className="input-field"
                  value={privateKeyInput}
                  onChange={(e) => setPrivateKeyInput(e.target.value)}
                  placeholder="Enter private exponent x"
                />
                <span className="input-suffix"><Key size={14} /></span>
              </div>
              <span className="indicator-status">
                Must be the secret key $x$ matching $y \equiv g^x \pmod p$
              </span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="decrypt-ciphertext-input">Ciphertext JSON Blocks Array</label>
              <textarea
                id="decrypt-ciphertext-input"
                className="input-field mono-math"
                value={ciphertextInput}
                onChange={(e) => setCiphertextInput(e.target.value)}
                placeholder='[{"c1": 15, "c2": 20}]'
                style={{ minHeight: '110px', fontSize: '0.8rem' }}
              />
              <span className="indicator-status">
                Array of objects containing <strong>c₁</strong> and <strong>c₂</strong>
              </span>
            </div>
          </div>

          <button
            id="decrypt-submit-btn"
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ fontSize: '1rem', padding: '0.8rem' }}
          >
            <Unlock size={16} />
            {loading ? 'Performing Discrete Log Modular Inversion...' : 'Decrypt Ciphertext'}
          </button>

          {error && (
            <div className="alert-callout danger" style={{ marginTop: '1.25rem' }}>
              <AlertTriangle className="alert-icon" size={18} />
              <div>{error}</div>
            </div>
          )}
        </form>
      )}

      {/* Results display */}
      {results && (
        <div className="trace-section" style={{ animation: 'fadeIn 0.3s ease' }}>
          
          {/* Plaintext Recovery banner */}
          <h3 className="trace-title" style={{ color: 'var(--color-success)' }}>
            Plaintext Recovered Successfully
          </h3>
          <div className="indicator-card y-ind" style={{ padding: '1.5rem', marginBottom: '1.5rem', backgroundColor: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <span className="indicator-label" style={{ color: 'var(--color-success)' }}>Decoded Original Message Output</span>
            <h2 id="recovered-text-display" style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, color: '#f3f4f6', wordBreak: 'break-word', letterSpacing: '-0.02em', marginTop: '0.5rem' }}>
              {results.recovered_text}
            </h2>
          </div>

          {/* Block breakdown table */}
          <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            1. Recovered Plaintext Integer Blocks (M)
          </h4>
          <div className="trace-table-wrapper">
            <table className="trace-table" id="decrypted-blocks-table">
              <thead>
                <tr>
                  <th>Block</th>
                  <th>Ciphertext c₁</th>
                  <th>Ciphertext c₂</th>
                  <th>Shared Secret s</th>
                  <th>s⁻¹ (Mod Inverse)</th>
                  <th>Recovered M</th>
                </tr>
              </thead>
              <tbody>
                {results.trace_steps.map((step, idx) => (
                  <tr key={idx}>
                    <td>#{step.block_index + 1}</td>
                    <td className="mono-math" style={{ color: 'var(--color-primary)' }}>{ciphertextData.ciphertext_blocks ? ciphertextData.ciphertext_blocks[idx]?.c1.toString() : 'c1'}</td>
                    <td className="mono-math" style={{ color: 'var(--color-primary)' }}>{ciphertextData.ciphertext_blocks ? ciphertextData.ciphertext_blocks[idx]?.c2.toString() : 'c2'}</td>
                    <td className="mono-math" style={{ color: '#fbbf24' }}>{step.shared_secret.toString()}</td>
                    <td className="mono-math" style={{ color: '#818cf8' }}>{step.shared_secret_inverse.toString()}</td>
                    <td className="mono-math" style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>{step.recovered_block.toString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Decryption math details */}
          <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            2. Step-by-Step Decryption Calculations
          </h4>
          {results.trace_steps.map((step, idx) => (
            <div className="calculation-block success-variant" key={idx}>
              <div className="calculation-block-title">
                Block #{step.block_index + 1} Mathematics:
              </div>
              <div className="calculation-formula">
                Shared Secret (s) = c₁<sup>x</sup> mod p &rArr; (c1)<sup>{privateKeyInput}</sup> mod {keys.p.toString()} = <strong>{step.shared_secret.toString()}</strong>
              </div>
              <div className="calculation-formula">
                Inverse (s⁻¹) &rArr; Find {step.shared_secret.toString()}<sup>-1</sup> mod {keys.p.toString()} via EEA = <strong>{step.shared_secret_inverse.toString()}</strong>
              </div>
              <div className="calculation-formula">
                Plain M = (c₂ &times; s⁻¹) mod p &rArr; (c2 &times; {step.shared_secret_inverse.toString()}) mod {keys.p.toString()} = <strong>{step.recovered_block.toString()}</strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
