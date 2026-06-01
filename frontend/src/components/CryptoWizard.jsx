import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Lock, 
  Unlock, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle,
  Undo2
} from 'lucide-react';

import { apiPost } from '../api/client';

export default function CryptoWizard({ apiBase, onBackToHome }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [paradigm, setParadigm] = useState('toy'); // 'toy' or 'secure'
  const [bits, setBits] = useState(256);
  const [messageInput, setMessageInput] = useState('');
  
  // Wizard calculations states
  const [keys, setKeys] = useState({ p: null, g: null, y: null, x: null });
  const [ciphertextData, setCiphertextData] = useState(null);
  const [decryptionData, setDecryptionData] = useState(null);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showDecPrivateKey, setShowDecPrivateKey] = useState(false);

  // Set default message input based on paradigm
  useEffect(() => {
    if (paradigm === 'toy') {
      setMessageInput('15');
    } else {
      setMessageInput('Hello, ElGamal! 🔐');
    }
    setError(null);
  }, [paradigm]);

  // Step 1: Initialize System & Generate Keys
  const handleInitialize = async () => {
    setError(null);
    setLoading(true);

    // Validate inputs before starting
    if (paradigm === 'toy') {
      const val = parseInt(messageInput, 10);
      if (isNaN(val) || val <= 0 || val >= 23) {
        setError("For Toy Mode (mod 23), please enter a positive integer strictly less than 23 (e.g., 15).");
        setLoading(false);
        return;
      }
    } else {
      if (!messageInput.trim()) {
        setError("Please enter a text message to encrypt.");
        setLoading(false);
        return;
      }
    }

    try {
      const data = await apiPost(
        '/api/keygen',
        {
          mode: paradigm,
          bits: paradigm === 'secure' ? bits : undefined,
        },
        { baseUrl: apiBase }
      );

      setKeys({
        p: data.public_key.p,
        g: data.public_key.g,
        y: data.public_key.y,
        x: data.private_key,
      });

      setCurrentStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Proceed to Encryption
  const handleEncrypt = async () => {
    setError(null);
    setLoading(true);

    try {
      // Prepare correct message format for the backend
      const messageToSend = paradigm === 'toy' ? parseInt(messageInput, 10) : messageInput;
      
      const data = await apiPost(
        '/api/encrypt',
        {
          message: messageToSend,
          p: keys.p,
          g: keys.g,
          y: keys.y,
        },
        { baseUrl: apiBase }
      );

      setCiphertextData(data);
      setCurrentStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Proceed to Decryption
  const handleDecrypt = async () => {
    setError(null);
    setLoading(true);

    try {
      const data = await apiPost(
        '/api/decrypt',
        {
          ciphertext_blocks: ciphertextData.ciphertext_blocks,
          x: keys.x,
          p: keys.p,
        },
        { baseUrl: apiBase }
      );

      setDecryptionData(data);
      setCurrentStep(4);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setKeys({ p: null, g: null, y: null, x: null });
    setCiphertextData(null);
    setDecryptionData(null);
    setError(null);
    if (paradigm === 'toy') {
      setMessageInput('15');
    } else {
      setMessageInput('Hello, ElGamal! 🔐');
    }
  };

  return (
    <div className="wizard-page-container">
      {/* Navigation & Header */}
      <div className="wizard-header-nav">
        <button className="back-home-link" onClick={onBackToHome}>
          <Undo2 size={16} />
          Back to Portal Home
        </button>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className="trace-tag purple">Interactive Wizard</span>
          <span className="trace-tag green">Asymmetric Pipeline</span>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.04em', background: 'linear-gradient(135deg, #fff 30%, #a5b4fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.5rem' }}>
          ElGamal Secure Workflow Timeline
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '650px', margin: '0 auto' }}>
          Follow Alice and Bob step-by-step through parameter configuration, public/private key generation, randomized message block encryption, and mathematical plaintext recovery.
        </p>
      </div>
      {error && (
        <div className="alert-callout danger" style={{ marginBottom: '1.5rem' }}>
          <AlertTriangle className="alert-icon" size={18} />
          <div>{error}</div>
        </div>
      )}

      <div className="wizard-steps-timeline">
        {/* ==========================================
            STEP 1: CONFIGURATION & MESSAGE SETUP
            ========================================== */}
        <div className={`wizard-step-card ${currentStep === 1 ? 'active' : 'completed'}`}>
          <div className="step-badge-indicator">Step 1</div>
          
          <div className="wizard-step-header">
            <div>
              <h2 className="wizard-step-title">Configure Paradigm & Plaintext Message</h2>
              <p className="wizard-step-desc">Establish mathematical constraints and set up your initial message block payload.</p>
            </div>
            <div className="wizard-step-status-icon">
              {currentStep > 1 ? <CheckCircle size={18} /> : <Sparkles size={18} />}
            </div>
          </div>

          {currentStep === 1 && (
            <div style={{ animation: 'fadeIn 0.3s ease', marginTop: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Select Security Paradigm</label>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                  <button
                    id="wizard-mode-toy-btn"
                    type="button"
                    className={`btn ${paradigm === 'toy' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1 }}
                    onClick={() => setParadigm('toy')}
                  >
                    <Sparkles size={16} />
                    Toy Parameters (p = 23)
                  </button>
                  <button
                    id="wizard-mode-secure-btn"
                    type="button"
                    className={`btn ${paradigm === 'secure' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1 }}
                    onClick={() => setParadigm('secure')}
                  >
                    <ShieldCheck size={16} />
                    Secure Prime Parameters
                  </button>
                </div>
              </div>

              {paradigm === 'secure' && (
                <div className="form-group" style={{ animation: 'fadeIn 0.2s ease' }}>
                  <label className="form-label">Safe Prime Strength (Miller-Rabin Primes)</label>
                  <div className="input-container">
                    <select
                      className="input-field select-field"
                      value={bits}
                      onChange={(e) => setBits(Number(e.target.value))}
                    >
                      <option value={128}>128-bit Modulus</option>
                      <option value={256}>256-bit Modulus (Recommended)</option>
                      <option value={512}>512-bit Modulus</option>
                    </select>
                  </div>
                </div>
              )}

              {paradigm === 'toy' ? (
                <div className="alert-callout info">
                  <Sparkles className="alert-icon" size={18} />
                  <div>
                    <strong>Toy Modulus:</strong> Uses prime modulus $p = 23$ and generator $g = 5$. Ideal for manually checking the modular exponents on paper. Enforces raw numerical message $M &lt; p$.
                  </div>
                </div>
              ) : (
                <div className="alert-callout success">
                  <ShieldCheck className="alert-icon" size={18} />
                  <div>
                    <strong>Secure Modulus:</strong> Runs probabilistic generation for a large safe prime modulus $p$ and generator $g$. Supports standard multi-character text messages which will be chunked into bytes.
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">
                  {paradigm === 'toy' ? 'Raw Integer Message (M < 23)' : 'Plaintext Text Message'}
                </label>
                <div className="input-container">
                  {paradigm === 'toy' ? (
                    <input
                      id="wizard-msg-number"
                      type="number"
                      className="input-field"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="e.g. 15"
                      min="1"
                      max="22"
                    />
                  ) : (
                    <textarea
                      id="wizard-msg-text"
                      className="input-field"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Enter a message to be encrypted..."
                      rows={2}
                    />
                  )}
                </div>
              </div>

              <button
                id="wizard-step1-submit"
                className="btn btn-primary"
                onClick={handleInitialize}
                disabled={loading}
                style={{ padding: '0.9rem' }}
              >
                {loading ? (
                  <>
                    <RefreshCw size={18} className="spinning-icon" />
                    {paradigm === 'secure'
                      ? `Generating ${bits}-bit safe prime & keys (a few seconds)…`
                      : 'Finding generator modulo prime…'}
                  </>
                ) : (
                  <>
                    Generate Bob's Key Pair & Initialize System
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          )}

          {currentStep > 1 && (
            <div style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Selected Paradigm: <strong style={{ color: 'var(--text-primary)' }}>{paradigm === 'toy' ? 'Toy parameters' : `Secure ${bits}-bit parameters`}</strong> | 
              Plaintext: <strong style={{ color: 'var(--text-primary)' }}>"{messageInput}"</strong>
            </div>
          )}
        </div>

        {/* ==========================================
            STEP 2: KEY CONFIGURATION DISPLAY
            ========================================== */}
        <div className={`wizard-step-card ${currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : 'inactive'}`}>
          <div className="step-badge-indicator">Step 2</div>
          
          <div className="wizard-step-header">
            <div>
              <h2 className="wizard-step-title">Bob's Key Pair Generation</h2>
              <p className="wizard-step-desc">Bob generates a public key pair for Alice, while holding the secret private key exponent.</p>
            </div>
            <div className="wizard-step-status-icon">
              {currentStep > 2 ? <CheckCircle size={18} /> : <Key size={18} />}
            </div>
          </div>

          {currentStep === 2 && keys.p && (
            <div style={{ animation: 'fadeIn 0.3s ease', marginTop: '1.5rem' }}>
              <div className="math-equation-banner">
                <span>Congruency Form</span>
                y &equiv; g<sup>x</sup> (mod p)
              </div>

              <div className="grid-2">
                <div>
                  <div className="form-group">
                    <span className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Modulus Prime (p)</span>
                      <span className="trace-tag purple">Public</span>
                    </span>
                    <div className="huge-number-container mono-math">{keys.p.toString()}</div>
                    <span className="indicator-status">Defines cyclic group size limit.</span>
                  </div>

                  <div className="form-group">
                    <span className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Generator (g)</span>
                      <span className="trace-tag amber">Public</span>
                    </span>
                    <div className="huge-number-container generator mono-math">{keys.g.toString()}</div>
                    <span className="indicator-status">Generates multiplicative subgroup.</span>
                  </div>
                </div>

                <div>
                  <div className="form-group">
                    <span className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Public Key Exponent (y)</span>
                      <span className="trace-tag green">Public</span>
                    </span>
                    <div className="huge-number-container decrypted mono-math">{keys.y.toString()}</div>
                    <span className="indicator-status">Shared identity: y = gˣ mod p.</span>
                  </div>

                  <div className="form-group">
                    <span className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Private Key Exponent (x)</span>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <button
                          type="button"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}
                          onClick={() => setShowPrivateKey(!showPrivateKey)}
                        >
                          {showPrivateKey ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                        <span className="trace-tag red" style={{ fontSize: '0.65rem' }}>Keep Secret</span>
                      </div>
                    </span>
                    <div className="huge-number-container private-key mono-math" style={{ letterSpacing: showPrivateKey ? 'normal' : '0.45em' }}>
                      {showPrivateKey ? keys.x.toString() : '••••••••••••••••'}
                    </div>
                    <span className="indicator-status">Randomly chosen: 1 &lt; x &lt; p-1.</span>
                  </div>
                </div>
              </div>

              <div className="alert-callout success" style={{ marginTop: '1rem' }}>
                <ShieldCheck className="alert-icon" size={18} />
                <div>
                  Bob publishes the public parameters <code className="mono-math">(p={keys.p.toString()}, g={keys.g.toString()}, y={keys.y.toString()})</code>. 
                  Alice can now encrypt the message using these parameters, while only Bob can decrypt using his private key exponent <code className="mono-math">x</code>!
                </div>
              </div>

              <button
                id="wizard-step2-submit"
                className="btn btn-primary"
                onClick={handleEncrypt}
                disabled={loading}
                style={{ padding: '0.9rem', marginTop: '1rem' }}
              >
                {loading ? (
                  <>
                    <RefreshCw size={18} className="spinning-icon" />
                    Executing Alice's Modular Encryptions...
                  </>
                ) : (
                  <>
                    Perform Alice's Encryption
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          )}

          {currentStep > 2 && (
            <div style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Public Parameters: Modulus <code className="mono-math" style={{ color: 'var(--text-primary)' }}>p = {keys.p?.toString()}</code> | 
              Generator <code className="mono-math" style={{ color: 'var(--text-primary)' }}>g = {keys.g?.toString()}</code> | 
              Public Key <code className="mono-math" style={{ color: 'var(--text-primary)' }}>y = {keys.y?.toString()}</code>
            </div>
          )}
        </div>

        {/* ==========================================
            STEP 3: ALICE'S ENCRYPTION PROCESS
            ========================================== */}
        <div className={`wizard-step-card ${currentStep === 3 ? 'active' : currentStep > 3 ? 'completed' : 'inactive'}`}>
          <div className="step-badge-indicator">Step 3</div>
          
          <div className="wizard-step-header">
            <div>
              <h2 className="wizard-step-title">Alice's Asymmetric Encryption</h2>
              <p className="wizard-step-desc">Alice hides the message in two parts $(c_1, c_2)$ using a randomized ephemeral key exponent $k$.</p>
            </div>
            <div className="wizard-step-status-icon">
              {currentStep > 3 ? <CheckCircle size={18} /> : <Lock size={18} />}
            </div>
          </div>

          {currentStep === 3 && ciphertextData && (
            <div style={{ animation: 'fadeIn 0.3s ease', marginTop: '1.5rem' }}>
              {/* Message Chunk visualizer */}
              <div className="blocks-flow-container">
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>Message Block Segmentation Bridge</span>
                  <span className="trace-tag purple">{paradigm === 'toy' ? 'Raw Numeric' : 'Text Chunks'}</span>
                </h4>
                <div className="block-chunk-list">
                  {ciphertextData.numeric_blocks.map((block, index) => (
                    <div className="block-chunk-item" key={index}>
                      <div className="block-chunk-label">{paradigm === 'toy' ? 'Raw Payload M' : `Block ${index + 1}`}</div>
                      <div className="block-chunk-int">{block.toString()}</div>
                      <div className="indicator-status" style={{ fontSize: '0.65rem', color: 'var(--color-success)' }}>
                        M &lt; p
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Steps and equations */}
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Mathematical Computation Step-by-Step Trace
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                {ciphertextData.trace_steps.map((step, idx) => (
                  <div className="calculation-block" key={idx}>
                    <div className="calculation-block-title" style={{ color: 'var(--color-primary)' }}>
                      Block #{step.block_index + 1} Encryption Mathematical Operations:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <div className="calculation-formula">
                        1. Random Ephemeral exponent (k) selected: <strong>k = {step.ephemeral_key.toString()}</strong>
                      </div>
                      <div className="calculation-formula">
                        2. Ephemeral Public Ciphertext: c₁ = g<sup>k</sup> mod p
                        <div style={{ paddingLeft: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                          c₁ = {keys.g.toString()}<sup>{step.ephemeral_key.toString()}</sup> mod {keys.p.toString()} = <strong style={{ color: 'var(--color-primary)' }}>{step.c1.toString()}</strong>
                        </div>
                      </div>
                      <div className="calculation-formula">
                        3. Multiplicative Shared Mask: s = y<sup>k</sup> mod p
                        <div style={{ paddingLeft: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                          s = {keys.y.toString()}<sup>{step.ephemeral_key.toString()}</sup> mod {keys.p.toString()} = <strong style={{ color: 'var(--color-warning)' }}>{step.shared_secret.toString()}</strong>
                        </div>
                      </div>
                      <div className="calculation-formula">
                        4. Encrypted Masked Message block: c₂ = (M &times; s) mod p
                        <div style={{ paddingLeft: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                          c₂ = ({step.original_block.toString()} &times; {step.shared_secret.toString()}) mod {keys.p.toString()} = <strong style={{ color: 'var(--color-primary)' }}>{step.c2.toString()}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Ciphertext table */}
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Alice's Output Ciphertext Block Pairs (c₁, c₂)
              </h4>
              <div className="trace-table-wrapper">
                <table className="trace-table">
                  <thead>
                    <tr>
                      <th>Block</th>
                      <th>Plain Block (M)</th>
                      <th>Ephemeral (k)</th>
                      <th>Shared Secret (s)</th>
                      <th>Ciphertext component (c₁)</th>
                      <th>Ciphertext component (c₂)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ciphertextData.trace_steps.map((step, idx) => (
                      <tr key={idx}>
                        <td>#{step.block_index + 1}</td>
                        <td className="mono-math" style={{ color: 'var(--text-muted)' }}>{step.original_block.toString()}</td>
                        <td className="mono-math" style={{ color: '#fbbf24' }}>{step.ephemeral_key.toString()}</td>
                        <td className="mono-math" style={{ color: '#34d399' }}>{step.shared_secret.toString()}</td>
                        <td className="mono-math" style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>{step.c1.toString()}</td>
                        <td className="mono-math" style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>{step.c2.toString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="alert-callout info" style={{ marginTop: '1.25rem' }}>
                <Sparkles className="alert-icon" size={18} />
                <div>
                  <strong>Semantic Security Demonstration:</strong> Notice that even if the plain blocks were identical, selecting a random fresh ephemeral key <strong>k</strong> generates unique <strong>(c₁, c₂)</strong> blocks. Eve can only intercept the ciphertexts, but has no way to extract M without the modular logarithm base!
                </div>
              </div>

              <button
                id="wizard-step3-submit"
                className="btn btn-primary"
                onClick={handleDecrypt}
                disabled={loading}
                style={{ padding: '0.9rem', marginTop: '1rem' }}
              >
                {loading ? (
                  <>
                    <RefreshCw size={18} className="spinning-icon" />
                    Finding Multiplicative Inverse...
                  </>
                ) : (
                  <>
                    Perform Bob's Decryption & Recover Message
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          )}

          {currentStep > 3 && ciphertextData && (
            <div style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Generated Ciphertext Pairs: <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {JSON.stringify(ciphertextData.ciphertext_blocks.map(b => `(${b.c1}, ${b.c2})`))}
              </strong>
            </div>
          )}
        </div>

        {/* ==========================================
            STEP 4: BOB'S DECRYPTION & RECOVERY
            ========================================== */}
        <div className={`wizard-step-card ${currentStep === 4 ? 'active animate-pulse' : 'inactive'}`}>
          <div className="step-badge-indicator">Step 4</div>
          
          <div className="wizard-step-header">
            <div>
              <h2 className="wizard-step-title">Bob's Decryption & Message Recovery</h2>
              <p className="wizard-step-desc">Bob divides out the shared secret mask from Alice's cipher blocks using private key exponent $x$.</p>
            </div>
            <div className="wizard-step-status-icon">
              {currentStep === 4 ? <CheckCircle size={18} style={{ color: 'var(--color-success)' }} /> : <Unlock size={18} />}
            </div>
          </div>

          {currentStep === 4 && decryptionData && (
            <div style={{ animation: 'fadeIn 0.4s ease', marginTop: '1.5rem' }}>
              {/* Output Result Card */}
              <div className="indicator-card y-ind" style={{ padding: '2rem', marginBottom: '2rem', backgroundColor: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.25)', boxShadow: '0 0 25px rgba(16, 185, 129, 0.1)' }}>
                <span className="indicator-label" style={{ color: 'var(--color-success)', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                  Decrypted Original Plaintext Recovered Flawlessly!
                </span>
                <h1 id="wizard-recovered-output" style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, color: '#f3f4f6', wordBreak: 'break-word', letterSpacing: '-0.02em', marginTop: '0.5rem', fontSize: '2.5rem' }}>
                  {decryptionData.recovered_text}
                </h1>
              </div>

              {/* Math calculations */}
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Mathematical Decryption Calculations (Step-by-Step)
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                {decryptionData.trace_steps.map((step, idx) => (
                  <div className="calculation-block success-variant" key={idx}>
                    <div className="calculation-block-title" style={{ color: 'var(--color-success)' }}>
                      Block #{step.block_index + 1} Decryption Operations:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <div className="calculation-formula">
                        1. Bob recovers the Shared Secret Mask: s = c₁<sup>x</sup> mod p
                        <div style={{ paddingLeft: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                          s = {ciphertextData.ciphertext_blocks[idx]?.c1.toString()}<sup>{keys.x.toString()}</sup> mod {keys.p.toString()} = <strong style={{ color: 'var(--color-success)' }}>{step.shared_secret.toString()}</strong>
                        </div>
                      </div>
                      <div className="calculation-formula">
                        2. Bob computes Modular Inversion: s⁻¹ mod p (via Extended Euclidean Algorithm)
                        <div style={{ paddingLeft: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                          s<sup>-1</sup> &equiv; {step.shared_secret.toString()}<sup>-1</sup> mod {keys.p.toString()} = <strong style={{ color: 'var(--color-primary)' }}>{step.shared_secret_inverse.toString()}</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                            (Verify: {step.shared_secret.toString()} &times; {step.shared_secret_inverse.toString()} &equiv; 1 mod {keys.p.toString()})
                          </span>
                        </div>
                      </div>
                      <div className="calculation-formula">
                        3. Bob retrieves Plain Block M: M = (c₂ &times; s⁻¹) mod p
                        <div style={{ paddingLeft: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                          M = ({ciphertextData.ciphertext_blocks[idx]?.c2.toString()} &times; {step.shared_secret_inverse.toString()}) mod {keys.p.toString()} = <strong style={{ color: 'var(--color-success)', fontSize: '1rem' }}>{step.recovered_block.toString()}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Decryption table */}
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Bob's Modular Division Reconstruction Details
              </h4>
              <div className="trace-table-wrapper">
                <table className="trace-table">
                  <thead>
                    <tr>
                      <th>Block</th>
                      <th>Cipher c₁</th>
                      <th>Cipher c₂</th>
                      <th>Recovered Secret (s)</th>
                      <th>Modular Inverse (s⁻¹)</th>
                      <th>Decrypted Block (M)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {decryptionData.trace_steps.map((step, idx) => (
                      <tr key={idx}>
                        <td>#{step.block_index + 1}</td>
                        <td className="mono-math" style={{ color: 'var(--color-primary)' }}>{ciphertextData.ciphertext_blocks[idx]?.c1.toString()}</td>
                        <td className="mono-math" style={{ color: 'var(--color-primary)' }}>{ciphertextData.ciphertext_blocks[idx]?.c2.toString()}</td>
                        <td className="mono-math" style={{ color: '#fbbf24' }}>{step.shared_secret.toString()}</td>
                        <td className="mono-math" style={{ color: '#818cf8' }}>{step.shared_secret_inverse.toString()}</td>
                        <td className="mono-math" style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>{step.recovered_block.toString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Celebration message */}
              <div className="alert-callout success" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '1.5rem', borderRadius: '16px', marginTop: '2rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <ShieldCheck className="alert-icon" size={24} style={{ color: 'var(--color-success)' }} />
                  <div>
                    <h3 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.25rem' }}>Asymmetric Secure Circle Complete!</h3>
                    <p style={{ color: '#a7f3d0', fontSize: '0.9rem', lineHeight: '1.5' }}>
                      Alice successfully encrypted and transmitted her private message using Bob's public parameters. Even though the cipher blocks were public, only Bob could unpack the mathematical mask because only Bob knew the secret discrete log exponent exponent <code className="mono-math">x = {keys.x.toString()}</code>. 
                      No plaintext data was leaked during transit, and no private parameters were ever shared.
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '2rem' }}>
                <button
                  id="wizard-reset-btn"
                  className="btn btn-secondary"
                  onClick={handleReset}
                  style={{ flex: 1 }}
                >
                  Encrypt A New Message
                </button>
                <button
                  className="btn btn-primary"
                  onClick={onBackToHome}
                  style={{ flex: 1 }}
                >
                  Return to Home Portal
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
