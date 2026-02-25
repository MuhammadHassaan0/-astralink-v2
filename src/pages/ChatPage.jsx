import React, { useState, useRef, useEffect } from 'react';

export default function ChatPage() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi, I'm your digital twin. Ask me anything — about my values, decisions, or what I'd do in your situation." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const [chatRecording, setChatRecording] = useState(false);
  const chatMediaRecorderRef = useRef(null);
  const chatAudioChunksRef = useRef([]);

  const toggleChatVoice = async () => {
    if (!chatRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        chatMediaRecorderRef.current = mediaRecorder;
        chatAudioChunksRef.current = [];
        mediaRecorder.ondataavailable = (e) => chatAudioChunksRef.current.push(e.data);
        mediaRecorder.start();
        setChatRecording(true);
      } catch(err) {
        alert('Microphone access denied.');
      }
    } else {
      chatMediaRecorderRef.current.stop();
      chatMediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      setChatRecording(false);
      const blob = new Blob(chatAudioChunksRef.current, { type: 'audio/webm' });
      if (blob.size === 0) return;
      const formData = new FormData();
      formData.append('audio', blob, 'chat.webm');
      const token = localStorage.getItem('token');
      try {
        const res = await fetch('https://astralink-v2-production.up.railway.app/transcribe', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + token },
          body: formData
        });
        const data = await res.json();
        if (data.success) setInput(data.transcription);
      } catch(e) { console.error(e); }
    }
  };

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
      const res = await fetch('https://astralink-v2-production.up.railway.app/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
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
          } catch {}
        }
      }
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: 'Error connecting to backend. Make sure the server is running.' };
        return updated;
      });
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f9fafb', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>A</div>
        <div>
          <div style={{ fontWeight: 600, color: '#1f2937' }}>Your Digital Twin</div>
          <div style={{ fontSize: '12px', color: '#10b981' }}>● Online</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '70%', padding: '12px 16px', borderRadius: '18px',
              background: msg.role === 'user' ? '#6366F1' : '#fff',
              color: msg.role === 'user' ? '#fff' : '#1f2937',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
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
          placeholder="Ask your digital twin anything..."
          style={{ flex: 1, padding: '12px 16px', borderRadius: '999px', border: '1px solid #e5e7eb', fontSize: '15px', outline: 'none', fontFamily: 'Inter, sans-serif' }}
        />
        <button
          onClick={toggleChatVoice}
          style={{ background: chatRecording ? '#EF4444' : '#F3F4F6', color: chatRecording ? '#fff' : '#6366F1', border: 'none', borderRadius: '999px', padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
        </button>
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
