import React, { useState, useEffect } from 'react';
import {
  LockKeyhole,
  BookOpen,
  Rocket,
  ChevronDown,
  Key,
  Lock,
  Unlock,
  Zap,
  Sparkles,
  ShieldAlert,
  MessageSquare,
  Wifi,
} from 'lucide-react';

import CryptoWizard from './components/CryptoWizard';
import DLPDemo from './components/DLPDemo';
import ProbabilisticDemo from './components/ProbabilisticDemo';
import EphemeralDanger from './components/EphemeralDanger';
import SecureChat from './components/SecureChat';
import { getApiBase, apiPost } from './api/client';

const API_BASE = getApiBase();

export default function App() {
  const [view, setView] = useState('home'); // 'home' | 'wizard' | 'chat'
  const [activeLab, setActiveLab] = useState('dlp');
  const [labKeys, setLabKeys] = useState({
    p: null,
    g: null,
    y: null,
    x: null,
    mode: 'toy',
  });

  useEffect(() => {
    if (view !== 'home') return;
    apiPost('/api/keygen', { mode: 'toy' })
      .then((data) => {
        if (data.public_key) {
          setLabKeys({
            p: data.public_key.p,
            g: data.public_key.g,
            y: data.public_key.y,
            x: data.private_key,
            mode: 'toy',
          });
        }
      })
      .catch(() => {});
  }, [view]);

  const scrollToLearn = () => {
    document.getElementById('learn-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (view === 'wizard') {
    return (
      <CryptoWizard
        apiBase={API_BASE}
        onBackToHome={() => setView('home')}
      />
    );
  }

  if (view === 'chat') {
    return (
      <SecureChat
        apiBase={API_BASE}
        onBackToHome={() => setView('home')}
      />
    );
  }

  return (
    <div className="landing-page">
      <section className="hero-container">
        <div className="hero-badge">
          <LockKeyhole size={16} />
          Discrete Log Cryptography
        </div>
        <h1 className="hero-title">ElGamal Cryptosystem</h1>
        <p className="hero-subtitle">
          Learn public-key encryption with toy parameters you can trace by hand,
          or secure primes for real UTF-8 messages — one guided workflow from keys to recovery.
        </p>
        <div className="hero-actions">
          <button type="button" className="btn btn-secondary" onClick={scrollToLearn}>
            <BookOpen size={18} />
            Learn &amp; Explore
          </button>
          <button
            type="button"
            id="hero-get-started-btn"
            className="btn btn-primary"
            onClick={() => setView('wizard')}
          >
            <Rocket size={18} />
            Get Started Wizard
          </button>
        </div>
        <button type="button" className="scroll-indicator" onClick={scrollToLearn} aria-label="Scroll to learn">
          <span>Scroll to learn</span>
          <ChevronDown size={20} className="scroll-icon-animated" />
        </button>
      </section>

      <div className="section-divider" />

      <section id="learn-section" className="learn-section-container">
        <h2 className="section-title">Learn ElGamal</h2>
        <p className="section-subtitle">
          Key generation, encryption, and decryption — then dive into security labs.
        </p>

        <div className="interactive-cards-grid">
          <article className="concept-card">
            <div className="concept-card-icon">
              <Key size={24} />
            </div>
            <h3 className="concept-card-title">Key Generation</h3>
            <p className="concept-card-desc">
              Bob picks private x, publishes y ≡ gˣ mod p with public p and g.
            </p>
            <span className="concept-card-action" onClick={() => setView('wizard')}>
              Try in wizard →
            </span>
          </article>

          <article className="concept-card green-theme">
            <div className="concept-card-icon">
              <Lock size={24} />
            </div>
            <h3 className="concept-card-title">Asymmetric Encryption</h3>
            <p className="concept-card-desc">
              Alice uses random k to produce (c₁, c₂) with semantic security.
            </p>
            <span className="concept-card-action" onClick={() => setView('wizard')}>
              Try in wizard →
            </span>
          </article>

          <article className="concept-card amber-theme">
            <div className="concept-card-icon">
              <Unlock size={24} />
            </div>
            <h3 className="concept-card-title">Decryption</h3>
            <p className="concept-card-desc">
              Bob recovers M using x, modular inverse, and block reconstruction.
            </p>
            <span className="concept-card-action" onClick={() => setView('wizard')}>
              Try in wizard →
            </span>
          </article>
        </div>

        <h2 className="section-title" style={{ fontSize: '1.75rem', marginTop: '4rem' }}>
          Real-Life Application
        </h2>
        <p className="section-subtitle">
          Experience the power of ElGamal encryption in an active WiFi-linked messaging space.
        </p>

        <div className="card glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1.25rem', border: '1px solid rgba(139, 92, 246, 0.25)', background: 'linear-gradient(135deg, rgba(20, 10, 40, 0.6) 0%, rgba(10, 5, 20, 0.8) 100%)', borderRadius: '24px', marginBottom: '4rem', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)' }}>
          <div style={{ color: '#8b5cf6', display: 'inline-flex', padding: '1.25rem', borderRadius: '50%', backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
            <MessageSquare size={36} />
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            WiFi-Linked End-to-End Secure Chat
          </h3>
          <p style={{ maxWidth: '650px', color: 'var(--text-secondary)', fontSize: '0.975rem', lineHeight: 1.6 }}>
            Run the server locally and connect another device (such as a smartphone or laptop) on the same WiFi network.
            Both users generate their keys on-the-fly, exchange public keys automatically, and encrypt messages locally.
            The server only processes and relays ciphertext blocks, demonstrating true zero-knowledge secure communication!
          </p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button className="btn btn-primary" id="launch-chat-btn" onClick={() => setView('chat')} style={{ padding: '0.75rem 2.5rem' }}>
              <Wifi size={16} style={{ display: 'inline', marginRight: 8 }} />
              Launch Secure Chat Room
            </button>
          </div>
        </div>

        <h2 className="section-title" style={{ fontSize: '1.75rem' }}>
          Security Laboratories
        </h2>
        <p className="section-subtitle" style={{ marginBottom: '2rem' }}>
          DLP hardness, probabilistic encryption, and ephemeral key reuse.
        </p>

        <nav className="labs-navigation-bar">
          <button
            type="button"
            className={`lab-nav-tab ${activeLab === 'dlp' ? 'active' : ''}`}
            onClick={() => setActiveLab('dlp')}
          >
            <Zap size={16} style={{ display: 'inline', marginRight: 6 }} />
            DLP Hardness
          </button>
          <button
            type="button"
            className={`lab-nav-tab ${activeLab === 'probabilistic' ? 'active warning-theme' : ''}`}
            onClick={() => setActiveLab('probabilistic')}
          >
            <Sparkles size={16} style={{ display: 'inline', marginRight: 6 }} />
            Probabilistic Security
          </button>
          <button
            type="button"
            className={`lab-nav-tab ${activeLab === 'keyreuse' ? 'active danger-theme' : ''}`}
            onClick={() => setActiveLab('keyreuse')}
          >
            <ShieldAlert size={16} style={{ display: 'inline', marginRight: 6 }} />
            Key Reuse Threat
          </button>
        </nav>

        <div className="card glass-panel">
          {activeLab === 'dlp' && <DLPDemo />}
          {activeLab === 'probabilistic' && (
            <ProbabilisticDemo keys={labKeys} apiBase={API_BASE} />
          )}
          {activeLab === 'keyreuse' && (
            <EphemeralDanger keys={labKeys} apiBase={API_BASE} />
          )}
        </div>
      </section>
    </div>
  );
}