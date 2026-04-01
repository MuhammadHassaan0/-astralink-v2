import React, { useState, useRef, useEffect } from 'react';

const API = 'https://astralink-v2-production.up.railway.app';

// ── Styles ────────────────────────────────────────────────────────────────────
const STYLES = `
  @keyframes wozFadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes wozDot {
    0%, 60%, 100% { transform: translateY(0); opacity: 0.25; }
    30%           { transform: translateY(-4px); opacity: 0.8; }
  }

  @keyframes wozHeroIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .woz-page {
    height: 100dvh;
    background: #FFFFFF;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display",
      "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: hidden;
    -webkit-font-smoothing: antialiased;
  }

  .woz-inner {
    width: 100%;
    max-width: 680px;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  /* ── Header ── */
  .woz-header {
    flex-shrink: 0;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    border-bottom: 0.5px solid #d2d2d7;
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }

  .woz-header-text {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .woz-header-name {
    font-size: 17px;
    font-weight: 400;
    color: #1d1d1f;
    line-height: 1.2;
    letter-spacing: -0.2px;
  }

  .woz-header-sub {
    font-size: 13px;
    font-weight: 400;
    color: #86868b;
    line-height: 1.2;
  }

  /* ── Chat area ── */
  .woz-chat {
    flex: 1;
    overflow-y: auto;
    padding: 0 24px;
    display: flex;
    flex-direction: column;
    scrollbar-width: none;
  }

  .woz-chat::-webkit-scrollbar { display: none; }

  /* ── Hero (empty state) ── */
  .woz-hero {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 48px 16px 80px 16px;
    animation: wozHeroIn 0.7s ease forwards;
  }

  .woz-hero-fifty {
    font-size: 48px;
    font-weight: 300;
    color: #1d1d1f;
    letter-spacing: -0.5px;
    margin: 20px 0 6px 0;
    line-height: 1;
  }

  .woz-hero-date {
    font-size: 14px;
    color: #86868b;
    font-weight: 400;
    letter-spacing: 0;
    margin-bottom: 40px;
  }

  .woz-hero-line1 {
    font-size: 17px;
    color: #1d1d1f;
    font-weight: 400;
    line-height: 1.6;
    margin-bottom: 2px;
    max-width: 340px;
  }

  .woz-hero-line2 {
    font-size: 17px;
    color: #86868b;
    font-weight: 400;
    line-height: 1.6;
  }

  /* ── Messages ── */
  .woz-msg-group {
    animation: wozFadeUp 0.3s ease forwards;
    opacity: 0;
  }

  .woz-msg-group-user {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 6px;
    margin-top: 20px;
  }

  .woz-msg-group-user:first-child { margin-top: 24px; }

  .woz-bubble-user {
    background: #0071e3;
    color: #FFFFFF;
    border-radius: 18px 18px 4px 18px;
    padding: 10px 16px;
    max-width: 75%;
    font-size: 16px;
    line-height: 1.5;
    word-break: break-word;
    white-space: pre-wrap;
    font-weight: 400;
  }

  .woz-msg-group-assistant {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 20px;
    margin-top: 4px;
  }

  .woz-msg-label {
    font-size: 12px;
    font-weight: 500;
    color: #86868b;
    margin-bottom: 4px;
    padding-left: 1px;
  }

  .woz-bubble-assistant {
    color: #1d1d1f;
    font-size: 16px;
    line-height: 1.6;
    word-break: break-word;
    white-space: pre-wrap;
    font-weight: 400;
    max-width: 85%;
  }

  /* ── Typing dots ── */
  .woz-dots {
    display: flex;
    gap: 5px;
    align-items: center;
    padding: 6px 0;
  }

  .woz-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #86868b;
    animation: wozDot 1.3s ease infinite;
  }

  .woz-dot:nth-child(2) { animation-delay: 0.18s; }
  .woz-dot:nth-child(3) { animation-delay: 0.36s; }

  /* ── Input area ── */
  .woz-input-wrap {
    flex-shrink: 0;
    background: #FFFFFF;
    border-top: 0.5px solid #d2d2d7;
    padding: 12px 24px;
    padding-bottom: max(16px, env(safe-area-inset-bottom, 16px));
  }

  .woz-input-row {
    display: flex;
    align-items: flex-end;
    gap: 10px;
    min-height: 44px;
  }

  .woz-input {
    flex: 1;
    border: none;
    outline: none;
    resize: none;
    background: transparent;
    font-family: inherit;
    font-size: 16px;
    font-weight: 400;
    color: #1d1d1f;
    line-height: 1.5;
    max-height: 128px;
    overflow-y: auto;
    padding: 10px 0;
    scrollbar-width: none;
  }

  .woz-input::-webkit-scrollbar { display: none; }
  .woz-input::placeholder { color: #86868b; }

  .woz-send {
    width: 32px;
    height: 32px;
    min-width: 32px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: transform 0.1s ease, background 0.15s ease;
    margin-bottom: 5px;
    -webkit-tap-highlight-color: transparent;
  }

  .woz-send:active { transform: scale(0.93); }
  .woz-send:disabled { cursor: default; }

  .woz-disclaimer {
    font-size: 11px;
    color: #86868b;
    text-align: center;
    padding-top: 8px;
    line-height: 1.4;
    opacity: 0.7;
  }

  @media (min-width: 600px) {
    .woz-header  { padding: 0 48px; }
    .woz-chat    { padding: 0 48px; }
    .woz-input-wrap { padding: 12px 48px; padding-bottom: max(16px, env(safe-area-inset-bottom, 16px)); }
  }
`;

