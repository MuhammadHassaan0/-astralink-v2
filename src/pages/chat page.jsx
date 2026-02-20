import React, { useState, useEffect, useRef } from 'react';

const customStyles = {
  root: {
    '--primary': '#6366F1',
    '--primary-hover': '#4F46E5',
    '--bg-page': '#FFFFFF',
    '--bg-twin': '#F8F8F8',
    '--text-main': '#1A120B',
    '--text-muted': '#8D8D8D',
    '--border-light': '#EFEFEF',
    '--shadow-soft': '0 8px 24px rgba(0, 0, 0, 0.04)',
    '--shadow-float': '0 12px 32px rgba(99, 102, 241, 0.15)',
    '--success': '#10B981',
    '--error': '#EF4444',
    '--radius-bubble': '20px',
    '--radius-pill': '999px',
    '--radius-card': '24px'
  }
};

const Header = () => {
  return (
    <header className="flex items-center justify-between h-20 px-10 bg-white/90 backdrop-blur-[10px] border-b border-[var(--border-light)] z-10 flex-shrink-0">
      <div className="flex items-center gap-3 font-semibold text-lg text-[var(--text-main)]">
        <div className="w-8 h-8 bg-[var(--primary)] rounded-lg flex items-center justify-center text-white">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
          </svg>
        </div>
        <span>AstraLink</span>
      </div>

      <div style={{display:'flex', gap:'8px'}}>
        <button onClick={() => window.location.href = '/progress'} style={{background:'none', border:'1px solid #e5e7eb', borderRadius:'999px', padding:'8px 16px', fontSize:'13px', fontWeight:600, cursor:'pointer', color:'#6b7280'}}>
          ← Dashboard
        </button>
        <button onClick={() => window.location.href = '/family'} style={{background:'#6366F1', border:'none', borderRadius:'999px', padding:'8px 16px', fontSize:'13px', fontWeight:600, cursor:'pointer', color:'white'}}>
          Family Sharing →
        </button>
      </div>

      <div className="flex flex-col items-center">
        <div className="relative mb-1">
          <div className="w-9 h-9 bg-[var(--primary)] text-white rounded-full flex items-center justify-center text-sm font-medium">
            {(localStorage.getItem('userName') || 'U')[0].toUpperCase()}
          </div>
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[var(--success)] border-2 border-white rounded-full"></div>
        </div>
        <div className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
          {localStorage.getItem('userName') || 'You'} <span className="text-[var(--success)] font-medium">● Online</span>
        </div>
      </div>

      <button className="w-10 h-10 rounded-full border border-[var(--border-light)] bg-white flex items-center justify-center cursor-pointer text-[var(--text-muted)] transition-all duration-200 hover:text-[var(--primary)] hover:border-[var(--primary)]" aria-label="Settings">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      </button>
    </header>
  );
};

const FeedbackButtons = ({ messageId, feedback, onFeedback }) => {
  if (feedback) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
        <span style={{
          fontSize: '12px', fontWeight: 600, padding: '4px 12px', borderRadius: '999px',
          background: feedback === 'positive' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
          color: feedback === 'positive' ? '#10b981' : '#ef4444',
          transition: 'all 0.3s'
        }}>
          {feedback === 'positive' ? '👍 Got it, training your twin!' : '👎 Got it, won&apos;t do that again!'}
        </span>
      </div>
    );
  }

  return (
    <div className="flex gap-3 mt-1 opacity-0 -translate-y-1 animate-[slideIn_0.3s_ease-out_0.2s_forwards]">
      <button 
        onClick={() => onFeedback(messageId, 'positive')}
        className="bg-transparent border border-[rgba(16,185,129,0.3)] rounded-[var(--radius-pill)] py-1.5 px-3.5 text-xs font-medium cursor-pointer flex items-center gap-1.5 transition-all duration-200 text-[var(--success)] hover:bg-[rgba(16,185,129,0.15)] hover:border-[var(--success)]"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
        </svg>
        Sounds like me
      </button>
      <button 
        onClick={() => onFeedback(messageId, 'negative')}
        className="bg-transparent border border-[rgba(239,68,68,0.3)] rounded-[var(--radius-pill)] py-1.5 px-3.5 text-xs font-medium cursor-pointer flex items-center gap-1.5 transition-all duration-200 text-[var(--error)] hover:bg-[rgba(239,68,68,0.15)] hover:border-[var(--error)]"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
        </svg>
        Doesn't sound like me
      </button>
    </div>
  );
};

