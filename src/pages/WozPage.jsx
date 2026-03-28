import React, { useState, useRef, useEffect } from 'react';

const API = 'https://astralink-v2-production.up.railway.app';

const fadeInKeyframes = `
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
`;

function Message({ msg, index }) {
  const isUser = msg.role === 'user';
  return (
    <div
      key={index}
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '18px',
        animation: 'fadeSlideIn 0.35s ease forwards',
        opacity: 0,
        animationDelay: `${Math.min(index * 0.04, 0.2)}s`,
      }}
    >
      <div
        style={{
          maxWidth: '72%',
          padding: isUser ? '12px 18px' : '16px 22px',
          borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          background: isUser ? '#312E81' : '#ffffff',
          color: isUser ? '#ffffff' : '#1a1a2e',
          boxShadow: isUser
            ? '0 2px 12px rgba(49,46,129,0.18)'
            : '0 2px 16px rgba(0,0,0,0.07)',
          border: isUser ? 'none' : '1px solid #ede9e1',
          fontSize: isUser ? '15px' : '15.5px',
          lineHeight: isUser ? '1.5' : '1.85',
          fontFamily: "'Manrope', 'Georgia', serif",
          fontWeight: isUser ? '500' : '400',
          letterSpacing: isUser ? '0' : '0.01em',
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
        }}
      >
        {msg.content}
        {msg.role === 'assistant' && msg.content === '' && (
          <span style={{ opacity: 0.4, fontStyle: 'italic', fontSize: '13px' }}>thinking…</span>
        )}
      </div>
    </div>
  );
}

export default function WozPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    const style = document.createElement('style');
    style.textContent = fadeInKeyframes;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(link);
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

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#ffffff',
        fontFamily: "'Manrope', 'Georgia', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '760px',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          padding: '0 24px',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <div style={{ paddingTop: '52px', paddingBottom: '0', textAlign: 'center' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: '600',
              letterSpacing: '0.25em',
              color: '#4338ca',
              textTransform: 'uppercase',
              marginBottom: '18px',
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            ASTRALINK
          </div>

          <h1
            style={{
              fontSize: '52px',
              fontWeight: '800',
              color: '#0f0e1a',
              margin: '0 0 14px 0',
              fontFamily: "'Manrope', sans-serif",
              lineHeight: '1.1',
              letterSpacing: '-0.02em',
            }}
          >
            Woz
          </h1>

          <p
            style={{
              fontSize: '16px',
              fontWeight: '300',
              color: '#a0a0a8',
              margin: '0 0 28px 0',
              fontFamily: "'Manrope', sans-serif",
              letterSpacing: '0.01em',
            }}
          >
            An attempt to preserve how Woz thinks.
          </p>

          {/* Gold divider */}
          <div
            style={{
              width: '48px',
              height: '1px',
              background: '#C49A2A',
              margin: '0 auto 28px auto',
            }}
          />

          {/* Disclaimer */}
          <div
            style={{
              background: '#fdf8f0',
              border: '1px solid #ede5d0',
              borderRadius: '10px',
              padding: '14px 20px',
              marginBottom: '36px',
              textAlign: 'left',
            }}
          >
            <p
              style={{
                fontSize: '12.5px',
                color: '#8b7d65',
                margin: 0,
                lineHeight: '1.7',
                fontFamily: "'Manrope', sans-serif",
                fontWeight: '400',
              }}
            >
              Private experimental prototype — not for public release. Built from public interviews,
              talks, and writings only. Not for distribution.
            </p>
          </div>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            paddingBottom: '120px',
          }}
        >
          {messages.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '48px 0',
                color: '#c8c4bc',
                fontSize: '14px',
                fontStyle: 'italic',
                fontFamily: "'Manrope', sans-serif",
                fontWeight: '300',
              }}
            >
              Begin the conversation.
            </div>
          )}
          {messages.map((msg, i) => (
            <Message key={i} msg={msg} index={i} />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input area — fixed to bottom of container */}
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            maxWidth: '760px',
            padding: '16px 24px 28px 24px',
            background: 'linear-gradient(to top, #ffffff 70%, rgba(255,255,255,0))',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-end',
              background: '#ffffff',
              border: '1px solid #e2ddd6',
              borderRadius: '16px',
              padding: '10px 10px 10px 18px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything…"
              rows={1}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                resize: 'none',
                fontSize: '15px',
                fontFamily: "'Manrope', sans-serif",
                fontWeight: '400',
                color: '#1a1a2e',
                background: 'transparent',
                lineHeight: '1.6',
                maxHeight: '120px',
                overflowY: 'auto',
              }}
              onInput={e => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || streaming}
              style={{
                background: input.trim() && !streaming ? '#312E81' : '#d4d0e8',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                width: '40px',
                height: '40px',
                cursor: input.trim() && !streaming ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.2s ease',
              }}
            >
              {streaming ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" opacity="0.3"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="2" strokeLinecap="round">
                    <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/>
                  </path>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              )}
            </button>
          </div>

          {/* Footer */}
          <p
            style={{
              textAlign: 'center',
              fontSize: '11px',
              color: '#d4cfc8',
              margin: '10px 0 0 0',
              fontFamily: "'Manrope', sans-serif",
              fontWeight: '400',
              letterSpacing: '0.02em',
            }}
          >
            Built by AstraLink — astralink.life
          </p>
        </div>
      </div>
    </div>
  );
}
