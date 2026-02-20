import React, { useState } from 'react';

const questions = [
  "What's a decision you're proud of?",
  "How do you want to be remembered?",
  "What drives you forward?",
  "What's the most important lesson you've learned?",
  "What would you tell your younger self?"
];

export default function QAPage() {
  const [current, setCurrent] = useState(0);
  const [answer, setAnswer] = useState('');
  const [saved, setSaved] = useState([]);
  const [done, setDone] = useState(false);

  const saveAndContinue = async () => {
    if (!answer.trim()) return;
    
    await fetch('https://astralink-v2-production.up.railway.app/qa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 1, question: questions[current], answer })
    });

    setSaved([...saved, { q: questions[current], a: answer }]);
    setAnswer('');

    if (current + 1 >= questions.length) {
      setDone(true);
    } else {
      setCurrent(current + 1);
    }
  };

  if (done) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Inter, sans-serif', background: '#f9fafb' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
      <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#1f2937' }}>Your answers are saved</h2>
      <p style={{ color: '#6b7280', marginBottom: '32px' }}>Your digital twin is learning from you.</p>
      <button onClick={() => window.location.href = '/chat'} style={{ background: '#6366F1', color: '#fff', border: 'none', borderRadius: '999px', padding: '16px 40px', fontSize: '16px', fontWeight: 600, cursor: 'pointer' }}>
        Talk to Your Digital Twin →
      </button>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'Inter, sans-serif', background: '#f9fafb', padding: '40px' }}>
      <div style={{ width: '100%', maxWidth: '600px' }}>
        <div style={{ marginBottom: '12px', color: '#6366F1', fontWeight: 600, fontSize: '14px' }}>
          QUESTION {current + 1} OF {questions.length}
        </div>
        <div style={{ height: '4px', background: '#e5e7eb', borderRadius: '999px', marginBottom: '40px' }}>
          <div style={{ height: '4px', background: '#6366F1', borderRadius: '999px', width: `${((current) / questions.length) * 100}%`, transition: 'width 0.3s' }} />
        </div>
        <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#1f2937', marginBottom: '24px' }}>{questions[current]}</h2>
        <textarea
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          placeholder="Write your answer here..."
          rows={6}
          style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '16px', fontFamily: 'Inter, sans-serif', resize: 'none', outline: 'none', boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          <button onClick={saveAndContinue} disabled={!answer.trim()} style={{ flex: 1, background: '#6366F1', color: '#fff', border: 'none', borderRadius: '999px', padding: '16px', fontSize: '16px', fontWeight: 600, cursor: answer.trim() ? 'pointer' : 'not-allowed', opacity: answer.trim() ? 1 : 0.5 }}>
            Save & Continue →
          </button>
          <button onClick={() => { setAnswer(''); current + 1 >= questions.length ? setDone(true) : setCurrent(current + 1); }} style={{ background: '#fff', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '999px', padding: '16px 24px', fontSize: '16px', cursor: 'pointer' }}>
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
