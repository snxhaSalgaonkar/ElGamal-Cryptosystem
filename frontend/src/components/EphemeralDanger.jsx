import React, { useState } from 'react';
import { Eye, ShieldAlert, Sparkles, AlertTriangle, ArrowRight, Lock, Unlock } from 'lucide-react';

export default function EphemeralDanger({ keys, apiBase }) {
  const [m1, setM1] = useState('12');
  const [m2, setM2] = useState('17');
  const [k, setK] = useState('7');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [simulation, setSimulation] = useState(null);

  // Modular arithmetic utilities for client-side display if needed
  // (Extended Euclidean Algorithm)
  const modInverse = (a, m) => {
    a = ((a % m) + m) % m;
    for (let x = 1; x < m; x++) {
      if ((a * x) % m === 1) return x;
    }
    return 1;
  };

  const handleSimulate = async () => {
    if (!keys.p) {
      setError("Please generate keys in the Key Generation tab first.");
      return;
    }

    const valM1 = parseInt(m1, 10);
    const valM2 = parseInt(m2, 10);
    const valK = parseInt(k, 10);
    const valP = Number(keys.p);
    const valG = Number(keys.g);
    const valY = Number(keys.y);

    if (isNaN(valM1) || valM1 <= 0 || valM1 >= valP ||
        isNaN(valM2) || valM2 <= 0 || valM2 >= valP) {
      setError(`Messages M1 and M2 must be positive integers strictly less than p (p = ${keys.p}).`);
      return;
    }

    if (isNaN(valK) || valK <= 1 || valK >= valP - 1) {
      setError(`Ephemeral key k must satisfy 1 < k < p-1 (1 < k < ${valP - 1}).`);
      return;
    }

    setLoading(true);
    setError(null);
    setSimulation(null);

    try {
      // We will perform the calculations on the client side since standard toy mode 
      // math is simple and this keeps the animation instant, or we can use keys.
      // Math:
      // c1a = g^k mod p
      // s = y^k mod p
      // c2a = M1 * s mod p
      // c2b = M2 * s mod p
      
      const powerMod = (base, exp, mod) => {
        let res = 1;
        base = base % mod;
        while (exp > 0) {
          if (exp % 2 === 1) res = (res * base) % mod;
          base = (base * base) % mod;
          exp = Math.floor(exp / 2);
        }
        return res;
      };

      const c1a = powerMod(valG, valK, valP);
      const sharedSecret = powerMod(valY, valK, valP);
      const c2a = (valM1 * sharedSecret) % valP;
      const c2b = (valM2 * sharedSecret) % valP;

      // Attacker Hack math:
      // Attacker intercepts (c1a, c2a) and (c1b, c2b)
      // Attacker notices c1a === c1b => same secret s
      // Attacker guesses M1
      // s = c2a * M1^-1 mod p
      const m1Inverse = modInverse(valM1, valP);
      const recoveredSecret = (c2a * m1Inverse) % valP;
      const secretInverse = modInverse(recoveredSecret, valP);
      
      // M2 = c2b * s^-1 mod p
      const recoveredM2 = (c2b * secretInverse) % valP;

      setSimulation({
        c1a,
        c2a,
        c1b: c1a, // identical
        c2b,
        sharedSecret,
        m1Inverse,
        recoveredSecret,
        secretInverse,
        recoveredM2
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const hasKeys = keys.p !== null;

  return (
    <div className="card glass-panel" id="ephemeral-danger-container">
      <div className="card-title">
        <ShieldAlert className="nav-icon" size={22} style={{ color: 'var(--color-danger)' }} />
        <h2>Vulnerability Lab: Ephemeral Key Reuse</h2>
      </div>
      <p className="card-desc">
        The ephemeral key $k$ must be unique on every encryption. If $k$ is reused twice across different messages, an eavesdropper can algebraically bypass Bob's private key and decrypt the message directly.
      </p>

      {!hasKeys ? (
        <div className="alert-callout warning">
          <AlertTriangle className="alert-icon" size={18} />
          <div>
            <strong>Keys Not Detected!</strong> Please generate parameters in the <strong>Key Generation</strong> tab first to establish the mathematical modulo ring.
          </div>
        </div>
      ) : (
        <div>
          <div className="alert-callout danger" style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
            <AlertTriangle className="alert-icon" size={18} />
            <div>
              <strong>Attack Vector:</strong> This laboratory simulates the math of a key-reuse vulnerability. To see the modular arithmetic clearly, enter integer-based plaintexts (ideal for learning parameters like $p=23$ or $p=2011$).
            </div>
          </div>

          {/* Form Controls */}
          <div className="grid-3">
            <div className="form-group">
              <label className="form-label" htmlFor="danger-m1-input">Message 1 (M₁)</label>
              <input
                id="danger-m1-input"
                type="number"
                className="input-field"
                value={m1}
                onChange={(e) => setM1(e.target.value)}
                placeholder="E.g., 12"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="danger-m2-input">Message 2 (M₂)</label>
              <input
                id="danger-m2-input"
                type="number"
                className="input-field"
                value={m2}
                onChange={(e) => setM2(e.target.value)}
                placeholder="E.g., 17"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="danger-k-input">Reused Ephemeral Key (k)</label>
              <input
                id="danger-k-input"
                type="number"
                className="input-field"
                value={k}
                onChange={(e) => setK(e.target.value)}
                placeholder="E.g., 7"
              />
            </div>
          </div>

          <button
            id="simulate-attack-btn"
            className="btn btn-danger"
            onClick={handleSimulate}
            disabled={loading}
          >
            <Lock size={16} />
            Simulate Key Reuse & Exploit Attack
          </button>

          {error && (
            <div className="alert-callout danger" style={{ marginTop: '1rem' }}>
              <AlertTriangle className="alert-icon" size={18} />
              <div>{error}</div>
            </div>
          )}

          {/* Exploit Steps Visualization */}
          {simulation && (
            <div style={{ animation: 'fadeIn 0.35s ease', marginTop: '2rem' }}>
              <h3 className="trace-title" style={{ color: 'var(--color-danger)' }}>
                Intercepted Ciphertexts & Mathematical Decoupling
              </h3>

              <div className="grid-2">
                {/* Captured data */}
                <div className="indicator-card x-ind" style={{ padding: '1.25rem' }}>
                  <span className="indicator-label" style={{ color: 'var(--color-danger)' }}>Intercepted by Eavesdropper Eve</span>
                  
                  <div className="prob-c-list" style={{ marginTop: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                    <div>
                      <strong>Ciphertext A (for M₁ = {m1}):</strong>
                      <div>c₁<sub>a</sub> = <strong style={{ color: '#fff' }}>{simulation.c1a}</strong>, c₂<sub>a</sub> = <strong>{simulation.c2a}</strong></div>
                    </div>
                    <div style={{ marginTop: '0.75rem', borderTop: '1px solid rgba(239,68,68,0.1)', paddingTop: '0.75rem' }}>
                      <strong>Ciphertext B (for M₂ = {m2}):</strong>
                      <div>c₁<sub>b</sub> = <strong style={{ color: '#fff' }}>{simulation.c1b}</strong>, c₂<sub>b</sub> = <strong>{simulation.c2b}</strong></div>
                    </div>
                  </div>

                  <div className="alert-callout warning" style={{ marginTop: '1rem', padding: '0.75rem 1rem', fontSize: '0.8rem', marginBottom: 0 }}>
                    <AlertTriangle className="alert-icon" size={16} />
                    <div>
                      Eve notices that <strong>c₁<sub>a</sub> === c₁<sub>b</sub> === {simulation.c1a}</strong>. This signals that the exact same shared secret $s = y^k \bmod p$ was used to mask both plaintexts!
                    </div>
                  </div>
                </div>

                {/* Exploit steps */}
                <div className="exploit-flow">
                  <div className="exploit-step">
                    <div className="exploit-step-title">Step 1: Eve guesses or intercepts plaintext M₁</div>
                    <div className="exploit-step-desc">
                      Let's assume Eve has cracked the standard file header: <strong>M₁ = {m1}</strong>.
                    </div>
                  </div>

                  <div className="exploit-step">
                    <div className="exploit-step-title">Step 2: Recover the shared secret (s) without Bob's private key x</div>
                    <div className="exploit-step-desc">
                      Since c₂<sub>a</sub> = M₁ &times; s mod p, Eve calculates the modular inverse of M₁:
                      <div className="exploit-equation">
                        M₁⁻¹ mod p &rArr; {m1}⁻¹ mod {keys.p.toString()} = {simulation.m1Inverse}
                      </div>
                      Then she recovers the shared secret:
                      <div className="exploit-equation">
                        s = c₂<sub>a</sub> &times; M₁⁻¹ mod p &rArr; {simulation.c2a} &times; {simulation.m1Inverse} mod {keys.p.toString()} = <strong>{simulation.recoveredSecret}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="exploit-step">
                    <div className="exploit-step-title">Step 3: Recover the secret message M₂</div>
                    <div className="exploit-step-desc">
                      Eve computes the modular inverse of the secret $s$:
                      <div className="exploit-equation">
                        s⁻¹ mod p &rArr; {simulation.recoveredSecret}⁻¹ mod {keys.p.toString()} = {simulation.secretInverse}
                      </div>
                      Eve decrypts message M₂ directly:
                      <div className="exploit-equation" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#a7f3d0' }}>
                        M₂ = c₂<sub>b</sub> &times; s⁻¹ mod p &rArr; {simulation.c2b} &times; {simulation.secretInverse} mod {keys.p.toString()} = <strong style={{ fontSize: '1.15rem' }}>{simulation.recoveredM2}</strong>
                      </div>
                      <div style={{ color: 'var(--color-success)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem', fontSize: '0.8rem' }}>
                        <Unlock size={14} /> Succesfully decrypted M₂ = {simulation.recoveredM2} without Bob's private key x!
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
