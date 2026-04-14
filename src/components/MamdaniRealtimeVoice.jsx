import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import mamdaniImage from '../assets/mamdani.jpg';

const API = 'https://astralink-v2-production.up.railway.app';

// Silence detection — chunk-size based (no AudioContext needed)
// MediaRecorder fires every 100ms; Opus audio chunk with speech is typically
// 1 000 – 10 000+ bytes. A chunk < 500 bytes is near-silence (just headers).
const SPEECH_CHUNK_BYTES = 500;  // above → speech detected
const SILENCE_MS         = 800;  // ms of sub-threshold chunks before submitting

const STYLES = `
  @keyframes mrvFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes mrvSlideUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes mrvListening {
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

  .mrv-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(0, 0, 0, 0.97);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 28px;
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
    line-height: 1;
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
  .mrv-avatar.mrv-listening {
    animation: mrvSlideUp 0.4s ease forwards,
               mrvListening 2s ease-out infinite 0.4s;
  }
  .mrv-avatar.mrv-speaking {
    animation: mrvSlideUp 0.4s ease forwards,
               mrvSpeaking 0.75s ease-in-out infinite 0.4s;
  }
  .mrv-avatar.mrv-processing {
    animation: mrvSlideUp 0.4s ease forwards,
               mrvProcessing 1.2s ease-in-out infinite 0.4s;
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
  .mrv-status.mrv-error  { color: #e74c3c; }

  .mrv-hint {
    font-size: 12px;
    color: #3a3a3a;
    text-align: center;
    max-width: 220px;
    line-height: 1.6;
    margin-top: -12px;
  }
`;

