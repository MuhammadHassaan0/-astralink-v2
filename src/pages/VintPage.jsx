import React, { useState, useRef, useEffect } from 'react';
import { flushSync } from 'react-dom';
import VintCall from '../components/VintCall';

const API = 'https://astralink-v2-production.up.railway.app';

const GATE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

  .vp-gate {
    min-height: 100vh;
    background: #F8F7FF;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Inter', sans-serif;
  }
  .vp-gate-inner {
    background: #FFFFFF;
    border-radius: 24px;
    box-shadow: 0 20px 60px rgba(107,92,231,0.12), 0 4px 16px rgba(0,0,0,0.06);
    padding: 40px;
    width: 100%;
    max-width: 360px;
    margin: 16px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .vp-gate-brand {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.3em;
    color: #6B5CE7;
    text-transform: uppercase;
    margin-bottom: 28px;
  }
  .vp-gate-input {
    width: 100%;
    border: 1.5px solid #E8E4F8;
    border-radius: 14px;
    background: #F8F7FF;
    padding: 14px 18px;
    font-family: 'Inter', sans-serif;
    font-size: 15px;
    color: #1A1626;
    outline: none;
    box-sizing: border-box;
    text-align: center;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .vp-gate-input::placeholder { color: #9B98B0; }
  .vp-gate-input:focus {
    border-color: #6B5CE7;
    box-shadow: 0 0 0 3px rgba(107,92,231,0.10);
  }
  .vp-gate-btn {
    margin-top: 14px;
    width: 100%;
    background: #6B5CE7;
    color: #FFFFFF;
    border: none;
    border-radius: 14px;
    padding: 14px 24px;
    font-family: 'Inter', sans-serif;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s;
  }
  .vp-gate-btn:hover { background: #4A3DB5; }
  .vp-gate-error {
    margin-top: 10px;
    font-size: 11px;
    color: #EF4444;
    text-align: center;
  }
`;

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

  @keyframes vintFadeIn  { from { opacity: 0; } to { opacity: 1; } }
  @keyframes vintFadeUp  {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes thinkPulse  {
    0%, 100% { opacity: 0.25; }
    50%       { opacity: 1; }
  }

  /* ── Root ── */
  .vp-root {
    min-height: 100vh;
    background: #F8F7FF;
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
    box-sizing: border-box;
  }

  /* ── Hero / Header ── */
  .vp-header {
    position: fixed;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 680px;
    background: #FFFFFF;
    border-bottom: 1px solid #E8E4F8;
    box-sizing: border-box;
    z-index: 100;
    padding: 20px 24px 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
    animation: vintFadeIn 0.5s ease forwards;
  }
  .vp-brand {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.25em;
    color: #6B5CE7;
    text-transform: uppercase;
    margin-bottom: 12px;
    line-height: 1;
  }
  .vp-avatar-hero {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: linear-gradient(135deg, #EDE9FD 0%, #D8D0FC 100%);
    border: 3px solid #6B5CE7;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 20px;
    font-style: italic;
    color: #6B5CE7;
    flex-shrink: 0;
    box-shadow: 0 0 0 6px #EDE9FD, 0 6px 24px rgba(107,92,231,0.18);
  }
  .vp-name {
    font-size: 22px;
    font-weight: 600;
    color: #1A1626;
    letter-spacing: -0.02em;
    margin-top: 10px;
    margin-bottom: 2px;
    line-height: 1.2;
  }
  .vp-subtitle {
    font-size: 12px;
    font-weight: 400;
    color: #6B6580;
    font-style: italic;
    margin-bottom: 10px;
    line-height: 1.4;
  }
  .vp-header-call {
    margin-bottom: 8px;
  }
  .vp-badge {
    font-size: 10px;
    color: #9B98B0;
    background: #EDE9FD;
    border-radius: 9999px;
    padding: 3px 12px;
    display: inline-block;
    line-height: 1.6;
  }

  /* ── Chat area ── */
  .vp-chat {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 16px 16px 140px;
    overflow-y: auto;
    background: #F8F7FF;
  }
  .vp-chat::-webkit-scrollbar { display: none; }
  .vp-chat { scrollbar-width: none; }

  /* ── Empty state ── */
  .vp-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 48px 0;
    gap: 8px;
  }
  .vp-empty-icon {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #EDE9FD;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: Georgia, serif;
    font-size: 14px;
    font-style: italic;
    color: #6B5CE7;
    margin-bottom: 4px;
  }
  .vp-empty-heading {
    font-size: 13px;
    font-weight: 400;
    color: #9B98B0;
    font-style: italic;
  }

  /* ── Messages ── */
  .vp-msg {
    display: flex;
    flex-direction: column;
    animation: vintFadeUp 0.25s ease forwards;
    opacity: 0;
  }
  .vp-msg.user {
    align-items: flex-end;
    align-self: flex-end;
    max-width: 75%;
  }
  .vp-msg.assistant {
    align-items: flex-start;
    align-self: flex-start;
    max-width: 78%;
  }
  .vp-msg-row {
    display: flex;
    align-items: flex-end;
    gap: 8px;
  }
  .vp-msg-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #EDE9FD;
    border: 2px solid #E8E4F8;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: Georgia, serif;
    font-size: 9px;
    font-style: italic;
    color: #6B5CE7;
    flex-shrink: 0;
    user-select: none;
  }
  .vp-msg-bubble {
    padding: 10px 16px;
    font-size: 14px;
    line-height: 1.65;
    word-break: break-word;
  }
  .vp-msg-bubble.user {
    background: #6B5CE7;
    color: #FFFFFF;
    border-radius: 20px 20px 4px 20px;
    box-shadow: 0 2px 8px rgba(107,92,231,0.22);
  }
  .vp-msg-bubble.assistant {
    background: #FFFFFF;
    color: #1A1626;
    border-radius: 20px 20px 20px 4px;
    border: 1px solid #E8E4F8;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    line-height: 1.75;
  }
  .vp-thinking {
    background: #FFFFFF;
    color: #9B98B0;
    border: 1px solid #E8E4F8;
    border-radius: 20px 20px 20px 4px;
    padding: 10px 18px;
    font-size: 20px;
    letter-spacing: 3px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    animation: thinkPulse 1.4s ease-in-out infinite;
  }

  /* ── Input area ── */
  .vp-input-area {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 680px;
    background: #FFFFFF;
    border-top: 1px solid #E8E4F8;
    padding: 12px 16px 20px;
    box-sizing: border-box;
    z-index: 100;
  }
  .vp-input-row {
    display: flex;
    align-items: flex-end;
    gap: 10px;
    background: #F8F7FF;
    border: 1.5px solid #E8E4F8;
    border-radius: 20px;
    padding: 10px 10px 10px 18px;
    box-shadow: 0 1px 4px rgba(107,92,231,0.06);
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .vp-input-row:focus-within {
    border-color: #6B5CE7;
    box-shadow: 0 0 0 3px rgba(107,92,231,0.08);
  }
  .vp-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    color: #1A1626;
    resize: none;
    line-height: 1.5;
    max-height: 120px;
    overflow-y: auto;
    padding: 0;
  }
  .vp-input::placeholder { color: #9B98B0; }
  .vp-send {
    width: 38px;
    height: 38px;
    border-radius: 12px;
    background: #6B5CE7;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.15s, transform 0.1s;
    color: #fff;
  }
  .vp-send:hover:not(:disabled) { background: #4A3DB5; }
  .vp-send:active:not(:disabled) { transform: scale(0.90); }
  .vp-send:disabled { opacity: 0.38; cursor: default; }
  .vp-footer {
    font-size: 10px;
    color: #D1D5DB;
    text-align: center;
    padding-top: 8px;
    letter-spacing: 0.02em;
  }
`;

/* Header height offset so chat doesn't hide under fixed header */
const HEADER_HEIGHT = 278;

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
      {isUser ? (
        <div className="vp-msg-bubble user">
          {msg.content}
        </div>
      ) : (
        <div className="vp-msg-row">
          <div className="vp-msg-avatar">VC</div>
          <div>
            {msg.content === '' ? (
              <div className="vp-thinking">…</div>
            ) : (
              <div className="vp-msg-bubble assistant">
                {msg.content.split('\n\n').map((para, pi) => (
                  <p key={pi} style={{ margin: 0, marginBottom: pi < msg.content.split('\n\n').length - 1 ? '12px' : 0 }}>
                    {para.split('\n').map((line, li, arr) => (
                      <span key={li}>{line}{li < arr.length - 1 && <br />}</span>
                    ))}
                  </p>
                ))}
              </div>
            )}
          </div>
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

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const randDelay = () => 10 + Math.random() * 20; // 10–30ms

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
                await sleep(randDelay());
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

        {/* Fixed hero header */}
        <div className="vp-header">
          <div className="vp-brand">Astralink</div>
          <div className="vp-avatar-hero">VC</div>
          <div className="vp-name">Vint Cerf</div>
          <div className="vp-subtitle">An attempt to preserve how he thinks.</div>
          <div className="vp-header-call">
            <VintCall
              messages={messages}
              onNewExchange={(userText, vintText) =>
                setMessages(prev => [
                  ...prev,
                  { role: 'user', content: userText },
                  { role: 'assistant', content: vintText },
                ])
              }
            />
          </div>
          <div className="vp-badge">Private experimental prototype — not for public release</div>
        </div>

        {/* Spacer for fixed header */}
        <div style={{ height: HEADER_HEIGHT }} />

        {/* Chat area */}
        <div className="vp-chat">
          {messages.length === 0 ? (
            <div className="vp-empty">
              <div className="vp-empty-icon">VC</div>
              <div className="vp-empty-heading">Ask something.</div>
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
          <div className="vp-footer">AstraLink — astralink.life</div>
        </div>

      </div>
    </div>
  );
}
