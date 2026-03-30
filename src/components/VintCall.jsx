import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

const API = 'https://astralink-v2-production.up.railway.app';

const CALL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,400;0,500;1,400&display=swap');

  /* ── Trigger button ── */
  .vc-trigger {
    display: flex;
    align-items: center;
    gap: 8px;
    background: none;
    border: 1px solid #6366F1;
    border-radius: 9999px;
    padding: 7px 16px 7px 12px;
    cursor: pointer;
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    color: #6366F1;
    letter-spacing: 0.04em;
    transition: background 0.15s, color 0.15s;
    white-space: nowrap;
  }
  .vc-trigger:hover { background: #6366F1; color: #fff; }
  .vc-trigger:hover .vc-pulse-dot { background: #fff; box-shadow: 0 0 0 3px rgba(255,255,255,0.4); }

  .vc-pulse-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #22c55e;
    box-shadow: 0 0 0 3px rgba(34,197,94,0.25);
    animation: vcPulse 1.8s ease-in-out infinite;
    flex-shrink: 0;
  }
  @keyframes vcPulse {
    0%, 100% { box-shadow: 0 0 0 3px rgba(34,197,94,0.25); }
    50%       { box-shadow: 0 0 0 6px rgba(34,197,94,0.08); }
  }

  /* ── Portal overlay — rendered into document.body ── */
  .vc-overlay {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    z-index: 99999 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    animation: vcFadeIn 0.2s ease forwards;
  }
  @keyframes vcFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  /* ── Card ── */
  .vc-card {
    background: #fff;
    border-radius: 20px;
    padding: 36px 28px 28px;
    width: 100%;
    max-width: 340px;
    min-height: 500px;
    margin: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 0 32px 80px rgba(0,0,0,0.25);
    font-family: 'DM Mono', monospace;
    animation: vcSlideUp 0.22s ease forwards;
    box-sizing: border-box;
  }
  @keyframes vcSlideUp {
    from { transform: translateY(20px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }

  /* ── Avatar ── */
  .vc-avatar-wrap {
    position: relative;
    width: 96px;
    height: 96px;
    margin-bottom: 16px;
    flex-shrink: 0;
  }
  .vc-avatar-ring {
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    background: #E5E7EB;
  }
  .vc-avatar-ring.idle    { background: #E5E7EB; }
  .vc-avatar-ring.listening {
    background: conic-gradient(#ef4444, #fca5a5, #ef4444);
    animation: vcSpin 1.4s linear infinite;
  }
  .vc-avatar-ring.thinking {
    background: conic-gradient(#f59e0b, #fcd34d, #f59e0b);
    animation: vcSpin 1.4s linear infinite;
  }
  .vc-avatar-ring.speaking {
    background: conic-gradient(#22c55e, #86efac, #22c55e);
    animation: vcSpin 1.4s linear infinite;
  }
  @keyframes vcSpin { to { transform: rotate(360deg); } }

  .vc-avatar-initials {
    position: absolute;
    inset: 4px;
    border-radius: 50%;
    background: #EEF2FF;
    border: 3px solid #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: Georgia, serif;
    font-size: 26px;
    font-style: italic;
    color: #6366F1;
    font-weight: normal;
    user-select: none;
  }

  /* ── Name & status ── */
  .vc-name {
    font-size: 18px;
    font-style: italic;
    font-family: Georgia, serif;
    color: #111827;
    margin-bottom: 4px;
    text-align: center;
  }
  .vc-status {
    font-size: 11px;
    color: #9CA3AF;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 20px;
    min-height: 16px;
    text-align: center;
  }

  /* ── Transcript ── */
  .vc-transcript {
    width: 100%;
    flex: 1;
    min-height: 80px;
    max-height: 140px;
    overflow-y: auto;
    background: #F9FAFB;
    border-radius: 10px;
    padding: 12px 14px;
    box-sizing: border-box;
    margin-bottom: 24px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .vc-transcript-empty {
    font-size: 12px;
    color: #D1D5DB;
    text-align: center;
    font-style: italic;
    margin: auto;
  }
  .vc-tx-user {
    font-size: 12px;
    color: #6366F1;
    text-align: right;
    line-height: 1.5;
  }
  .vc-tx-vint {
    font-size: 12px;
    color: #1F2937;
    text-align: left;
    line-height: 1.6;
    font-family: Georgia, serif;
  }

  /* ── Mic button ── */
  .vc-mic-btn {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: #fff;
    border: 2px solid #E5E7EB;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    margin-bottom: 16px;
    flex-shrink: 0;
  }
  .vc-mic-btn:hover:not(:disabled) {
    border-color: #6366F1;
    box-shadow: 0 4px 16px rgba(99,102,241,0.2);
  }
  .vc-mic-btn.listening {
    background: #fef2f2;
    border-color: #ef4444;
    box-shadow: 0 0 0 8px rgba(239,68,68,0.1);
  }
  .vc-mic-btn:disabled { opacity: 0.35; cursor: not-allowed; }
  .vc-mic-icon { width: 28px; height: 28px; }

  /* ── Error ── */
  .vc-error {
    font-size: 11px;
    color: #ef4444;
    margin-bottom: 8px;
    text-align: center;
    font-family: 'DM Mono', monospace;
    max-width: 280px;
    word-break: break-word;
  }

  /* ── End call ── */
  .vc-end-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #EF4444;
    padding: 6px 14px;
    border-radius: 6px;
    transition: background 0.15s;
    flex-shrink: 0;
  }
  .vc-end-btn:hover { background: #FEF2F2; }
`;

const MicIcon = ({ active }) => (
  <svg className="vc-mic-icon" viewBox="0 0 24 24" fill="none"
    stroke={active ? '#ef4444' : '#6366F1'} strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="2" width="6" height="12" rx="3"/>
    <path d="M19 10a7 7 0 0 1-14 0"/>
    <line x1="12" y1="19" x2="12" y2="22"/>
    <line x1="8" y1="22" x2="16" y2="22"/>
  </svg>
);

// Portal renders directly into document.body, escaping any parent stacking context
function ModalPortal({ children }) {
  return createPortal(children, document.body);
}

export default function VintCall({ messages = [], onNewExchange }) {
  const [open, setOpen]       = useState(false);
  const [phase, setPhase]     = useState('idle'); // idle | listening | thinking | speaking
  const [lastUser, setLastUser] = useState('');
  const [lastVint, setLastVint] = useState('');
  const [error, setError]     = useState('');
  const audioRef              = useRef(null);
  const recognitionRef        = useRef(null);

  // Inject styles once on mount
  useEffect(() => {
    const el = document.createElement('style');
    el.id = 'vc-styles';
    el.textContent = CALL_STYLES;
    document.head.appendChild(el);
    return () => el.remove();
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      try { URL.revokeObjectURL(audioRef.current.src); } catch {}
      audioRef.current = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    stopAudio();
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setOpen(false);
    setPhase('idle');
    setError('');
  }, [stopAudio]);

  const sendVoice = useCallback(async (transcript) => {
    console.log('[VintCall] sendVoice — transcript:', transcript);
    if (!transcript.trim()) { setPhase('idle'); return; }

    setLastUser(transcript);
    setLastVint('');
    setPhase('thinking');
    setError('');

    try {
      const fetchUrl = `${API}/vint-voice`;
      console.log('[VintCall] POST →', fetchUrl);

      const res = await fetch(fetchUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: transcript, history: messages }),
      });

      console.log('[VintCall] Response status:', res.status);

      if (!res.ok) {
        const errBody = await res.text();
        console.error('[VintCall] Server error body:', errBody);
        throw new Error(`Server ${res.status}: ${errBody}`);
      }

      const vintText = decodeURIComponent(res.headers.get('X-Vint-Text') || '');
      console.log('[VintCall] X-Vint-Text:', vintText);
      setLastVint(vintText);

      const blob = await res.blob();
      console.log('[VintCall] Blob size:', blob.size, 'type:', blob.type);

      if (blob.size === 0) throw new Error('Empty audio blob — MiniMax may not be configured');

      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      setPhase('speaking');

      audio.onended = () => {
        console.log('[VintCall] Audio ended');
        URL.revokeObjectURL(url);
        audioRef.current = null;
        setPhase('idle');
        if (vintText && onNewExchange) onNewExchange(transcript, vintText);
      };

      audio.onerror = (e) => {
        console.error('[VintCall] Audio error:', e);
        URL.revokeObjectURL(url);
        audioRef.current = null;
        setPhase('idle');
        if (vintText && onNewExchange) onNewExchange(transcript, vintText);
      };

      console.log('[VintCall] Starting playback...');
      audio.play().catch((e) => {
        console.error('[VintCall] play() rejected:', e);
        setError(`Playback blocked: ${e.message}`);
        setPhase('idle');
      });

    } catch (e) {
      console.error('[VintCall] sendVoice caught:', e);
      setError(e.message);
      setPhase('idle');
    }
  }, [messages, onNewExchange]);

  const startListening = useCallback(() => {
    // DEBUG: confirm button is reachable
    alert('[VintCall] Mic button clicked — phase: ' + phase);

    if (phase !== 'idle') return;
    setError('');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      const msg = 'Speech recognition not supported in this browser. Use Chrome.';
      setError(msg);
      console.error('[VintCall]', msg);
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    recognitionRef.current = rec;
    let gotResult = false;

    rec.onstart = () => {
      console.log('[VintCall] Recognition started');
      setPhase('listening');
    };

    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      const confidence = e.results[0][0].confidence;
      console.log('[VintCall] Result:', transcript, '| confidence:', confidence);
      gotResult = true;
      recognitionRef.current = null;
      sendVoice(transcript);
    };

    rec.onerror = (e) => {
      console.error('[VintCall] Recognition error:', e.error);
      recognitionRef.current = null;
      gotResult = true;
      if (e.error !== 'no-speech') setError(`Mic error: ${e.error}`);
      setPhase('idle');
    };

    rec.onend = () => {
      console.log('[VintCall] Recognition onend — gotResult:', gotResult);
      recognitionRef.current = null;
      if (!gotResult) setPhase('idle');
    };

    console.log('[VintCall] rec.start()...');
    rec.start();
  }, [phase, sendVoice]);

  const stopListening = useCallback(() => {
    console.log('[VintCall] stopListening called');
    if (recognitionRef.current) recognitionRef.current.stop();
  }, []);

  const statusLabel = {
    idle:      'Tap mic to speak',
    listening: 'Listening…',
    thinking:  'Thinking…',
    speaking:  'Speaking…',
  }[phase];

  return (
    <>
      {/* Trigger button — inline on page */}
      <button className="vc-trigger" onClick={() => setOpen(true)}>
        <span className="vc-pulse-dot" />
        Call Vint
      </button>

      {/* Modal rendered via portal directly into document.body */}
      {open && (
        <ModalPortal>
          <div
            className="vc-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
          >
            <div className="vc-card">

              {/* Avatar — VC initials, no external image */}
              <div className="vc-avatar-wrap">
                <div className={`vc-avatar-ring ${phase}`} />
                <div className="vc-avatar-initials">VC</div>
              </div>

              <div className="vc-name">Vint Cerf</div>
              <div className="vc-status">{statusLabel}</div>

              {/* Transcript */}
              <div className="vc-transcript">
                {!lastUser && !lastVint
                  ? <div className="vc-transcript-empty">Conversation will appear here</div>
                  : <>
                      {lastUser && <div className="vc-tx-user">{lastUser}</div>}
                      {lastVint && <div className="vc-tx-vint">{lastVint}</div>}
                    </>
                }
              </div>

              {/* Mic button */}
              <button
                className={`vc-mic-btn${phase === 'listening' ? ' listening' : ''}`}
                onClick={phase === 'listening' ? stopListening : startListening}
                disabled={phase === 'thinking' || phase === 'speaking'}
                title={phase === 'listening' ? 'Stop listening' : 'Speak'}
              >
                <MicIcon active={phase === 'listening'} />
              </button>

              {/* Error */}
              {error && <div className="vc-error">{error}</div>}

              {/* End call */}
              <button className="vc-end-btn" onClick={handleClose}>End call</button>

            </div>
          </div>
        </ModalPortal>
      )}
    </>
  );
}