export default function MamdaniRealtimeVoice({ onNewExchange, onClose }) {
  const [phase,  setPhase]  = useState('connecting');
  const [errMsg, setErrMsg] = useState('');

  const onNewExchangeRef = useRef(onNewExchange);
  useEffect(() => { onNewExchangeRef.current = onNewExchange; }, [onNewExchange]);

  // ── Inject CSS ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = document.createElement('style');
    el.id = 'mrv-styles';
    el.textContent = STYLES;
    document.head.appendChild(el);
    return () => document.getElementById('mrv-styles')?.remove();
  }, []);

  // ── Main audio pipeline ────────────────────────────────────────────────────
  useEffect(() => {
    let closed     = false;
    let micStream  = null;
    let mediaRec   = null;
    let recChunks  = [];
    let hasSpeech  = false;
    let silTimer   = null;
    let phaseLocal = 'connecting';

    const go = (p) => {
      if (closed) return;
      phaseLocal = p;
      setPhase(p);
    };

    // ── Play one MP3 chunk from base64 via HTML Audio ─────────────────────
    const playChunk = (b64) => new Promise((resolve) => {
      console.log(`[MamdaniRTV] playChunk — b64.length=${b64.length} (~${Math.round(b64.length * 0.75 / 1024)}KB)`);
      const binary = atob(b64);
      const bytes  = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: 'audio/mpeg' });
      const url  = URL.createObjectURL(blob);
      const audio = new Audio(url);

      audio.onended = () => {
        console.log('[MamdaniRTV] playChunk — onended, revoking URL');
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.onerror = (e) => {
        console.error('[MamdaniRTV] playChunk — onerror:', e.message ?? e);
        URL.revokeObjectURL(url);
        resolve(); // skip and continue
      };

      console.log('[MamdaniRTV] playChunk — calling audio.play()');
      audio.play().catch((e) => {
        console.error('[MamdaniRTV] playChunk — play() rejected:', e.message);
        URL.revokeObjectURL(url);
        resolve();
      });
    });

    // ── Play full SSE response — sequential drain queue ────────────────────
    // Returns Promise<string> resolving to mamdaniText once all chunks played.
    const playAudio = (response) => new Promise(async (resolve) => {
      let mamdaniText = '';
      let resolved    = false;
      const done_ = () => { if (!resolved) { resolved = true; resolve(mamdaniText); } };

      const pending  = []; // b64 strings queued to play
      let   playing  = false;
      let   serverDone = false;

      // Drain pending queue sequentially; resolve when empty + serverDone
      const drainQueue = async () => {
        if (playing) return; // already draining
        playing = true;
        console.log(`[MamdaniRTV] drainQueue start — ${pending.length} chunks queued`);
        while (pending.length > 0) {
          const b64 = pending.shift();
          console.log(`[MamdaniRTV] drainQueue — playing chunk, ${pending.length} remaining after this`);
          await playChunk(b64);
        }
        playing = false;
        console.log(`[MamdaniRTV] drainQueue empty — serverDone=${serverDone}`);
        if (serverDone) done_();
      };

      // Parse SSE stream
      const reader = response.body.getReader();
      const dec    = new TextDecoder();
      let sseBuf   = '';
      let sseEventCount = 0;
      console.log('[MamdaniRTV] SSE connection open — starting stream read loop');

      try {
        while (true) {
          const { done: streamDone, value } = await reader.read();
          if (streamDone) { console.log('[MamdaniRTV] SSE stream body closed (done=true)'); break; }

          sseBuf += dec.decode(value, { stream: true });
          const lines = sseBuf.split('\n');
          sseBuf = lines.pop();

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (!data) continue;

            sseEventCount++;
            console.log(`[MamdaniRTV] SSE event #${sseEventCount} — length=${data.length} first8="${data.slice(0, 8)}"`);

            if (data === '[DONE]') {
              console.log(`[MamdaniRTV] [DONE] received — playing=${playing} pending=${pending.length}`);
              serverDone = true;
              if (!playing && pending.length === 0) {
                console.log('[MamdaniRTV] [DONE] — queue already empty, resolving immediately');
                done_();
              }
              continue;
            }

            // Meta event: {"type":"meta","text":"..."}
            if (data.startsWith('{')) {
              try {
                const parsed = JSON.parse(data);
                if (parsed.type === 'meta' && parsed.text) {
                  mamdaniText = parsed.text;
                  console.log(`[MamdaniRTV] meta event ✓ — ${mamdaniText.length} chars: "${mamdaniText.slice(0, 80)}"`);
                } else {
                  console.log(`[MamdaniRTV] JSON event unknown type="${parsed.type}"`);
                }
              } catch (e) {
                console.warn(`[MamdaniRTV] JSON parse failed: ${e.message}`);
              }
              continue;
            }

            // Audio chunk — push to queue and kick off drain if idle
            console.log(`[MamdaniRTV] audio chunk #${sseEventCount} queued — playing=${playing}`);
            pending.push(data);
            drainQueue(); // no-op if already draining
          }
        }
      } catch (streamErr) {
        console.error('[MamdaniRTV] SSE read error:', streamErr.name, streamErr.message);
      }

      // Stream closed without explicit [DONE]
      if (!serverDone) {
        serverDone = true;
        console.log('[MamdaniRTV] SSE closed without [DONE] — serverDone forced');
        if (!playing && pending.length === 0) done_();
      }
    });

    // ── Submit recorded blob to server ─────────────────────────────────────
    const submitBlob = async (blob) => {
      if (closed) return;
      go('processing');

      try {
        const fd = new FormData();
        fd.append('audio', blob, 'audio.webm');

        console.log(`[MamdaniRTV] submitBlob — POSTing ${blob.size}B to ${API}/mamdani-realtime-voice`);
        const voiceRes = await fetch(`${API}/mamdani-realtime-voice`, { method: 'POST', body: fd });
        if (!voiceRes.ok) throw new Error(`Server error ${voiceRes.status}`);

        const transcriptText = decodeURIComponent(voiceRes.headers.get('X-Transcript-Text') || '');
        console.log(`[MamdaniRTV] SSE connection opened — status=${voiceRes.status} transcript="${transcriptText}"`);

        if (closed) return;
        go('speaking');

        console.log('[MamdaniRTV] calling playAudio — awaiting all chunks');
        const mamdaniText = await playAudio(voiceRes);
        console.log(`[MamdaniRTV] playAudio resolved — mamdaniText="${mamdaniText.slice(0, 80)}" (${mamdaniText.length} chars)`);

        if (closed) return;
        if (transcriptText && mamdaniText) {
          onNewExchangeRef.current?.(transcriptText, mamdaniText);
        }

        // 1500ms cooldown before re-listening (prevents immediate re-trigger from room noise)
        console.log('[MamdaniRTV] starting 1500ms cooldown before re-listening');
        setTimeout(() => {
          if (closed) return;
          console.log('[MamdaniRTV] cooldown elapsed — calling startListening()');
          startListening();
        }, 1500);

      } catch (e) {
        console.error('[MamdaniRTV] submitBlob error:', e);
        if (!closed) { go('error'); setErrMsg(e.message || 'Something went wrong'); }
      }
    };

    // ── Start listening session ────────────────────────────────────────────
    const startListening = () => {
      if (closed) return;
      hasSpeech = false;
      recChunks = [];
      if (silTimer) { clearTimeout(silTimer); silTimer = null; }

      if (!micStream || micStream.getTracks().some(t => t.readyState === 'ended')) {
        go('connecting');
        initMic();
        return;
      }

      const mimeType =
        ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', '']
          .find(m => !m || MediaRecorder.isTypeSupported(m)) || '';

      mediaRec = new MediaRecorder(micStream, mimeType ? { mimeType } : {});

      mediaRec.ondataavailable = (ev) => {
        if (!ev.data || ev.data.size === 0) return;
        recChunks.push(ev.data);

        // Silence detection via chunk size — no AudioContext needed.
        // Opus audio with real speech is typically 1 000 – 10 000 bytes per 100ms.
        // Near-silence (just codec headers/padding) is < 500 bytes.
        if (ev.data.size >= SPEECH_CHUNK_BYTES) {
          if (!hasSpeech) console.log(`[MamdaniRTV] speech detected — chunk ${ev.data.size}B`);
          hasSpeech = true;
          if (silTimer) { clearTimeout(silTimer); silTimer = null; }
        } else if (hasSpeech && !silTimer) {
          console.log(`[MamdaniRTV] silence after speech — chunk ${ev.data.size}B, starting ${SILENCE_MS}ms timer`);
          silTimer = setTimeout(() => {
            silTimer = null;
            if (phaseLocal === 'listening' && mediaRec?.state === 'recording') {
              console.log('[MamdaniRTV] silence timeout — stopping MediaRecorder');
              mediaRec.stop();
            }
          }, SILENCE_MS);
        }
      };

      mediaRec.onstop = () => {
        if (closed) return;
        const blob = new Blob(recChunks, { type: mediaRec.mimeType || 'audio/webm' });
        recChunks = [];
        console.log(`[MamdaniRTV] MediaRecorder stopped — blob ${blob.size}B hasSpeech=${hasSpeech}`);
        if (blob.size < 1000 || !hasSpeech) {
          console.log('[MamdaniRTV] blob too short or no speech — restarting listener');
          startListening();
          return;
        }
        submitBlob(blob);
      };

      mediaRec.start(100); // 100ms timeslices for fine-grained silence detection
      console.log('[MamdaniRTV] MediaRecorder started — listening');
      go('listening');
    };

    // ── Init mic ──────────────────────────────────────────────────────────
    const initMic = async () => {
      if (closed) return;
      try {
        console.log('[MamdaniRTV] initMic — requesting getUserMedia');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (closed) { stream.getTracks().forEach(t => t.stop()); return; }
        micStream = stream;
        console.log('[MamdaniRTV] initMic ✓ — mic stream acquired');
        startListening();
      } catch (err) {
        console.error('[MamdaniRTV] getUserMedia error:', err);
        if (!closed) { go('error'); setErrMsg('Microphone access denied'); }
      }
    };

    initMic();

    // ── Cleanup ────────────────────────────────────────────────────────────
    return () => {
      closed = true;
      if (silTimer) clearTimeout(silTimer);
      if (mediaRec?.state === 'recording') try { mediaRec.stop(); } catch {}
      micStream?.getTracks().forEach(t => t.stop());
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived UI ────────────────────────────────────────────────────────────
  const statusText = {
    connecting: 'Connecting…',
    listening:  'Listening…',
    processing: 'Thinking…',
    speaking:   'Speaking…',
    error:      errMsg || 'Something went wrong',
  }[phase] ?? '';

  const hintText = {
    listening: 'Speak naturally — I\'ll respond when you pause',
    speaking:  'Waiting to finish…',
    error:     'Close and try again',
  }[phase] ?? '';

  const avatarClass = [
    'mrv-avatar',
    phase === 'listening'  ? 'mrv-listening'  : '',
    phase === 'speaking'   ? 'mrv-speaking'   : '',
    phase === 'processing' ? 'mrv-processing' : '',
  ].filter(Boolean).join(' ');

  const statusClass = [
    'mrv-status',
    (phase === 'listening' || phase === 'speaking') ? 'mrv-active' : '',
    phase === 'error' ? 'mrv-error' : '',
  ].filter(Boolean).join(' ');

  return createPortal(
    <div className="mrv-overlay" role="dialog" aria-modal="true" aria-label="Voice chat with Mamdani">
      <button className="mrv-close" onClick={onClose} aria-label="Close voice mode">✕</button>

      <img
        src={mamdaniImage}
        alt="Zohran Mamdani"
        className={avatarClass}
      />

      <div className={statusClass}>{statusText}</div>

      {hintText && <div className="mrv-hint">{hintText}</div>}
    </div>,
    document.body
  );
}
