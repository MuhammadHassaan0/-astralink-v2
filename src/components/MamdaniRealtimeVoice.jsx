import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import mamdaniImage from '../assets/mamdani.jpg';

const API = 'https://astralink-v2-production.up.railway.app';

// RMS thresholds (values are 0–1 scale)
const SPEECH_THRESHOLD    = 0.012; // above → speech detected
const SILENCE_THRESHOLD   = 0.008; // below after speech → start silence timer
const INTERRUPT_THRESHOLD = 0.035; // above during playback → interrupt
const SILENCE_MS          = 600;   // ms of silence before submitting

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

  .mrv-canvas {
    display: block;
    border-radius: 12px;
    background: rgba(255,255,255,0.03);
    width: 280px;
    height: 68px;
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

function calcRMS(uint8Data) {
  let sum = 0;
  for (let i = 0; i < uint8Data.length; i++) {
    const v = (uint8Data[i] - 128) / 128;
    sum += v * v;
  }
  return Math.sqrt(sum / uint8Data.length);
}

export default function MamdaniRealtimeVoice({ onNewExchange, onClose, audioCtx: propAudioCtx }) {
  const [phase,  setPhase]  = useState('connecting');
  const [errMsg, setErrMsg] = useState('');

  const canvasRef          = useRef(null);
  const onNewExchangeRef   = useRef(onNewExchange);
  useEffect(() => { onNewExchangeRef.current = onNewExchange; }, [onNewExchange]);

  // ── Inject CSS ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = document.createElement('style');
    el.id = 'mrv-styles';
    el.textContent = STYLES;
    document.head.appendChild(el);
    return () => document.getElementById('mrv-styles')?.remove();
  }, []);

  // ── Main audio pipeline (single effect, closure-based) ────────────────────
  useEffect(() => {
    let closed              = false;
    let audioCtx            = null;  // set from propAudioCtx in initMic
    let analyser            = null;
    let micStream           = null;
    let mediaRec            = null;
    let recChunks           = [];
    let hasSpeech           = false;
    let silTimer            = null;
    let silCheckInt         = null;
    let rafId               = null;
    let interruptInt        = null;
    let currentPlayingSource = null; // active AudioBufferSourceNode during speaking
    let phaseLocal          = 'connecting';

    const go = (p) => {
      if (closed) return;
      phaseLocal = p;
      setPhase(p);
    };

    // ── Waveform draw loop ──────────────────────────────────────────────────
    const draw = () => {
      const canvas = canvasRef.current;
      if (canvas && analyser) {
        const ctx    = canvas.getContext('2d');
        const W      = canvas.width;
        const H      = canvas.height;
        const freqBuf = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(freqBuf);

        ctx.clearRect(0, 0, W, H);

        const barCount = 44;
        const step  = Math.floor(freqBuf.length / barCount);
        const barW  = W / barCount;

        for (let i = 0; i < barCount; i++) {
          const val  = freqBuf[i * step] / 255;
          const barH = Math.max(3, val * H * 0.88);
          const x    = i * barW + 2;
          const y    = (H - barH) / 2;

          let fillColor;
          if (phaseLocal === 'speaking') {
            fillColor = `rgba(46,204,113,${0.2 + val * 0.8})`;
          } else if (phaseLocal === 'listening') {
            fillColor = `rgba(46,204,113,${0.15 + val * 0.75})`;
          } else {
            fillColor = `rgba(80,80,80,${0.1 + val * 0.3})`;
          }

          ctx.fillStyle = fillColor;
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(x, y, barW - 4, barH, 2);
          } else {
            ctx.rect(x, y, barW - 4, barH);
          }
          ctx.fill();
        }
      }
      rafId = requestAnimationFrame(draw);
    };

    // ── Silence / speech detection (called by interval during 'listening') ──
    const checkSilence = () => {
      if (!analyser || phaseLocal !== 'listening') return;
      const tdBuf = new Uint8Array(analyser.fftSize);
      analyser.getByteTimeDomainData(tdBuf);
      const level = calcRMS(tdBuf);

      if (level > SPEECH_THRESHOLD) {
        hasSpeech = true;
        if (silTimer) { clearTimeout(silTimer); silTimer = null; }
      } else if (hasSpeech && level < SILENCE_THRESHOLD && !silTimer) {
        silTimer = setTimeout(() => {
          silTimer = null;
          if (phaseLocal === 'listening' && mediaRec?.state === 'recording') {
            mediaRec.stop();
          }
        }, SILENCE_MS);
      }
    };

    // ── Play audio response ───────────────────────────────────────────────
    // Server sends SSE stream of base64-encoded MP3 chunks (one per sentence).
    // AudioContext was created during the user-gesture button click so it is
    // already unlocked — decodeAudioData + BufferSourceNode.start() work
    // without autoplay restrictions regardless of how deep in async chains we are.
    // Sentences are decoded+played sequentially: source.onended triggers the next.
    const playAudio = (response) => new Promise(async (resolve) => {

      let resolved = false;
      const done_ = () => { if (!resolved) { resolved = true; resolve(); } };

      let interrupted  = false;
      let serverDone   = false;
      const pending    = []; // base64 strings received but not yet decoded
      let processing   = false; // true while a decode+play is in flight

      // Stop current source and resolve immediately (interrupt or cleanup)
      const stopAll = () => {
        if (interrupted) return;
        interrupted = true;
        clearInterval(interruptInt);
        interruptInt = null;
        if (currentPlayingSource) {
          try { currentPlayingSource.stop(0); } catch {}
          currentPlayingSource = null;
        }
        done_();
      };

      // After each source ends, call this to play the next pending chunk
      // or resolve if everything is done.
      const processNext = async () => {
        if (interrupted) return;
        if (pending.length === 0) {
          processing = false;
          if (serverDone) {
            console.log('[MamdaniRTV] Queue drained + server done → resolve');
            done_();
          }
          // else: wait — next SSE event will push to pending and call processNext
          return;
        }
        processing = true;
        const b64 = pending.shift();
        console.log(`[MamdaniRTV] Decoding chunk (${b64.length} b64 chars), ${pending.length} still queued`);

        try {
          const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
          const ab    = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
          console.log(`[MamdaniRTV] decodeAudioData (${ab.byteLength}B, ctx state=${audioCtx?.state})…`);

          const audioBuffer = await audioCtx.decodeAudioData(ab);
          console.log(`[MamdaniRTV] Decoded ${audioBuffer.duration.toFixed(2)}s — starting playback`);

          if (interrupted) { processing = false; return; }

          const src = audioCtx.createBufferSource();
          src.buffer = audioBuffer;
          src.connect(audioCtx.destination);
          currentPlayingSource = src;

          src.onended = () => {
            console.log('[MamdaniRTV] Source ended, chaining next');
            currentPlayingSource = null;
            processNext(); // chain: play next sentence immediately
          };

          src.start(0);
          console.log('[MamdaniRTV] source.start(0) called');
        } catch (err) {
          console.error('[MamdaniRTV] decode/play error:', err.message);
          currentPlayingSource = null;
          processNext(); // skip failed chunk, continue with next
        }
      };

      // Interrupt poller — mic RMS while speaking
      interruptInt = setInterval(() => {
        if (!analyser || phaseLocal !== 'speaking') return;
        const td = new Uint8Array(analyser.fftSize);
        analyser.getByteTimeDomainData(td);
        if (calcRMS(td) > INTERRUPT_THRESHOLD) {
          console.log('[MamdaniRTV] Interrupted by user speech');
          stopAll();
        }
      }, 80);

      // Parse SSE stream: each data event is one base64-encoded MP3 chunk
      const reader = response.body.getReader();
      const dec    = new TextDecoder();
      let sseBuf   = '';

      try {
        while (true) {
          const { done: streamDone, value } = await reader.read();
          if (streamDone) { console.log('[MamdaniRTV] SSE stream body closed'); break; }
          if (interrupted) { try { reader.cancel(); } catch {} break; }

          sseBuf += dec.decode(value, { stream: true });
          const lines = sseBuf.split('\n');
          sseBuf = lines.pop();

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (!data) continue;

            if (data === '[DONE]') {
              console.log('[MamdaniRTV] [DONE] received from server');
              serverDone = true;
              if (!processing && pending.length === 0) done_();
              continue;
            }

            if (interrupted) break;

            console.log(`[MamdaniRTV] SSE chunk received (${data.length} chars), processing=${processing}`);
            pending.push(data);
            if (!processing) processNext(); // kick off if idle
          }
        }
      } catch (streamErr) {
        console.error('[MamdaniRTV] SSE read error:', streamErr.message);
      }

      if (!serverDone) {
        serverDone = true;
        if (!processing && pending.length === 0) done_();
      }
    });

    // ── Submit recorded blob ──────────────────────────────────────────────
    const submitBlob = async (blob) => {
      if (closed) return;
      go('processing');

      try {
        const fd = new FormData();
        fd.append('audio', blob, 'audio.webm');

        const voiceRes = await fetch(`${API}/mamdani-realtime-voice`, { method: 'POST', body: fd });
        if (!voiceRes.ok) throw new Error(`Server error ${voiceRes.status}`);

        const transcriptText = decodeURIComponent(voiceRes.headers.get('X-Transcript-Text') || '');
        const mamdaniText    = decodeURIComponent(voiceRes.headers.get('X-Mamdani-Text')    || '');

        if (closed) return;
        go('speaking');

        await playAudio(voiceRes);

        if (closed) return;
        if (transcriptText && mamdaniText) {
          onNewExchangeRef.current?.(transcriptText, mamdaniText);
        }
        // Auto-restart
        startListening();
      } catch (e) {
        console.error('[MamdaniRTV] submitBlob error:', e);
        if (!closed) {
          go('error');
          setErrMsg(e.message || 'Something went wrong');
        }
      }
    };

    // ── Start listening session ───────────────────────────────────────────
    const startListening = () => {
      if (closed) return;
      hasSpeech = false;
      recChunks = [];
      if (silTimer) { clearTimeout(silTimer); silTimer = null; }

      // If stream tracks died, re-init
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
        if (ev.data && ev.data.size > 0) recChunks.push(ev.data);
      };
      mediaRec.onstop = () => {
        if (closed) return;
        const blob = new Blob(recChunks, { type: mediaRec.mimeType || 'audio/webm' });
        recChunks = [];
        if (blob.size < 1000) { startListening(); return; } // too short
        submitBlob(blob);
      };
      mediaRec.start(100); // 100ms timeslices
      go('listening');
    };

    // ── Init mic + AudioContext ───────────────────────────────────────────
    const initMic = async () => {
      if (closed) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (closed) { stream.getTracks().forEach(t => t.stop()); return; }

        micStream = stream;

        // Use the AudioContext created during the user-gesture button click.
        // This context is already resumed and bypasses autoplay restrictions
        // for all subsequent programmatic playback on this same context.
        audioCtx = propAudioCtx || new (window.AudioContext || window.webkitAudioContext)();
        console.log('[MamdaniRTV] AudioContext state:', audioCtx.state);
        if (audioCtx.state === 'suspended') {
          await audioCtx.resume().catch(() => {});
          console.log('[MamdaniRTV] AudioContext resumed');
        }

        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.8;

        const micSource = audioCtx.createMediaStreamSource(stream);
        micSource.connect(analyser);
        // NOT connected to destination — avoids mic echo

        rafId = requestAnimationFrame(draw);
        silCheckInt = setInterval(() => { if (closed) return; checkSilence(); }, 50);

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
      cancelAnimationFrame(rafId);
      clearInterval(silCheckInt);
      clearInterval(interruptInt);
      if (silTimer)   clearTimeout(silTimer);
      if (mediaRec?.state === 'recording') try { mediaRec.stop(); } catch {}
      micStream?.getTracks().forEach(t => t.stop());
      if (currentPlayingSource) { try { currentPlayingSource.stop(0); } catch {} currentPlayingSource = null; }
      // Don't close audioCtx — it is owned by MamdaniPage and closed in onClose
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived UI text ────────────────────────────────────────────────────────
  const statusText = {
    connecting:  'Connecting…',
    listening:   'Listening…',
    processing:  'Thinking…',
    speaking:    'Speaking…',
    error:       errMsg || 'Something went wrong',
  }[phase] ?? '';

  const hintText = {
    listening: 'Speak naturally — I\'ll respond when you pause',
    speaking:  'Speak to interrupt',
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

      <canvas
        ref={canvasRef}
        className="mrv-canvas"
        width={560}
        height={136}
      />

      <div className={statusClass}>{statusText}</div>

      {hintText && <div className="mrv-hint">{hintText}</div>}
    </div>,
    document.body
  );
}
