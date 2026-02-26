import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';

export default function PublicTwinPage() {
  const { slug } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    setMessages([{ role: 'assistant', content: `Hey, I'm ${slug}. What's on your mind?` }]);
    setName(slug.charAt(0).toUpperCase() + slug.slice(1));
  }, [slug]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    const assistantMsg = { role: 'assistant', content: '' };
    setMessages([...newMessages, assistantMsg]);

    try {
      const res = await fetch(`https://astralink-v2-production.up.railway.app/public-chat/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages.map(m => ({ role: m.role, content: m.content })) })
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
        for (const line of lines) {
          const data = line.replace('data: ', '');
          if (data === '[DONE]') break;
          try {
            const { text } = JSON.parse(data);
            full += text;
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: 'assistant', content: full };
              return updated;
            });
          } catch(e) {}
        }
      }
    } catch(e) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: 'Something went wrong. Try again.' };
        return updated;
      });
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#fff', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '18px' }}>
            {name.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: '#1f2937' }}>{name} — Digital Twin</div>
            <div style={{ fontSize: '12px', color: '#10b981' }}>● Online</div>
          </div>
        </div>
        <div style={{ fontSize: '12px', color: '#9ca3af' }}>Powered by <span style={{ color: '#6366F1', fontWeight: 600 }}>AstraLink</span></div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '70%', padding: '12px 16px', borderRadius: '18px',
              background: msg.role === 'user' ? '#6366F1' : '#f3f4f6',
              color: msg.role === 'user' ? '#fff' : '#1f2937',
              fontSize: '15px', lineHeight: '1.6'
            }}>
              {msg.content || <span style={{ opacity: 0.5 }}>Thinking...</span>}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ background: '#fff', borderTop: '1px solid #e5e7eb', padding: '16px 24px', display: 'flex', gap: '12px' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder={`Ask ${name} anything...`}
          style={{ flex: 1, padding: '12px 16px', borderRadius: '999px', border: '1px solid #e5e7eb', fontSize: '15px', outline: 'none', fontFamily: 'Inter, sans-serif' }}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          style={{ background: '#6366F1', color: '#fff', border: 'none', borderRadius: '999px', padding: '12px 24px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
