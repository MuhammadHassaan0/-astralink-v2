import React, { useState, useEffect, useRef } from 'react';

const App = () => {
  const [activeTab, setActiveTab] = useState('voice');
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [showPostRecordActions, setShowPostRecordActions] = useState(false);
  const questions = [
    "What's a decision you're proud of?",
    "How do you want to be remembered?",
    "What drives you forward?",
    "What's the most important lesson you've learned?",
    "What would you tell your younger self?"
  ];
  const [currentQ, setCurrentQ] = useState(0);
  const [qAnswer, setQAnswer] = useState('');
  const [qDone, setQDone] = useState(false);
  const [qRecording, setQRecording] = useState(false);
  const [qSeconds, setQSeconds] = useState(0);
  const qMediaRecorderRef = useRef(null);
  const qAudioChunksRef = useRef([]);
  const qTimerRef = useRef(null);

  const toggleQRecord = async () => {
    if (!qRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        qMediaRecorderRef.current = mediaRecorder;
        qAudioChunksRef.current = [];
        mediaRecorder.ondataavailable = (e) => qAudioChunksRef.current.push(e.data);
        mediaRecorder.start();
        setQRecording(true);
        setQSeconds(0);
        qTimerRef.current = setInterval(() => setQSeconds(prev => prev + 1), 1000);
      } catch(err) {
        alert('Microphone access denied.');
      }
    } else {
      qMediaRecorderRef.current.stop();
      qMediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      setQRecording(false);
      clearInterval(qTimerRef.current);
      // Transcribe and save
      const blob = new Blob(qAudioChunksRef.current, { type: 'audio/webm' });
      if (blob.size === 0) { alert('No audio captured.'); return; }
      const formData = new FormData();
      formData.append('audio', blob, 'answer.webm');
      const token = localStorage.getItem('token');
      try {
        const res = await fetch('https://astralink-v2-production.up.railway.app/transcribe', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + token },
          body: formData
        });
        const data = await res.json();
        if (data.success) {
          setQAnswer(data.transcription);
        } else {
          alert('Transcription failed');
        }
      } catch(e) { alert('Error: ' + e.message); }
    }
  };
  const timerIntervalRef = useRef(null);
  const [stats, setStats] = useState({ voices: 0, documents: 0, questions: 0, days: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('https://astralink-v2-production.up.railway.app/export', {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        const voices = data.voice?.length || 0;
        const documents = data.documents?.length || 0;
        const questions = data.qa?.length || 0;
        // Calculate days active from first entry
        const allDates = [
          ...(data.voice || []),
          ...(data.documents || []),
          ...(data.qa || [])
        ].map(e => new Date(e.created_at)).filter(Boolean);
        let days = 0;
        if (allDates.length > 0) {
          const first = Math.min(...allDates);
          days = Math.max(1, Math.ceil((Date.now() - first) / (1000 * 60 * 60 * 24)));
        }
        setStats({ voices, documents, questions, days });
      } catch(e) { console.error('stats fetch failed', e); }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
      
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes scaleIn {
        from {
          opacity: 0;
          transform: scale(0.9);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      @keyframes slideInRight {
        from {
          opacity: 0;
          transform: translateX(30px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      @keyframes pulse {
        0% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
        100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
      }

      @keyframes blink {
        50% { opacity: 0.4; }
      }

      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      body {
        font-family: 'Inter', sans-serif;
        background-color: #FFFFFF;
        color: #111111;
        -webkit-font-smoothing: antialiased;
        overflow-x: hidden;
      }
    `;
    document.head.appendChild(style);
    
    const progressBar = document.querySelector('.progress-bar-fill');
    if (progressBar) {
      setTimeout(() => {
        progressBar.style.width = '50%';
      }, 500);
    }

    return () => {
      document.head.removeChild(style);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  const mediaRecorderRef = React.useRef(null);
  const audioChunksRef = React.useRef([]);

  const toggleRecord = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
        mediaRecorder.start();
        setIsRecording(true);
        setSeconds(0);
        timerIntervalRef.current = setInterval(() => {
          setSeconds(prev => prev + 1);
        }, 1000);
      } catch (err) {
        alert('Microphone access denied. Please allow microphone access.');
      }
    } else {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setShowPostRecordActions(true);
    }
  };

  const resetRecord = () => {
    setShowPostRecordActions(false);
    setSeconds(0);
  };

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const styles = {
    appContainer: {
      display: 'grid',
      gridTemplateRows: '72px 1fr',
      minHeight: '100vh'
    },
    header: {
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid #E5E7EB',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      animation: 'fadeIn 0.6s ease-out'
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    },
    headerRight: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    },
    logo: {
      fontWeight: 800,
      fontSize: '18px',
      color: '#6366F1',
      letterSpacing: '-0.5px',
      textDecoration: 'none',
      cursor: 'pointer'
    },
    pageIndicator: {
      fontSize: '14px',
      color: '#666666',
      fontWeight: 500,
      background: '#F9FAFB',
      padding: '6px 12px',
      borderRadius: '9999px'
    },
    userAvatar: {
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      background: '#6366F1',
      cursor: 'pointer',
      border: '2px solid white',
      boxShadow: '0 2px 8px rgba(99, 102, 241, 0.2)',
      transition: 'transform 0.3s ease'
    },
    mainContent: {
      display: 'grid',
      gridTemplateColumns: '1.4fr 0.8fr',
      gap: '40px',
      padding: '40px 32px',
      maxWidth: '1200px',
      margin: '0 auto',
      width: '100%'
    },
    card: {
      background: '#FFFFFF',
      borderRadius: '24px',
      padding: '40px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      border: '1px solid #E5E7EB',
      position: 'relative',
      overflow: 'hidden',
      animation: 'fadeInUp 0.8s ease-out'
    },
    tabsContainer: {
      display: 'inline-flex',
      background: '#F3F4F6',
      padding: '4px',
      borderRadius: '9999px',
      marginBottom: '32px',
      animation: 'fadeIn 0.6s ease-out 0.2s both'
    },
    tab: {
      padding: '10px 24px',
      borderRadius: '9999px',
      fontSize: '14px',
      fontWeight: 600,
      color: '#666666',
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    },
    tabActive: {
      background: '#6366F1',
      color: 'white',
      boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)'
    },
    voiceInterface: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      padding: '20px 0'
    },
    h2: {
      fontSize: '24px',
      fontWeight: 700,
      color: '#111111',
      marginBottom: '8px',
      letterSpacing: '-0.5px',
      animation: 'fadeInUp 0.6s ease-out 0.3s both'
    },
    promptText: {
      fontSize: '18px',
      color: '#666666',
      fontStyle: 'italic',
      marginBottom: '48px',
      maxWidth: '80%',
      animation: 'fadeInUp 0.6s ease-out 0.4s both'
    },
    micContainer: {
      position: 'relative',
      marginBottom: '40px'
    },
    micButton: {
      width: '120px',
      height: '120px',
      borderRadius: '50%',
      background: '#6366F1',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease',
      position: 'relative',
      zIndex: 2,
      boxShadow: '0 10px 30px rgba(99, 102, 241, 0.3)',
      animation: 'scaleIn 0.6s ease-out 0.4s both'
    },
    micIcon: {
      width: '40px',
      height: '40px',
      fill: 'white'
    },
    micPulse: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      background: '#6366F1',
      opacity: 0.3,
      zIndex: 1,
      animation: 'pulse 2s infinite'
    },
    timer: {
      fontSize: '48px',
      fontWeight: 700,
      color: '#111111',
      fontFeatureSettings: '"tnum"',
      marginBottom: '8px',
      letterSpacing: '-1px'
    },
    statusText: {
      fontSize: '14px',
      fontWeight: 500,
      color: '#EF4444',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'opacity 0.3s'
    },
    statusDot: {
      width: '8px',
      height: '8px',
      background: '#EF4444',
      borderRadius: '50%',
      animation: 'blink 1s infinite'
    },
    actionsGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      width: '100%',
      maxWidth: '320px'
    },
    btn: {
      width: '100%',
      height: '56px',
      borderRadius: '9999px',
      fontSize: '16px',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    btnPrimary: {
      background: '#6366F1',
      color: 'white',
      border: 'none',
      boxShadow: '0 4px 12px rgba(123, 44, 191, 0.2)'
    },
    btnSecondary: {
      background: 'white',
      color: '#111111',
      border: '2px solid #E5E7EB'
    },
    uploadArea: {
      border: '2px dashed #E5E7EB',
      borderRadius: '24px',
      padding: '48px',
      textAlign: 'center',
      background: '#F9FAFB',
      transition: 'all 0.2s',
      cursor: 'pointer',
      marginBottom: '32px'
    },
    fileList: {
      marginTop: '24px'
    },
    fileItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px',
      background: '#F9FAFB',
      borderRadius: '12px',
      marginBottom: '8px'
    },
    statsColumn: {
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    },
    statCard: {
      background: 'white',
      borderRadius: '24px',
      padding: '32px',
      border: '1px solid #E5E7EB',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      position: 'relative',
      animation: 'slideInRight 0.8s ease-out both'
    },
    bigStat: {
      fontSize: '80px',
      fontWeight: 800,
      color: '#6366F1',
      letterSpacing: '-3px',
      lineHeight: 1,
      marginBottom: '8px',
      textAlign: 'center',
      animation: 'scaleIn 0.8s ease-out 0.2s both'
    },
    trendPill: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 12px',
      background: '#ECFDF5',
      color: '#10B981',
      borderRadius: '9999px',
      fontSize: '13px',
      fontWeight: 600,
      margin: '0 auto 24px auto'
    },
    progressContainer: {
      marginBottom: '24px'
    },
    progressBarBg: {
      height: '12px',
      background: '#F3F4F6',
      borderRadius: '9999px',
      overflow: 'hidden',
      marginTop: '8px'
    },
    progressBarFill: {
      height: '100%',
      background: '#6366F1',
      width: '0%',
      borderRadius: '9999px',
      transition: 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1) 0.5s'
    },
    traitsList: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px'
    },
    traitPill: {
      padding: '8px 16px',
      borderRadius: '9999px',
      fontSize: '12px',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      background: '#F3F4F6',
      color: '#6366F1'
    },
    statRow: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '13px',
      color: '#666666',
      padding: '8px 0',
      borderBottom: '1px solid #F3F4F6'
    },
    h3: {
      fontSize: '14px',
      fontWeight: 700,
      color: '#111111',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      marginBottom: '16px',
      opacity: 0.8
    },
    subtitle: {
      fontSize: '16px',
      color: '#666666',
      lineHeight: 1.5,
      marginBottom: '32px'
    }
  };

  return (
    <div style={styles.appContainer}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <a href="#" style={styles.logo}>AstraLink</a>
          <span style={styles.pageIndicator}>Recording Hub</span>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.userAvatar}></div>
        </div>
      </header>

      <main style={styles.mainContent}>
        <section className="action-column">
          <div style={styles.card}>
            <div className="tabs-container" style={styles.tabsContainer}>
              <button 
                style={{...styles.tab, ...(activeTab === 'voice' ? styles.tabActive : {})}}
                onClick={() => setActiveTab('voice')}
              >
                Voice
              </button>
              <button 
                style={{...styles.tab, ...(activeTab === 'doc' ? styles.tabActive : {})}}
                onClick={() => setActiveTab('doc')}
              >
                Documents
              </button>
              <button 
                style={{...styles.tab, ...(activeTab === 'questions' ? styles.tabActive : {})}}
                onClick={() => setActiveTab('questions')}
              >
                Questions
              </button>
            </div>

            {activeTab === 'voice' && (
              <div style={styles.voiceInterface}>
                <h2 style={styles.h2}>
                  {showPostRecordActions ? 'Voice memo captured' : isRecording ? 'Recording...' : 'Record a voice memo'}
                </h2>
                {!isRecording && !showPostRecordActions && (
                  <p style={styles.promptText}>"Tell us about a tough decision you made"</p>
                )}

                <div className="mic-area">
                  {isRecording && (
                    <div style={styles.timer}>{formatTime(seconds)}</div>
                  )}
                  
                  {!showPostRecordActions && (
                    <div style={styles.micContainer}>
                      {isRecording && <div style={styles.micPulse}></div>}
                      <button style={styles.micButton} onClick={toggleRecord}>
                        <svg style={styles.micIcon} viewBox="0 0 24 24">
                          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"></path>
                          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"></path>
                        </svg>
                      </button>
                    </div>
                  )}
                  
                  {isRecording && (
                    <div style={{...styles.statusText, opacity: 1}}>
                      <div style={styles.statusDot}></div> Recording...
                    </div>
                  )}
                </div>

                {showPostRecordActions && (
                  <div style={styles.actionsGroup}>
                    <p style={{...styles.subtitle, marginBottom: '12px', textAlign: 'center'}}>Sounds good?</p>
                    <button style={{...styles.btn, ...styles.btnPrimary}} onClick={async () => {
                      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                      console.log('blob size:', blob.size, 'chunks:', audioChunksRef.current.length);
                      if (blob.size === 0) { alert('No audio captured. Try again.'); return; }
                      const formData = new FormData();
                      formData.append('audio', blob, 'recording.webm');
                      const token = localStorage.getItem('token');
                      try {
                        const res = await fetch('https://astralink-v2-production.up.railway.app/transcribe', {
                          method: 'POST',
                          headers: { 'Authorization': 'Bearer ' + token },
                          body: formData
                        });
                        const data = await res.json();
                        if (data.success) alert('Saved! Transcribed: ' + data.transcription.slice(0, 100));
                        else alert('Transcription failed');
                      } catch(e) { alert('Error: ' + e.message); }
                      resetRecord();
                    }}>Save this voice</button>
                    <button style={{...styles.btn, ...styles.btnSecondary}} onClick={resetRecord}>Retake</button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'doc' && (
              <div>
                <h2 style={styles.h2}>Upload a document</h2>
                <p style={styles.subtitle}>Journal entries, letters, emails, personal notes. Any writing that shows your thinking.</p>
                
                <div style={styles.uploadArea} onClick={() => document.getElementById('docInput').click()}
                  onDrop={async (e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (!file) return;
                    const text = await file.text();
                    await fetch('https://astralink-v2-production.up.railway.app/document', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
                      body: JSON.stringify({ filename: file.name, content: text })
                    });
                    alert(file.name + ' uploaded! Your twin is learning.');
                  }}
                  onDragOver={e => e.preventDefault()}
                  style={{...styles.uploadArea, cursor: 'pointer'}}>
                  <p style={{fontWeight: 500, color: '#666666', marginBottom: '8px'}}>Drag and drop a document here</p>
                  <p style={{fontSize: '12px', color: '#999999'}}>Accepts: TXT, MD, PDF</p>
                  <input id="docInput" type="file" accept=".txt,.md,.pdf" style={{display:'none'}} onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const token = localStorage.getItem('token');
                    if (file.name.endsWith('.pdf')) {
                      const formData = new FormData();
                      formData.append('pdf', file);
                      const res = await fetch('https://astralink-v2-production.up.railway.app/upload-pdf', {
                        method: 'POST',
                        headers: { 'Authorization': 'Bearer ' + token },
                        body: formData
                      });
                      const data = await res.json();
                      if (data.success) alert(file.name + ' uploaded! ' + data.chars + ' characters extracted.');
                      else alert('PDF upload failed: ' + data.error);
                    } else {
                      const text = await file.text();
                      await fetch('https://astralink-v2-production.up.railway.app/document', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                        body: JSON.stringify({ filename: file.name, content: text })
                      });
                      alert(file.name + ' uploaded! Your twin is learning.');
                    }
                  }} />
                </div>
                
                <h3 style={styles.h3}>Your recent documents</h3>
                <div style={styles.fileList}>
                  <div style={styles.fileItem}>
                    <span style={{fontSize: '14px', fontWeight: 500}}>personal_letter.pdf</span>
                    <span style={{fontSize: '12px', color: '#999999'}}>2h ago</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'questions' && (
              <div>
                <h2 style={styles.h2}>Answer guided questions</h2>
                <p style={styles.subtitle}>5 thoughtful questions about you.</p>

                {qDone ? (
                  <div style={{textAlign: 'center', padding: '40px', background: '#F3F4F6', borderRadius: '16px'}}>
                    <div style={{fontSize: '40px', marginBottom: '12px'}}>✅</div>
                    <p style={{fontWeight: 700, fontSize: '18px', color: '#1f2937'}}>All done!</p>
                    <p style={{color: '#6b7280'}}>Your twin is learning from your answers.</p>
                  </div>
                ) : (
                  <>
                    <div style={{background: '#F3F4F6', borderRadius: '16px', padding: '24px', marginBottom: '24px'}}>
                      <span style={{fontSize: '12px', fontWeight: 700, color: '#6366F1', textTransform: 'uppercase'}}>Question {currentQ + 1} of {questions.length}</span>
                      <h3 style={{fontSize: '18px', color: '#111111', margin: '12px 0 24px 0'}}>{questions[currentQ]}</h3>
                      <textarea value={qAnswer} onChange={e => setQAnswer(e.target.value)} style={{width: '100%', height: '120px', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '12px', fontFamily: 'Inter', resize: 'none', boxSizing: 'border-box'}} placeholder="Start typing your answer..."></textarea>
                      <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px'}}>
                        <button onClick={toggleQRecord} style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '999px', border: '2px solid #6366F1', background: qRecording ? '#6366F1' : 'white', color: qRecording ? 'white' : '#6366F1', fontWeight: 600, fontSize: '14px', cursor: 'pointer'}}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                          </svg>
                          {qRecording ? `Recording... ${formatTime(qSeconds)}` : 'Answer by voice'}
                        </button>
                        {qRecording && <span style={{fontSize: '13px', color: '#EF4444', fontWeight: 500}}>Tap to stop & transcribe</span>}
                      </div>
                    </div>
                    <button style={{...styles.btn, ...styles.btnPrimary, marginBottom: '12px'}} onClick={async () => {
                      if (!qAnswer.trim()) return;
                      await fetch('https://astralink-v2-production.up.railway.app/qa', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
                        body: JSON.stringify({ question: questions[currentQ], answer: qAnswer })
                      });
                      setQAnswer('');
                      if (currentQ + 1 >= questions.length) setQDone(true);
                      else setCurrentQ(currentQ + 1);
                    }}>Save and continue</button>
                    <button style={{...styles.btn, ...styles.btnSecondary}} onClick={() => {
                      setQAnswer('');
                      if (currentQ + 1 >= questions.length) setQDone(true);
                      else setCurrentQ(currentQ + 1);
                    }}>Skip this question</button>
                  </>
                )}
              </div>
            )}
          </div>
        </section>

        <aside style={styles.statsColumn}>
          <div style={{...styles.statCard, animationDelay: '0.1s'}}>
            <div style={styles.trendPill}>↑ improving</div>
            <div style={styles.bigStat}>{Math.min(95, Math.round((stats.voices * 5) + (stats.documents * 10) + (stats.questions * 3)))}%</div>
            <p style={{textAlign: 'center', color: '#666666', fontSize: '14px', marginBottom: '32px'}}>Your current accuracy</p>
            
            <div style={styles.progressContainer}>
              <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600}}>
                <span>Next milestone: 50%</span>
                <span style={{color: '#999999'}}>{stats.voices < 5 ? `${5 - stats.voices} more voices` : 'Keep going!'}</span>
              </div>
              <div style={styles.progressBarBg}>
                <div className="progress-bar-fill" style={styles.progressBarFill}></div>
              </div>
            </div>
          </div>

          <div style={{...styles.statCard, animationDelay: '0.2s'}}>
            <h3 style={styles.h3}>Traits we're seeing</h3>
            <div style={styles.traitsList}>
              <span style={{...styles.traitPill, animationDelay: '0.5s', animation: 'fadeIn 0.6s ease-out both'}}>Thoughtful</span>
              <span style={{...styles.traitPill, animationDelay: '0.6s', animation: 'fadeIn 0.6s ease-out both'}}>Detail-Oriented</span>
              <span style={{...styles.traitPill, animationDelay: '0.7s', animation: 'fadeIn 0.6s ease-out both'}}>Listener</span>
            </div>
          </div>

          <div style={{...styles.statCard, animationDelay: '0.3s'}}>
            <h3 style={styles.h3}>Your progress</h3>
            <div style={styles.statRow}>
              <span>Voices recorded</span>
              <span style={{fontWeight: 600, color: '#111111'}}>{stats.voices}</span>
            </div>
            <div style={styles.statRow}>
              <span>Documents uploaded</span>
              <span style={{fontWeight: 600, color: '#111111'}}>{stats.documents}</span>
            </div>
            <div style={styles.statRow}>
              <span>Questions answered</span>
              <span style={{fontWeight: 600, color: '#111111'}}>{stats.questions}</span>
            </div>
            <div style={{...styles.statRow, borderBottom: 'none'}}>
              <span>Days active</span>
              <span style={{fontWeight: 600, color: '#111111'}}>{stats.days}</span>
            </div>
          </div>

          <div style={{...styles.statCard, animationDelay: '0.4s', background: '#F9FAFB', border: '1px solid #E5E7EB'}}>
            <h3 style={styles.h3}>What's next?</h3>
            <p style={{fontSize: '14px', color: '#666666', lineHeight: 1.4}}>Record 3 more voices this week to hit 50% accuracy.</p>
            <a href="#" style={{color: '#10B981', fontWeight: 600, fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', marginTop: '12px'}}>You’re on track →</a>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default function Page10B() {
  return (
    <>
      <App />
      <div style={{ display: "flex", justifyContent: "center", padding: "40px 0", background: "#fff" }}>
        <button
          onClick={() => window.location.href = "/progress"}
          style={{ background: "#6366F1", color: "#fff", border: "none", borderRadius: "999px", padding: "18px 48px", fontSize: "16px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif", boxShadow: "0 4px 24px rgba(99,102,241,0.3)" }}
        >
          Continue to Chat →
        </button>
      </div>
    </>
  );
}