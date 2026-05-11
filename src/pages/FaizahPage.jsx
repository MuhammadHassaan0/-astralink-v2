import React, { useState, useRef, useEffect } from 'react';
import { flushSync } from 'react-dom';

// ── Candidate config ───────────────────────────────────────────────────────────
const CANDIDATE = {
  name:        'Faizah Malik',
  title:       'Candidate · LA City Council District 11',
  initials:    'FM',
  gateLabel:   'Talk to Faizah Malik',
  gateSubtitle:'LA City Council District 11 · Digital Twin',
  emptyHeading:'Ask me anything',
  emptySub:    "I'm Faizah Malik, running for LA City Council District 11. Ask me about housing, homelessness, climate, or anything on your mind.",
  placeholder: 'Ask Faizah…',
  photoUrl:    'https://images.squarespace-cdn.com/content/v1/68196764767bdd3f81b650fc/767387c6-7b7f-4b8f-9b58-b596423e4ae5/1.+Primary+Campaign+Headshot.jpg?format=500w',
  navy:        '#1a3fa3',
  orange:      '#e85d2f',
  periLight:   '#d6e2f8',
  periBg:      '#e8eef8',
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

// ── SVG decorative elements ────────────────────────────────────────────────────
const FloralLeft = () => (
  <svg width="80" height="120" viewBox="0 0 80 120" fill="none" style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', opacity: 0.18 }}>
    <circle cx="10" cy="60" r="8" fill={CANDIDATE.navy} />
    <circle cx="22" cy="40" r="5" fill={CANDIDATE.orange} />
    <circle cx="22" cy="80" r="5" fill={CANDIDATE.orange} />
    <circle cx="36" cy="28" r="4" fill={CANDIDATE.navy} />
    <circle cx="36" cy="92" r="4" fill={CANDIDATE.navy} />
    <circle cx="48" cy="20" r="3" fill={CANDIDATE.orange} />
    <circle cx="48" cy="100" r="3" fill={CANDIDATE.orange} />
    <line x1="10" y1="60" x2="48" y2="20" stroke={CANDIDATE.navy} strokeWidth="1.5" />
    <line x1="10" y1="60" x2="48" y2="100" stroke={CANDIDATE.navy} strokeWidth="1.5" />
    <line x1="10" y1="60" x2="36" y2="28" stroke={CANDIDATE.navy} strokeWidth="1" />
    <line x1="10" y1="60" x2="36" y2="92" stroke={CANDIDATE.navy} strokeWidth="1" />
  </svg>
);

const FloralRight = () => (
  <svg width="80" height="120" viewBox="0 0 80 120" fill="none" style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', opacity: 0.18 }}>
    <circle cx="70" cy="60" r="8" fill={CANDIDATE.navy} />
    <circle cx="58" cy="40" r="5" fill={CANDIDATE.orange} />
    <circle cx="58" cy="80" r="5" fill={CANDIDATE.orange} />
    <circle cx="44" cy="28" r="4" fill={CANDIDATE.navy} />
    <circle cx="44" cy="92" r="4" fill={CANDIDATE.navy} />
    <circle cx="32" cy="20" r="3" fill={CANDIDATE.orange} />
    <circle cx="32" cy="100" r="3" fill={CANDIDATE.orange} />
    <line x1="70" y1="60" x2="32" y2="20" stroke={CANDIDATE.navy} strokeWidth="1.5" />
    <line x1="70" y1="60" x2="32" y2="100" stroke={CANDIDATE.navy} strokeWidth="1.5" />
    <line x1="70" y1="60" x2="44" y2="28" stroke={CANDIDATE.navy} strokeWidth="1" />
    <line x1="70" y1="60" x2="44" y2="92" stroke={CANDIDATE.navy} strokeWidth="1" />
  </svg>
);

// ── Styles ─────────────────────────────────────────────────────────────────────
const GATE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Inter:wght@400;500;600&display=swap');

  .fp-gate {
    min-height: 100vh;
    background: ${CANDIDATE.periBg};
    background-image: radial-gradient(circle at 20% 50%, ${CANDIDATE.periLight} 0%, transparent 60%),
                      radial-gradient(circle at 80% 50%, ${CANDIDATE.periLight} 0%, transparent 60%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Inter', sans-serif;
    position: relative;
    overflow: hidden;
  }
  .fp-gate-inner {
    background: #ffffff;
    border: 2px solid ${CANDIDATE.periLight};
    border-radius: 24px;
    padding: 44px 40px 36px;
    width: 100%;
    max-width: 360px;
    margin: 16px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 0 8px 40px rgba(26,63,163,0.12);
    position: relative;
    z-index: 1;
  }
  .fp-gate-photo {
    width: 88px;
    height: 88px;
    border-radius: 50%;
    object-fit: cover;
    object-position: top center;
    border: 3px solid ${CANDIDATE.navy};
    box-shadow: 0 0 0 4px ${CANDIDATE.periLight};
    margin-bottom: 18px;
    flex-shrink: 0;
  }
  .fp-gate-photo-fallback {
    width: 88px;
    height: 88px;
    border-radius: 50%;
    background: ${CANDIDATE.periLight};
    border: 3px solid ${CANDIDATE.navy};
    box-shadow: 0 0 0 4px ${CANDIDATE.periLight};
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 28px;
    font-weight: 800;
    color: ${CANDIDATE.navy};
    margin-bottom: 18px;
    flex-shrink: 0;
  }
  .fp-gate-name {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 24px;
    font-weight: 800;
    color: ${CANDIDATE.navy};
    text-align: center;
    margin-bottom: 4px;
    letter-spacing: 0.01em;
    text-transform: uppercase;
  }
  .fp-gate-subtitle {
    font-size: 12px;
    color: #6b7280;
    text-align: center;
    margin-bottom: 28px;
    line-height: 1.5;
  }
  .fp-gate-divider {
    width: 40px;
    height: 3px;
    background: ${CANDIDATE.orange};
    border-radius: 2px;
    margin: 0 auto 24px;
  }
  .fp-gate-input {
    width: 100%;
    background: ${CANDIDATE.periBg};
    border: 1.5px solid ${CANDIDATE.periLight};
    border-radius: 10px;
    padding: 12px 16px;
    font-family: 'Inter', sans-serif;
    font-size: 15px;
    color: #111827;
    outline: none;
    box-sizing: border-box;
    text-align: center;
    transition: border-color 0.15s, box-shadow 0.15s;
    margin-bottom: 12px;
  }
  .fp-gate-input::placeholder { color: #9ca3af; }
  .fp-gate-input:focus {
    border-color: ${CANDIDATE.navy};
    box-shadow: 0 0 0 3px ${CANDIDATE.periLight};
  }
  .fp-gate-btn {
    width: 100%;
    background: ${CANDIDATE.navy};
    color: #fff;
    border: none;
    border-radius: 10px;
    padding: 13px 24px;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 17px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    cursor: pointer;
    transition: opacity 0.15s;
    margin-bottom: 10px;
  }
  .fp-gate-btn:hover { opacity: 0.88; }
  .fp-gate-error {
    font-size: 12px;
    color: ${CANDIDATE.orange};
    text-align: center;
    min-height: 16px;
  }
`;

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Inter:wght@400;500;600&display=swap');

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
    background: ${CANDIDATE.periBg};
    display: flex;
    flex-direction: column;
    align-items: center;
    font-family: 'Inter', sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .fp-inner {
    width: 100%;
    max-width: 680px;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
  }

  /* ── Disclaimer banner ── */
  .fp-disclaimer {
    background: #fffbeb;
    border-bottom: 1px solid #fde68a;
    padding: 10px 20px;
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
    top: 38px;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 680px;
    background: #ffffff;
    border-bottom: 2px solid ${CANDIDATE.periLight};
    box-sizing: border-box;
    z-index: 100;
    padding: 12px 20px;
    display: flex;
    align-items: center;
    gap: 14px;
    animation: fpFadeIn 0.4s ease forwards;
  }
  .fp-header-photo {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    object-fit: cover;
    object-position: top center;
    border: 2px solid ${CANDIDATE.navy};
    flex-shrink: 0;
  }
  .fp-header-photo-fallback {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: ${CANDIDATE.periLight};
    border: 2px solid ${CANDIDATE.navy};
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 15px;
    font-weight: 800;
    color: ${CANDIDATE.navy};
    flex-shrink: 0;
  }
  .fp-header-text h1 {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 18px;
    font-weight: 800;
    color: ${CANDIDATE.navy};
    margin: 0;
    line-height: 1.1;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }
  .fp-header-text p {
    font-size: 11px;
    color: #6b7280;
    margin: 2px 0 0;
  }
  .fp-status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${CANDIDATE.orange};
    margin-left: auto;
    box-shadow: 0 0 6px ${CANDIDATE.orange}88;
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
  .fp-chat::-webkit-scrollbar-thumb { background: ${CANDIDATE.periLight}; border-radius: 2px; }

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
  .fp-empty-photo {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    object-fit: cover;
    object-position: top center;
    border: 3px solid ${CANDIDATE.navy};
    box-shadow: 0 0 0 4px ${CANDIDATE.periLight};
    margin-bottom: 8px;
    flex-shrink: 0;
  }
  .fp-empty-photo-fallback {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: ${CANDIDATE.periLight};
    border: 3px solid ${CANDIDATE.navy};
    box-shadow: 0 0 0 4px white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 26px;
    font-weight: 800;
    color: ${CANDIDATE.navy};
    margin-bottom: 8px;
    flex-shrink: 0;
  }
  .fp-empty-heading {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 24px;
    font-weight: 800;
    color: ${CANDIDATE.navy};
    margin: 0;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }
  .fp-empty-sub {
    font-size: 13px;
    color: #4b5563;
    max-width: 320px;
    line-height: 1.6;
    margin: 0;
  }
  .fp-suggestions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    margin-top: 8px;
    max-width: 500px;
  }
  .fp-suggestion {
    background: #ffffff;
    border: 1.5px solid ${CANDIDATE.periLight};
    border-radius: 20px;
    padding: 7px 14px;
    font-family: 'Inter', sans-serif;
    font-size: 12.5px;
    color: #374151;
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s, background 0.15s;
    -webkit-tap-highlight-color: transparent;
  }
  .fp-suggestion:hover {
    border-color: ${CANDIDATE.orange};
    color: ${CANDIDATE.orange};
    background: #fff8f6;
  }

  /* ── Messages ── */
  .fp-msg {
    display: flex;
    flex-direction: column;
    animation: fpFadeUp 0.25s ease forwards;
  }
  .fp-msg.user  { align-items: flex-end; }
  .fp-msg.assistant { align-items: flex-start; }
  .fp-msg-label {
    font-size: 10.5px;
    font-weight: 600;
    color: #9ca3af;
    margin-bottom: 4px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .fp-msg-bubble {
    max-width: 78%;
    padding: 11px 15px;
    border-radius: 16px;
    font-size: 14px;
    line-height: 1.65;
    word-break: break-word;
  }
  .fp-msg-bubble.user {
    background: ${CANDIDATE.navy};
    color: #fff;
    border-bottom-right-radius: 4px;
  }
  .fp-msg-bubble.assistant {
    background: #ffffff;
    color: #111827;
    border: 1.5px solid ${CANDIDATE.periLight};
    border-bottom-left-radius: 4px;
    box-shadow: 0 2px 8px rgba(26,63,163,0.06);
  }

  /* Typing dots */
  .fp-typing {
    display: flex;
    gap: 4px;
    padding: 12px 15px;
    background: #ffffff;
    border: 1.5px solid ${CANDIDATE.periLight};
    border-radius: 16px;
    border-bottom-left-radius: 4px;
    box-shadow: 0 2px 8px rgba(26,63,163,0.06);
  }
  .fp-typing span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${CANDIDATE.navy};
    opacity: 0.4;
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
    padding: 12px 16px 20px;
    background: #ffffff;
    border-top: 2px solid ${CANDIDATE.periLight};
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
    background: ${CANDIDATE.periBg};
    border: 1.5px solid ${CANDIDATE.periLight};
    border-radius: 12px;
    padding: 10px 14px;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    color: #111827;
    outline: none;
    resize: none;
    line-height: 1.5;
    max-height: 120px;
    overflow-y: auto;
    transition: border-color 0.15s, box-shadow 0.15s;
    box-sizing: border-box;
  }
  .fp-input::placeholder { color: #9ca3af; }
  .fp-input:focus {
    border-color: ${CANDIDATE.navy};
    box-shadow: 0 0 0 3px ${CANDIDATE.periLight};
  }
  .fp-send {
    flex-shrink: 0;
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: ${CANDIDATE.navy};
    border: none;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: opacity 0.15s;
    -webkit-tap-highlight-color: transparent;
  }
  .fp-send:hover { opacity: 0.88; }
  .fp-send:disabled { opacity: 0.3; pointer-events: none; }

  /* ── Footer ── */
  .fp-footer {
    font-size: 10px;
    color: #9ca3af;
    text-align: center;
    padding: 8px 0 0;
    letter-spacing: 0.02em;
  }
  .fp-footer a {
    color: #9ca3af;
    text-decoration: none;
  }
  .fp-footer a:hover { color: ${CANDIDATE.navy}; }

  /* ── Orange accent bar below header ── */
  .fp-accent-bar {
    height: 3px;
    background: linear-gradient(90deg, ${CANDIDATE.navy} 0%, ${CANDIDATE.orange} 100%);
    width: 100%;
  }
`;

const DISCLAIMER_HEIGHT = 38;
const HEADER_HEIGHT     = 73;

// ── Photo with fallback ────────────────────────────────────────────────────────
function CandidatePhoto({ className, fallbackClass, size }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <div className={fallbackClass}>{CANDIDATE.initials}</div>;
  return (
    <img
      className={className}
      src={CANDIDATE.photoUrl}
      alt={CANDIDATE.name}
      onError={() => setFailed(true)}
    />
  );
}

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
      <FloralLeft />
      <FloralRight />
      <div className="fp-gate-inner">
        <CandidatePhoto className="fp-gate-photo" fallbackClass="fp-gate-photo-fallback" />
        <div className="fp-gate-name">{CANDIDATE.gateLabel}</div>
        <div className="fp-gate-divider" />
        <div className="fp-gate-subtitle">{CANDIDATE.gateSubtitle}</div>
        <input
          className="fp-gate-input"
          type="password"
          placeholder="Access code"
          value={code}
          onChange={e => { setCode(e.target.value); setError(false); }}
          onKeyDown={e => e.key === 'Enter' && attempt()}
          autoFocus
        />
        <button className="fp-gate-btn" onClick={attempt}>Continue →</button>
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

        {/* Disclaimer banner */}
        <div className="fp-disclaimer">
          Unofficial prototype built from Faizah Malik's public record by AstraLink. Not affiliated with the campaign.
        </div>

        {/* Fixed header */}
        <div className="fp-header">
          <CandidatePhoto className="fp-header-photo" fallbackClass="fp-header-photo-fallback" />
          <div className="fp-header-text">
            <h1>{CANDIDATE.name}</h1>
            <p>{CANDIDATE.title}</p>
          </div>
          <div className="fp-status-dot" />
        </div>

        {/* Spacer */}
        <div style={{ height: topOffset }} />

        {/* Chat */}
        <div className="fp-chat">
          {messages.length === 0 ? (
            <div className="fp-empty">
              <CandidatePhoto className="fp-empty-photo" fallbackClass="fp-empty-photo-fallback" />
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

        {/* Input */}
        <div className="fp-input-area">
          <div className="fp-accent-bar" style={{ marginBottom: 12 }} />
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
            Powered by <a href="https://astralink.life" target="_blank" rel="noreferrer">AstraLink</a> · astralink.life
          </div>
        </div>

      </div>
    </div>
  );
}
