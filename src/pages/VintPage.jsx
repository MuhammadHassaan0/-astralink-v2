import React, { useState, useRef, useEffect } from 'react';
import { flushSync } from 'react-dom';

const API = 'https://astralink-v2-production.up.railway.app';

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@700;800&family=Inter:wght@400;500&display=swap');

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes headerFade {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes dotPulse {
    0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
    40%           { opacity: 1;   transform: scale(1); }
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #FFFFFF;
    font-family: 'Inter', sans-serif;
  }

  .vint-root {
    min-height: 100vh;
    background: #FFFFFF;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
  }

  .vint-root::before {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    opacity: 0.022;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
    background-repeat: repeat;
    background-size: 200px 200px;
  }

  .vint-inner {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 760px;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    padding: 0 24px;
  }

  /* Header */
  .vint-header {
    padding-top: 56px;
    padding-bottom: 0;
    text-align: center;
    animation: headerFade 0.6s ease forwards;
  }

  .vint-brand {
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.3em;
    color: #6366F1;
    text-transform: uppercase;
    margin-bottom: 20px;
  }

  .vint-name {
    font-family: 'Manrope', sans-serif;
    font-size: 42px;
    font-weight: 800;
    color: #111827;
    line-height: 1.1;
    letter-spacing: -0.02em;
    margin-bottom: 12px;
  }

  .vint-subtitle {
    font-family: 'Inter', sans-serif;
    font-size: 16px;
    font-weight: 400;
    color: #9CA3AF;
    font-style: italic;
    margin-bottom: 24px;
  }

  .vint-divider {
    width: 60px;
    height: 1px;
    background: #C49A2A;
    margin: 0 auto 28px auto;
  }

  /* Disclaimer */
  .vint-disclaimer {
    background: #FDF8F0;
    border-left: 3px solid #C49A2A;
    border-radius: 4px;
    padding: 12px 16px;
    margin-bottom: 36px;
    text-align: left;
  }

  .vint-disclaimer p {
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    font-weight: 400;
    color: #92400E;
    font-style: italic;
    line-height: 1.7;
  }

  /* Messages */
  .vint-messages {
    flex: 1;
    overflow-y: auto;
    padding-bottom: 130px;
  }

  .vint-message-row {
    display: flex;
    margin-bottom: 20px;
    animation: fadeUp 0.3s ease forwards;
    opacity: 0;
  }

  .vint-message-row.user { justify-content: flex-end; }
  .vint-message-row.assistant { justify-content: flex-start; }

  .vint-bubble {
    word-break: break-word;
    white-space: pre-wrap;
  }

  .vint-bubble.user {
    background: #6366F1;
    color: #FFFFFF;
    border-radius: 18px 18px 4px 18px;
    max-width: 70%;
    padding: 14px 18px;
    font-family: 'Inter', sans-serif;
    font-size: 15px;
    font-weight: 400;
    line-height: 1.6;
  }

  .vint-bubble.assistant {
    background: #FFFFFF;
    color: #1F2937;
    border: 1px solid #E5E7EB;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    border-radius: 18px 18px 18px 4px;
    max-width: 75%;
    padding: 16px 20px;
    font-family: 'Inter', sans-serif;
    font-size: 15px;
    font-weight: 400;
    line-height: 1.8;
  }

  /* Thinking dots */
  .vint-dots {
    display: flex;
    gap: 5px;
    align-items: center;
    padding: 4px 0;
  }

  .vint-dots span {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #6366F1;
    display: inline-block;
    animation: dotPulse 1.4s ease-in-out infinite;
  }

  .vint-dots span:nth-child(2) { animation-delay: 0.2s; }
  .vint-dots span:nth-child(3) { animation-delay: 0.4s; }

  /* Empty state */
  .vint-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 64px 0 48px 0;
    gap: 12px;
  }

  .vint-monogram {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: #F5F3FF;
    border: 1px solid #E0E7FF;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Manrope', sans-serif;
    font-size: 16px;
    font-weight: 800;
    color: #6366F1;
    margin-bottom: 4px;
  }

  .vint-empty-label {
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 400;
    color: #9CA3AF;
    font-style: italic;
  }

  .vint-empty-meta {
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    font-weight: 400;
    color: #D1D5DB;
    letter-spacing: 0.03em;
  }

  /* Input area */
  .vint-input-area {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 760px;
    padding: 16px 24px 24px 24px;
    background: #FFFFFF;
    border-top: 1px solid #F3F4F6;
  }

  .vint-input-row {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .vint-input {
    flex: 1;
    border: 1px solid #E5E7EB;
    border-radius: 9999px;
    padding: 14px 20px;
    font-family: 'Inter', sans-serif;
    font-size: 15px;
    font-weight: 400;
    color: #111827;
    background: #FFFFFF;
    outline: none;
    resize: none;
    line-height: 1.5;
    max-height: 120px;
    overflow-y: auto;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .vint-input::placeholder { color: #9CA3AF; }

  .vint-input:focus {
    border-color: #6366F1;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
  }

  .vint-send {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #6366F1;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.15s ease, opacity 0.15s ease;
  }

  .vint-send:hover:not(:disabled) { background: #4F46E5; }
  .vint-send:disabled { opacity: 0.4; cursor: default; }

  /* Footer */
  .vint-footer {
    text-align: center;
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    color: #D1D5DB;
    padding-top: 10px;
    padding-bottom: 0;
    letter-spacing: 0.02em;
  }
`;

function ThinkingDots() {
  return (
    <div className="vint-dots">
      <span /><span /><span />
    </div>
  );
}

function Message({ msg, index }) {
  const isUser = msg.role === 'user';
  return (
    <div
      className={`vint-message-row ${isUser ? 'user' : 'assistant'}`}
      style={{ animationDelay: `${Math.min(index * 0.03, 0.15)}s` }}
    >
      <div className={`vint-bubble ${isUser ? 'user' : 'assistant'}`}>
        {msg.content === '' && !isUser ? <ThinkingDots /> : msg.content}
      </div>
    </div>
  );
}

export default function VintPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = GLOBAL_STYLES;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
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
    <div className="vint-root">
      <div className="vint-inner">

        {/* Header */}
        <div className="vint-header">
          <div className="vint-brand">ASTRALINK</div>
          <h1 className="vint-name">Vint Cerf</h1>
          <p className="vint-subtitle">An attempt to preserve how he thinks.</p>
          <div className="vint-divider" />
          <div className="vint-disclaimer">
            <p>
              Private experimental prototype — not for public release. Built from public interviews,
              talks, and writings only. Not for distribution.
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="vint-messages">
          {messages.length === 0 && (
            <div className="vint-empty">
              <div className="vint-monogram">VC</div>
            </div>
          )}
          {messages.map((msg, i) => (
            <Message key={i} msg={msg} index={i} />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="vint-input-area">
          <div className="vint-input-row">
            <textarea
              ref={inputRef}
              className="vint-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything…"
              rows={1}
              onInput={e => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
            />
            <button
              className="vint-send"
              onClick={sendMessage}
              disabled={!input.trim() || streaming}
            >
              {streaming ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" opacity="0.3"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="2" strokeLinecap="round">
                    <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/>
                  </path>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              )}
            </button>
          </div>
          <p className="vint-footer">Built by AstraLink — astralink.life</p>
        </div>

      </div>
    </div>
  );
}
