import React, { useState, useRef, useEffect } from 'react';
import { flushSync } from 'react-dom';

const API = 'https://astralink-v2-production.up.railway.app';

const GATE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

  .mp-gate {
    min-height: 100vh;
    background: #0d0d0d;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Inter', sans-serif;
  }
  .mp-gate-inner {
    background: #161616;
    border: 1px solid #2a2a2a;
    border-radius: 24px;
    padding: 40px;
    width: 100%;
    max-width: 360px;
    margin: 16px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
  }
  .mp-gate-avatar {
    width: 68px;
    height: 68px;
    border-radius: 50%;
    background: rgba(46,204,113,0.10);
    border: 2px solid #2ecc71;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: 600;
    color: #2ecc71;
    letter-spacing: 1px;
    margin-bottom: 20px;
  }
  .mp-gate-name {
    font-size: 19px;
    font-weight: 600;
    color: #e8e8e8;
    text-align: center;
    margin-bottom: 4px;
  }
  .mp-gate-subtitle {
    font-size: 12px;
    color: #666;
    text-align: center;
    margin-bottom: 28px;
    line-height: 1.5;
  }
  .mp-gate-input {
    width: 100%;
    background: #1f1f1f;
    border: 1px solid #2a2a2a;
    border-radius: 12px;
    padding: 13px 16px;
    font-family: 'Inter', sans-serif;
    font-size: 15px;
    color: #e8e8e8;
    outline: none;
    box-sizing: border-box;
    text-align: center;
    transition: border-color 0.15s;
    margin-bottom: 12px;
  }
  .mp-gate-input::placeholder { color: #444; }
  .mp-gate-input:focus { border-color: #2ecc71; }
  .mp-gate-btn {
    width: 100%;
    background: #2ecc71;
    color: #000;
    border: none;
    border-radius: 12px;
    padding: 13px 24px;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s;
    margin-bottom: 10px;
  }
  .mp-gate-btn:hover { opacity: 0.88; }
  .mp-gate-error {
    font-size: 12px;
    color: #e74c3c;
    text-align: center;
    min-height: 16px;
  }
`;

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

  @keyframes mpFadeIn  { from { opacity: 0; } to { opacity: 1; } }
  @keyframes mpFadeUp  {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes mpPulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.25; }
  }
  @keyframes mpDot {
    0%, 60%, 100% { transform: translateY(0); opacity: 0.3; }
    30%            { transform: translateY(-4px); opacity: 1; }
  }

  .mp-root {
    min-height: 100dvh;
    background: #0d0d0d;
    display: flex;
    flex-direction: column;
    align-items: center;
    font-family: 'Inter', sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .mp-inner {
    width: 100%;
    max-width: 680px;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
  }

  /* ── Header ── */
  .mp-header {
    position: fixed;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 680px;
    background: #161616;
    border-bottom: 1px solid #2a2a2a;
    box-sizing: border-box;
    z-index: 100;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    gap: 14px;
    animation: mpFadeIn 0.4s ease forwards;
  }
  .mp-header-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgba(46,204,113,0.10);
    border: 1.5px solid #2ecc71;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 600;
    color: #2ecc71;
    flex-shrink: 0;
  }
  .mp-header-text h1 {
    font-size: 15px;
    font-weight: 600;
    color: #e8e8e8;
    margin: 0;
    line-height: 1.2;
  }
  .mp-header-text p {
    font-size: 11px;
    color: #666;
    margin: 2px 0 0;
  }
  .mp-status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #2ecc71;
    margin-left: auto;
    box-shadow: 0 0 6px #2ecc71;
    animation: mpPulse 2.4s ease-in-out infinite;
    flex-shrink: 0;
  }

  /* ── Chat area ── */
  .mp-chat {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px 16px 140px;
    overflow-y: auto;
    background: #0d0d0d;
  }
  .mp-chat::-webkit-scrollbar { display: none; }
  .mp-chat { scrollbar-width: none; }

  /* ── Empty state ── */
  .mp-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 48px 24px;
    gap: 10px;
    animation: mpFadeUp 0.5s ease forwards;
  }
  .mp-empty-avatar {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: rgba(46,204,113,0.10);
    border: 1.5px solid #2ecc71;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 17px;
    font-weight: 600;
    color: #2ecc71;
    margin-bottom: 4px;
  }
  .mp-empty-heading {
    font-size: 16px;
    font-weight: 600;
    color: #e8e8e8;
    margin: 0;
  }
  .mp-empty-sub {
    font-size: 13px;
    color: #555;
    max-width: 280px;
    line-height: 1.6;
    margin: 0;
  }
  .mp-suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
    margin-top: 8px;
  }
  .mp-suggestion {
    background: #161616;
    border: 1px solid #2a2a2a;
    border-radius: 20px;
    padding: 7px 14px;
    font-size: 12px;
    color: #666;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    transition: border-color 0.15s, color 0.15s;
  }
  .mp-suggestion:hover { border-color: #2ecc71; color: #2ecc71; }

  /* ── Messages ── */
  .mp-msg {
    display: flex;
    flex-direction: column;
    animation: mpFadeUp 0.22s ease forwards;
    opacity: 0;
  }
  .mp-msg.user {
    align-items: flex-end;
    align-self: flex-end;
    max-width: 76%;
  }
  .mp-msg.assistant {
    align-items: flex-start;
    align-self: flex-start;
    max-width: 88%;
  }
  .mp-msg-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .mp-msg.user .mp-msg-label    { color: #444; }
  .mp-msg.assistant .mp-msg-label { color: #2ecc71; }

  .mp-msg-bubble {
    font-size: 14px;
    line-height: 1.7;
    word-break: break-word;
  }
  .mp-msg-bubble.user {
    background: #1a2e22;
    border: 1px solid #2ecc71;
    border-radius: 18px 18px 4px 18px;
    padding: 10px 16px;
    color: #e8e8e8;
  }
  .mp-msg-bubble.assistant {
    background: transparent;
    color: #d8d8d8;
    padding: 0;
  }

  /* Typing dots */
  .mp-typing {
    display: flex;
    gap: 5px;
    align-items: center;
    padding: 4px 0;
  }
  .mp-typing span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #2ecc71;
    animation: mpDot 1.2s ease-in-out infinite;
  }
  .mp-typing span:nth-child(2) { animation-delay: 0.2s; }
  .mp-typing span:nth-child(3) { animation-delay: 0.4s; }

  /* ── Input area ── */
  .mp-input-area {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 680px;
    background: #161616;
    border-top: 1px solid #2a2a2a;
    padding: 12px 16px 20px;
    box-sizing: border-box;
    z-index: 100;
  }
  .mp-input-row {
    display: flex;
    align-items: flex-end;
    gap: 10px;
    background: #1f1f1f;
    border: 1px solid #2a2a2a;
    border-radius: 16px;
    padding: 10px 10px 10px 16px;
    transition: border-color 0.15s;
  }
  .mp-input-row:focus-within { border-color: #2ecc71; }
  .mp-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    color: #e8e8e8;
    resize: none;
    line-height: 1.5;
    max-height: 120px;
    overflow-y: auto;
    padding: 0;
  }
  .mp-input::placeholder { color: #444; }
  .mp-send {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #2ecc71;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: opacity 0.15s, transform 0.1s;
    color: #000;
  }
  .mp-send:hover:not(:disabled) { opacity: 0.85; }
  .mp-send:active:not(:disabled) { transform: scale(0.92); }
  .mp-send:disabled { opacity: 0.3; cursor: default; }
`;

const HEADER_HEIGHT = 77;
const GATE_KEY  = 'mamdani_access';
const GATE_PASS = 'mamdani2026';

const SUGGESTIONS = [
  "What's your housing policy?",
  "What did you announce recently?",
  "Tell me about fare-free buses",
  "What do you believe in?",
];

function PasswordGate({ onUnlock }) {
  const [code, setCode]   = useState('');
  const [error, setError] = useState(false);

  const attempt = () => {
    if (code.trim() === GATE_PASS) {
      sessionStorage.setItem(GATE_KEY, '1');
      onUnlock();
    } else {
      setError(true);
      setCode('');
    }
  };

  return (
    <div className="mp-gate">
      <div className="mp-gate-inner">
        <div className="mp-gate-avatar">ZM</div>
        <div className="mp-gate-name">Talk to Zohran Mamdani</div>
        <div className="mp-gate-subtitle">Mayor of New York City · Digital Twin</div>
        <input
          className="mp-gate-input"
          type="password"
          placeholder="Access code"
          value={code}
          onChange={e => { setCode(e.target.value); setError(false); }}
          onKeyDown={e => e.key === 'Enter' && attempt()}
          autoFocus
        />
        <button className="mp-gate-btn" onClick={attempt}>Continue</button>
        <div className="mp-gate-error">{error ? 'Incorrect access code' : ''}</div>
      </div>
    </div>
  );
}

function Message({ msg, index }) {
  const isUser = msg.role === 'user';
  const isTyping = !isUser && msg.content === '';

  return (
    <div
      className={`mp-msg ${isUser ? 'user' : 'assistant'}`}
      style={{ animationDelay: `${Math.min(index * 0.03, 0.1)}s` }}
    >
      <div className="mp-msg-label">{isUser ? 'You' : 'Mamdani'}</div>
      {isUser ? (
        <div className="mp-msg-bubble user">{msg.content}</div>
      ) : isTyping ? (
        <div className="mp-typing">
          <span /><span /><span />
        </div>
      ) : (
        <div className="mp-msg-bubble assistant">
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

export default function MamdaniPage() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(GATE_KEY) === '1');
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Inject styles — always before any conditional return
  useEffect(() => {
    const gateEl = document.createElement('style');
    gateEl.id = 'mp-gate-styles';
    gateEl.textContent = GATE_STYLES;
    document.head.appendChild(gateEl);

    const chatEl = document.createElement('style');
    chatEl.id = 'mp-chat-styles';
    chatEl.textContent = STYLES;
    document.head.appendChild(chatEl);

    return () => {
      document.getElementById('mp-gate-styles')?.remove();
      document.getElementById('mp-chat-styles')?.remove();
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />;

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

    // Show typing indicator immediately (content: '' triggers dots)
    setMessages([...history, { role: 'assistant', content: '' }]);
    setInput('');
    setStreaming(true);

    // ── Thinking delay: 800–2000ms based on question length ──────────────────
    const thinkMs = 800 + Math.min(content.length * 12, 1200);
    await new Promise(r => setTimeout(r, thinkMs));

    try {
      const res = await fetch(`${API}/mamdani-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok) throw new Error(`Server error ${res.status}`);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let sseBuffer  = '';   // raw SSE line buffer
      let tokenBuf   = '';   // pending token chars (for || detection)

      // Flush tokenBuf to the last message, handling || pause
      const flushTokenBuf = async () => {
        while (tokenBuf.length > 0) {
          const delimIdx = tokenBuf.indexOf('||');
          if (delimIdx === -1) {
            // No delimiter — safe to display unless ends with '|' (partial)
            if (tokenBuf.endsWith('|')) {
              // Hold the trailing '|' in case next token completes '||'
              const safe = tokenBuf.slice(0, -1);
              if (safe) flushSync(() => appendToLast(safe));
              tokenBuf = '|';
            } else {
              flushSync(() => appendToLast(tokenBuf));
              tokenBuf = '';
            }
            break;
          } else {
            // Found '||' — display up to it, pause, continue
            const before = tokenBuf.slice(0, delimIdx);
            tokenBuf = tokenBuf.slice(delimIdx + 2);
            if (before) flushSync(() => appendToLast(before));
            await new Promise(r => setTimeout(r, 600)); // 600ms chunk pause
          }
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        sseBuffer += decoder.decode(value, { stream: true });
        const lines = sseBuffer.split('\n');
        sseBuffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;
          try {
            const evt = JSON.parse(raw);
            if (evt.type === 'token' && evt.content) {
              tokenBuf += evt.content;
              await flushTokenBuf();
            } else if (evt.type === 'done') {
              // Flush any remaining buffer (strip stray '|')
              if (tokenBuf) {
                const final = tokenBuf.replace(/\|+$/, '');
                if (final) flushSync(() => appendToLast(final));
                tokenBuf = '';
              }
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

  return (
    <div className="mp-root">
      <div className="mp-inner">

        {/* Fixed header */}
        <div className="mp-header">
          <div className="mp-header-avatar">ZM</div>
          <div className="mp-header-text">
            <h1>Zohran Mamdani</h1>
            <p>Mayor of New York City</p>
          </div>
          <div className="mp-status-dot" />
        </div>

        {/* Spacer */}
        <div style={{ height: HEADER_HEIGHT }} />

        {/* Chat */}
        <div className="mp-chat">
          {messages.length === 0 ? (
            <div className="mp-empty">
              <div className="mp-empty-avatar">ZM</div>
              <p className="mp-empty-heading">Ask me anything</p>
              <p className="mp-empty-sub">I'm Zohran Mamdani, Mayor of New York City. Ask me about housing, transit, childcare, or anything on your mind.</p>
              <div className="mp-suggestions">
                {SUGGESTIONS.map(s => (
                  <button key={s} className="mp-suggestion" onClick={() => sendMessage(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => <Message key={i} msg={msg} index={i} />)
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="mp-input-area">
          <div className="mp-input-row">
            <textarea
              ref={inputRef}
              className="mp-input"
              rows={1}
              placeholder="Ask the Mayor…"
              value={input}
              onChange={e => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={handleKeyDown}
              disabled={streaming}
            />
            <button
              className="mp-send"
              onClick={() => sendMessage()}
              disabled={streaming || !input.trim()}
              aria-label="Send"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2 21l21-9L2 3v7l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
