import React, { useState, useRef, useEffect, useCallback } from 'react';
import { flushSync } from 'react-dom';
import MamdaniCall from '../components/MamdaniCall';
import mamdaniImage from '../assets/mamdani.jpg';

const API = 'https://astralink-v2-production.up.railway.app';

const GATE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

  .mp-gate {
    min-height: 100vh;
    background: #0d0d0d;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Inter', sans-serif;
  }
  .mp-gate-inner {
    background: #161616;
    border: 1px solid #2a2a2a;
    border-radius: 24px;
    padding: 40px;
    width: 100%;
    max-width: 360px;
    margin: 16px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
  }
  .mp-gate-avatar {
    width: 68px;
    height: 68px;
    border-radius: 50%;
    border: 2px solid #2ecc71;
    overflow: hidden;
    margin-bottom: 20px;
    flex-shrink: 0;
  }
  .mp-gate-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top;
    display: block;
  }
  .mp-gate-name {
    font-size: 19px;
    font-weight: 600;
    color: #e8e8e8;
    text-align: center;
    margin-bottom: 4px;
  }
  .mp-gate-subtitle {
    font-size: 12px;
    color: #666;
    text-align: center;
    margin-bottom: 28px;
    line-height: 1.5;
  }
  .mp-gate-input {
    width: 100%;
    background: #1f1f1f;
    border: 1px solid #2a2a2a;
    border-radius: 12px;
    padding: 13px 16px;
    font-family: 'Inter', sans-serif;
    font-size: 15px;
    color: #e8e8e8;
    outline: none;
    box-sizing: border-box;
    text-align: center;
    transition: border-color 0.15s;
    margin-bottom: 12px;
  }
  .mp-gate-input::placeholder { color: #444; }
  .mp-gate-input:focus { border-color: #2ecc71; }
  .mp-gate-btn {
    width: 100%;
    background: #2ecc71;
    color: #000;
    border: none;
    border-radius: 12px;
    padding: 13px 24px;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s;
    margin-bottom: 10px;
  }
  .mp-gate-btn:hover { opacity: 0.88; }
  .mp-gate-error {
    font-size: 12px;
    color: #e74c3c;
    text-align: center;
    min-height: 16px;
  }
`;

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

  @keyframes mpFadeIn  { from { opacity: 0; } to { opacity: 1; } }
  @keyframes mpFadeUp  {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes mpPulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.25; }
  }
  @keyframes mpDot {
    0%, 60%, 100% { transform: translateY(0); opacity: 0.3; }
    30%            { transform: translateY(-4px); opacity: 1; }
  }
  @keyframes mpListenRing {
    0%   { box-shadow: 0 0 0 0px  rgba(46,204,113,0.55); }
    70%  { box-shadow: 0 0 0 10px rgba(46,204,113,0);    }
    100% { box-shadow: 0 0 0 0px  rgba(46,204,113,0);    }
  }
  @keyframes mpSpeakBounce {
    0%, 100% { transform: scaleY(0.3); }
    50%       { transform: scaleY(1);   }
  }
  @keyframes mpVoiceBtnPulse {
    0%, 100% { box-shadow: 0 0 0 0px  rgba(46,204,113,0.5); }
    60%      { box-shadow: 0 0 0 6px  rgba(46,204,113,0);   }
  }

  .mp-root {
    min-height: 100dvh;
    background: #0d0d0d;
    display: flex;
    flex-direction: column;
    align-items: center;
    font-family: 'Inter', sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .mp-inner {
    width: 100%;
    max-width: 680px;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
  }

  /* ── Header ── */
  .mp-header {
    position: fixed;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 680px;
    background: #161616;
    border-bottom: 1px solid #2a2a2a;
    box-sizing: border-box;
    z-index: 100;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    gap: 14px;
    animation: mpFadeIn 0.4s ease forwards;
  }
  .mp-header-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 1.5px solid #2ecc71;
    overflow: hidden;
    flex-shrink: 0;
  }
  .mp-header-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top;
    display: block;
  }
  .mp-header-text h1 {
    font-size: 15px;
    font-weight: 600;
    color: #e8e8e8;
    margin: 0;
    line-height: 1.2;
  }
  .mp-header-text p {
    font-size: 11px;
    color: #666;
    margin: 2px 0 0;
  }
  .mp-status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #2ecc71;
    margin-left: auto;
    box-shadow: 0 0 6px #2ecc71;
    animation: mpPulse 2.4s ease-in-out infinite;
    flex-shrink: 0;
  }
  .mp-header .mc-trigger {
    margin-left: 6px;
    flex-shrink: 0;
  }

  /* ── Voice mode button (header) ── */
  .mp-voice-btn {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: transparent;
    border: 1.5px solid #2a2a2a;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s, color 0.2s;
    flex-shrink: 0;
    color: #555;
    margin-left: 6px;
    -webkit-tap-highlight-color: transparent;
  }
  .mp-voice-btn:hover:not(.active) { border-color: #444; color: #888; }
  .mp-voice-btn.active {
    background: rgba(46,204,113,0.15);
    border-color: #2ecc71;
    color: #2ecc71;
    animation: mpVoiceBtnPulse 2s ease-out infinite;
  }

  /* ── Voice status bar (above text input) ── */
  .mp-voice-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    background: rgba(46,204,113,0.06);
    border: 1px solid rgba(46,204,113,0.18);
    border-radius: 12px;
    margin-bottom: 8px;
    font-family: 'Inter', sans-serif;
    animation: mpFadeIn 0.2s ease forwards;
  }
  .mp-voice-orb {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: rgba(46,204,113,0.12);
    border: 1.5px solid #2ecc71;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .mp-voice-orb.listening { animation: mpListenRing 1.5s ease-out infinite; }
  .mp-voice-orb.speaking  { animation: mpListenRing 2.8s ease-out infinite; }
  .mp-voice-waves {
    display: flex;
    align-items: flex-end;
    gap: 2px;
    height: 12px;
  }
  .mp-voice-waves span {
    width: 3px;
    border-radius: 2px;
    background: #2ecc71;
    transform-origin: bottom;
    animation: mpSpeakBounce 0.7s ease-in-out infinite;
  }
  .mp-voice-waves span:nth-child(1) { height: 8px;  animation-delay: 0s;    }
  .mp-voice-waves span:nth-child(2) { height: 12px; animation-delay: 0.12s; }
  .mp-voice-waves span:nth-child(3) { height: 10px; animation-delay: 0.24s; }
  .mp-voice-waves span:nth-child(4) { height: 12px; animation-delay: 0.08s; }
  .mp-voice-waves span:nth-child(5) { height: 6px;  animation-delay: 0.16s; }
  .mp-voice-label {
    flex: 1;
    font-size: 12px;
    color: rgba(255,255,255,0.55);
    letter-spacing: 0.02em;
  }
  .mp-voice-error-txt {
    flex: 1;
    font-size: 11px;
    color: #e74c3c;
  }
  .mp-voice-stop {
    font-size: 11px;
    color: #555;
    background: transparent;
    border: none;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    padding: 3px 8px;
    border-radius: 6px;
    transition: color 0.15s;
    flex-shrink: 0;
  }
  .mp-voice-stop:hover { color: #e74c3c; }

  /* ── Chat area ── */
  .mp-chat {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px 16px 140px;
    overflow-y: auto;
    background: #0d0d0d;
  }
  .mp-chat::-webkit-scrollbar { display: none; }
  .mp-chat { scrollbar-width: none; }

  /* ── Empty state ── */
  .mp-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 48px 24px;
    gap: 10px;
    animation: mpFadeUp 0.5s ease forwards;
  }
  .mp-empty-avatar {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    border: 1.5px solid #2ecc71;
    overflow: hidden;
    margin-bottom: 4px;
    flex-shrink: 0;
  }
  .mp-empty-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top;
    display: block;
  }
  .mp-empty-heading {
    font-size: 16px;
    font-weight: 600;
    color: #e8e8e8;
    margin: 0;
  }
  .mp-empty-sub {
    font-size: 13px;
    color: #555;
    max-width: 280px;
    line-height: 1.6;
    margin: 0;
  }
  .mp-suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
    margin-top: 8px;
  }
  .mp-suggestion {
    background: #161616;
    border: 1px solid #2a2a2a;
    border-radius: 20px;
    padding: 7px 14px;
    font-size: 12px;
    color: #666;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    transition: border-color 0.15s, color 0.15s;
  }
  .mp-suggestion:hover { border-color: #2ecc71; color: #2ecc71; }

  /* ── Messages ── */
  .mp-msg {
    display: flex;
    flex-direction: column;
    animation: mpFadeUp 0.22s ease forwards;
    opacity: 0;
  }
  .mp-msg.user {
    align-items: flex-end;
    align-self: flex-end;
    max-width: 76%;
  }
  .mp-msg.assistant {
    align-items: flex-start;
    align-self: flex-start;
    max-width: 88%;
  }
  .mp-msg-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .mp-msg.user .mp-msg-label    { color: #444; }
  .mp-msg.assistant .mp-msg-label { color: #2ecc71; }

  .mp-msg-bubble {
    font-size: 14px;
    line-height: 1.7;
    word-break: break-word;
  }
  .mp-msg-bubble.user {
    background: #1a2e22;
    border: 1px solid #2ecc71;
    border-radius: 18px 18px 4px 18px;
    padding: 10px 16px;
    color: #e8e8e8;
  }
  .mp-msg-bubble.assistant {
    background: transparent;
    color: #d8d8d8;
    padding: 0;
  }

  /* Typing dots */
  .mp-typing {
    display: flex;
    gap: 5px;
    align-items: center;
    padding: 4px 0;
  }
  .mp-typing span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #2ecc71;
    animation: mpDot 1.2s ease-in-out infinite;
  }
  .mp-typing span:nth-child(2) { animation-delay: 0.2s; }
  .mp-typing span:nth-child(3) { animation-delay: 0.4s; }

  /* ── Disabled / streaming state ── */
  .mp-input:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .mp-input-row.mp-disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  /* ── Input area ── */
  .mp-input-area {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 680px;
    background: #161616;
    border-top: 1px solid #2a2a2a;
    padding: 12px 16px 20px;
    box-sizing: border-box;
    z-index: 100;
  }
  .mp-input-row {
    display: flex;
    align-items: flex-end;
    gap: 10px;
    background: #1f1f1f;
    border: 1px solid #2a2a2a;
    border-radius: 16px;
    padding: 10px 10px 10px 16px;
    transition: border-color 0.15s;
  }
  .mp-input-row:focus-within { border-color: #2ecc71; }
  .mp-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    color: #e8e8e8;
    resize: none;
    line-height: 1.5;
    max-height: 120px;
    overflow-y: auto;
    padding: 0;
  }
  .mp-input::placeholder { color: #444; }
  .mp-send {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #2ecc71;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: opacity 0.15s, transform 0.1s;
    color: #000;
  }
  .mp-send:hover:not(:disabled) { opacity: 0.85; }
  .mp-send:active:not(:disabled) { transform: scale(0.92); }
  .mp-send:disabled { opacity: 0.3; cursor: default; }
`;

const HEADER_HEIGHT = 77;
const GATE_KEY  = 'mamdani_access';
const GATE_PASS = 'mamdani2026';

const SUGGESTIONS = [
  "What's your housing policy?",
  "What did you announce recently?",
  "Tell me about fare-free buses",
  "What do you believe in?",
];

function PasswordGate({ onUnlock }) {
  const [code, setCode]   = useState('');
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
    <div className="mp-gate">
      <div className="mp-gate-inner">
        <div className="mp-gate-avatar"><img src={mamdaniImage} alt="Zohran Mamdani" /></div>
        <div className="mp-gate-name">Talk to Zohran Mamdani</div>
        <div className="mp-gate-subtitle">Mayor of New York City · Digital Twin</div>
        <input
          className="mp-gate-input"
          type="password"
          placeholder="Access code"
          value={code}
          onChange={e => { setCode(e.target.value); setError(false); }}
          onKeyDown={e => e.key === 'Enter' && attempt()}
          autoFocus
        />
        <button className="mp-gate-btn" onClick={attempt}>Continue</button>
        <div className="mp-gate-error">{error ? 'Incorrect access code' : ''}</div>
      </div>
    </div>
  );
}

function Message({ msg, index }) {
  const isUser = msg.role === 'user';
  const isTyping = !isUser && msg.content === '';

  return (
    <div
      className={`mp-msg ${isUser ? 'user' : 'assistant'}`}
      style={{ animationDelay: `${Math.min(index * 0.03, 0.1)}s` }}
    >
      <div className="mp-msg-label">{isUser ? 'You' : 'Mamdani'}</div>
      {isUser ? (
        <div className="mp-msg-bubble user">{msg.content}</div>
      ) : isTyping ? (
        <div className="mp-typing">
          <span /><span /><span />
        </div>
      ) : (
        <div className="mp-msg-bubble assistant">
          {msg.content.split('\n\n').map((para, pi, arr) => (
            <p key={pi} style={{ margin: 0, marginBottom: pi < arr.length - 1 ? '12px' : 0 }}>
              {para.split('\n').map((line, li, lines) => (
                <span key={li}>{line}{li < lines.length - 1 && <br />}</span>
              ))}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Mic SVG icon ────────────────────────────────────────────────────────────
const MicIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="2" width="6" height="12" rx="3"/>
    <path d="M19 10a7 7 0 0 1-14 0"/>
    <line x1="12" y1="19" x2="12" y2="22"/>
    <line x1="8" y1="22" x2="16" y2="22"/>
  </svg>
);

export default function MamdaniPage() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(GATE_KEY) === '1');
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [streaming, setStreaming] = useState(false);

  // ── Voice mode state ──────────────────────────────────────────────────────
  const [voiceMode,  setVoiceMode]  = useState(false);
  // 'idle' | 'listening' | 'processing' | 'speaking' | 'error'
  const [voicePhase, setVoicePhase] = useState('idle');
  const [voiceError, setVoiceError] = useState('');

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Voice refs — stable across renders, safe to use in async callbacks
  const recognitionRef    = useRef(null);
  const voiceAudioRef     = useRef(null);
  const voiceModeRef      = useRef(false);   // mirrors voiceMode for use in closures
  const voicePhaseRef     = useRef('idle');  // mirrors voicePhase for use in closures
  const intentionalStop   = useRef(false);   // true when WE stop recognition before processing
  const messagesRef       = useRef([]);      // always-fresh copy of messages

  // Keep refs in sync
  useEffect(() => { voiceModeRef.current  = voiceMode;  }, [voiceMode]);
  useEffect(() => { voicePhaseRef.current = voicePhase; }, [voicePhase]);
  useEffect(() => { messagesRef.current   = messages;   }, [messages]);

  // Inject styles
  useEffect(() => {
    const gateEl = document.createElement('style');
    gateEl.id = 'mp-gate-styles';
    gateEl.textContent = GATE_STYLES;
    document.head.appendChild(gateEl);

    const chatEl = document.createElement('style');
    chatEl.id = 'mp-chat-styles';
    chatEl.textContent = STYLES;
    document.head.appendChild(chatEl);

    return () => {
      document.getElementById('mp-gate-styles')?.remove();
      document.getElementById('mp-chat-styles')?.remove();
    };
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup voice resources on unmount
  useEffect(() => {
    return () => {
      voiceModeRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
        recognitionRef.current = null;
      }
      if (voiceAudioRef.current) {
        voiceAudioRef.current.pause();
        voiceAudioRef.current = null;
      }
    };
  }, []);

  // ── Voice: start recognition session ─────────────────────────────────────
  const startRecognition = useCallback(() => {
    if (!voiceModeRef.current) return;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.continuous      = true;
    rec.interimResults  = false;
    rec.language        = 'en-US';
    recognitionRef.current = rec;

    rec.onresult = (event) => {
      // Take the last final result
      const last = event.results.length - 1;
      if (!event.results[last].isFinal) return;
      const transcript = event.results[last][0].transcript.trim();
      if (!transcript) return;
      console.log('[VoiceMode] Detected:', transcript);
      handleVoiceResult(transcript);
    };

    rec.onerror = (e) => {
      console.warn('[VoiceMode] Recognition error:', e.error);
      if (e.error === 'aborted' || e.error === 'no-speech') return;
      if (e.error === 'not-allowed') {
        setVoiceError('Microphone access denied.');
        setVoiceMode(false);
        setVoicePhase('idle');
        voiceModeRef.current = false;
        return;
      }
      // Restart on transient errors
      if (voiceModeRef.current && voicePhaseRef.current === 'listening') {
        setTimeout(startRecognition, 800);
      }
    };

    rec.onend = () => {
      // If we stopped intentionally (to process speech) — do nothing, handleVoiceResult takes over
      if (intentionalStop.current) {
        intentionalStop.current = false;
        return;
      }
      // Otherwise auto-restart if voice mode is still active and we're in listening phase
      if (voiceModeRef.current && voicePhaseRef.current === 'listening') {
        console.log('[VoiceMode] Recognition ended unexpectedly — restarting');
        setTimeout(startRecognition, 200);
      }
    };

    rec.start();
    setVoicePhase('listening');
    setVoiceError('');
    console.log('[VoiceMode] Recognition started');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Voice: process detected speech ───────────────────────────────────────
  const handleVoiceResult = useCallback(async (transcript) => {
    if (!voiceModeRef.current) return;

    // Stop recognition while we process
    intentionalStop.current = true;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }

    setVoicePhase('processing');

    // Add user + empty assistant bubble to chat
    const currentMessages = messagesRef.current;
    const userMsg = { role: 'user', content: transcript };
    setMessages(prev => [...prev, userMsg, { role: 'assistant', content: '' }]);

    try {
      console.log('[VoiceMode] Calling /mamdani-voice...');
      const res = await fetch(`${API}/mamdani-voice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: transcript, history: currentMessages }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Voice endpoint error ${res.status}: ${errBody}`);
      }

      const mamdaniText = decodeURIComponent(res.headers.get('X-Mamdani-Text') || '');
      console.log('[VoiceMode] Got text:', mamdaniText);

      // Fill in assistant bubble with the text
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: mamdaniText };
        return updated;
      });

      const arrayBuffer = await res.arrayBuffer();
      if (arrayBuffer.byteLength === 0) throw new Error('Empty audio response');

      // Play the audio
      setVoicePhase('speaking');
      const audioBlob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      const audioUrl  = URL.createObjectURL(audioBlob);
      const audioEl   = new Audio(audioUrl);
      voiceAudioRef.current = audioEl;

      audioEl.onended = () => {
        URL.revokeObjectURL(audioUrl);
        voiceAudioRef.current = null;
        console.log('[VoiceMode] Audio ended');
        if (voiceModeRef.current) {
          // Resume listening automatically
          startRecognition();
        } else {
          setVoicePhase('idle');
        }
      };

      audioEl.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        voiceAudioRef.current = null;
        if (voiceModeRef.current) startRecognition();
        else setVoicePhase('idle');
      };

      await audioEl.play();

    } catch (e) {
      console.error('[VoiceMode] handleVoiceResult error:', e);
      setVoiceError(e.message);
      setMessages(prev => {
        const updated = [...prev];
        if (updated.length && updated[updated.length - 1].content === '') {
          updated[updated.length - 1] = { role: 'assistant', content: 'Something went wrong. Please try again.' };
        }
        return updated;
      });
      // Resume listening after a short pause even on error
      if (voiceModeRef.current) {
        setTimeout(startRecognition, 1500);
      } else {
        setVoicePhase('idle');
      }
    }
  }, [startRecognition]);

  // ── Voice: toggle on/off ──────────────────────────────────────────────────
  const toggleVoiceMode = useCallback(() => {
    if (voiceModeRef.current) {
      // Turn off
      voiceModeRef.current = false;
      setVoiceMode(false);
      setVoicePhase('idle');
      setVoiceError('');

      if (recognitionRef.current) {
        intentionalStop.current = true;
        try { recognitionRef.current.abort(); } catch {}
        recognitionRef.current = null;
      }
      if (voiceAudioRef.current) {
        voiceAudioRef.current.pause();
        try { URL.revokeObjectURL(voiceAudioRef.current.src); } catch {}
        voiceAudioRef.current = null;
      }
    } else {
      // Turn on — check browser support first
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) {
        setVoiceError('Voice mode requires Chrome or Edge.');
        return;
      }
      voiceModeRef.current = true;
      setVoiceMode(true);
      setVoiceError('');
      startRecognition();
    }
  }, [startRecognition]);

  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />;

  // ── Text chat ─────────────────────────────────────────────────────────────
  const appendToLast = (extra) => {
    setMessages(prev => {
      const updated = [...prev];
      updated[updated.length - 1] = {
        ...updated[updated.length - 1],
        content: updated[updated.length - 1].content + extra,
      };
      return updated;
    });
  };

  const sendMessage = async (text) => {
    const content = (text || input).trim();
    if (!content || streaming) return;

    const userMsg = { role: 'user', content };
    const history = [...messages, userMsg];

    setMessages([...history, { role: 'assistant', content: '' }]);
    setInput('');
    setStreaming(true);

    const thinkMs = 800 + Math.min(content.length * 12, 1200);
    await new Promise(r => setTimeout(r, thinkMs));

    try {
      const res = await fetch(`${API}/mamdani-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok) throw new Error(`Server error ${res.status}`);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;
          try {
            const evt = JSON.parse(raw);
            if (evt.type === 'token' && evt.content) {
              flushSync(() => appendToLast(evt.content));
            } else if (evt.type === 'pause') {
              await new Promise(r => setTimeout(r, evt.ms || 700));
            } else if (evt.type === 'done') {
              setStreaming(false);
              inputRef.current?.focus();
            }
          } catch {}
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

  // ── Voice bar content ─────────────────────────────────────────────────────
  const VoiceOrb = () => {
    if (voicePhase === 'speaking') {
      return (
        <div className="mp-voice-orb speaking">
          <div className="mp-voice-waves">
            <span/><span/><span/><span/><span/>
          </div>
        </div>
      );
    }
    return (
      <div className={`mp-voice-orb${voicePhase === 'listening' ? ' listening' : ''}`}>
        <MicIcon size={13} color="#2ecc71" />
      </div>
    );
  };

  const voiceLabel = {
    listening:  'Listening…',
    processing: 'Thinking…',
    speaking:   'Speaking…',
    idle:       'Voice mode on',
    error:      '',
  }[voiceError ? 'error' : voicePhase];

  return (
    <div className="mp-root">
      <div className="mp-inner">

        {/* Fixed header */}
        <div className="mp-header">
          <div className="mp-header-avatar"><img src={mamdaniImage} alt="Zohran Mamdani" /></div>
          <div className="mp-header-text">
            <h1>Zohran Mamdani</h1>
            <p>Mayor of New York City</p>
          </div>
          <div className="mp-status-dot" />

          {/* Continuous voice mode toggle */}
          <button
            className={`mp-voice-btn${voiceMode ? ' active' : ''}`}
            onClick={toggleVoiceMode}
            title={voiceMode ? 'Turn off voice mode' : 'Turn on voice mode'}
            aria-label="Toggle voice mode"
          >
            <MicIcon size={15} />
          </button>

          {/* Push-to-talk call modal */}
          <MamdaniCall
            messages={messages}
            onNewExchange={(userText, assistantText) => {
              setMessages(prev => [
                ...prev,
                { role: 'user', content: userText },
                { role: 'assistant', content: assistantText },
              ]);
            }}
          />
        </div>

        {/* Spacer */}
        <div style={{ height: HEADER_HEIGHT }} />

        {/* Chat */}
        <div className="mp-chat">
          {messages.length === 0 ? (
            <div className="mp-empty">
              <div className="mp-empty-avatar"><img src={mamdaniImage} alt="Zohran Mamdani" /></div>
              <p className="mp-empty-heading">Ask me anything</p>
              <p className="mp-empty-sub">I'm Zohran Mamdani, Mayor of New York City. Ask me about housing, transit, childcare, or anything on your mind.</p>
              <div className="mp-suggestions">
                {SUGGESTIONS.map(s => (
                  <button key={s} className="mp-suggestion" onClick={() => sendMessage(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => <Message key={i} msg={msg} index={i} />)
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="mp-input-area">

          {/* Voice status bar — visible when voice mode is on */}
          {voiceMode && (
            <div className="mp-voice-bar">
              <VoiceOrb />
              {voiceError
                ? <span className="mp-voice-error-txt">{voiceError}</span>
                : <span className="mp-voice-label">{voiceLabel}</span>
              }
              <button className="mp-voice-stop" onClick={toggleVoiceMode}>Stop</button>
            </div>
          )}
          {/* Also show browser-support error even when voice mode isn't on yet */}
          {!voiceMode && voiceError && (
            <div className="mp-voice-bar">
              <span className="mp-voice-error-txt">{voiceError}</span>
            </div>
          )}

          <div className={`mp-input-row${streaming ? ' mp-disabled' : ''}`}>
            <textarea
              ref={inputRef}
              className="mp-input"
              rows={1}
              placeholder={
                voiceMode
                  ? voicePhase === 'listening'  ? 'Listening — or type here…'
                  : voicePhase === 'processing' ? 'Thinking…'
                  : voicePhase === 'speaking'   ? 'Speaking…'
                  : 'Ask the Mayor…'
                  : streaming ? 'Waiting for response…' : 'Ask the Mayor…'
              }
              value={input}
              onChange={e => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={handleKeyDown}
              disabled={streaming}
              style={streaming ? { opacity: 0.45, cursor: 'not-allowed' } : {}}
            />
            <button
              className="mp-send"
              onClick={() => sendMessage()}
              disabled={streaming || !input.trim()}
              aria-label="Send"
              style={streaming ? { opacity: 0.3, pointerEvents: 'none' } : {}}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2 21l21-9L2 3v7l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
