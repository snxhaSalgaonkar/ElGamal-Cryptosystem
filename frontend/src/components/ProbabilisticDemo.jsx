import React, { useState } from 'react';
import { Eye, ShieldCheck, Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';

export default function ProbabilisticDemo({ keys, apiBase }) {
  const [inputText, setInputText] = useState('GOLD');
  const [encryptions, setEncryptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runMultiEncryption = async () => {
    if (!keys.p) {
      setError("Please generate keys in the Key Generation tab first.");
      return;
    }

    setLoading(true);
    setError(null);
    setEncryptions([]);

    // Check if modulus is small. For Toy Mode (p=23), text will fail, so send an integer
    let messageToSend = inputText;
    if (Number(keys.p) < 256) {
      const val = parseInt(inputText, 10);
      if (isNaN(val) || val <= 0 || val >= Number(keys.p)) {
        setError(`For Toy Mode (p=${keys.p}), please enter an integer strictly between 0 and ${keys.p} (e.g. 7).`);
        setLoading(false);
        return;
      }
      messageToSend = val;
    } else {
      if (!inputText.trim()) {
        setError("Please enter a short text message to encrypt.");
        setLoading(false);
        return;
      }
    }

    try {
      const runs = [];
      // Fire 3 independent parallel requests to illustrate different random k
      for (let i = 0; i < 3; i++) {
        runs.push(
          fetch(`${apiBase}/api/encrypt`, {
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
          }).then(res => {
            if (!res.ok) throw new Error("Server encryption run failed");
            return res.json();
          })
        );
      }

      const results = await Promise.all(runs);
      
      // Extract block trace details (first block for clean display comparison)
      const mappedRuns = results.map((res, index) => {
        const step = res.trace_steps[0];
        return {
          runNumber: index + 1,
          k: step.ephemeral_key,
          s: step.shared_secret,
          c1: step.c1,
          c2: step.c2,
          rawPlaintext: step.original_block
        };
      });

      setEncryptions(mappedRuns);
    } catch (err) {
      setError(err.message || "Failed to complete parallel probabilistic encryptions.");
    } finally {
      setLoading(false);
    }
  };

  const hasKeys = keys.p !== null;

  return (
    <div className="card glass-panel" id="probabilistic-demo-container">
      <div className="card-title">
        <Sparkles className="nav-icon" size={22} style={{ color: 'var(--color-primary)' }} />
        <h2>Probabilistic Encryption Lab</h2>
      </div>
      <p className="card-desc">
        Unlike deterministic algorithms like RSA, ElGamal is probabilistic. Encrypting the exact same plaintext multiple times yields entirely different ciphertexts, preventing attackers from detecting repeating patterns.
      </p>

      {!hasKeys ? (
        <div className="alert-callout warning">
          <AlertTriangle className="alert-icon" size={18} />
          <div>
            <strong>Keys Not Detected!</strong> Please visit the <strong>Key Generation</strong> tab first to load public key parameters.
          </div>
        </div>
      ) : (
        <div>
          {/* Inputs section */}
          <div className="form-group" style={{ maxWidth: '500px' }}>
            <label className="form-label" htmlFor="prob-plaintext-input">
              {Number(keys.p) < 256 ? 'Plaintext Integer (M)' : 'Plaintext Message Text'}
            </label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input
                id="prob-plaintext-input"
                type={Number(keys.p) < 256 ? 'number' : 'text'}
                className="input-field"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={Number(keys.p) < 256 ? 'E.g., 7' : 'E.g., SECRET'}
              />
              <button
                id="run-probabilistic-btn"
                className="btn btn-primary"
                style={{ width: 'auto', whiteSpace: 'nowrap' }}
                onClick={runMultiEncryption}
                disabled={loading}
              >
                <RefreshCw size={16} className={loading ? 'spinning-icon' : ''} />
                Encrypt 3 Times
              </button>
            </div>
            <span className="indicator-status">
              {Number(keys.p) < 256 
                ? `Toy Modulo active: enter integer < ${keys.p}`
                : 'Secure Modulo active: text input will be encrypted in parallel'}
            </span>
          </div>

          {error && (
            <div className="alert-callout danger">
              <AlertTriangle className="alert-icon" size={18} />
              <div>{error}</div>
            </div>
          )}

          {/* Comparisons */}
          {encryptions.length > 0 && (
            <div style={{ animation: 'fadeIn 0.3s ease', marginTop: '1.5rem' }}>
              <h3 className="trace-title">Comparative Analysis of Encryption Runs</h3>
              
              <div className="grid-3" id="probabilistic-cards-container">
                {encryptions.map((run) => (
                  <div className="probabilistic-item" key={run.runNumber} style={{ borderTop: `3px solid var(--color-primary)` }}>
                    <div className="prob-top">
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Encryption Run #{run.runNumber}</span>
                      <span className="prob-k-badge" id={`prob-run-k-${run.runNumber}`}>k = {run.k.toString()}</span>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      Plain M = <span className="mono-math">{run.rawPlaintext.toString()}</span>
                    </div>

                    <div className="prob-c-list">
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>c₁ = g<sup>k</sup> mod p</span>
                        <div id={`prob-run-c1-${run.runNumber}`} style={{ fontWeight: 'bold' }}>{run.c1.toString()}</div>
                      </div>
                      <div style={{ marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>c₂ = M &times; y<sup>k</sup> mod p</span>
                        <div id={`prob-run-c2-${run.runNumber}`} style={{ fontWeight: 'bold' }}>{run.c2.toString()}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="alert-callout success">
                <ShieldCheck className="alert-icon" size={18} />
                <div>
                  <strong>Semantic Security Proven!</strong> Note that although the input <code className="mono-math">"{inputText}"</code> is identical across all three runs, the resulting ciphertext pairs <code className="mono-math">(c₁, c₂)</code> are <strong>completely distinct</strong>. 
                  This is because ElGamal selects a fresh, random, single-use <strong>ephemeral exponent k</strong> on every execution, making ciphertext frequency analysis impossible.
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
