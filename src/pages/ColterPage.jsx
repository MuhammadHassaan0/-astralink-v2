import React, { useState, useRef, useEffect } from 'react';
import { flushSync } from 'react-dom';

// ── Candidate config ───────────────────────────────────────────────────────────
const CANDIDATE = {
  name:        'Colter Carlisle',
  title:       'Challenger · LA City Council District 13',
  initials:    'CC',
  gateLabel:   'Colter',
  gateSubtitle:'for LA City Council',
  emptyHeading:'Ask me anything',
  emptySub:    "I'm Colter Carlisle, running for LA City Council District 13. Ask me about renter protections, SB79, small businesses, or anything on your mind.",
  placeholder: 'Ask Colter…',
  forest:      '#1a5c3a',   // deep forest green — primary
  leafBg:      '#d6eadc',   // light sage — page background
  leafMid:     '#9cbfa8',   // medium sage — borders/accents
  gold:        '#c8793a',   // warm amber — CTA button, accent
  darkWood:    '#0d2818',   // near-black dark green — body text
  password:    'colter2026',
  apiEndpoint: '/colter-chat',
  suggestions: [
    'How will you protect renters?',
    "What's your position on SB79?",
    'How will you help undocumented neighbors?',
    'Why are you running against the incumbent?',
  ],
  topics: ['Rent Stabilization', 'Anti-Displacement', 'SB79', 'Small Business', 'Immigrant Rights'],
};

const API      = 'https://astralink-v2-production.up.railway.app';
const GATE_KEY = 'cp_unlocked';

