import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import mamdaniImage from '../assets/mamdani.jpg';

const API        = 'https://astralink-v2-production.up.railway.app';
const COOLDOWN_MS = 1500; // wait after TTS finishes before returning to idle

const STYLES = `
  @keyframes mrvFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes mrvSlideUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes mrvPulse {
    0%   { box-shadow: 0 0 0 0px  rgba(46,204,113,0.7), 0 0 0 3px #2ecc71; }
    70%  { box-shadow: 0 0 0 22px rgba(46,204,113,0),   0 0 0 3px #2ecc71; }
    100% { box-shadow: 0 0 0 0px  rgba(46,204,113,0),   0 0 0 3px #2ecc71; }
  }
  @keyframes mrvSpeaking {
    0%, 100% { box-shadow: 0 0 0 4px rgba(46,204,113,0.9), 0 0 0 10px rgba(46,204,113,0.3); }
    50%      { box-shadow: 0 0 0 9px rgba(46,204,113,0.6), 0 0 0 18px rgba(46,204,113,0.1); }
  }
  @keyframes mrvProcessing {
    0%   { box-shadow: 0 0 0 3px #2ecc71; opacity: 1; }
    50%  { box-shadow: 0 0 0 3px #27ae60; opacity: 0.7; }
    100% { box-shadow: 0 0 0 3px #2ecc71; opacity: 1; }
  }
  @keyframes mrvHoldPulse {
    0%, 100% { transform: scale(1);    box-shadow: 0 0 0 0   rgba(231,76,60,0.5); }
    50%      { transform: scale(1.08); box-shadow: 0 0 0 14px rgba(231,76,60,0);   }
  }

  .mrv-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(0, 0, 0, 0.97);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 24px;
    animation: mrvFadeIn 0.25s ease forwards;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  .mrv-close {
    position: absolute;
    top: 20px;
    right: 20px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #1e1e1e;
    border: 1px solid #333;
    color: #777;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: color 0.15s, background 0.15s;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
  }
  .mrv-close:hover { background: #2a2a2a; color: #ccc; }

  .mrv-avatar {
    width: 148px;
    height: 148px;
    border-radius: 50%;
    object-fit: cover;
    object-position: top;
    display: block;
    border: 3px solid #2ecc71;
    animation: mrvSlideUp 0.4s ease forwards;
    flex-shrink: 0;
  }
  .mrv-avatar.mrv-recording  { animation: mrvSlideUp 0.4s ease forwards, mrvPulse 1.4s ease-out infinite 0.4s; }
  .mrv-avatar.mrv-speaking   { animation: mrvSlideUp 0.4s ease forwards, mrvSpeaking 0.75s ease-in-out infinite 0.4s; }
  .mrv-avatar.mrv-processing { animation: mrvSlideUp 0.4s ease forwards, mrvProcessing 1.2s ease-in-out infinite 0.4s; }

  /* Hold-to-speak button */
  .mrv-hold-btn {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    border: 3px solid #2ecc71;
    background: transparent;
    color: #2ecc71;
    font-size: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
    touch-action: none; /* prevent scroll-cancel on mobile long press */
  }
  .mrv-hold-btn:disabled {
    opacity: 0.3;
    cursor: default;
  }
  .mrv-hold-btn.mrv-held {
    background: rgba(231,76,60,0.15);
    border-color: #e74c3c;
    color: #e74c3c;
    animation: mrvHoldPulse 0.9s ease-in-out infinite;
  }

  .mrv-status {
    font-size: 15px;
    font-weight: 500;
    color: #666;
    letter-spacing: 0.02em;
    text-align: center;
    min-height: 22px;
    transition: color 0.3s;
  }
  .mrv-status.mrv-active { color: #2ecc71; }
  .mrv-status.mrv-rec    { color: #e74c3c; }
  .mrv-status.mrv-error  { color: #e74c3c; }

  .mrv-hint {
    font-size: 12px;
    color: #3a3a3a;
    text-align: center;
    max-width: 240px;
    line-height: 1.6;
    margin-top: -8px;
  }
`;

