import React, { useState, useRef, useEffect } from 'react';
import { flushSync } from 'react-dom';

const API = 'https://astralink-v2-production.up.railway.app';

const GATE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

  .vp-gate {
    min-height: 100vh;
    background: #FFFFFF;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-family: 'Inter', sans-serif;
  }

  .vp-gate-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
    width: 100%;
    max-width: 320px;
    padding: 0 24px;
    box-sizing: border-box;
  }

  .vp-gate-brand {
    font-family: 'Inter', sans-serif;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.3em;
    color: #6366F1;
    text-transform: uppercase;
    margin-bottom: 40px;
  }

  .vp-gate-input {
    width: 100%;
    border: none;
    border-bottom: 1.5px solid #6366F1;
    background: transparent;
    padding: 8px 0;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 15px;
    color: #1A1A1A;
    outline: none;
    text-align: center;
    box-sizing: border-box;
  }

  .vp-gate-input::placeholder {
    color: #9CA3AF;
    font-style: italic;
  }

  .vp-gate-input:focus {
    border-bottom-color: #4F46E5;
  }

  .vp-gate-btn {
    margin-top: 20px;
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.2em;
    color: #C49A2A;
    text-transform: uppercase;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    transition: color 0.15s ease;
  }

  .vp-gate-btn:hover { color: #1A1A1A; }

  .vp-gate-error {
    margin-top: 12px;
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    color: #EF4444;
    text-align: center;
  }
`;

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

  @keyframes vintFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  @keyframes thinkPulse {
    0%, 100% { opacity: 0.2; }
    50%       { opacity: 1; }
  }

  .vp-root {
    min-height: 100vh;
    background: #FFFFFF;
    display: flex;
    flex-direction: column;
    align-items: center;
    font-family: 'Inter', sans-serif;
  }

  .vp-inner {
    width: 100%;
    max-width: 680px;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    padding: 0 24px;
    box-sizing: border-box;
  }

  /* ── Header ── */
  .vp-header {
    position: fixed;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 680px;
    padding: 24px 24px 0 24px;
    background: #FFFFFF;
    box-sizing: border-box;
    z-index: 100;
    animation: vintFadeIn 0.6s ease forwards;
  }

  .vp-brand {
    font-family: 'Inter', sans-serif;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.25em;
    color: #6366F1;
    text-transform: uppercase;
    line-height: 1;
  }

  .vp-name {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 36px;
    font-weight: normal;
    color: #1A1A1A;
    margin-top: 4px;
    line-height: 1.1;
  }

  .vp-subtitle {
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 400;
    color: #999999;
    font-style: italic;
    margin-top: 2px;
    line-height: 1.4;
  }

  .vp-rule {
    width: 100%;
    height: 1px;
    background: #E5E7EB;
    border: none;
    margin-top: 16px;
    margin-bottom: 0;
  }

  .vp-disclaimer {
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    font-weight: 400;
    color: #9CA3AF;
    font-style: italic;
    padding: 8px 0 16px 0;
  }

  /* ── Chat area ── */
  .vp-chat {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding-bottom: 120px;
    overflow-y: auto;
  }

  /* ── Empty state ── */
  .vp-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 48px 0;
  }

  .vp-empty-heading {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 20px;
    font-weight: normal;
    color: #1A1A1A;
  }

  .vp-empty-sub {
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    font-weight: 400;
    color: #9CA3AF;
    margin-top: 6px;
  }

  /* ── Messages ── */
  .vp-msg {
    display: flex;
    flex-direction: column;
    animation: vintFadeIn 0.25s ease forwards;
    opacity: 0;
  }

  .vp-msg.user {
    align-items: flex-end;
    max-width: 80%;
    align-self: flex-end;
  }

  .vp-msg.assistant {
    align-items: flex-start;
    max-width: 90%;
    align-self: flex-start;
  }

  .vp-msg-label {
    font-family: 'Inter', sans-serif;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.2em;
    color: #6366F1;
    text-transform: uppercase;
    margin-bottom: 5px;
  }

  .vp-msg-text.user {
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 400;
    color: #1A1A1A;
    text-align: right;
    line-height: 1.6;
    word-break: break-word;
    white-space: pre-wrap;
  }

  .vp-msg-text.assistant {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 15px;
    font-weight: normal;
    color: #1A1A1A;
    line-height: 1.9;
    border-left: 2px solid #6366F1;
    padding-left: 16px;
    word-break: break-word;
    white-space: pre-wrap;
  }

  .vp-thinking {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 15px;
    color: #A5B4FC;
    border-left: 2px solid #6366F1;
    padding-left: 16px;
    animation: thinkPulse 1.6s ease-in-out infinite;
  }

  /* ── Input area ── */
  .vp-input-area {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 680px;
    padding: 16px 24px 24px 24px;
    background: #FFFFFF;
    border-top: 1px solid #E5E7EB;
    box-sizing: border-box;
    z-index: 100;
  }

  .vp-input-row {
    display: flex;
    align-items: flex-end;
    gap: 16px;
  }

  .vp-input {
    flex: 1;
    border: none;
    border-bottom: 1.5px solid #6366F1;
    background: transparent;
    padding: 8px 0;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 15px;
    color: #1A1A1A;
    outline: none;
    resize: none;
    line-height: 1.5;
    max-height: 100px;
    overflow-y: auto;
    transition: border-bottom-color 0.15s ease;
  }

  .vp-input::placeholder {
    font-family: Georgia, 'Times New Roman', serif;
    color: #9CA3AF;
    font-style: italic;
  }

  .vp-input:focus {
    border-bottom-color: #4F46E5;
  }

  .vp-send {
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.2em;
    color: #6366F1;
    text-transform: uppercase;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0 0 2px 0;
    transition: color 0.15s ease;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .vp-send:hover:not(:disabled) { color: #4F46E5; }
  .vp-send:disabled { opacity: 0.35; cursor: default; }

  .vp-footer {
    font-family: 'Inter', sans-serif;
    font-size: 10px;
    color: #D1D5DB;
    text-align: center;
    padding-top: 10px;
    padding-bottom: 0;
    letter-spacing: 0.02em;
  }
`;

/* Header height offset so chat doesn't hide under fixed header */
const HEADER_HEIGHT = 148;

const GATE_KEY = 'vint_access';
const GATE_PASS = 'vint2026';

function PasswordGate({ onUnlock }) {
  const [code, setCode] = useState('');
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
    <div className="vp-gate">
      <div className="vp-gate-inner">
        <div className="vp-gate-brand">Astralink</div>
        <input
          className="vp-gate-input"
          type="password"
          placeholder="Enter access code"
          value={code}
          onChange={e => { setCode(e.target.value); setError(false); }}
          onKeyDown={e => e.key === 'Enter' && attempt()}
          autoFocus
        />
        <button className="vp-gate-btn" onClick={attempt}>Enter</button>
        {error && <div className="vp-gate-error">Incorrect access code</div>}
      </div>
    </div>
  );
}