// ── Apple logo SVG ─────────────────────────────────────────────────────────────
function AppleLogo({ size = 16, color = '#1d1d1f' }) {
  return (
    <svg
      width={size}
      height={size * 1.22}
      viewBox="0 0 814 1000"
      fill={color}
      aria-hidden="true"
    >
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.5-155.5-127.4C46 790.7 0 637.7 0 491.6c0-167.7 109.2-256.8 216.6-256.8 71 0 130.3 46.5 175.5 46.5 43.5 0 111.5-49.6 188.6-49.6 30.4 0 108.2 2.6 163.7 78.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z" />
    </svg>
  );
}

// ── Message component ──────────────────────────────────────────────────────────
function Message({ msg, index }) {
  const isUser = msg.role === 'user';
  const isThinking = !isUser && msg.content === '';

  if (isUser) {
    return (
      <div
        key={index}
        className="woz-msg-group woz-msg-group-user"
        style={{ animationDelay: `${Math.min(index * 0.04, 0.2)}s` }}
      >
        <div className="woz-bubble-user">{msg.content}</div>
      </div>
    );
  }

  return (
    <div
      key={index}
      className="woz-msg-group woz-msg-group-assistant"
      style={{ animationDelay: `${Math.min(index * 0.04, 0.2)}s` }}
    >
      <div className="woz-msg-label">Woz</div>
      {isThinking ? (
        <div className="woz-dots">
          <div className="woz-dot" />
          <div className="woz-dot" />
          <div className="woz-dot" />
        </div>
      ) : (
        <div className="woz-bubble-assistant">{msg.content}</div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function WozPage() {
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = STYLES;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || streaming) return;
    const userMsg = { role: 'user', content: input.trim() };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setStreaming(true);

    const placeholder = { role: 'assistant', content: '' };
    setMessages(prev => [...prev, placeholder]);

    try {
      const res = await fetch(`${API}/woz-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const { text } = JSON.parse(data);
              if (text) {
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    content: updated[updated.length - 1].content + text,
                  };
                  return updated;
                });
              }
            } catch {}
          }
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

  const hasText = input.trim().length > 0;

  return (
    <div className="woz-page">
      <div className="woz-inner">

        {/* ── Header ── */}
        <header className="woz-header">
          <div className="woz-header-text">
            <span className="woz-header-name">Steve Wozniak</span>
            <span className="woz-header-sub">An attempt to preserve how Woz thinks.</span>
          </div>
          <AppleLogo size={16} color="#1d1d1f" />
        </header>

        {/* ── Chat ── */}
        <div className="woz-chat">
          {messages.length === 0 ? (
            <div className="woz-hero">
              <AppleLogo size={48} color="#1d1d1f" />
              <div className="woz-hero-fifty">50 Years</div>
              <div className="woz-hero-date">April 1, 1976 — April 1, 2026</div>
              <div className="woz-hero-line1">
                Steve Wozniak built something that changed everything.
              </div>
              <div className="woz-hero-line2">Ask him anything.</div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <Message key={i} msg={msg} index={i} />
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── Input ── */}
        <div className="woz-input-wrap">
          <div className="woz-input-row">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Woz..."
              rows={1}
              className="woz-input"
              onInput={e => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!hasText || streaming}
              className="woz-send"
              style={{ background: hasText && !streaming ? '#0071e3' : '#d2d2d7' }}
            >
              {streaming ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2.5" opacity="0.35"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from="0 12 12"
                      to="360 12 12"
                      dur="0.75s"
                      repeatCount="indefinite"
                    />
                  </path>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              )}
            </button>
          </div>
          <div className="woz-disclaimer">
            Private experimental prototype — not for public release
          </div>
        </div>

      </div>
    </div>
  );
}
