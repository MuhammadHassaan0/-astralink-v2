import React, { useState, useRef, useEffect } from 'react';
import { flushSync } from 'react-dom';

// ── Candidate config — swap these to create a new candidate twin ──────────────
const CANDIDATE = {
  name:        'Faizah Malik',
  title:       'Candidate · LA City Council District 11',
  initials:    'FM',
  gateLabel:   'Talk to Faizah Malik',
  gateSubtitle:'LA City Council District 11 · Digital Twin',
  emptyHeading:'Ask me anything',
  emptySub:    "I'm Faizah Malik, running for LA City Council District 11. Ask me about housing, homelessness, climate, or anything on your mind.",
  placeholder: 'Ask Faizah…',
  accentColor: '#1a56db',
  accentLight: '#eff6ff',
  accentBorder:'#bfdbfe',
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

// ── Styles ─────────────────────────────────────────────────────────────────────
const GATE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

  .fp-gate {
    min-height: 100vh;
    background: #f8fafc;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Inter', sans-serif;
  }
  .fp-gate-inner {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    padding: 40px;
    width: 100%;
    max-width: 360px;
    margin: 16px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 0 4px 24px rgba(0,0,0,0.07);
  }
  .fp-gate-avatar {
    width: 68px;
    height: 68px;
    border-radius: 50%;
    background: ${CANDIDATE.accentLight};
    border: 2px solid ${CANDIDATE.accentColor};
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    font-weight: 700;
    color: ${CANDIDATE.accentColor};
    margin-bottom: 20px;
    flex-shrink: 0;
    letter-spacing: 0.02em;
  }
  .fp-gate-name {
    font-size: 19px;
    font-weight: 600;
    color: #111827;
    text-align: center;
    margin-bottom: 4px;
  }
  .fp-gate-subtitle {
    font-size: 12px;
    color: #6b7280;
    text-align: center;
    margin-bottom: 28px;
    line-height: 1.5;
  }
  .fp-gate-input {
    width: 100%;
    background: #f9fafb;
    border: 1px solid #d1d5db;
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
    border-color: ${CANDIDATE.accentColor};
    box-shadow: 0 0 0 3px ${CANDIDATE.accentBorder};
  }
  .fp-gate-btn {
    width: 100%;
    background: ${CANDIDATE.accentColor};
    color: #fff;
    border: none;
    border-radius: 10px;
    padding: 13px 24px;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s;
    margin-bottom: 10px;
  }
  .fp-gate-btn:hover { opacity: 0.88; }
  .fp-gate-error {
    font-size: 12px;
    color: #ef4444;
    text-align: center;
    min-height: 16px;
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
    background: #f8fafc;
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
    border-bottom: 1px solid #e5e7eb;
    box-sizing: border-box;
    z-index: 100;
    padding: 14px 20px;
    display: flex;
    align-items: center;
    gap: 14px;
    animation: fpFadeIn 0.4s ease forwards;
  }
  .fp-header-avatar {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    background: ${CANDIDATE.accentLight};
    border: 1.5px solid ${CANDIDATE.accentColor};
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 700;
    color: ${CANDIDATE.accentColor};
    flex-shrink: 0;
    letter-spacing: 0.02em;
  }
  .fp-header-text h1 {
    font-size: 15px;
    font-weight: 600;
    color: #111827;
    margin: 0;
    line-height: 1.2;
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
    background: ${CANDIDATE.accentColor};
    margin-left: auto;
    box-shadow: 0 0 5px ${CANDIDATE.accentBorder};
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
    background: #f8fafc;
  }
  .fp-chat::-webkit-scrollbar { width: 4px; }
  .fp-chat::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 2px; }

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
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: ${CANDIDATE.accentLight};
    border: 1.5px solid ${CANDIDATE.accentColor};
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 700;
    color: ${CANDIDATE.accentColor};
    margin-bottom: 4px;
    flex-shrink: 0;
  }
  .fp-empty-heading {
    font-size: 16px;
    font-weight: 600;
    color: #111827;
    margin: 0;
  }
  .fp-empty-sub {
    font-size: 13px;
    color: #6b7280;
    max-width: 300px;
    line-height: 1.6;
    margin: 0;
  }
  .fp-suggestions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    margin-top: 4px;
    max-width: 500px;
  }
  .fp-suggestion {
    background: #ffffff;
    border: 1px solid #e5e7eb;
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
    border-color: ${CANDIDATE.accentColor};
    color: ${CANDIDATE.accentColor};
    background: ${CANDIDATE.accentLight};
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
    font-weight: 500;
    color: #9ca3af;
    margin-bottom: 4px;
    letter-spacing: 0.03em;
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
    background: ${CANDIDATE.accentColor};
    color: #fff;
    border-bottom-right-radius: 4px;
  }
  .fp-msg-bubble.assistant {
    background: #ffffff;
    color: #111827;
    border: 1px solid #e5e7eb;
    border-bottom-left-radius: 4px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  }

  /* Typing dots */
  .fp-typing {
    display: flex;
    gap: 4px;
    padding: 12px 15px;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    border-bottom-left-radius: 4px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  }
  .fp-typing span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #9ca3af;
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
    border-top: 1px solid #e5e7eb;
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
    background: #f9fafb;
    border: 1px solid #d1d5db;
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
    border-color: ${CANDIDATE.accentColor};
    box-shadow: 0 0 0 3px ${CANDIDATE.accentBorder};
  }
  .fp-send {
    flex-shrink: 0;
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: ${CANDIDATE.accentColor};
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
  .fp-footer a:hover { color: ${CANDIDATE.accentColor}; }
`;

const DISCLAIMER_HEIGHT = 38; // px — matches .fp-disclaimer padding
const HEADER_HEIGHT     = 70; // px — spacer below fixed header

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
        <div className="fp-gate-avatar">{CANDIDATE.initials}</div>
        <div className="fp-gate-name">{CANDIDATE.gateLabel}</div>
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
        <button className="fp-gate-btn" onClick={attempt}>Continue</button>
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

  // Inject styles
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
          <div className="fp-header-avatar">{CANDIDATE.initials}</div>
          <div className="fp-header-text">
            <h1>{CANDIDATE.name}</h1>
            <p>{CANDIDATE.title}</p>
          </div>
          <div className="fp-status-dot" />
        </div>

        {/* Spacer for fixed disclaimer + header */}
        <div style={{ height: topOffset }} />

        {/* Chat */}
        <div className="fp-chat">
          {messages.length === 0 ? (
            <div className="fp-empty">
              <div className="fp-empty-avatar">{CANDIDATE.initials}</div>
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
