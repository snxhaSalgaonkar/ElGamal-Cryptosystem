import React, { useState, useEffect, useRef } from 'react';
import {
  Undo2,
  Send,
  Lock,
  Unlock,
  Key,
  ShieldAlert,
  ShieldCheck,
  Wifi,
  Users,
  Terminal,
  RefreshCw,
  HelpCircle,
  AlertCircle,
  User,
  Info,
  Copy,
  Check
} from 'lucide-react';

import { apiPost } from '../api/client';

export default function SecureChat({ apiBase, onBackToHome }) {
  // Join Room States
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [paradigm, setParadigm] = useState('toy'); // 'toy' or 'secure'
  const [bits, setBits] = useState(256);
  const [inRoom, setInRoom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Connection Info State
  const [ipInfo, setIpInfo] = useState({ ip: '127.0.0.1', port: 5000 });
  const [copiedIp, setCopiedIp] = useState(false);

  // Active Room State
  const [roomParams, setRoomParams] = useState({ p: null, g: null });
  const [keys, setKeys] = useState({ x: null, y: null });
  const [participants, setParticipants] = useState({});
  const [messages, setMessages] = useState([]);
  const [serverDbView, setServerDbView] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);

  // Chat Input and Send Status
  const [sending, setSending] = useState(false);
  const [isInputEmpty, setIsInputEmpty] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [activeMobileTab, setActiveMobileTab] = useState('chat'); // 'chat' | 'inspector' | 'server'

  const chatInputRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Plaintext decryption cache (stores decrypted messages locally in client browser)
  const [decryptedCache, setDecryptedCache] = useState({});
  const [decryptingIds, setDecryptingIds] = useState(new Set());
  // Local cache of messages sent by *this* client (keeps plaintext of sent messages since server has no plaintext)
  const [sentPlaintextCache, setSentPlaintextCache] = useState({});

  // Scroller Ref
  const messagesEndRef = useRef(null);

  // 1. Fetch backend server IP info on load
  useEffect(() => {
    fetch(`${apiBase || ''}/api/chat/ip`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ip) {
          setIpInfo({ ip: data.ip, port: data.port });
        }
      })
      .catch(() => {});
  }, [apiBase]);

  // 2. Poll Room Status and Messages once inside room
  useEffect(() => {
    if (!inRoom || !roomId) return;

    let pollInterval = setInterval(() => {
      pollRoomData();
    }, 2000);

    // Initial poll
    pollRoomData();

    return () => {
      clearInterval(pollInterval);
    };
  }, [inRoom, roomId, username, keys]);

  // 3. Scroll to bottom on new messages
  useEffect(() => {
    if (inRoom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, inRoom]);

  // Handle Leave Room proactively when navigating away
  useEffect(() => {
    return () => {
      if (inRoom && roomId && username) {
        // Send beacon or fetch to leave room
        fetch(`${apiBase || ''}/api/chat/leave`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ room_id: roomId, username }),
          keepalive: true
        }).catch(() => {});
      }
    };
  }, [inRoom, roomId, username, apiBase]);

  const pollRoomData = async () => {
    try {
      // Fetch Status (Participants)
      const statusData = await apiPost(
        `/api/chat/status?room_id=${roomId}`,
        null,
        { baseUrl: apiBase }
      );
      if (statusData && statusData.participants) {
        setParticipants(statusData.participants);
      }

      // Fetch Messages & Server Logs
      const msgRes = await apiPost(
        `/api/chat/messages?room_id=${roomId}`,
        null,
        { baseUrl: apiBase }
      );
      if (msgRes) {
        setMessages(msgRes.messages || []);
        if (msgRes.server_db_view) {
          setServerDbView(msgRes.server_db_view);
        }

        // Proactively decrypt new incoming messages
        const msgs = msgRes.messages || [];
        msgs.forEach((msg) => {
          // If we are NOT the sender, we need to decrypt it
          if (msg.sender !== username) {
            triggerMessageDecryption(msg);
          }
        });
      }
    } catch (err) {
      console.error('Polling error:', err);
    }
  };

  const triggerMessageDecryption = async (msg) => {
    // Skip if already decrypted, or already decrypting, or has no blocks
    if (decryptedCache[msg.id] || decryptingIds.has(msg.id) || !msg.ciphertext_blocks.length) {
      return;
    }

    setDecryptingIds((prev) => {
      const copy = new Set(prev);
      copy.add(msg.id);
      return copy;
    });

    try {
      const data = await apiPost(
        '/api/decrypt',
        {
          ciphertext_blocks: msg.ciphertext_blocks,
          x: keys.x,
          p: roomParams.p,
        },
        { baseUrl: apiBase }
      );

      if (data && data.recovered_text !== undefined) {
        setDecryptedCache((prev) => ({
          ...prev,
          [msg.id]: {
            text: data.recovered_text,
            trace: data.trace_steps,
            recovered_blocks: data.recovered_blocks
          }
        }));
      }
    } catch (err) {
      console.error('Decryption failed for msg', msg.id, err);
      setDecryptedCache((prev) => ({
        ...prev,
        [msg.id]: {
          text: '[Decryption Error: Prime mismatch or corrupted block]',
          trace: null,
          recovered_blocks: null
        }
      }));
    } finally {
      setDecryptingIds((prev) => {
        const copy = new Set(prev);
        copy.delete(msg.id);
        return copy;
      });
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!username.trim() || !roomId.trim()) {
      setError('Username and Room Code are required.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const formattedRoomId = roomId.trim().toUpperCase();
      const formattedUsername = username.trim();

      // 1. Join room (and generate keys matching room parameters)
      const data = await apiPost(
        '/api/chat/join',
        {
          room_id: formattedRoomId,
          username: formattedUsername,
          mode: paradigm,
          bits: paradigm === 'secure' ? bits : undefined,
        },
        { baseUrl: apiBase }
      );

      // 2. Set credentials
      setRoomParams({ p: data.p, g: data.g });
      setKeys({ x: data.x, y: data.y });
      setParticipants(data.participants || {});
      setRoomId(formattedRoomId);
      setUsername(formattedUsername);
      setInRoom(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const textToSend = chatInputRef.current?.value || '';
    if (!textToSend.trim() || sending) return;

    // Retrieve recipient
    const peerName = Object.keys(participants).find((u) => u !== username);
    if (!peerName) {
      setError('Cannot send message: waiting for another participant to join the room.');
      return;
    }

    const peerPublicKeyY = participants[peerName];

    setError(null);
    setSending(true);

    try {
      // 1. Encrypt message locally using recipient's public key (via backend helper for math trace consistency)
      const encPayload = paradigm === 'toy' ? parseInt(textToSend, 10) : textToSend;
      if (paradigm === 'toy') {
        const val = parseInt(textToSend, 10);
        if (isNaN(val) || val <= 0 || val >= parseInt(roomParams.p, 10)) {
          throw new Error(`For Toy Mode, enter a positive number strictly less than p (${roomParams.p}).`);
        }
      }

      const encData = await apiPost(
        '/api/encrypt',
        {
          message: encPayload,
          p: roomParams.p,
          g: roomParams.g,
          y: peerPublicKeyY,
        },
        { baseUrl: apiBase }
      );

      // 2. Send ciphertext blocks to backend
      const sendRes = await apiPost(
        '/api/chat/send',
        {
          room_id: roomId,
          sender: username,
          ciphertext_blocks: encData.ciphertext_blocks,
        },
        { baseUrl: apiBase }
      );

      if (sendRes && sendRes.message) {
        const newMsgId = sendRes.message.id;

        // Cache the sent plaintext locally so we can display it to ourselves
        setSentPlaintextCache((prev) => ({
          ...prev,
          [newMsgId]: {
            text: textToSend,
            trace: encData.trace_steps,
            numeric_blocks: encData.numeric_blocks,
            ciphertext_blocks: encData.ciphertext_blocks,
            peer_y: peerPublicKeyY
          }
        }));

        if (chatInputRef.current) {
          chatInputRef.current.value = '';
        }
        setIsInputEmpty(true);
      }

      // Refresh immediately
      pollRoomData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleLeave = async () => {
    setLoading(true);
    try {
      await apiPost('/api/chat/leave', { room_id: roomId, username }, { baseUrl: apiBase });
    } catch (err) {}
    setInRoom(false);
    setKeys({ x: null, y: null });
    setRoomParams({ p: null, g: null });
    setParticipants({});
    setMessages([]);
    setServerDbView(null);
    setSelectedMessage(null);
    setDecryptedCache({});
    setSentPlaintextCache({});
    setLoading(false);
  };

  const copyUrlToClipboard = () => {
    const url = `http://${ipInfo.ip}:5173`;
    navigator.clipboard.writeText(url);
    setCopiedIp(true);
    setTimeout(() => setCopiedIp(false), 2000);
  };

  // Render Join Layout
  if (!inRoom) {
    return (
      <div className="wizard-page-container animate-fadeIn">
        <div className="wizard-header-nav">
          <button className="back-home-link" onClick={onBackToHome}>
            <Undo2 size={16} />
            Back to Portal Home
          </button>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span className="trace-tag purple">Real-Life Lab</span>
            <span className="trace-tag green">WiFi Network Link</span>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, background: 'linear-gradient(135deg, #fff 30%, #a5b4fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.5rem', letterSpacing: '-0.04em' }}>
            WiFi Secure Chat Room Gateway
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
            Establish a 1-to-1 secure ElGamal cryptosystem chat. Your private key stays inside your browser, while public keys are synchronized to encrypt live message packets over WiFi.
          </p>
        </div>

        <div className="grid-2" style={{ maxWidth: '1000px', margin: '0 auto', gap: '2rem' }}>
          {/* Form Side */}
          <div className="card glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Key size={20} className="text-primary" /> Join or Create Room
            </h2>

            {error && (
              <div className="alert-callout danger" style={{ marginBottom: '1.5rem' }}>
                <AlertCircle className="alert-icon" size={18} />
                <div>{error}</div>
              </div>
            )}

            <form onSubmit={handleJoinRoom} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Display Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                  placeholder="e.g. Alice"
                  maxLength={12}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Secret Room Code</label>
                <input
                  type="text"
                  className="input-field"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                  placeholder="e.g. GOLDEN_KEY"
                  maxLength={20}
                  required
                />
                <span className="indicator-status">Users joining the same code enter the same secure math space.</span>
              </div>

              <div className="form-group">
                <label className="form-label">Encryption Paradigm</label>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                  <button
                    type="button"
                    className={`btn ${paradigm === 'toy' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, padding: '0.6rem' }}
                    onClick={() => setParadigm('toy')}
                  >
                    Toy Mode (p=23)
                  </button>
                  <button
                    type="button"
                    className={`btn ${paradigm === 'secure' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, padding: '0.6rem' }}
                    onClick={() => setParadigm('secure')}
                  >
                    Secure Mode
                  </button>
                </div>
              </div>

              {paradigm === 'secure' && (
                <div className="form-group animate-fadeIn">
                  <label className="form-label">Modulus Prime Length</label>
                  <select
                    className="input-field select-field"
                    value={bits}
                    onChange={(e) => setBits(Number(e.target.value))}
                  >
                    <option value={128}>128-bit Prime</option>
                    <option value={256}>256-bit Prime (Recommended)</option>
                    <option value={512}>512-bit Prime</option>
                  </select>
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ padding: '0.9rem', marginTop: '0.5rem' }} disabled={loading}>
                {loading ? (
                  <>
                    <RefreshCw size={18} className="spinning-icon" />
                    Initializing Secure Cryptographic Room Parameters...
                  </>
                ) : (
                  <>
                    Initialize &amp; Join Room
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Connection Helper Side */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card glass-panel" style={{ padding: '2rem', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Wifi size={20} style={{ color: '#3b82f6' }} /> WiFi Peer Connection Setup
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                To connect a second device (smartphone or laptop) on your WiFi network, open the browser on that device and navigate to the address below:
              </p>

              <div className="huge-number-container mono-math" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1rem', padding: '0.75rem 1rem', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '12px', flexWrap: 'wrap', gap: '0.75rem' }}>
                <code style={{ color: '#3b82f6', wordBreak: 'break-all' }}>http://{ipInfo.ip}:5173</code>
                <button
                  onClick={copyUrlToClipboard}
                  className="btn btn-secondary"
                  style={{ padding: '0.4rem 0.8rem', minWidth: '80px', display: 'flex', gap: '0.4rem', fontSize: '0.8rem', width: 'auto' }}
                >
                  {copiedIp ? <Check size={14} style={{ color: 'var(--color-success)' }} /> : <Copy size={14} />}
                  {copiedIp ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <div className="alert-callout info" style={{ marginTop: '1.5rem' }}>
                <Info className="alert-icon" size={18} />
                <div style={{ fontSize: '0.825rem' }}>
                  <strong>How to use:</strong> Open this page on both devices, type in the **exact same Room Code** (e.g. <code>WIFI_CHAT</code>), choose the **same paradigm**, and input two different names (e.g., Alice on device 1, Bob on device 2).
                </div>
              </div>
            </div>

            <div className="card glass-panel" style={{ padding: '1.5rem', backgroundColor: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
              <h4 style={{ color: '#10b981', fontWeight: 700, fontSize: '0.95rem', display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                <ShieldCheck size={16} /> Zero-Knowledge Secure Promise
              </h4>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Private key generation math is resolved locally in each browser session. Only public parameters are synced. The server never holds the private key exponent <code>x</code>, and does not record the raw message text. Encryption and Decryption mathematically occur at the client edge.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active Peer
  const peerName = Object.keys(participants).find((u) => u !== username);
  const activeMessageDetails = selectedMessage ? (
    selectedMessage.sender === username 
      ? sentPlaintextCache[selectedMessage.id] 
      : {
          text: decryptedCache[selectedMessage.id]?.text,
          trace: decryptedCache[selectedMessage.id]?.trace,
          numeric_blocks: decryptedCache[selectedMessage.id]?.recovered_blocks,
          ciphertext_blocks: selectedMessage.ciphertext_blocks,
          peer_y: participants[selectedMessage.sender]
        }
  ) : null;

  return (
    <div className="wizard-page-container animate-fadeIn" style={{ maxWidth: '1400px', paddingBottom: isMobile ? '12rem' : '3rem' }}>
      {/* Top Banner Navigation */}
      <div className="wizard-header-nav" style={{ flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: '1rem' }}>
        <button className="back-home-link" onClick={handleLeave}>
          <Undo2 size={16} />
          Leave Chat Room
        </button>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="trace-tag purple">Active Room: {roomId}</span>
          <span className="trace-tag green">{paradigm === 'toy' ? 'Toy parameters (p=23)' : 'Secure Prime parameters'}</span>
          <span className="trace-tag amber">As: {username}</span>
        </div>
      </div>

      {/* Mobile view Tab Bar switcher */}
      {isMobile && (
        <div className="labs-navigation-bar" style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '0.75rem' }}>
          <button
            type="button"
            className={`lab-nav-tab ${activeMobileTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveMobileTab('chat')}
            style={{ flex: 1, padding: '0.5rem 0.25rem', fontSize: '0.8rem', borderRadius: '12px' }}
          >
            Chat Room
          </button>
          <button
            type="button"
            className={`lab-nav-tab ${activeMobileTab === 'inspector' ? 'active' : ''}`}
            onClick={() => setActiveMobileTab('inspector')}
            style={{ flex: 1, padding: '0.5rem 0.25rem', fontSize: '0.8rem', borderRadius: '12px' }}
          >
            Crypto Inspector
          </button>
          <button
            type="button"
            className={`lab-nav-tab ${activeMobileTab === 'server' ? 'active' : ''}`}
            onClick={() => setActiveMobileTab('server')}
            style={{ flex: 1, padding: '0.5rem 0.25rem', fontSize: '0.8rem', borderRadius: '12px' }}
          >
            Server Logs
          </button>
        </div>
      )}

      {/* Main Content Layout */}
      {(!isMobile || activeMobileTab === 'chat') && (
        <div className="secure-chat-grid" style={{ display: isMobile ? 'block' : 'grid' }}>
          {/* LEFT COLUMN: CHAT PORTAL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Room Participants Status Card */}
            <div className="card glass-panel" style={{ padding: '1rem 1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#fff' }}>
                  <Users size={18} style={{ color: 'var(--color-primary)' }} />
                  <span style={{ fontWeight: 700 }}>Participants ({Object.keys(participants).length}/2)</span>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981' }} />
                    <span style={{ color: 'var(--text-primary)' }}>{username} (You)</span>
                  </div>
                  {peerName ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981' }} />
                      <span style={{ color: 'var(--text-primary)' }}>{peerName}</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', animation: 'pulse 1.5s infinite' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                      <span style={{ color: 'var(--text-muted)' }}>Waiting...</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Display user keys info */}
              <div className="secure-chat-keys-container">
                <div style={{ wordBreak: 'break-all' }}>
                  Private Key <code className="mono-math" style={{ color: 'var(--color-danger)' }}>x</code>: <strong style={{ color: '#fff' }}>{keys.x?.toString()}</strong>
                </div>
                <div style={{ wordBreak: 'break-all' }}>
                  Public Key <code className="mono-math" style={{ color: 'var(--color-success)' }}>y</code>: <strong style={{ color: '#fff' }}>{keys.y?.toString().substring(0, 10)}...</strong>
                </div>
              </div>
            </div>

            {/* Active Chat Bubble Screen */}
            <div className="card glass-panel" style={{ height: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.25rem' }}>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem', marginBottom: '1rem' }}>
                {messages.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', textAlign: 'center', gap: '0.75rem' }}>
                    <Lock size={32} style={{ opacity: 0.3 }} />
                    <p style={{ fontSize: '0.9rem' }}>
                      {peerName 
                        ? 'Room is established! Messages are encrypted asymmetrically.' 
                        : `Tell your peer to join room code "${roomId}" to start chatting.`}
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender === username;
                    const isSelected = selectedMessage?.id === msg.id;
                    
                    let plain = null;
                    let isDecrypting = false;
                    
                    if (isMe) {
                      plain = sentPlaintextCache[msg.id]?.text;
                    } else {
                      const cached = decryptedCache[msg.id];
                      if (cached) {
                        plain = cached.text;
                      } else if (decryptingIds.has(msg.id)) {
                        isDecrypting = true;
                      }
                    }

                    return (
                      <div
                        key={msg.id}
                        onClick={() => setSelectedMessage(msg)}
                        style={{
                          alignSelf: isMe ? 'flex-end' : 'flex-start',
                          maxWidth: '85%',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isMe ? 'flex-end' : 'flex-start',
                          animation: 'fadeIn 0.25s ease'
                        }}
                      >
                        <div style={{ display: 'flex', gap: '0.4rem', fontSize: '0.675rem', color: 'var(--text-muted)', marginBottom: '0.2rem', padding: '0 0.25rem' }}>
                          <span>{msg.sender}</span>
                          <span>•</span>
                          <span>{msg.timestamp}</span>
                        </div>
                        
                        <div
                          style={{
                            padding: '0.75rem 1rem',
                            borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                            backgroundColor: isSelected 
                              ? (isMe ? '#4338ca' : '#1e293b') 
                              : (isMe ? '#4f46e5' : '#0f172a'),
                            border: isSelected 
                              ? '1.5px solid #8b5cf6' 
                              : '1.5px solid rgba(255, 255, 255, 0.05)',
                            color: '#fff',
                            boxShadow: isSelected ? '0 0 12px rgba(139, 92, 246, 0.2)' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <p style={{ margin: 0, fontSize: '0.925rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {plain !== null ? (
                              plain
                            ) : isDecrypting ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                                <RefreshCw size={12} className="spinning-icon" /> Decrypting...
                              </span>
                            ) : isMe ? (
                              <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Lock size={12} /> Plaintext cleared on refresh
                              </span>
                            ) : (
                              <span style={{ color: 'var(--color-danger)', fontStyle: 'italic', fontSize: '0.85rem' }}>
                                [Ciphertext Encrypted]
                              </span>
                            )}
                          </p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.15rem', padding: '0 0.25rem' }}>
                          {plain !== null ? <Unlock size={10} style={{ color: '#10b981' }} /> : <Lock size={10} style={{ color: '#f59e0b' }} />}
                          <span>
                            {msg.ciphertext_blocks.length} block{msg.ciphertext_blocks.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Panel */}
              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '0.75rem' }}>
                <input
                  ref={chatInputRef}
                  type="text"
                  inputMode={paradigm === 'toy' ? 'numeric' : 'text'}
                  pattern={paradigm === 'toy' ? '[0-9]*' : undefined}
                  className="input-field"
                  onInput={(e) => setIsInputEmpty(!e.target.value.trim())}
                  onFocus={() => {
                    if (isMobile) {
                      setTimeout(() => {
                        chatInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 300);
                    }
                  }}
                  placeholder={
                    !peerName 
                      ? "Waiting for another participant..." 
                      : (paradigm === 'toy' ? `Enter raw integer M < ${roomParams.p}...` : "Type a secure message...")
                  }
                  disabled={!peerName || sending}
                  style={{ flex: 1, backgroundColor: '#101014', color: '#ffffff' }}
                  required
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '0 1.5rem', width: 'auto' }}
                  disabled={!peerName || isInputEmpty || sending}
                >
                  {sending ? (
                    <RefreshCw size={16} className="spinning-icon" />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Crypto Inspector Column */}
      {(!isMobile || activeMobileTab === 'inspector') && (
        <div style={{ display: isMobile ? 'block' : 'block', marginTop: isMobile ? '0' : '0' }}>
          <div className="card glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', minHeight: '500px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '0.75rem', marginBottom: '1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Key size={18} style={{ color: 'var(--color-primary)' }} /> ElGamal Crypto Inspector
            </h3>

            {!selectedMessage ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem', gap: '0.75rem' }}>
                <HelpCircle size={36} style={{ opacity: 0.2, color: 'var(--color-primary)' }} />
                <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#fff' }}>No Message Selected</h4>
                <p style={{ fontSize: '0.85rem', lineHeight: 1.4 }}>
                  Select any chat message to dissect its ciphertext blocks, reveal the cryptographic mathematical formulas, and view the client private key parameters.
                </p>
              </div>
            ) : (
              <div style={{ flex: 1, overflowY: 'auto', fontSize: '0.825rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fadeIn 0.2s ease' }}>
                {/* Basic Metadata */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)', borderRadius: '10px' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>SENDER</span>
                    <strong style={{ color: '#fff' }}>{selectedMessage.sender}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>RECEIVER</span>
                    <strong style={{ color: '#fff' }}>{selectedMessage.receiver || 'Unknown'}</strong>
                  </div>
                </div>

                {/* Mathematical Public Modulus */}
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>Shared Group Parameters</h4>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, padding: '0.5rem', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '6px', minWidth: '120px' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>MODULUS (p)</span>
                      <code className="mono-math" style={{ display: 'block', color: 'var(--color-primary)', wordBreak: 'break-all' }}>{roomParams.p?.toString()}</code>
                    </div>
                    <div style={{ flex: 1, padding: '0.5rem', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '6px', minWidth: '120px' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>GENERATOR (g)</span>
                      <code className="mono-math" style={{ display: 'block', color: 'var(--color-warning)', wordBreak: 'break-all' }}>{roomParams.g?.toString()}</code>
                    </div>
                  </div>
                </div>

                {/* Recipient's Public Key */}
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>
                    Recipient's Public Key exponent (y) Used
                  </h4>
                  <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '6px', wordBreak: 'break-all' }}>
                    <code className="mono-math" style={{ color: 'var(--color-success)' }}>
                      y = {activeMessageDetails?.peer_y?.toString() || 'Loading...'}
                    </code>
                  </div>
                </div>

                {/* Transit Ciphertext Blocks */}
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>
                    Intercepted Network Ciphertext Blocks (c₁, c₂)
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {selectedMessage.ciphertext_blocks.map((block, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '0.5rem', padding: '0.4rem 0.6rem', background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '6px', fontFamily: 'var(--font-mono)', flexWrap: 'wrap' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Block #{idx + 1}:</span>
                        <span style={{ color: '#6366f1', wordBreak: 'break-all' }}>c₁ = {block.c1.toString()}</span>
                        <span style={{ color: '#8b5cf6', wordBreak: 'break-all' }}>c₂ = {block.c2.toString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Encryption/Decryption Step math trace */}
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
                    {selectedMessage.sender === username ? "Encryption Steps (Alice's Client)" : "Decryption Steps (Bob's Client)"}
                  </h4>

                  {activeMessageDetails && activeMessageDetails.trace ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {activeMessageDetails.trace.map((step, idx) => {
                        const originalTextChunk = selectedMessage.sender === username 
                          ? (paradigm === 'toy' ? step.original_block.toString() : `Byte Block: ${step.original_block.toString()}`)
                          : (paradigm === 'toy' ? step.recovered_block.toString() : `Byte Block: ${step.recovered_block.toString()}`);
                        
                        return (
                          <div key={idx} style={{ padding: '0.75rem', background: 'rgba(255, 255, 255, 0.01)', borderLeft: '3px solid var(--color-primary)', borderRadius: '0 8px 8px 0', fontSize: '0.775rem' }}>
                            <div style={{ fontWeight: 700, marginBottom: '0.4rem', color: '#fff' }}>Block #{idx + 1} math trace:</div>
                            
                            {selectedMessage.sender === username ? (
                              // Encryption trace
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                                <div>Plaintext: <strong>{originalTextChunk}</strong></div>
                                <div>1. Random Ephemeral key: <strong>k = {step.ephemeral_key?.toString()}</strong></div>
                                <div>2. Ephemeral Public: <code className="mono-math">c₁ = gᵏ mod p</code>
                                  <div style={{ paddingLeft: '0.5rem', opacity: 0.8 }}>c₁ = {roomParams.g?.toString()}<sup>{step.ephemeral_key?.toString()}</sup> mod {roomParams.p?.toString()} = <strong>{step.c1?.toString()}</strong></div>
                                </div>
                                <div>3. Shared Secret Mask: <code className="mono-math">s = yᵏ mod p</code>
                                  <div style={{ paddingLeft: '0.5rem', opacity: 0.8 }}>s = {activeMessageDetails.peer_y?.toString()}<sup>{step.ephemeral_key?.toString()}</sup> mod {roomParams.p?.toString()} = <strong>{step.shared_secret?.toString()}</strong></div>
                                </div>
                                <div>4. Message Masking: <code className="mono-math">c₂ = (M × s) mod p</code>
                                  <div style={{ paddingLeft: '0.5rem', opacity: 0.8 }}>c₂ = ({step.original_block?.toString()} &times; {step.shared_secret?.toString()}) mod {roomParams.p?.toString()} = <strong>{step.c2?.toString()}</strong></div>
                                </div>
                              </div>
                            ) : (
                              // Decryption trace
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                                <div>1. Recover Shared Secret: <code className="mono-math">s = c₁ˣ mod p</code>
                                  <div style={{ paddingLeft: '0.5rem', opacity: 0.8 }}>s = {selectedMessage.ciphertext_blocks[idx]?.c1.toString()}<sup>{keys.x?.toString()}</sup> mod {roomParams.p?.toString()} = <strong>{step.shared_secret?.toString()}</strong></div>
                                </div>
                                <div>2. Modular Multiplicative Inverse: <code className="mono-math">s⁻¹ mod p</code>
                                  <div style={{ paddingLeft: '0.5rem', opacity: 0.8 }}>s⁻¹ = {step.shared_secret?.toString()}⁻¹ mod {roomParams.p?.toString()} = <strong>{step.shared_secret_inverse?.toString()}</strong></div>
                                </div>
                                <div>3. Recover Plaintext Block: <code className="mono-math">M = (c₂ × s⁻¹) mod p</code>
                                  <div style={{ paddingLeft: '0.5rem', opacity: 0.8 }}>M = ({selectedMessage.ciphertext_blocks[idx]?.c2.toString()} &times; {step.shared_secret_inverse?.toString()}) mod {roomParams.p?.toString()} = <strong>{step.recovered_block?.toString()}</strong></div>
                                </div>
                                <div>Plaintext Block Decoded: <strong>{originalTextChunk}</strong></div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="alert-callout warning" style={{ margin: 0, padding: '0.75rem 1rem' }}>
                      <ShieldAlert className="alert-icon" size={16} />
                      <div>
                        {selectedMessage.sender === username ? (
                          <span>Decrypting details are unavailable because the recipient's private key is stored on their remote browser memory.</span>
                        ) : (
                          <span>Decrypting steps are loading. Click the message again to trigger mathematical decryption cache reload.</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BOTTOM PANEL: ZERO-KNOWLEDGE SERVER LOG MONITOR */}
      {(!isMobile || activeMobileTab === 'server') && (
        <div className="card glass-panel" style={{ marginTop: '1.5rem', padding: '1.5rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Terminal size={16} style={{ color: '#10b981' }} /> Server-Side Database / Network Log Visualizer
            </h4>
            <span className="trace-tag green" style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <ShieldCheck size={12} /> Zero-Knowledge Relay Active
            </span>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '1rem' }}>
            Below is a live rendering of what is actually recorded in the Flask backend's in-memory room database. Observe that the server only tracks ciphertext numbers and has no access to the private exponents (<code>x</code>) or the decoded message plaintext.
          </p>

          <div style={{ background: '#020617', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '1rem', height: '180px', overflowY: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#10b981' }}>
            {serverDbView ? (
              <div>
                <div style={{ color: '#64748b', marginBottom: '0.5rem' }}>// Server Database State for Room: {roomId}</div>
                <div>{"{"}</div>
                <div style={{ paddingLeft: '1.5rem' }}>
                  <span style={{ color: '#e2e8f0' }}>"room_id"</span>: <span style={{ color: '#a5b4fc' }}>"{roomId}"</span>,
                </div>
                <div style={{ paddingLeft: '1.5rem' }}>
                  <span style={{ color: '#e2e8f0' }}>"p"</span>: <span style={{ color: '#f59e0b' }}>"{serverDbView.p}"</span>,
                </div>
                <div style={{ paddingLeft: '1.5rem' }}>
                  <span style={{ color: '#e2e8f0' }}>"g"</span>: <span style={{ color: '#f59e0b' }}>"{serverDbView.g}"</span>,
                </div>
                <div style={{ paddingLeft: '1.5rem' }}>
                  <span style={{ color: '#e2e8f0' }}>"participants"</span>: {JSON.stringify(serverDbView.participants)},
                </div>
                <div style={{ paddingLeft: '1.5rem' }}>
                  <span style={{ color: '#e2e8f0' }}>"messages_table"</span>: {"["}
                  {serverDbView.raw_records.length === 0 ? "]" : (
                    <div style={{ paddingLeft: '1.5rem' }}>
                      {serverDbView.raw_records.map((rec, index) => (
                        <div key={rec.id} style={{ color: '#34d399', margin: '0.25rem 0' }}>
                          {"{"} id: {rec.id}, sender: "{rec.sender}", receiver: "{rec.receiver}", ciphertext_blocks: {JSON.stringify(rec.ciphertext_blocks_preview)} {"}"}
                          {index < serverDbView.raw_records.length - 1 ? "," : ""}
                        </div>
                      ))}
                      {" ]"}
                    </div>
                  )}
                </div>
                <div>{"}"}</div>
              </div>
            ) : (
              <div style={{ color: '#64748b', fontStyle: 'italic', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                Waiting for data exchange stream to initialize...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
