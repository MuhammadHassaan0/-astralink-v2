import React, { useState, useRef, useEffect } from 'react';
import { flushSync } from 'react-dom';

// ── Candidate config ───────────────────────────────────────────────────────────
const CANDIDATE = {
  name:        'Faizah Malik',
  title:       'Candidate · LA City Council District 11',
  initials:    'FM',
  gateLabel:   'Faizah',
  gateSubtitle:'for LA City Council',
  tagline:     'A Westside Where Everyone Has a Future.',
  emptyHeading:'Ask me anything',
  emptySub:    "I'm Faizah Malik, running for LA City Council District 11. Ask me about housing, homelessness, climate, or anything on your mind.",
  placeholder: 'Ask Faizah…',
  // Colors sampled directly from campaign screenshot
  cobalt:      '#1a35b8',   // deep royal blue — "FAIZAH" logo text
  skyBg:       '#c8daf5',   // powder sky blue — hero background
  skyMid:      '#a8c8f0',   // slightly deeper blue for accents
  red:         '#d44c2a',   // warm red-orange — floral accents & donate btn
  darkNavy:    '#0f1e6e',   // near-black navy for body/subtext contrast
  password:    'faizah2026',
  apiEndpoint: '/faizah-chat',
  suggestions: [
    "What's your housing plan for District 11?",
    'How would you address homelessness?',
    'What will you do about the Venice Dell project?',
    'Why are you running against Traci Park?',
  ],
};

const API      = 'https://astralink-v2-production.up.railway.app';
const GATE_KEY = 'fp_unlocked';

