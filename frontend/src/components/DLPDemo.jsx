import React, { useState, useRef } from 'react';
import { Eye, ShieldAlert, Zap, Timer, BarChart, Play, Square } from 'lucide-react';

export default function DLPDemo() {
  const [selectedPreset, setSelectedPreset] = useState('tiny');
  const [p, setP] = useState(23);
  const [g, setG] = useState(5);
  const [y, setY] = useState(8); // 5^x = 8 mod 23 => x = 6
  
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [foundX, setFoundX] = useState(null);
  const [speed, setSpeed] = useState(0);

  const runningRef = useRef(false);
  const timerId = useRef(null);

  const presets = {
    tiny: { p: 23, g: 5, y: 8, xName: 'Tiny Modulus (p=23)' },
    small: { p: 2011, g: 3, y: 1729, xName: 'Medium Modulus (p=2,011)' },
    medium: { p: 99991, g: 6, y: 55432, xName: 'Moderate Modulus (p=99,991)' },
    large: { p: 1323118931, g: 7, y: 92837412, xName: 'Large (p ≈ 1.3 Billion, Safe Crash Warning)' }
  };

  const handlePresetChange = (presetKey) => {
    setSelectedPreset(presetKey);
    const pr = presets[presetKey];
    setP(pr.p);
    setG(pr.g);
    setY(pr.y);
    setFoundX(null);
    setSteps(0);
    setElapsedTime(0);
    setSpeed(0);
  };

  const stopBruteForce = () => {
    runningRef.current = false;
    setRunning(false);
    if (timerId.current) clearInterval(timerId.current);
  };

  const runBruteForce = () => {
    setFoundX(null);
    setSteps(0);
    setElapsedTime(0);
    setSpeed(0);
    setRunning(true);
    runningRef.current = true;

    const startTimestamp = performance.now();
    let currentSteps = 0;
    const targetY = BigInt(y);
    const modulusP = BigInt(p);
    const baseG = BigInt(g);
    
    // Live update interval
    timerId.current = setInterval(() => {
      const now = performance.now();
      const elapsed = (now - startTimestamp) / 1000;
      setElapsedTime(elapsed);
      if (elapsed > 0) {
        setSpeed(Math.floor(currentSteps / elapsed));
      }
    }, 100);

    const chunkRun = () => {
      if (!runningRef.current) return;

      const chunkSize = 2000; // Run 2000 tests per chunk to prevent blocking main thread
      let found = false;
      let matchedX = -1;

      for (let i = 0; i < chunkSize; i++) {
        const testX = currentSteps + i;
        
        // Compute baseG^testX mod modulusP
        // Using BigInt modular exponentiation
        let res = 1n;
        let base = baseG % modulusP;
        let exp = BigInt(testX);
        
        while (exp > 0n) {
          if (exp % 2n === 1n) res = (res * base) % modulusP;
          base = (base * base) % modulusP;
          exp = exp / 2n;
        }

        if (res === targetY) {
          found = true;
          matchedX = testX;
          break;
        }
      }

      currentSteps += chunkSize;
      setSteps(currentSteps);

      if (found) {
        setFoundX(matchedX);
        stopBruteForce();
        // Record final precise time
        const endNow = performance.now();
        setElapsedTime((endNow - startTimestamp) / 1000);
      } else if (currentSteps >= p) {
        // Explored entire group without match (should not happen if y is in subgroup)
        setFoundX("No solution exists (Generator mismatch)");
        stopBruteForce();
      } else {
        // Queue next chunk in requestAnimationFrame
        requestAnimationFrame(chunkRun);
      }
    };

    requestAnimationFrame(chunkRun);
  };

  return (
    <div className="card glass-panel" id="dlp-demo-container">
      <div className="card-title">
        <Zap className="nav-icon" size={22} style={{ color: 'var(--color-warning)' }} />
        <h2>Discrete Logarithm Problem (DLP) Laboratory</h2>
      </div>
      <p className="card-desc">
        Under ElGamal, your private key is exponent $x$, public key is $y = g^x \bmod p$. To break it, an attacker must solve for $x$ given $(p, g, y)$. This tab lets you experience brute-forcing this discrete log problem in real time.
      </p>

      <div className="grid-2">
        <div>
          {/* Preset Selector */}
          <div className="form-group">
            <label className="form-label">Select Modulus Size</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {Object.keys(presets).map((key) => (
                <button
                  key={key}
                  id={`preset-${key}-btn`}
                  type="button"
                  className={`btn ${selectedPreset === key ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ justifyContent: 'space-between', padding: '0.6rem 1rem' }}
                  onClick={() => handlePresetChange(key)}
                  disabled={running}
                >
                  <span>{presets[key].xName}</span>
                  <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>p = {presets[key].p}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive controls */}
          <div className="form-group" style={{ background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <span className="form-label" style={{ color: '#fbbf24' }}>Equations Being Attacked:</span>
            <div className="calculation-formula" style={{ fontSize: '1rem', margin: '0.5rem 0' }}>
              {g}<sup>x</sup> &equiv; {y} (mod {p})
            </div>
            <p className="indicator-status" style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>
              We know base generator $g = {g}$ and public key $y = {y}$. The brute force algorithm will test increments $i = 0, 1, 2, \dots$ until it finds an exponent $x$ satisfying the congruent relation.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            {!running ? (
              <button
                id="start-brute-btn"
                className="btn btn-primary"
                style={{ backgroundColor: 'var(--color-warning)', color: '#000' }}
                onClick={runBruteForce}
              >
                <Play size={16} />
                Launch Brute Force Attack
              </button>
            ) : (
              <button
                id="stop-brute-btn"
                className="btn btn-danger"
                onClick={stopBruteForce}
              >
                <Square size={16} />
                Terminate Process
              </button>
            )}
          </div>
        </div>

        {/* Live Attack Dashboard Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div className="indicator-card p-ind" style={{ padding: '1.25rem', flexGrow: 1, marginBottom: '1.25rem', borderColor: running ? 'var(--color-warning)' : 'var(--border-color)' }}>
            <span className="indicator-label" style={{ color: running ? 'var(--color-warning)' : 'var(--text-secondary)' }}>
              {running ? 'Discrete Logarithm Attack Active...' : 'Discrete Logarithm Attack Idle'}
            </span>
            
            {/* Live Progress Bar */}
            <div className="dlp-loading-bar" style={{ marginTop: '0.75rem' }}>
              <div
                className={`dlp-loading-bar-fill ${running ? 'active' : ''}`}
                style={{ width: running ? `${Math.min(100, (steps / p) * 100)}%` : foundX ? '100%' : '0%' }}
              />
            </div>

            <div className="brute-force-stats">
              <div className="stat-item">
                <div className="stat-label">
                  <BarChart size={12} style={{ marginRight: '0.2rem' }} />
                  Keys Tested
                </div>
                <div className="stat-value" id="dlp-stat-steps">{steps.toLocaleString()}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">
                  <Timer size={12} style={{ marginRight: '0.2rem' }} />
                  Time Elapsed
                </div>
                <div className="stat-value" id="dlp-stat-time">{elapsedTime.toFixed(2)}s</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">
                  <Zap size={12} style={{ marginRight: '0.2rem' }} />
                  Hash Rate
                </div>
                <div className="stat-value" id="dlp-stat-speed">{speed.toLocaleString()} H/s</div>
              </div>
            </div>

            {/* Answer Display */}
            {foundX !== null && (
              <div className="alert-callout success" style={{ marginTop: '0.5rem', animation: 'fadeIn 0.25s ease' }} id="dlp-success-banner">
                <ShieldAlert className="alert-icon" size={18} style={{ color: 'var(--color-success)' }} />
                <div>
                  <strong>Secret Key Exposed!</strong> Private Key found: <strong className="mono-math" style={{ fontSize: '1.05rem' }}>x = {foundX.toString()}</strong>
                  <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: '#a7f3d0' }}>
                    Verification: {g}<sup>{foundX.toString()}</sup> mod {p} = {y}
                  </div>
                </div>
              </div>
            )}

            {running && selectedPreset === 'large' && (
              <div className="alert-callout danger" style={{ marginTop: '0.5rem' }}>
                <AlertTriangle className="alert-icon" size={18} />
                <div>
                  <strong>Exponential Wall!</strong> At 1.3 billion operations, this will run for several days on standard single-thread JavaScript engines. Imagine if p were 512 bits!
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Math Explanation Area */}
      <div className="trace-section">
        <h3 className="trace-title">The Math Behind DLP Hardness</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', fontSize: '0.875rem', lineHeight: '1.5', color: 'var(--text-secondary)' }}>
          <div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontWeight: 600 }}>Why is DLP Hard?</h4>
            <p>
              In regular modular arithmetic, checking if $g^x \equiv y \pmod p$ is trivial using fast modular exponentiation (takes $O(\log x)$ time).
            </p>
            <p style={{ marginTop: '0.5rem' }}>
              However, the inverse operation (finding $x$ given $g$ and $y$) has no known polynomial-time classical algorithm. The values of $g^x \bmod p$ jump around in a seemingly random, chaotic fashion across the multiplicative group $\mathbb{Z}_p^*$.
            </p>
          </div>
          <div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontWeight: 600 }}>Complexity Scaling Comparison</h4>
            <p>
              For a prime modulus $p$:
              <br />
              - **Toy parameters (p=23)**: maximum steps to check = 23 (instant, &lt; 1 ms).
              <br />
              - **Secure parameters (512-bit prime)**: $p$ is a number with 154 decimal digits! The number of steps to brute force exceeds $10^{154}$ operations.
            </p>
            <p style={{ marginTop: '0.5rem', borderLeft: '2px solid var(--color-primary)', paddingLeft: '0.75rem', color: '#a5b4fc', fontSize: '0.8rem' }}>
              "Even if every atom in the observable universe were a supercomputer testing a trillion keys per second, brute-forcing a 512-bit safe prime would take trillions of times longer than the age of the universe."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