function Message({ msg, index }) {
  const isUser = msg.role === 'user';
  return (
    <div
      className={`vp-msg ${isUser ? 'user' : 'assistant'}`}
      style={{ animationDelay: `${Math.min(index * 0.03, 0.12)}s` }}
    >
      <div className="vp-msg-label">{isUser ? 'You' : 'Vint Cerf'}</div>
      {!isUser && msg.content === '' ? (
        <div className="vp-thinking">…</div>
      ) : (
        <div className={`vp-msg-text ${isUser ? 'user' : 'assistant'}`}>
          {msg.content}
        </div>
      )}
    </div>
  );
}

export default function VintPage() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(GATE_KEY) === '1');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Always inject styles — hooks must come before any conditional return
  useEffect(() => {
    const gateStyle = document.createElement('style');
    gateStyle.id = 'vp-gate-styles';
    gateStyle.textContent = GATE_STYLES;
    document.head.appendChild(gateStyle);

    const chatStyle = document.createElement('style');
    chatStyle.id = 'vp-chat-styles';
    chatStyle.textContent = STYLES;
    document.head.appendChild(chatStyle);

    return () => {
      document.getElementById('vp-gate-styles')?.remove();
      document.getElementById('vp-chat-styles')?.remove();
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />;

  const sendMessage = async () => {
    if (!input.trim() || streaming) return;
    const userMsg = { role: 'user', content: input.trim() };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setStreaming(true);

    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch(`${API}/vint-chat`, {
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
                flushSync(() => {
                  setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                      ...updated[updated.length - 1],
                      content: updated[updated.length - 1].content + text,
                    };
                    return updated;
                  });
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

  return (
    <div className="vp-root">
      <div className="vp-inner">

        {/* Fixed header */}
        <div className="vp-header">
          <div className="vp-brand">Astralink</div>
          <div className="vp-name">Vint Cerf</div>
          <div className="vp-subtitle">An attempt to preserve how he thinks.</div>
          <hr className="vp-rule" />
          <div className="vp-disclaimer">
            Private experimental prototype — not for public release
          </div>
        </div>

        {/* Spacer for fixed header */}
        <div style={{ height: HEADER_HEIGHT }} />

        {/* Chat area */}
        <div className="vp-chat">
          {messages.length === 0 ? (
            <div className="vp-empty">
              <div className="vp-empty-heading">Begin.</div>
            </div>
          ) : (
            messages.map((msg, i) => <Message key={i} msg={msg} index={i} />)
          )}
          <div ref={bottomRef} />
        </div>

        {/* Fixed input area */}
        <div className="vp-input-area">
          <div className="vp-input-row">
            <textarea
              ref={inputRef}
              className="vp-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask something."
              rows={1}
              onInput={e => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
              }}
            />
            <button
              className="vp-send"
              onClick={sendMessage}
              disabled={!input.trim() || streaming}
            >
              {streaming ? 'Sending…' : 'Send'}
            </button>
          </div>
          <div className="vp-footer">AstraLink — astralink.life</div>
        </div>

      </div>
    </div>
  );
}