const MessageBubble = ({ message, onFeedback }) => {
  const isUser = message.type === 'user';
  const isTwin = message.type === 'twin';
  const isTyping = message.isTyping;

  return (
    <div className={`flex flex-col gap-2 max-w-[60%] animate-[fadeIn_0.4s_ease-out_forwards] ${
      isUser ? 'self-end items-end' : 'self-start items-start'
    }`}>
      <div className={`py-4 px-6 rounded-[var(--radius-bubble)] text-[15px] leading-[1.5] relative ${
        isUser 
          ? 'bg-[var(--primary)] text-white rounded-br-[4px] shadow-[var(--shadow-float)]' 
          : isTyping
            ? 'bg-[var(--bg-twin)] text-[var(--text-muted)] rounded-bl-[4px] shadow-[var(--shadow-soft)] border border-[rgba(0,0,0,0.02)]'
            : 'bg-[var(--bg-twin)] text-[var(--text-main)] rounded-bl-[4px] shadow-[var(--shadow-soft)] border border-[rgba(0,0,0,0.02)]'
      }`}>
        {isTyping ? (
          <span className="text-2xl leading-[0]">•••</span>
        ) : (
          message.text
        )}
      </div>
      {isTwin && !isTyping && (
        <FeedbackButtons messageId={message.id} feedback={message.feedback} onFeedback={onFeedback} />
      )}
    </div>
  );
};

const ChatArea = ({ messages, onFeedback }) => {
  const chatAreaRef = useRef(null);

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <main 
      ref={chatAreaRef}
      className="flex-1 overflow-y-auto py-10 px-10 flex flex-col gap-8 max-w-[900px] w-full mx-auto"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#E5E7EB transparent'
      }}
    >
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} onFeedback={onFeedback} />
      ))}
    </main>
  );
};

const InputArea = ({ onSendMessage }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <footer className="bg-white py-6 px-10 pb-8 border-t border-[var(--border-light)] flex items-center justify-center z-10">
      <form onSubmit={handleSubmit} className="max-w-[800px] w-full relative flex items-center gap-4">
        <input 
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 h-14 bg-[#F8F8F8] border border-transparent rounded-[var(--radius-pill)] px-6 text-base font-[inherit] text-[var(--text-main)] transition-all duration-200 focus:outline-none focus:bg-white focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]"
          placeholder="Ask anything..."
          aria-label="Message input"
        />
        <button 
          type="submit"
          className="w-14 h-14 rounded-full bg-[var(--primary)] text-white border-none cursor-pointer flex items-center justify-center transition-transform duration-200 hover:scale-105 hover:bg-[var(--primary-hover)]"
          aria-label="Send message"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-0.5">
            <line x1="12" y1="19" x2="12" y2="5"></line>
            <polyline points="5 12 12 5 19 12"></polyline>
          </svg>
        </button>
      </form>
    </footer>
  );
};

const ChatPage = () => {
  const [messages, setMessages] = useState([
    { id: 1, type: 'twin', text: "Hey, what's on your mind?", feedback: null }
  ]);

  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
      
      * {
        -webkit-font-smoothing: antialiased;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes slideIn {
        from { opacity: 0; transform: translateY(-5px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      main::-webkit-scrollbar {
        width: 6px;
      }
      main::-webkit-scrollbar-track {
        background: transparent;
      }
      main::-webkit-scrollbar-thumb {
        background: #E5E7EB;
        border-radius: 10px;
      }
    `;
    document.head.appendChild(styleSheet);
    return () => document.head.removeChild(styleSheet);
  }, []);

  const handleSendMessage = async (text) => {
    const newUserMessage = { id: Date.now(), type: 'user', text };
    const updatedMessages = [...messages.filter(m => !m.isTyping), newUserMessage];
    setMessages(updatedMessages);

    const typingMessage = { id: Date.now() + 1, type: 'twin', isTyping: true, text: '' };
    setMessages(prev => [...prev, typingMessage]);

    const payload = updatedMessages.map(m => ({ role: m.type === 'user' ? 'user' : 'assistant', content: m.text }));

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('https://astralink-v2-production.up.railway.app/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ messages: payload })
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = '';
      const twinId = Date.now() + 2;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
        for (const line of lines) {
          const data = line.replace('data: ', '');
          if (data === '[DONE]') break;
          try {
            const { text: t } = JSON.parse(data);
            full += t;
            setMessages(prev => {
              const filtered = prev.filter(m => !m.isTyping);
              const existing = filtered.find(m => m.id === twinId);
              if (existing) return filtered.map(m => m.id === twinId ? { ...m, text: full } : m);
              return [...filtered, { id: twinId, type: 'twin', text: full, feedback: null }];
            });
          } catch {}
        }
      }
    } catch (err) {
      setMessages(prev => [...prev.filter(m => !m.isTyping), { id: Date.now(), type: 'twin', text: 'Error connecting to backend.', feedback: null }]);
    }
  };

  const handleFeedback = async (messageId, feedbackType) => {
    setMessages(prev => {
      const msg = prev.find(m => m.id === messageId);
      if (msg) {
        const token = localStorage.getItem('token');
        fetch('https://astralink-v2-production.up.railway.app/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify({ response: msg.text, rating: feedbackType })
        }).then(r => r.json()).then(d => console.log('feedback saved', d)).catch(e => console.error('feedback error', e));
      }
      return prev.map(m => m.id === messageId ? { ...m, feedback: feedbackType } : m);
    });
  };

  return (
    <div 
      className="font-['Inter',sans-serif] bg-[var(--bg-page)] text-[var(--text-main)] h-screen overflow-hidden flex flex-col"
      style={customStyles.root}
    >
      <Header />
      <ChatArea messages={messages} onFeedback={handleFeedback} />
      <InputArea onSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatPage;