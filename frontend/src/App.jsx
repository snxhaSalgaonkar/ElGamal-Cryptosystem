import React, { useState } from 'react';
import { 
  Key, 
  Lock, 
  Unlock, 
  Zap, 
  Sparkles, 
  ShieldAlert, 
  BookOpen, 
  Cpu, 
  LockKeyhole 
} from 'lucide-react';

// Import our custom functional modules
import KeyGenPanel from './components/KeyGenPanel';
import EncryptPanel from './components/EncryptPanel';
import DecryptPanel from './components/DecryptPanel';
import DLPDemo from './components/DLPDemo';
import ProbabilisticDemo from './components/ProbabilisticDemo';
import EphemeralDanger from './components/EphemeralDanger';

const API_BASE = "http://127.0.0.1:5000";

export default function App() {
  const [activeTab, setActiveTab] = useState('keygen');
  
  // Shared cryptographic parameter states
  const [keys, setKeys] = useState({
    p: null,
    g: null,
    y: null,
    x: null,
    mode: 'toy'
  });

  // Shared ciphertext buffer to ease transitions from Encryptor to Decryptor
  const [ciphertextData, setCiphertextData] = useState({
    ciphertext_blocks: null,
    p: null,
    g: null,
    y: null
  });

  const renderActiveContent = () => {
    switch (activeTab) {
      case 'keygen':
        return (
          <KeyGenPanel 
            keys={keys} 
            setKeys={setKeys} 
            apiBase={API_BASE} 
          />
        );
      case 'encrypt':
        return (
          <EncryptPanel 
            keys={keys} 
            ciphertextData={ciphertextData}
            setCiphertextData={setCiphertextData}
            apiBase={API_BASE} 
            setActiveTab={setActiveTab}
          />
        );
      case 'decrypt':
        return (
          <DecryptPanel 
            keys={keys} 
            ciphertextData={ciphertextData} 
            apiBase={API_BASE} 
          />
        );
      case 'dlp':
        return <DLPDemo />;
      case 'probabilistic':
        return (
          <ProbabilisticDemo 
            keys={keys} 
            apiBase={API_BASE} 
          />
        );
      case 'keyreuse':
        return (
          <EphemeralDanger 
            keys={keys} 
            apiBase={API_BASE} 
          />
        );
      default:
        return (
          <KeyGenPanel 
            keys={keys} 
            setKeys={setKeys} 
            apiBase={API_BASE} 
          />
        );
    }
  };

  const isKeyActive = keys.p !== null;

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="app-sidebar" id="app-sidebar-container">
        <div className="brand-section">
          <div className="brand-icon">
            <LockKeyhole size={20} />
          </div>
          <h1 className="brand-title">ElGamal Portal</h1>
        </div>

        <nav className="nav-menu">
          <div className="nav-category">Mathematics & Setup</div>
          <div 
            id="nav-keygen-tab"
            className={`nav-item ${activeTab === 'keygen' ? 'active' : ''}`}
            onClick={() => setActiveTab('keygen')}
          >
            <Key size={18} className="nav-icon" />
            <span>Key Generation</span>
          </div>

          <div className="nav-category">Asymmetric Workflows</div>
          <div 
            id="nav-encrypt-tab"
            className={`nav-item ${activeTab === 'encrypt' ? 'active' : ''}`}
            onClick={() => setActiveTab('encrypt')}
          >
            <Lock size={18} className="nav-icon" />
            <span>Encryption Module</span>
          </div>
          <div 
            id="nav-decrypt-tab"
            className={`nav-item ${activeTab === 'decrypt' ? 'active' : ''}`}
            onClick={() => setActiveTab('decrypt')}
          >
            <Unlock size={18} className="nav-icon" />
            <span>Decryption Module</span>
          </div>

          <div className="nav-category">Security Laboratories</div>
          <div 
            id="nav-dlp-tab"
            className={`nav-item ${activeTab === 'dlp' ? 'active' : ''}`}
            onClick={() => setActiveTab('dlp')}
          >
            <Zap size={18} className="nav-icon" />
            <span>DLP Hardness Lab</span>
          </div>
          <div 
            id="nav-probabilistic-tab"
            className={`nav-item ${activeTab === 'probabilistic' ? 'active' : ''}`}
            onClick={() => setActiveTab('probabilistic')}
          >
            <Sparkles size={18} className="nav-icon" />
            <span>Probabilistic Security</span>
          </div>
          <div 
            id="nav-keyreuse-tab"
            className={`nav-item ${activeTab === 'keyreuse' ? 'active' : ''}`}
            onClick={() => setActiveTab('keyreuse')}
          >
            <ShieldAlert size={18} className="nav-icon" />
            <span>Key Reuse Threat</span>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div>Discrete Log Cryptography</div>
          <div style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>
            Powered by <a href="https://react.dev" target="_blank" rel="noreferrer">React</a> + <a href="https://flask.palletsprojects.com" target="_blank" rel="noreferrer">Flask</a>
          </div>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="main-content">
        <header className="page-header">
          <div className="page-title-section">
            <div>
              <h1 id="page-primary-title">
                {activeTab === 'keygen' && 'Key Configuration'}
                {activeTab === 'encrypt' && 'Asymmetric Encrypter'}
                {activeTab === 'decrypt' && 'Asymmetric Decrypter'}
                {activeTab === 'dlp' && 'Complexity Theory: DLP'}
                {activeTab === 'probabilistic' && 'Semantic Security'}
                {activeTab === 'keyreuse' && 'Cryptographic Exploitation'}
              </h1>
              <p className="page-subtitle">
                {activeTab === 'keygen' && 'Initialize prime parameters and exponent pairs.'}
                {activeTab === 'encrypt' && 'Transform human-readable text into discrete logarithm cipher blocks.'}
                {activeTab === 'decrypt' && 'Undo modular multiplications via EEA multiplicative modular inverses.'}
                {activeTab === 'dlp' && 'Explore the exponential mathematical wall defending public-key cryptosystems.'}
                {activeTab === 'probabilistic' && 'Examine how randomised ephemeral keys hide message frequencies.'}
                {activeTab === 'keyreuse' && 'Simulate the catastrophic algebraic fallout of reusing single-use variables.'}
              </p>
            </div>
          </div>
        </header>

        {/* Global Key Parameter Status Indicators */}
        <section className="global-indicator-bar" id="global-status-indicator-bar">
          <div className="indicator-card p-ind">
            <span className="indicator-label">Modulus Prime (p)</span>
            <div className="indicator-val" id="global-p-indicator">
              {isKeyActive ? keys.p.toString() : 'Not Loaded'}
            </div>
            <span className="indicator-status">
              {isKeyActive ? (keys.mode === 'toy' ? 'Toy mod 23' : 'Secure Large Prime') : 'Awaiting initialization'}
            </span>
          </div>

          <div className="indicator-card g-ind">
            <span className="indicator-label">Generator (g)</span>
            <div className="indicator-val" id="global-g-indicator">
              {isKeyActive ? keys.g.toString() : 'Not Loaded'}
            </div>
            <span className="indicator-status">
              {isKeyActive ? 'Primitive root modulo p' : 'Awaiting initialization'}
            </span>
          </div>

          <div className="indicator-card y-ind">
            <span className="indicator-label">Public Key (y)</span>
            <div className="indicator-val" id="global-y-indicator">
              {isKeyActive ? keys.y.toString() : 'Not Loaded'}
            </div>
            <span className="indicator-status">
              {isKeyActive ? 'y ≡ gˣ mod p' : 'Awaiting initialization'}
            </span>
          </div>

          <div className="indicator-card x-ind">
            <span className="indicator-label">Private Key (x)</span>
            <div className="indicator-val" id="global-x-indicator" style={{ letterSpacing: isKeyActive ? '0.25em' : 'normal' }}>
              {isKeyActive ? '••••••••' : 'Not Loaded'}
            </div>
            <span className="indicator-status">
              {isKeyActive ? 'Secret exponent' : 'Awaiting initialization'}
            </span>
          </div>
        </section>

        {/* Render the Active Functional Module */}
        <section style={{ position: 'relative' }}>
          {renderActiveContent()}
        </section>
      </main>
    </div>
  );
}
