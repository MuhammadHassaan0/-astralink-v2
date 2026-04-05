import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import vintImage from '../assets/vint.jpg';

const API = 'https://astralink-v2-production.up.railway.app';

const CALL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,400;0,500;1,400&display=swap');

  @keyframes vcFadeIn   { from { opacity: 0; } to { opacity: 1; } }
  @keyframes vcPulse {
    0%, 100% { box-shadow: 0 0 0 3px rgba(34,197,94,0.25); }
    50%       { box-shadow: 0 0 0 6px rgba(34,197,94,0.08); }
  }
  @keyframes vcBlink    { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
  @keyframes ring-pulse {
    0%, 100% { transform: scale(1); opacity: 0.4; }
    50%       { transform: scale(1.08); opacity: 1; }
  }
  @keyframes ring-slow-pulse {
    0%, 100% { transform: scale(1); opacity: 0.3; }
    50%       { transform: scale(1.05); opacity: 0.7; }
  }

  /* ── Trigger button ── */
  .vc-trigger {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #6B5CE7;
    border: none;
    border-radius: 9999px;
    padding: 9px 20px 9px 14px;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: #FFFFFF;
    letter-spacing: 0.01em;
    transition: background 0.15s, box-shadow 0.15s, transform 0.1s;
    box-shadow: 0 2px 10px rgba(107,92,231,0.32);
    white-space: nowrap;
    -webkit-tap-highlight-color: transparent;
  }
  .vc-trigger:hover { background: #4A3DB5; box-shadow: 0 4px 18px rgba(107,92,231,0.42); }
  .vc-trigger:active { transform: scale(0.96); }

  .vc-pulse-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #22c55e;
    box-shadow: 0 0 0 3px rgba(34,197,94,0.25);
    animation: vcPulse 1.8s ease-in-out infinite;
    flex-shrink: 0;
  }

  /* ── Portal overlay — full dark, no card ── */
  .vc-overlay {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    background: rgba(13,10,26,0.92);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    z-index: 99999 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    animation: vcFadeIn 0.2s ease forwards;
  }

  /* ── Card — transparent, content only ── */
  .vc-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 360px;
    padding: 0 32px;
    box-sizing: border-box;
    font-family: 'DM Mono', monospace;
  }

  /* ── Avatar ── */
  .vc-avatar-wrap {
    position: relative;
    width: 144px;
    height: 144px;
    flex-shrink: 0;
  }
  .vc-avatar-ring {
    position: absolute;
    inset: -10px;
    border-radius: 50%;
    border: 2px solid rgba(107,92,231,0.35);
    transition: border-color 0.4s;
  }
  .vc-avatar-ring.speaking {
    border-color: #6B5CE7;
    animation: ring-pulse 1.2s ease-in-out infinite;
  }
  .vc-avatar-ring.thinking {
    border-color: #8B7FF0;
    animation: ring-slow-pulse 2s ease-in-out infinite;
  }
  .vc-avatar-ring.listening {
    border-color: rgba(239,68,68,0.55);
  }
  .vc-avatar-initials {
    position: absolute;
    inset: 4px;
    border-radius: 50%;
    background: linear-gradient(135deg, #2D2458 0%, #1A1040 100%);
    border: 4px solid rgba(255,255,255,0.10);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 38px;
    font-style: italic;
    color: rgba(255,255,255,0.80);
    box-shadow: 0 8px 40px rgba(0,0,0,0.55);
    user-select: none;
  }

  /* ── Name & status ── */
  .vc-name {
    font-size: 22px;
    font-weight: 600;
    color: #FFFFFF;
    margin-top: 24px;
    margin-bottom: 4px;
    letter-spacing: -0.01em;
    text-align: center;
    font-family: 'DM Mono', monospace;
  }
  .vc-status {
    font-size: 12px;
    color: rgba(155,152,176,0.9);
    letter-spacing: 0.04em;
    min-height: 18px;
    text-align: center;
    margin-bottom: 20px;
    font-family: 'DM Mono', monospace;
  }
  .vc-status.recording       { color: rgba(255,255,255,0.65); animation: vcBlink 0.9s ease-in-out infinite; }
  .vc-status.thinking-status { color: #8B7FF0; }
  .vc-status.speaking-status { color: #8B7FF0; }

  /* ── Transcript ── */
  .vc-transcript {
    background: rgba(255,255,255,0.07);
    border-radius: 16px;
    padding: 14px 18px;
    width: 100%;
    box-sizing: border-box;
    margin-bottom: 28px;
    min-height: 64px;
    max-height: 96px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .vc-transcript-empty {
    font-size: 12px;
    color: rgba(255,255,255,0.25);
    text-align: center;
    font-style: italic;
    margin: auto;
  }
  .vc-tx-user { font-size:12px; color:#8B7FF0; text-align:right; line-height:1.5; }
  .vc-tx-vint { font-size:13px; color:rgba(255,255,255,0.80); text-align:left; line-height:1.6; font-family:Georgia,serif; }

  /* ── Controls row ── */
  .vc-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 32px;
  }

  /* ── Mic button ── */
  .vc-mic-btn {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: rgba(255,255,255,0.10);
    border: 1.5px solid rgba(255,255,255,0.18);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.15s, transform 0.1s;
    flex-shrink: 0;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
    touch-action: none;
  }
  .vc-mic-btn:hover:not(:disabled) { background: rgba(255,255,255,0.18); }
  .vc-mic-btn:active:not(:disabled) { transform: scale(0.90); }
  .vc-mic-btn.recording {
    background: rgba(107,92,231,0.30);
    border-color: #6B5CE7;
  }
  .vc-mic-btn:disabled { opacity: 0.32; cursor: not-allowed; }
  .vc-mic-icon { width: 26px; height: 26px; pointer-events: none; }

  /* ── Hint text ── */
  .vc-mic-hint {
    font-size: 10px;
    color: rgba(155,152,176,0.70);
    letter-spacing: 0.10em;
    text-transform: uppercase;
    margin-top: 16px;
    text-align: center;
    font-family: 'DM Mono', monospace;
  }
  .vc-mic-hint.recording { color: rgba(239,68,68,0.85); }

  /* ── Error ── */
  .vc-error {
    font-size: 11px;
    color: #EF4444;
    margin-top: 10px;
    text-align: center;
    max-width: 280px;
    word-break: break-word;
    font-family: 'DM Mono', monospace;
  }

  /* ── End call button ── */
  .vc-end-btn {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: #EF4444;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.15s, transform 0.1s;
    box-shadow: 0 4px 20px rgba(239,68,68,0.38);
    flex-shrink: 0;
    -webkit-tap-highlight-color: transparent;
  }
  .vc-end-btn:hover { background: #DC2626; }
  .vc-end-btn:active { transform: scale(0.90); }
`;

const MicIcon = ({ recording }) => (
  <svg className="vc-mic-icon" viewBox="0 0 24 24" fill="none"
    stroke={recording ? '#ef4444' : 'rgba(255,255,255,0.90)'} strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="2" width="6" height="12" rx="3"/>
    <path d="M19 10a7 7 0 0 1-14 0"/>
    <line x1="12" y1="19" x2="12" y2="22"/>
    <line x1="8" y1="22" x2="16" y2="22"/>
  </svg>
);

export default function VintCall({ messages = [], onNewExchange }) {
  const [open, setOpen]         = useState(false);
  const [phase, setPhase]       = useState('idle'); // idle | recording | thinking | speaking
  const [lastUser, setLastUser] = useState('');
  const [lastVint, setLastVint] = useState('');
  const [error, setError]       = useState('');

  const audioRef        = useRef(null);
  const mediaRecRef     = useRef(null);
  const chunksRef       = useRef([]);
  const streamRef       = useRef(null);

  // Inject styles once
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

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    stopAudio();
    stopStream();
    if (mediaRecRef.current && mediaRecRef.current.state !== 'inactive') {
      try { mediaRecRef.current.stop(); } catch {}
    }
    mediaRecRef.current = null;
    chunksRef.current = [];
    setOpen(false);
    setPhase('idle');
    setError('');
  }, [stopAudio, stopStream]);

  // Called once we have a recorded blob — transcribe then synthesise
  const handleBlob = useCallback(async (blob) => {
    console.log('[VintCall] handleBlob — size:', blob.size, 'type:', blob.type);
    if (blob.size < 1000) {
      console.warn('[VintCall] Blob too small, ignoring');
      setPhase('idle');
      return;
    }

    setPhase('thinking');
    setError('');

    try {
      // 1. Transcribe via Groq Whisper
      const fd = new FormData();
      fd.append('audio', blob, 'audio.webm');
      console.log('[VintCall] POST /vint-transcribe...');
      const txRes = await fetch(`${API}/vint-transcribe`, { method: 'POST', body: fd });
      console.log('[VintCall] /vint-transcribe status:', txRes.status);

      if (!txRes.ok) {
        const errBody = await txRes.text();
        console.error('[VintCall] Transcribe error:', errBody);
        throw new Error(`Transcribe failed ${txRes.status}: ${errBody}`);
      }

      const { text } = await txRes.json();
      console.log('[VintCall] Transcript:', text);

      if (!text || !text.trim()) {
        setError('No speech detected. Hold the mic and speak clearly.');
        setPhase('idle');
        return;
      }

      setLastUser(text);
      setLastVint('');

      // 2. Get Vint's voice response
      console.log('[VintCall] POST /vint-voice...');
      const voiceRes = await fetch(`${API}/vint-voice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, history: messages }),
      });
      console.log('[VintCall] /vint-voice status:', voiceRes.status);

      if (!voiceRes.ok) {
        const errBody = await voiceRes.text();
        console.error('[VintCall] Voice error:', errBody);
        throw new Error(`Voice failed ${voiceRes.status}: ${errBody}`);
      }

      const vintText = decodeURIComponent(voiceRes.headers.get('X-Vint-Text') || '');
      console.log('[VintCall] X-Vint-Text:', vintText);
      setLastVint(vintText);

      const arrayBuffer = await voiceRes.arrayBuffer();
      console.log('[VintCall] Audio data size:', arrayBuffer.byteLength);

      if (arrayBuffer.byteLength === 0) throw new Error('Empty audio — check TTS server');

      setPhase('speaking');

      const audioBlob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audioEl = new Audio(audioUrl);
      audioRef.current = audioEl;
      audioEl.onended = () => {
        console.log('[VintCall] Playback ended');
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        setPhase('idle');
        if (vintText && onNewExchange) onNewExchange(text, vintText);
      };
      audioEl.play();

    } catch (e) {
      console.error('[VintCall] handleBlob caught:', e);
      setError(e.message);
      setPhase('idle');
    }
  }, [messages, onNewExchange]);

  // ── Start recording ──────────────────────────────────────────────────
  const startRecording = useCallback(async (e) => {
    e.preventDefault();
    if (phase !== 'idle') return;
    setError('');
    console.log('[VintCall] startRecording');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Pick a supported MIME type
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg', '']
        .find(m => !m || MediaRecorder.isTypeSupported(m)) || '';

      console.log('[VintCall] Using MIME type:', mimeType || '(browser default)');
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecRef.current = rec;
      chunksRef.current = [];

      rec.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
      };

      rec.onstop = () => {
        stopStream();
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' });
        chunksRef.current = [];
        handleBlob(blob);
      };

      rec.start();
      setPhase('recording');
    } catch (e) {
      console.error('[VintCall] getUserMedia error:', e);
      setError(`Mic access denied: ${e.message}`);
      setPhase('idle');
    }
  }, [phase, handleBlob, stopStream]);

  // ── Stop recording ───────────────────────────────────────────────────
  const stopRecording = useCallback((e) => {
    e.preventDefault();
    console.log('[VintCall] stopRecording — state:', mediaRecRef.current?.state);
    if (mediaRecRef.current && mediaRecRef.current.state === 'recording') {
      mediaRecRef.current.stop();
    }
  }, []);

  const statusLabel = {
    idle:      'Hold mic to speak',
    recording: 'Recording…',
    thinking:  'Thinking…',
    speaking:  'Speaking…',
  }[phase];

  const hintLabel = phase === 'recording' ? 'RELEASE TO SEND' : 'HOLD TO SPEAK';

  return (
    <>
      <button className="vc-trigger" onClick={() => setOpen(true)}>
        <span className="vc-pulse-dot" />
        Call Vint
      </button>

      {open && createPortal(
        <div
          className="vc-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <div className="vc-card">

            {/* Avatar */}
            <div className="vc-avatar-wrap">
              <div className={`vc-avatar-ring ${phase === 'recording' ? 'listening' : phase}`} />
              <img src={vintImage} alt="Vint Cerf" style={{ position: 'absolute', inset: 4, width: 'calc(100% - 8px)', height: 'calc(100% - 8px)', borderRadius: '50%', objectFit: 'cover', objectPosition: 'top', border: '4px solid rgba(255,255,255,0.15)', boxShadow: '0 8px 40px rgba(0,0,0,0.55)' }} />
            </div>

            <div className="vc-name">Vint Cerf</div>
            <div className={`vc-status${phase === 'recording' ? ' recording' : phase === 'thinking' ? ' thinking-status' : phase === 'speaking' ? ' speaking-status' : ''}`}>
              {statusLabel}
            </div>

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

            {/* Controls — mic + end call side by side */}
            <div className="vc-controls">
              <button
                className={`vc-mic-btn${phase === 'recording' ? ' recording' : ''}`}
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onMouseLeave={phase === 'recording' ? stopRecording : undefined}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                disabled={phase === 'thinking' || phase === 'speaking'}
                title={hintLabel}
              >
                <MicIcon recording={phase === 'recording'} />
              </button>

              <button className="vc-end-btn" onClick={handleClose}>
                {/* Phone hang-up icon */}
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                  stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07C6.88 17.2 4.8 15.12 3.07 12.72A19.73 19.73 0 0 1 0 4.05 2 2 0 0 1 2 1.87h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L6 9.78a16 16 0 0 0 4.68 3.53z"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>

            <div className={`vc-mic-hint${phase === 'recording' ? ' recording' : ''}`}>
              {hintLabel}
            </div>

            {error && <div className="vc-error">{error}</div>}

          </div>
        </div>,
        document.body
      )}
    </>
  );
}