// ── Campaign-style SVG decorations ────────────────────────────────────────────
// Matches the 4-petal rosette corner motifs from faizahforla.com
const Rosette = ({ size = 22, color = '#d44c2a' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <ellipse cx="12" cy="6"  rx="3.2" ry="5.5" fill={color} />
    <ellipse cx="12" cy="18" rx="3.2" ry="5.5" fill={color} />
    <ellipse cx="6"  cy="12" rx="5.5" ry="3.2" fill={color} />
    <ellipse cx="18" cy="12" rx="5.5" ry="3.2" fill={color} />
    <circle  cx="12" cy="12" r="3"    fill={color} />
  </svg>
);

// Vine branch — matches the flanking vine decorations around "for LA CITY COUNCIL"
const VineLeft = ({ color = '#1e38c0', opacity = 0.22 }) => (
  <svg width="60" height="28" viewBox="0 0 60 28" fill="none" style={{ opacity }}>
    <path d="M58 14 Q44 6 28 12 Q16 16 4 10" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
    <ellipse cx="52" cy="10" rx="4" ry="2.5" fill={color} transform="rotate(-20 52 10)" />
    <ellipse cx="36" cy="8"  rx="3.5" ry="2" fill={color} transform="rotate(-10 36 8)" />
    <ellipse cx="20" cy="13" rx="3.5" ry="2" fill={color} transform="rotate(10 20 13)" />
  </svg>
);

const VineRight = ({ color = '#1e38c0', opacity = 0.22 }) => (
  <svg width="60" height="28" viewBox="0 0 60 28" fill="none" style={{ opacity }}>
    <path d="M2 14 Q16 6 32 12 Q44 16 56 10" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
    <ellipse cx="8"  cy="10" rx="4"   ry="2.5" fill={color} transform="rotate(20 8 10)" />
    <ellipse cx="24" cy="8"  rx="3.5" ry="2"   fill={color} transform="rotate(10 24 8)" />
    <ellipse cx="40" cy="13" rx="3.5" ry="2"   fill={color} transform="rotate(-10 40 13)" />
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

  .fp-gate {
    min-height: 100vh;
    background: ${CANDIDATE.skyBg};
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Inter', sans-serif;
    position: relative;
    overflow: hidden;
  }
  /* Subtle dot-grid texture like campaign site's hero */
  .fp-gate::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: radial-gradient(circle, ${CANDIDATE.skyMid}55 1px, transparent 1px);
    background-size: 28px 28px;
    pointer-events: none;
  }
  .fp-gate-inner {
    background: #ffffff;
    border: 3px solid ${CANDIDATE.cobalt};
    border-radius: 6px;
    padding: 40px 36px 32px;
    width: 100%;
    max-width: 340px;
    margin: 16px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 6px 6px 0 ${CANDIDATE.cobalt};
    position: relative;
    z-index: 1;
  }
  /* Corner rosettes */
  .fp-gate-corner {
    position: absolute;
    line-height: 0;
  }
  .fp-gate-corner.tl { top: -13px;  left: -13px;  }
  .fp-gate-corner.tr { top: -13px;  right: -13px; }
  .fp-gate-corner.bl { bottom: -13px; left: -13px; }
  .fp-gate-corner.br { bottom: -13px; right: -13px; }

  .fp-gate-avatar {
    width: 88px;
    height: 88px;
    border-radius: 50%;
    border: 3px solid ${CANDIDATE.cobalt};
    box-shadow: 0 0 0 3px ${CANDIDATE.red}, 3px 3px 0 ${CANDIDATE.darkNavy};
    object-fit: cover;
    object-position: top center;
    margin-bottom: 18px;
    flex-shrink: 0;
    display: block;
  }
  .fp-gate-name {
    font-family: 'FTY Skorzhen', sans-serif;
    font-size: 52px;
    line-height: 0.9;
    color: ${CANDIDATE.cobalt};
    text-align: center;
    margin-bottom: 0;
    letter-spacing: 0.04em;
  }
  .fp-gate-tagline-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 4px 0 6px;
  }
  .fp-gate-for {
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-style: italic;
    font-weight: 500;
    color: ${CANDIDATE.red};
    letter-spacing: 0.02em;
  }
  .fp-gate-subtitle {
    font-family: 'FTY Skorzhen', sans-serif;
    font-size: 13px;
    letter-spacing: 0.12em;
    color: ${CANDIDATE.cobalt};
  }
  .fp-gate-district {
    font-size: 11px;
    color: ${CANDIDATE.darkNavy};
    opacity: 0.6;
    text-align: center;
    margin-bottom: 22px;
    letter-spacing: 0.04em;
  }
  .fp-gate-divider {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 20px;
    width: 100%;
    justify-content: center;
  }
  .fp-gate-divider-line {
    height: 1.5px;
    flex: 1;
    background: ${CANDIDATE.skyMid};
    max-width: 60px;
  }
  .fp-gate-input {
    width: 100%;
    background: ${CANDIDATE.skyBg};
    border: 2px solid ${CANDIDATE.skyMid};
    border-radius: 4px;
    padding: 11px 16px;
    font-family: 'Inter', sans-serif;
    font-size: 15px;
    color: ${CANDIDATE.darkNavy};
    outline: none;
    box-sizing: border-box;
    text-align: center;
    transition: border-color 0.15s;
    margin-bottom: 10px;
  }
  .fp-gate-input::placeholder { color: #7a9cc0; }
  .fp-gate-input:focus { border-color: ${CANDIDATE.cobalt}; }
  .fp-gate-btn {
    width: 100%;
    background: ${CANDIDATE.red};
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
    box-shadow: 3px 3px 0 ${CANDIDATE.darkNavy};
  }
  .fp-gate-btn:hover { opacity: 0.9; }
  .fp-gate-error {
    font-size: 12px;
    color: ${CANDIDATE.red};
    text-align: center;
    min-height: 16px;
    font-weight: 500;
  }
`;

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

  @keyframes fpFadeIn  { from { opacity: 0; } to { opacity: 1; } }
  @keyframes fpFadeUp  {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fpPulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.35; }
  }
  @keyframes fpDot {
    0%, 60%, 100% { transform: translateY(0); opacity: 0.3; }
    30%            { transform: translateY(-4px); opacity: 1; }
  }

  .fp-root {
    min-height: 100dvh;
    background: ${CANDIDATE.skyBg};
    display: flex;
    flex-direction: column;
    align-items: center;
    font-family: 'Inter', sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  /* Dot-grid texture */
  .fp-root::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: radial-gradient(circle, ${CANDIDATE.skyMid}44 1px, transparent 1px);
    background-size: 28px 28px;
    pointer-events: none;
    z-index: 0;
  }
  .fp-inner {
    width: 100%;
    max-width: 680px;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    position: relative;
    z-index: 1;
  }

  /* ── Disclaimer banner ── */
  .fp-disclaimer {
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

  /* ── Header ── */
  .fp-header {
    position: fixed;
    top: 36px;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 680px;
    background: ${CANDIDATE.cobalt};
    border-bottom: 3px solid ${CANDIDATE.darkNavy};
    box-sizing: border-box;
    z-index: 100;
    padding: 10px 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    animation: fpFadeIn 0.4s ease forwards;
  }
  .fp-header-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 2px solid #ffffff;
    box-shadow: 0 0 0 2px ${CANDIDATE.red};
    object-fit: cover;
    object-position: top center;
    flex-shrink: 0;
    display: block;
  }
  .fp-header-text h1 {
    font-family: 'FTY Skorzhen', sans-serif;
    font-size: 22px;
    letter-spacing: 0.06em;
    color: #ffffff;
    margin: 0;
    line-height: 1;
  }
  .fp-header-text p {
    font-size: 10.5px;
    color: ${CANDIDATE.skyBg};
    margin: 2px 0 0;
    opacity: 0.85;
    letter-spacing: 0.03em;
  }
  .fp-status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${CANDIDATE.red};
    margin-left: auto;
    box-shadow: 0 0 6px ${CANDIDATE.red};
    animation: fpPulse 2.4s ease-in-out infinite;
    flex-shrink: 0;
  }

  /* ── Chat area ── */
  .fp-chat {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px 16px 148px;
    overflow-y: auto;
    background: transparent;
  }
  .fp-chat::-webkit-scrollbar { width: 4px; }
  .fp-chat::-webkit-scrollbar-thumb { background: ${CANDIDATE.skyMid}; border-radius: 2px; }

  /* ── Empty state ── */
  .fp-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 48px 24px;
    gap: 10px;
    animation: fpFadeUp 0.5s ease forwards;
  }
  .fp-empty-avatar {
    width: 88px;
    height: 88px;
    border-radius: 50%;
    border: 3px solid ${CANDIDATE.cobalt};
    box-shadow: 0 0 0 3px ${CANDIDATE.red}, 4px 4px 0 ${CANDIDATE.darkNavy};
    object-fit: cover;
    object-position: top center;
    margin-bottom: 6px;
    flex-shrink: 0;
    display: block;
  }
  .fp-empty-heading {
    font-family: 'FTY Skorzhen', sans-serif;
    font-size: 32px;
    letter-spacing: 0.06em;
    color: ${CANDIDATE.cobalt};
    margin: 0;
  }
  .fp-empty-sub {
    font-size: 13px;
    color: ${CANDIDATE.darkNavy};
    max-width: 320px;
    line-height: 1.6;
    margin: 0;
    opacity: 0.8;
  }
  .fp-suggestions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    margin-top: 10px;
    max-width: 500px;
  }
  .fp-suggestion {
    background: #ffffff;
    border: 2px solid ${CANDIDATE.cobalt};
    border-radius: 4px;
    padding: 7px 14px;
    font-family: 'Inter', sans-serif;
    font-size: 12.5px;
    color: ${CANDIDATE.cobalt};
    cursor: pointer;
    transition: background 0.12s, color 0.12s, border-color 0.12s;
    -webkit-tap-highlight-color: transparent;
    font-weight: 500;
    box-shadow: 2px 2px 0 ${CANDIDATE.skyMid};
  }
  .fp-suggestion:hover {
    background: ${CANDIDATE.cobalt};
    color: #ffffff;
    border-color: ${CANDIDATE.cobalt};
  }

  /* ── Messages ── */
  .fp-msg {
    display: flex;
    flex-direction: column;
    animation: fpFadeUp 0.25s ease forwards;
  }
  .fp-msg.user     { align-items: flex-end; }
  .fp-msg.assistant { align-items: flex-start; }
  .fp-msg-label {
    font-family: 'FTY Skorzhen', sans-serif;
    font-size: 11px;
    letter-spacing: 0.1em;
    color: ${CANDIDATE.cobalt};
    opacity: 0.55;
    margin-bottom: 4px;
  }
  .fp-msg-bubble {
    max-width: 78%;
    padding: 11px 15px;
    border-radius: 4px;
    font-size: 14px;
    line-height: 1.65;
    word-break: break-word;
  }
  .fp-msg-bubble.user {
    background: ${CANDIDATE.cobalt};
    color: #ffffff;
    border-bottom-right-radius: 2px;
    box-shadow: 3px 3px 0 ${CANDIDATE.darkNavy};
  }
  .fp-msg-bubble.assistant {
    background: #ffffff;
    color: ${CANDIDATE.darkNavy};
    border: 2px solid ${CANDIDATE.skyMid};
    border-bottom-left-radius: 2px;
    box-shadow: 3px 3px 0 ${CANDIDATE.skyMid};
  }

  /* Typing dots */
  .fp-typing {
    display: flex;
    gap: 4px;
    padding: 12px 15px;
    background: #ffffff;
    border: 2px solid ${CANDIDATE.skyMid};
    border-radius: 4px;
    border-bottom-left-radius: 2px;
    box-shadow: 3px 3px 0 ${CANDIDATE.skyMid};
  }
  .fp-typing span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${CANDIDATE.cobalt};
    animation: fpDot 1.2s ease-in-out infinite;
  }
  .fp-typing span:nth-child(2) { animation-delay: 0.2s; }
  .fp-typing span:nth-child(3) { animation-delay: 0.4s; }

  /* ── Input area ── */
  .fp-input-area {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 680px;
    padding: 12px 16px 18px;
    background: ${CANDIDATE.cobalt};
    border-top: 3px solid ${CANDIDATE.darkNavy};
    box-sizing: border-box;
    z-index: 100;
  }
  .fp-input-row {
    display: flex;
    gap: 8px;
    align-items: flex-end;
  }
  .fp-input {
    flex: 1;
    background: #ffffff;
    border: 2px solid ${CANDIDATE.skyMid};
    border-radius: 4px;
    padding: 10px 14px;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    color: ${CANDIDATE.darkNavy};
    outline: none;
    resize: none;
    line-height: 1.5;
    max-height: 120px;
    overflow-y: auto;
    transition: border-color 0.15s;
    box-sizing: border-box;
  }
  .fp-input::placeholder { color: #7a9cc0; }
  .fp-input:focus { border-color: ${CANDIDATE.cobalt}; }
  .fp-send {
    flex-shrink: 0;
    width: 38px;
    height: 38px;
    border-radius: 4px;
    background: ${CANDIDATE.red};
    border: none;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: opacity 0.15s;
    -webkit-tap-highlight-color: transparent;
    box-shadow: 2px 2px 0 ${CANDIDATE.darkNavy};
  }
  .fp-send:hover { opacity: 0.9; }
  .fp-send:disabled { opacity: 0.35; pointer-events: none; }

  /* ── Footer ── */
  .fp-footer {
    font-size: 10px;
    color: ${CANDIDATE.skyBg};
    opacity: 0.7;
    text-align: center;
    padding: 7px 0 0;
    letter-spacing: 0.03em;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }
  .fp-footer a { color: inherit; text-decoration: none; }
  .fp-footer a:hover { opacity: 1; color: #ffffff; }
  .fp-voice-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: rgba(255,255,255,0.15);
    border: 1px solid rgba(255,255,255,0.25);
    border-radius: 20px;
    padding: 2px 8px;
    font-size: 10px;
    color: ${CANDIDATE.skyBg};
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
    <div className="fp-gate">
      <div className="fp-gate-inner">
        {/* Corner rosettes matching campaign site */}
        <span className="fp-gate-corner tl"><Rosette size={26} /></span>
        <span className="fp-gate-corner tr"><Rosette size={26} /></span>
        <span className="fp-gate-corner bl"><Rosette size={26} /></span>
        <span className="fp-gate-corner br"><Rosette size={26} /></span>

        <img className="fp-gate-avatar" src="/faizah-photo.jpg" alt={CANDIDATE.name} />

        <div className="fp-gate-name">{CANDIDATE.gateLabel}</div>

        {/* "for LA CITY COUNCIL" row with vines */}
        <div className="fp-gate-tagline-row">
          <VineLeft />
          <span className="fp-gate-for">for</span>
          <span className="fp-gate-subtitle">LA CITY COUNCIL</span>
          <VineRight />
        </div>

        <div className="fp-gate-district">District 11 · Digital Twin</div>

        <div className="fp-gate-divider">
          <div className="fp-gate-divider-line" />
          <Rosette size={14} color={CANDIDATE.red} />
          <div className="fp-gate-divider-line" />
        </div>

        <input
          className="fp-gate-input"
          type="password"
          placeholder="Access code"
          value={code}
          onChange={e => { setCode(e.target.value); setError(false); }}
          onKeyDown={e => e.key === 'Enter' && attempt()}
          autoFocus
        />
        <button className="fp-gate-btn" onClick={attempt}>ENTER →</button>
        <div className="fp-gate-error">{error ? 'Incorrect access code' : ''}</div>
      </div>
    </div>
  );
}

function ChatMessage({ msg, index }) {
  const isUser   = msg.role === 'user';
  const isTyping = !isUser && msg.content === '';

  return (
    <div
      className={`fp-msg ${isUser ? 'user' : 'assistant'}`}
      style={{ animationDelay: `${Math.min(index * 0.03, 0.1)}s` }}
    >
      <div className="fp-msg-label">{isUser ? 'You' : CANDIDATE.name.split(' ')[0]}</div>
      {isUser ? (
        <div className="fp-msg-bubble user">{msg.content}</div>
      ) : isTyping ? (
        <div className="fp-typing"><span /><span /><span /></div>
      ) : (
        <div className="fp-msg-bubble assistant">
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

export default function FaizahPage() {
  const [unlocked,  setUnlocked]  = useState(() => sessionStorage.getItem(GATE_KEY) === '1');
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState('');
  const [streaming, setStreaming] = useState(false);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    const gateEl = document.createElement('style');
    gateEl.id    = 'fp-gate-styles';
    gateEl.textContent = GATE_STYLES;
    document.head.appendChild(gateEl);

    const chatEl = document.createElement('style');
    chatEl.id    = 'fp-chat-styles';
    chatEl.textContent = STYLES;
    document.head.appendChild(chatEl);

    return () => {
      document.getElementById('fp-gate-styles')?.remove();
      document.getElementById('fp-chat-styles')?.remove();
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
    <div className="fp-root">
      <div className="fp-inner">

        {/* Disclaimer */}
        <div className="fp-disclaimer">
          Unofficial prototype built from Faizah Malik's public record by AstraLink. Not affiliated with the campaign.
        </div>

        {/* Fixed header — cobalt blue bar like campaign nav */}
        <div className="fp-header">
          <img className="fp-header-avatar" src="/faizah-photo.jpg" alt={CANDIDATE.name} />
          <div className="fp-header-text">
            <h1>FAIZAH MALIK</h1>
            <p>for LA City Council District 11</p>
          </div>
          <div className="fp-status-dot" />
        </div>

        {/* Spacer */}
        <div style={{ height: topOffset }} />

        {/* Chat */}
        <div className="fp-chat">
          {messages.length === 0 ? (
            <div className="fp-empty">
              <img className="fp-empty-avatar" src="/faizah-photo.jpg" alt={CANDIDATE.name} />
              <p className="fp-empty-heading">{CANDIDATE.emptyHeading}</p>
              <p className="fp-empty-sub">{CANDIDATE.emptySub}</p>
              <div className="fp-suggestions">
                {CANDIDATE.suggestions.map(s => (
                  <button key={s} className="fp-suggestion" onClick={() => sendMessage(s)}>{s}</button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => <ChatMessage key={i} msg={msg} index={i} />)
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input — cobalt footer bar */}
        <div className="fp-input-area">
          <div className="fp-input-row">
            <textarea
              ref={inputRef}
              className="fp-input"
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
              className="fp-send"
              onClick={() => sendMessage()}
              disabled={streaming || !input.trim()}
            >
              <SendIcon />
            </button>
          </div>
          <div className="fp-footer">
            <span>Powered by <a href="https://astralink.life" target="_blank" rel="noreferrer">AstraLink</a> · astralink.life</span>
            <span className="fp-voice-badge">🎙 Voice coming soon</span>
          </div>
        </div>

      </div>
    </div>
  );
}