export default function MamdaniRealtimeVoice({ onNewExchange, onClose }) {
  const [phase,  setPhase]  = useState('connecting');
  const [errMsg, setErrMsg] = useState('');

  const onNewExchangeRef   = useRef(onNewExchange);
  const startRecordingRef  = useRef(null); // bridge: closure fn → JSX handler
  const stopRecordingRef   = useRef(null);
  useEffect(() => { onNewExchangeRef.current = onNewExchange; }, [onNewExchange]);

  // ── Inject CSS ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = document.createElement('style');
    el.id = 'mrv-styles';
    el.textContent = STYLES;
    document.head.appendChild(el);
    return () => document.getElementById('mrv-styles')?.remove();
  }, []);

  // ── Main pipeline ──────────────────────────────────────────────────────────
  useEffect(() => {
    let closed     = false;
    let micStream  = null;
    let mediaRec   = null;
    let recChunks  = [];
    let phaseLocal = 'connecting';

    const go = (p) => {
      if (closed) return;
      phaseLocal = p;
      setPhase(p);
    };

    // ── Play one MP3 chunk (base64) via HTML Audio ────────────────────────
    const playChunk = (b64) => new Promise((resolve) => {
      console.log(`[MamdaniRTV] playChunk — b64.length=${b64.length} (~${Math.round(b64.length * 0.75 / 1024)}KB)`);
      const binary = atob(b64);
      const bytes  = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob  = new Blob([bytes], { type: 'audio/mpeg' });
      const url   = URL.createObjectURL(blob);
      const audio = new Audio(url);

      audio.onended = () => {
        console.log('[MamdaniRTV] playChunk onended');
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.onerror = (e) => {
        console.error('[MamdaniRTV] playChunk onerror:', e.message ?? e);
        URL.revokeObjectURL(url);
        resolve();
      };

      console.log('[MamdaniRTV] playChunk — calling audio.play()');
      audio.play().catch((e) => {
        console.error('[MamdaniRTV] playChunk play() rejected:', e.message);
        URL.revokeObjectURL(url);
        resolve();
      });
    });

    // ── Drain SSE response sequentially; return mamdaniText ───────────────
    const playAudio = (response) => new Promise(async (resolve) => {
      let mamdaniText = '';
      let resolved    = false;
      const done_ = () => { if (!resolved) { resolved = true; resolve(mamdaniText); } };

      const pending    = [];
      let   playing    = false;
      let   serverDone = false;

      const drainQueue = async () => {
        if (playing) return;
        playing = true;
        console.log(`[MamdaniRTV] drainQueue — ${pending.length} chunks`);
        while (pending.length > 0) {
          const b64 = pending.shift();
          console.log(`[MamdaniRTV] drainQueue — playing, ${pending.length} remaining`);
          await playChunk(b64);
        }
        playing = false;
        console.log(`[MamdaniRTV] drainQueue empty — serverDone=${serverDone}`);
        if (serverDone) done_();
      };

      const reader = response.body.getReader();
      const dec    = new TextDecoder();
      let   sseBuf = '';
      let   sseN   = 0;
      console.log('[MamdaniRTV] SSE open — reading stream');

      try {
        while (true) {
          const { done: streamDone, value } = await reader.read();
          if (streamDone) { console.log('[MamdaniRTV] SSE stream closed'); break; }

          sseBuf += dec.decode(value, { stream: true });
          const lines = sseBuf.split('\n');
          sseBuf = lines.pop();

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (!data) continue;

            sseN++;
            console.log(`[MamdaniRTV] SSE event #${sseN} length=${data.length} first8="${data.slice(0, 8)}"`);

            if (data === '[DONE]') {
              console.log(`[MamdaniRTV] [DONE] — playing=${playing} pending=${pending.length}`);
              serverDone = true;
              if (!playing && pending.length === 0) done_();
              continue;
            }

            if (data.startsWith('{')) {
              try {
                const parsed = JSON.parse(data);
                if (parsed.type === 'meta' && parsed.text) {
                  mamdaniText = parsed.text;
                  console.log(`[MamdaniRTV] meta ✓ — ${mamdaniText.length} chars`);
                }
              } catch (e) { console.warn('[MamdaniRTV] JSON parse failed:', e.message); }
              continue;
            }

            console.log(`[MamdaniRTV] audio chunk #${sseN} queued — playing=${playing}`);
            pending.push(data);
            drainQueue();
          }
        }
      } catch (e) {
        console.error('[MamdaniRTV] SSE read error:', e.name, e.message);
      }

      if (!serverDone) {
        serverDone = true;
        console.log('[MamdaniRTV] stream ended without [DONE]');
        if (!playing && pending.length === 0) done_();
      }
    });

    // ── Submit blob → server ─────────────────────────────────────────────
    const submitBlob = async (blob) => {
      if (closed) return;
      go('processing');

      try {
        const fd = new FormData();
        fd.append('audio', blob, 'audio.webm');

        console.log(`[MamdaniRTV] submitBlob — POSTing ${blob.size}B`);
        const voiceRes = await fetch(`${API}/mamdani-realtime-voice`, { method: 'POST', body: fd });
        if (!voiceRes.ok) throw new Error(`Server error ${voiceRes.status}`);

        const transcriptText = decodeURIComponent(voiceRes.headers.get('X-Transcript-Text') || '');
        console.log(`[MamdaniRTV] response ok — status=${voiceRes.status} transcript="${transcriptText}"`);

        if (closed) return;
        go('speaking');

        console.log('[MamdaniRTV] calling playAudio');
        const mamdaniText = await playAudio(voiceRes);
        console.log(`[MamdaniRTV] playAudio done — ${mamdaniText.length} chars`);

        if (closed) return;
        if (transcriptText && mamdaniText) {
          onNewExchangeRef.current?.(transcriptText, mamdaniText);
        }

        console.log(`[MamdaniRTV] waiting ${COOLDOWN_MS}ms cooldown`);
        setTimeout(() => {
          if (closed) return;
          console.log('[MamdaniRTV] cooldown done — back to idle');
          go('idle');
        }, COOLDOWN_MS);

      } catch (e) {
        console.error('[MamdaniRTV] submitBlob error:', e);
        if (!closed) { go('error'); setErrMsg(e.message || 'Something went wrong'); }
      }
    };

    // ── Start recording (called on button press) ──────────────────────────
    const startRecording = () => {
      if (closed || phaseLocal !== 'idle') return;

      // Re-acquire mic if tracks died while idle
      if (!micStream || micStream.getTracks().some(t => t.readyState === 'ended')) {
        go('connecting');
        initMic();
        return;
      }

      recChunks = [];
      const mimeType =
        ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', '']
          .find(m => !m || MediaRecorder.isTypeSupported(m)) || '';

      mediaRec = new MediaRecorder(micStream, mimeType ? { mimeType } : {});
      mediaRec.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) recChunks.push(ev.data);
      };
      mediaRec.onstop = () => {
        if (closed) return;
        const blob = new Blob(recChunks, { type: mediaRec.mimeType || 'audio/webm' });
        recChunks = [];
        console.log(`[MamdaniRTV] MediaRecorder stopped — blob ${blob.size}B`);
        if (blob.size < 1000) {
          console.log('[MamdaniRTV] blob too small — back to idle');
          go('idle');
          return;
        }
        submitBlob(blob);
      };

      mediaRec.start(100);
      go('recording');
      console.log('[MamdaniRTV] MediaRecorder started — press-and-hold active');
    };

    // ── Stop recording (called on button release) ─────────────────────────
    const stopRecording = () => {
      if (mediaRec?.state === 'recording') {
        console.log('[MamdaniRTV] stopRecording — stopping MediaRecorder');
        mediaRec.stop();
      }
    };

    // Expose to JSX via refs (closure fns can't be called directly from JSX)
    startRecordingRef.current = startRecording;
    stopRecordingRef.current  = stopRecording;

    // ── Acquire mic — set idle when ready, do NOT auto-start recording ────
    const initMic = async () => {
      if (closed) return;
      try {
        console.log('[MamdaniRTV] initMic — requesting getUserMedia');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (closed) { stream.getTracks().forEach(t => t.stop()); return; }
        micStream = stream;
        console.log('[MamdaniRTV] initMic ✓ — mic acquired, waiting for button press');
        go('idle');
      } catch (err) {
        console.error('[MamdaniRTV] getUserMedia error:', err);
        if (!closed) { go('error'); setErrMsg('Microphone access denied'); }
      }
    };

    initMic();

    return () => {
      closed = true;
      startRecordingRef.current = null;
      stopRecordingRef.current  = null;
      if (mediaRec?.state === 'recording') try { mediaRec.stop(); } catch {}
      micStream?.getTracks().forEach(t => t.stop());
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Press-and-hold handlers ────────────────────────────────────────────────
  const handlePressStart = (e) => {
    e.preventDefault(); // prevent touch scroll / context menu
    startRecordingRef.current?.();
  };
  const handlePressEnd = (e) => {
    e.preventDefault();
    stopRecordingRef.current?.();
  };

  // ── Derived UI ────────────────────────────────────────────────────────────
  const statusText = {
    connecting: 'Connecting…',
    idle:       'Ready',
    recording:  'Recording…',
    processing: 'Thinking…',
    speaking:   'Speaking…',
    error:      errMsg || 'Something went wrong',
  }[phase] ?? '';

  const hintText = {
    connecting: 'Setting up microphone…',
    idle:       'Hold to speak — release to send',
    recording:  'Release to send',
    processing: 'Processing your question…',
    speaking:   'Playing response…',
    error:      'Close and try again',
  }[phase] ?? '';

  const avatarClass = [
    'mrv-avatar',
    phase === 'recording'  ? 'mrv-recording'  : '',
    phase === 'speaking'   ? 'mrv-speaking'   : '',
    phase === 'processing' ? 'mrv-processing' : '',
  ].filter(Boolean).join(' ');

  const statusClass = [
    'mrv-status',
    phase === 'recording' ? 'mrv-rec'    : '',
    phase === 'speaking'  ? 'mrv-active' : '',
    phase === 'error'     ? 'mrv-error'  : '',
  ].filter(Boolean).join(' ');

  // Button is only interactive when idle or recording
  const btnDisabled = phase !== 'idle' && phase !== 'recording';
  const btnHeld     = phase === 'recording';

  return createPortal(
    <div className="mrv-overlay" role="dialog" aria-modal="true" aria-label="Voice chat with Mamdani">
      <button className="mrv-close" onClick={onClose} aria-label="Close voice mode">✕</button>

      <img src={mamdaniImage} alt="Zohran Mamdani" className={avatarClass} />

      {/* Hold-to-speak button — only shown when mic is ready or recording */}
      {(phase === 'idle' || phase === 'recording') && (
        <button
          className={`mrv-hold-btn${btnHeld ? ' mrv-held' : ''}`}
          disabled={btnDisabled}
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
          onContextMenu={(e) => e.preventDefault()}
          aria-label="Hold to speak"
        >
          🎙
        </button>
      )}

      <div className={statusClass}>{statusText}</div>
      {hintText && <div className="mrv-hint">{hintText}</div>}
    </div>,
    document.body
  );
}