// ── SVG decorations ────────────────────────────────────────────────────────────
const Leaf = ({ size = 22, color = '#c8793a' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 3 C6 3 3 8 3 12 C3 18 9 22 12 22 C15 22 21 18 21 12 C21 8 18 3 12 3Z"
          fill={color} opacity="0.85" />
    <path d="M12 3 L12 22" stroke="#fff" strokeWidth="1" opacity="0.3" />
    <path d="M12 8 C9 10 7 13 8 16" stroke="#fff" strokeWidth="0.8" opacity="0.25" strokeLinecap="round" />
    <path d="M12 8 C15 10 17 13 16 16" stroke="#fff" strokeWidth="0.8" opacity="0.25" strokeLinecap="round" />
  </svg>
);

const BranchLeft = ({ color = '#1a5c3a', opacity = 0.2 }) => (
  <svg width="64" height="28" viewBox="0 0 64 28" fill="none" style={{ opacity }}>
    <path d="M62 14 Q48 7 32 13 Q18 17 4 12" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
    <ellipse cx="54" cy="9"  rx="4.5" ry="2.5" fill={color} transform="rotate(-25 54 9)" />
    <ellipse cx="38" cy="8"  rx="4"   ry="2.2" fill={color} transform="rotate(-12 38 8)" />
    <ellipse cx="22" cy="13" rx="4"   ry="2.2" fill={color} transform="rotate(8 22 13)" />
  </svg>
);

const BranchRight = ({ color = '#1a5c3a', opacity = 0.2 }) => (
  <svg width="64" height="28" viewBox="0 0 64 28" fill="none" style={{ opacity }}>
    <path d="M2 14 Q16 7 32 13 Q46 17 60 12" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
    <ellipse cx="10" cy="9"  rx="4.5" ry="2.5" fill={color} transform="rotate(25 10 9)" />
    <ellipse cx="26" cy="8"  rx="4"   ry="2.2" fill={color} transform="rotate(12 26 8)" />
    <ellipse cx="42" cy="13" rx="4"   ry="2.2" fill={color} transform="rotate(-8 42 13)" />
  </svg>
);

// ── Styles ─────────────────────────────────────────────────────────────────────
const GATE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

  @font-face {
    font-family: 'FTY Skorzhen';
    src: url('/fonts/FTY_SKORZHEN_NCV.ttf') format('truetype');
    font-weight: normal;
    font-style: normal;
  }

  .cp-gate {
    min-height: 100vh;
    background: ${CANDIDATE.leafBg};
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Inter', sans-serif;
    position: relative;
    overflow: hidden;
  }
  .cp-gate::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: radial-gradient(circle, ${CANDIDATE.leafMid}44 1px, transparent 1px);
    background-size: 28px 28px;
    pointer-events: none;
  }
  .cp-gate-inner {
    background: #ffffff;
    border: 3px solid ${CANDIDATE.forest};
    border-radius: 6px;
    padding: 40px 36px 32px;
    width: 100%;
    max-width: 340px;
    margin: 16px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 6px 6px 0 ${CANDIDATE.forest};
    position: relative;
    z-index: 1;
  }
  .cp-gate-corner {
    position: absolute;
    line-height: 0;
  }
  .cp-gate-corner.tl { top: -13px;  left: -13px; }
  .cp-gate-corner.tr { top: -13px;  right: -13px; }
  .cp-gate-corner.bl { bottom: -13px; left: -13px; }
  .cp-gate-corner.br { bottom: -13px; right: -13px; }

  .cp-gate-avatar {
    width: 88px;
    height: 88px;
    border-radius: 50%;
    border: 3px solid ${CANDIDATE.forest};
    box-shadow: 0 0 0 3px ${CANDIDATE.gold}, 3px 3px 0 ${CANDIDATE.darkWood};
    object-fit: cover;
    object-position: top center;
    margin-bottom: 18px;
    flex-shrink: 0;
    display: block;
  }
  .cp-gate-name {
    font-family: 'FTY Skorzhen', sans-serif;
    font-size: 52px;
    line-height: 0.9;
    color: ${CANDIDATE.forest};
    text-align: center;
    margin-bottom: 0;
    letter-spacing: 0.04em;
  }
  .cp-gate-tagline-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 4px 0 6px;
  }
  .cp-gate-for {
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-style: italic;
    font-weight: 500;
    color: ${CANDIDATE.gold};
    letter-spacing: 0.02em;
  }
  .cp-gate-subtitle {
    font-family: 'FTY Skorzhen', sans-serif;
    font-size: 13px;
    letter-spacing: 0.12em;
    color: ${CANDIDATE.forest};
  }
  .cp-gate-district {
    font-size: 11px;
    color: ${CANDIDATE.darkWood};
    opacity: 0.6;
    text-align: center;
    margin-bottom: 22px;
    letter-spacing: 0.04em;
  }
  .cp-gate-divider {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 20px;
    width: 100%;
    justify-content: center;
  }
  .cp-gate-divider-line {
    height: 1.5px;
    flex: 1;
    background: ${CANDIDATE.leafMid};
    max-width: 60px;
  }
  .cp-gate-input {
    width: 100%;
    background: ${CANDIDATE.leafBg};
    border: 2px solid ${CANDIDATE.leafMid};
    border-radius: 4px;
    padding: 11px 16px;
    font-family: 'Inter', sans-serif;
    font-size: 15px;
    color: ${CANDIDATE.darkWood};
    outline: none;
    box-sizing: border-box;
    text-align: center;
    transition: border-color 0.15s;
    margin-bottom: 10px;
  }
  .cp-gate-input::placeholder { color: #7aa88a; }
  .cp-gate-input:focus { border-color: ${CANDIDATE.forest}; }
  .cp-gate-btn {
    width: 100%;
    background: ${CANDIDATE.gold};
    color: #fff;
    border: none;
    border-radius: 4px;
    padding: 13px 24px;
    font-family: 'FTY Skorzhen', sans-serif;
    font-size: 20px;
    letter-spacing: 0.12em;
    cursor: pointer;
    transition: opacity 0.15s;
    margin-bottom: 10px;
    box-shadow: 3px 3px 0 ${CANDIDATE.darkWood};
  }
  .cp-gate-btn:hover { opacity: 0.9; }
  .cp-gate-error {
    font-size: 12px;
    color: ${CANDIDATE.gold};
    text-align: center;
    min-height: 16px;
    font-weight: 500;
  }
`;

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

  @keyframes cpFadeIn  { from { opacity: 0; } to { opacity: 1; } }
  @keyframes cpFadeUp  {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes cpPulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.35; }
  }
  @keyframes cpDot {
    0%, 60%, 100% { transform: translateY(0); opacity: 0.3; }
    30%            { transform: translateY(-4px); opacity: 1; }
  }

  .cp-root {
    min-height: 100dvh;
    background: ${CANDIDATE.leafBg};
    display: flex;
    flex-direction: column;
    align-items: center;
    font-family: 'Inter', sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .cp-root::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: radial-gradient(circle, ${CANDIDATE.leafMid}38 1px, transparent 1px);
    background-size: 28px 28px;
    pointer-events: none;
    z-index: 0;
  }
  .cp-inner {
    width: 100%;
    max-width: 680px;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    position: relative;
    z-index: 1;
  }

  .cp-disclaimer {
    background: #fffbeb;
    border-bottom: 1px solid #fde68a;
    padding: 9px 20px;
    font-size: 11.5px;
    color: #92400e;
    text-align: center;
    line-height: 1.5;
    position: fixed;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 680px;
    box-sizing: border-box;
    z-index: 200;
  }

  .cp-header {
    position: fixed;
    top: 36px;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 680px;
    background: ${CANDIDATE.forest};
    border-bottom: 3px solid ${CANDIDATE.darkWood};
    box-sizing: border-box;
    z-index: 100;
    padding: 10px 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    animation: cpFadeIn 0.4s ease forwards;
  }
  .cp-header-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 2px solid #ffffff;
    box-shadow: 0 0 0 2px ${CANDIDATE.gold};
    object-fit: cover;
    object-position: top center;
    flex-shrink: 0;
    display: block;
  }
  .cp-header-text h1 {
    font-family: 'FTY Skorzhen', sans-serif;
    font-size: 22px;
    letter-spacing: 0.06em;
    color: #ffffff;
    margin: 0;
    line-height: 1;
  }
  .cp-header-text p {
    font-size: 10.5px;
    color: ${CANDIDATE.leafBg};
    margin: 2px 0 0;
    opacity: 0.85;
    letter-spacing: 0.03em;
  }
  .cp-status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${CANDIDATE.gold};
    margin-left: auto;
    box-shadow: 0 0 6px ${CANDIDATE.gold};
    animation: cpPulse 2.4s ease-in-out infinite;
    flex-shrink: 0;
  }

  .cp-chat {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px 16px 148px;
    overflow-y: auto;
    background: transparent;
  }
  .cp-chat::-webkit-scrollbar { width: 4px; }
  .cp-chat::-webkit-scrollbar-thumb { background: ${CANDIDATE.leafMid}; border-radius: 2px; }

  .cp-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 48px 24px;
    gap: 10px;
    animation: cpFadeUp 0.5s ease forwards;
  }
  .cp-empty-avatar {
    width: 88px;
    height: 88px;
    border-radius: 50%;
    border: 3px solid ${CANDIDATE.forest};
    box-shadow: 0 0 0 3px ${CANDIDATE.gold}, 4px 4px 0 ${CANDIDATE.darkWood};
    object-fit: cover;
    object-position: top center;
    margin-bottom: 6px;
    flex-shrink: 0;
    display: block;
  }
  .cp-empty-heading {
    font-family: 'FTY Skorzhen', sans-serif;
    font-size: 32px;
    letter-spacing: 0.06em;
    color: ${CANDIDATE.forest};
    margin: 0;
  }
  .cp-empty-sub {
    font-size: 13px;
    color: ${CANDIDATE.darkWood};
    max-width: 320px;
    line-height: 1.6;
    margin: 0;
    opacity: 0.8;
  }
  .cp-empty-caveat {
    font-size: 11px;
    color: ${CANDIDATE.darkWood};
    opacity: 0.45;
    max-width: 300px;
    line-height: 1.5;
    margin: 0;
    font-style: italic;
  }
  .cp-topics {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    width: 100%;
    max-width: 500px;
    margin-top: 4px;
  }
  .cp-topics-divider {
    width: 100%;
    height: 1px;
    background: ${CANDIDATE.leafMid};
    opacity: 0.5;
  }
  .cp-topics-label {
    font-size: 10.5px;
    font-weight: 600;
    color: ${CANDIDATE.darkWood};
    opacity: 0.45;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .cp-topics-pills {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
  }
  .cp-topic-pill {
    background: rgba(255,255,255,0.6);
    border: 1px solid ${CANDIDATE.leafMid};
    border-radius: 20px;
    padding: 3px 10px;
    font-size: 11px;
    color: ${CANDIDATE.darkWood};
    opacity: 0.7;
    letter-spacing: 0.02em;
  }
  .cp-suggestions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    margin-top: 10px;
    max-width: 500px;
  }
  .cp-suggestion {
    background: #ffffff;
    border: 2px solid ${CANDIDATE.forest};
    border-radius: 4px;
    padding: 7px 14px;
    font-family: 'Inter', sans-serif;
    font-size: 12.5px;
    color: ${CANDIDATE.forest};
    cursor: pointer;
    transition: background 0.12s, color 0.12s;
    -webkit-tap-highlight-color: transparent;
    font-weight: 500;
    box-shadow: 2px 2px 0 ${CANDIDATE.leafMid};
  }
  .cp-suggestion:hover {
    background: ${CANDIDATE.forest};
    color: #ffffff;
  }

  .cp-msg {
    display: flex;
    flex-direction: column;
    animation: cpFadeUp 0.25s ease forwards;
  }
  .cp-msg.user      { align-items: flex-end; }
  .cp-msg.assistant { align-items: flex-start; }
  .cp-msg-label {
    font-family: 'FTY Skorzhen', sans-serif;
    font-size: 11px;
    letter-spacing: 0.1em;
    color: ${CANDIDATE.forest};
    opacity: 0.55;
    margin-bottom: 4px;
  }
  .cp-msg-bubble {
    max-width: 78%;
    padding: 11px 15px;
    border-radius: 4px;
    font-size: 14px;
    line-height: 1.65;
    word-break: break-word;
  }
  .cp-msg-bubble.user {
    background: ${CANDIDATE.forest};
    color: #ffffff;
    border-bottom-right-radius: 2px;
    box-shadow: 3px 3px 0 ${CANDIDATE.darkWood};
  }
  .cp-msg-bubble.assistant {
    background: #ffffff;
    color: ${CANDIDATE.darkWood};
    border: 2px solid ${CANDIDATE.leafMid};
    border-bottom-left-radius: 2px;
    box-shadow: 3px 3px 0 ${CANDIDATE.leafMid};
  }

  .cp-typing {
    display: flex;
    gap: 4px;
    padding: 12px 15px;
    background: #ffffff;
    border: 2px solid ${CANDIDATE.leafMid};
    border-radius: 4px;
    border-bottom-left-radius: 2px;
    box-shadow: 3px 3px 0 ${CANDIDATE.leafMid};
  }
  .cp-typing span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${CANDIDATE.forest};
    animation: cpDot 1.2s ease-in-out infinite;
  }
  .cp-typing span:nth-child(2) { animation-delay: 0.2s; }
  .cp-typing span:nth-child(3) { animation-delay: 0.4s; }

  .cp-input-area {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 680px;
    padding: 12px 16px 18px;
    background: ${CANDIDATE.forest};
    border-top: 3px solid ${CANDIDATE.darkWood};
    box-sizing: border-box;
    z-index: 100;
  }
  .cp-input-row {
    display: flex;
    gap: 8px;
    align-items: flex-end;
  }
  .cp-input {
    flex: 1;
    background: #ffffff;
    border: 2px solid ${CANDIDATE.leafMid};
    border-radius: 4px;
    padding: 10px 14px;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    color: ${CANDIDATE.darkWood};
    outline: none;
    resize: none;
    line-height: 1.5;
    max-height: 120px;
    overflow-y: auto;
    transition: border-color 0.15s;
    box-sizing: border-box;
  }
  .cp-input::placeholder { color: #7aa88a; }
  .cp-input:focus { border-color: ${CANDIDATE.forest}; }
  .cp-send {
    flex-shrink: 0;
    width: 38px;
    height: 38px;
    border-radius: 4px;
    background: ${CANDIDATE.gold};
    border: none;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: opacity 0.15s;
    -webkit-tap-highlight-color: transparent;
    box-shadow: 2px 2px 0 ${CANDIDATE.darkWood};
  }
  .cp-send:hover { opacity: 0.9; }
  .cp-send:disabled { opacity: 0.35; pointer-events: none; }

  .cp-footer {
    font-size: 10px;
    color: ${CANDIDATE.leafBg};
    opacity: 0.7;
    text-align: center;
    padding: 7px 0 0;
    letter-spacing: 0.03em;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }
  .cp-footer a { color: inherit; text-decoration: none; }
  .cp-footer a:hover { opacity: 1; color: #ffffff; }
  .cp-voice-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: rgba(255,255,255,0.15);
    border: 1px solid rgba(255,255,255,0.25);
    border-radius: 20px;
    padding: 2px 8px;
    font-size: 10px;
    color: ${CANDIDATE.leafBg};
    opacity: 0.8;
    letter-spacing: 0.02em;
    white-space: nowrap;
  }
`;

const DISCLAIMER_HEIGHT = 36;
const HEADER_HEIGHT     = 68;

// ── Components ─────────────────────────────────────────────────────────────────

function PasswordGate({ onUnlock }) {
  const [code,  setCode]  = useState('');
  const [error, setError] = useState(false);

  const attempt = () => {
    if (code === CANDIDATE.password) {
      sessionStorage.setItem(GATE_KEY, '1');
      onUnlock();
    } else {
      setError(true);
      setCode('');
    }
  };

  return (
    <div className="cp-gate">
      <div className="cp-gate-inner">
        <span className="cp-gate-corner tl"><Leaf size={26} color={CANDIDATE.gold} /></span>
        <span className="cp-gate-corner tr"><Leaf size={26} color={CANDIDATE.gold} /></span>
        <span className="cp-gate-corner bl"><Leaf size={26} color={CANDIDATE.gold} /></span>
        <span className="cp-gate-corner br"><Leaf size={26} color={CANDIDATE.gold} /></span>

        <img className="cp-gate-avatar" src="/colter-photo.jpg" alt={CANDIDATE.name} />

        <div className="cp-gate-name">{CANDIDATE.gateLabel}</div>

        <div className="cp-gate-tagline-row">
          <BranchLeft />
          <span className="cp-gate-for">for</span>
          <span className="cp-gate-subtitle">LA CITY COUNCIL</span>
          <BranchRight />
        </div>

        <div className="cp-gate-district">District 13 · Constituent Intelligence Interface</div>

        <div className="cp-gate-divider">
          <div className="cp-gate-divider-line" />
          <Leaf size={14} color={CANDIDATE.gold} />
          <div className="cp-gate-divider-line" />
        </div>

        <input
          className="cp-gate-input"
          type="password"
          placeholder="Access code"
          value={code}
          onChange={e => { setCode(e.target.value); setError(false); }}
          onKeyDown={e => e.key === 'Enter' && attempt()}
          autoFocus
        />
        <button className="cp-gate-btn" onClick={attempt}>ENTER →</button>
        <div className="cp-gate-error">{error ? 'Incorrect access code' : ''}</div>
      </div>
    </div>
  );
}

function ChatMessage({ msg, index }) {
  const isUser   = msg.role === 'user';
  const isTyping = !isUser && msg.content === '';

  return (
    <div
      className={`cp-msg ${isUser ? 'user' : 'assistant'}`}
      style={{ animationDelay: `${Math.min(index * 0.03, 0.1)}s` }}
    >
      <div className="cp-msg-label">{isUser ? 'You' : CANDIDATE.name.split(' ')[0]}</div>
      {isUser ? (
        <div className="cp-msg-bubble user">{msg.content}</div>
      ) : isTyping ? (
        <div className="cp-typing"><span /><span /><span /></div>
      ) : (
        <div className="cp-msg-bubble assistant">
          {msg.content.split('\n\n').map((para, pi, arr) => (
            <p key={pi} style={{ margin: 0, marginBottom: pi < arr.length - 1 ? '12px' : 0 }}>
              {para.split('\n').map((line, li, lines) => (
                <span key={li}>{line}{li < lines.length - 1 && <br />}</span>
              ))}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2 21l21-9L2 3v7l15 2-15 2z"/>
  </svg>
);

// ── Main page ──────────────────────────────────────────────────────────────────

export default function ColterPage() {
  const [unlocked,  setUnlocked]  = useState(() => sessionStorage.getItem(GATE_KEY) === '1');
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState('');
  const [streaming, setStreaming] = useState(false);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    const gateEl = document.createElement('style');
    gateEl.id    = 'cp-gate-styles';
    gateEl.textContent = GATE_STYLES;
    document.head.appendChild(gateEl);

    const chatEl = document.createElement('style');
    chatEl.id    = 'cp-chat-styles';
    chatEl.textContent = STYLES;
    document.head.appendChild(chatEl);

    return () => {
      document.getElementById('cp-gate-styles')?.remove();
      document.getElementById('cp-chat-styles')?.remove();
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const appendToLast = (extra) => {
    setMessages(prev => {
      const updated = [...prev];
      updated[updated.length - 1] = {
        ...updated[updated.length - 1],
        content: updated[updated.length - 1].content + extra,
      };
      return updated;
    });
  };

  const sendMessage = async (text) => {
    const content = (text || input).trim();
    if (!content || streaming) return;

    const userMsg = { role: 'user', content };
    const history = [...messages, userMsg];

    setMessages([...history, { role: 'assistant', content: '' }]);
    setInput('');
    setStreaming(true);

    try {
      const res = await fetch(`${API}${CANDIDATE.apiEndpoint}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ messages: history }),
      });

      if (!res.ok) throw new Error(`Server error ${res.status}`);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;
          try {
            const evt = JSON.parse(raw);
            if (evt.type === 'token' && evt.content) {
              flushSync(() => appendToLast(evt.content));
            } else if (evt.type === 'done') {
              setStreaming(false);
              inputRef.current?.focus();
            }
          } catch {}
        }
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: 'Something went wrong. Please try again.',
        };
        return updated;
      });
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />;

  const topOffset = DISCLAIMER_HEIGHT + HEADER_HEIGHT;

  return (
    <div className="cp-root">
      <div className="cp-inner">

        <div className="cp-disclaimer">
          Unofficial prototype built from public campaign material. Not affiliated with Colter Carlisle or his campaign.
        </div>

        <div className="cp-header">
          <img className="cp-header-avatar" src="/colter-photo.jpg" alt={CANDIDATE.name} />
          <div className="cp-header-text">
            <h1>COLTER CARLISLE</h1>
            <p>for LA City Council District 13</p>
          </div>
          <div className="cp-status-dot" />
        </div>

        <div style={{ height: topOffset }} />

        <div className="cp-chat">
          {messages.length === 0 ? (
            <div className="cp-empty">
              <img className="cp-empty-avatar" src="/colter-photo.jpg" alt={CANDIDATE.name} />
              <p className="cp-empty-heading">{CANDIDATE.emptyHeading}</p>
              <p className="cp-empty-sub">{CANDIDATE.emptySub}</p>
              <p className="cp-empty-caveat">Answers are based only on public campaign material and may not reflect positions on every issue.</p>
              <div className="cp-suggestions">
                {CANDIDATE.suggestions.map(s => (
                  <button key={s} className="cp-suggestion" onClick={() => sendMessage(s)}>{s}</button>
                ))}
              </div>
              <div className="cp-topics">
                <div className="cp-topics-divider" />
                <span className="cp-topics-label">What voters are asking about</span>
                <div className="cp-topics-pills">
                  {CANDIDATE.topics.map(t => (
                    <span key={t} className="cp-topic-pill">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg, i) => <ChatMessage key={i} msg={msg} index={i} />)
          )}
          <div ref={bottomRef} />
        </div>

        <div className="cp-input-area">
          <div className="cp-input-row">
            <textarea
              ref={inputRef}
              className="cp-input"
              rows={1}
              placeholder={streaming ? 'Waiting for response…' : CANDIDATE.placeholder}
              value={input}
              onChange={e => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={handleKeyDown}
              disabled={streaming}
              style={streaming ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            />
            <button
              className="cp-send"
              onClick={() => sendMessage()}
              disabled={streaming || !input.trim()}
            >
              <SendIcon />
            </button>
          </div>
          <div className="cp-footer">
            <span>Powered by <a href="https://astralink-v2.vercel.app" target="_blank" rel="noreferrer">AstraLink</a> · astralink-v2.vercel.app</span>
            <span className="cp-voice-badge">🎙 Voice coming soon</span>
          </div>
        </div>

      </div>
    </div>
  );
}
