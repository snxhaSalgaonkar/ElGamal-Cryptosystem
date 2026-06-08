import React, { useState } from 'react';
import { Key, ShieldCheck, Sparkles, RefreshCw, AlertTriangle, Eye, EyeOff } from 'lucide-react';

export default function KeyGenPanel({ keys, setKeys, apiBase }) {
  const [mode, setMode] = useState('toy'); // 'toy' or 'secure'
  const [bits, setBits] = useState(256);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  const generateNewKeys = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBase}/api/keygen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: mode,
          bits: mode === 'secure' ? bits : undefined,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to generate keys');
      }

      const data = await response.json();
      // Ensure variables are properly saved as strings/numbers depending on big int conversion needs
      setKeys({
        p: data.public_key.p,
        g: data.public_key.g,
        y: data.public_key.y,
        x: data.private_key,
        mode: mode
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = (selectedMode) => {
    setMode(selectedMode);
    setError(null);
  };

  const isKeyActive = keys.p !== null;

  return (
    <div className="card glass-panel" id="keygen-panel-container">
      <div className="card-title">
        <Key className="nav-icon" size={22} style={{ color: 'var(--color-primary)' }} />
        <h2>Key Generation Module</h2>
      </div>
      <p className="card-desc">
        Generate Bob's public key pair for encryption and private key for decryption.
      </p>

      {/* Mode Selection */}
      <div className="form-group">
        <label className="form-label">Mathematical Paradigm</label>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <button
            id="mode-toy-btn"
            type="button"
            className={`btn ${mode === 'toy' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1 }}
            onClick={() => handleModeChange('toy')}
          >
            <Sparkles size={16} />
            Toy Parameters (Learning)
          </button>
          <button
            id="mode-secure-btn"
            type="button"
            className={`btn ${mode === 'secure' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1 }}
            onClick={() => handleModeChange('secure')}
          >
            <ShieldCheck size={16} />
            Secure Parameters (Real Cryptography)
          </button>
        </div>
      </div>

      {/* Secure Parameters Configuration */}
      {mode === 'secure' && (
        <div className="form-group" style={{ animation: 'fadeIn 0.2s ease' }}>
          <label className="form-label" htmlFor="bit-length-select">Safe Prime Bit Strength</label>
          <div className="input-container">
            <select
              id="bit-length-select"
              className="input-field select-field"
              value={bits}
              onChange={(e) => setBits(Number(e.target.value))}
            >
              <option value={128}>128-bit (Fast KeyGen)</option>
              <option value={256}>256-bit (Recommended for demos)</option>
              <option value={512}>512-bit (Robust security)</option>
            </select>
          </div>
          <div className="alert-callout warning" style={{ marginTop: '0.75rem' }}>
            <AlertTriangle className="alert-icon" size={18} />
            <div>
              Generating secure primes requires strong probabilistic tests (Miller-Rabin) and locating an appropriate generator generator modulo $p$. Higher bit sizes will cause longer server compute times.
            </div>
          </div>
        </div>
      )}

      {mode === 'toy' && (
        <div className="alert-callout info">
          <Sparkles className="alert-icon" size={18} />
          <div>
            <strong>Toy Parameters</strong> uses small numbers preset to $p = 23$, $g = 5$, and private key $x = 6$. This allows tracing modular exponentiation algebra in clear single-digit and double-digit integers without standard overflows.
          </div>
        </div>
      )}

      {/* Generate Trigger */}
      <button
        id="generate-keys-btn"
        className="btn btn-primary"
        onClick={generateNewKeys}
        disabled={loading}
        style={{ fontSize: '1rem', padding: '0.9rem' }}
      >
        <RefreshCw size={18} className={loading ? 'spinning-icon' : ''} />
        {loading ? 'Executing Number Theory Algorithms...' : 'Generate New ElGamal Key Pair'}
      </button>

      {error && (
        <div className="alert-callout danger" style={{ marginTop: '1rem' }}>
          <AlertTriangle className="alert-icon" size={18} />
          <div>{error}</div>
        </div>
      )}

      {/* Output Parameters display */}
      {isKeyActive && (
        <div className="trace-section" style={{ animation: 'fadeIn 0.3s ease' }}>
          <h3 className="trace-title">Generated Mathematical Key Parameters</h3>
          
          <div className="math-equation-banner">
            <span>Public Key Formula</span>
            <div>
              y = g<sup>x</sup> mod p &rArr; {keys.g.toString()}<sup>{showPrivateKey ? keys.x.toString() : 'x'}</sup> mod {keys.p.toString()} = <strong>{keys.y.toString()}</strong>
            </div>
          </div>

          <div className="grid-2">
            <div>
              <div className="form-group">
                <span className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Prime Modulus (p)</span>
                  <span className="trace-tag purple">Public parameter</span>
                </span>
                <div className="huge-number-container" id="display-p">
                  {keys.p.toString()}
                </div>
                <div className="indicator-status">
                  {keys.mode === 'toy' ? '23 (5-bit toy prime)' : `${keys.p.toString().length * 4}-bit safe prime`}
                </div>
              </div>

              <div className="form-group">
                <span className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Primitive Root Generator (g)</span>
                  <span className="trace-tag amber">Public parameter</span>
                </span>
                <div className="huge-number-container generator" id="display-g">
                  {keys.g.toString()}
                </div>
                <div className="indicator-status">
                  Generates multiplicative group <strong>Z<sub>p</sub><sup>*</sup></strong>
                </div>
              </div>
            </div>

            <div>
              <div className="form-group">
                <span className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Public Exponent (y)</span>
                  <span className="trace-tag green">Public key component</span>
                </span>
                <div className="huge-number-container" id="display-y">
                  {keys.y.toString()}
                </div>
                <div className="indicator-status">
                  Bob's public encryption identity: <strong>g<sup>x</sup> mod p</strong>
                </div>
              </div>

              <div className="form-group">
                <span className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Private Exponent (x)</span>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                      id="toggle-private-key-btn"
                      type="button"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: 0 }}
                      onClick={() => setShowPrivateKey(!showPrivateKey)}
                    >
                      {showPrivateKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <span className="trace-tag red" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                      KEEP PRIVATE
                    </span>
                  </div>
                </span>
                <div className="huge-number-container private-key" id="display-x" style={{ letterSpacing: showPrivateKey ? 'normal' : '0.4em' }}>
                  {showPrivateKey ? keys.x.toString() : '••••••••••••••••'}
                </div>
                <div className="indicator-status">
                  Chosen randomly satisfying: <strong>1 &lt; x &lt; p-1</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="alert-callout success" style={{ marginBottom: 0 }}>
            <ShieldCheck className="alert-icon" size={18} />
            <div>
              <strong>Global State Synchronized!</strong> These parameters have been loaded into the **Encryption** and **Decryption** channels. You can now toggle those tabs to begin processing text!
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
