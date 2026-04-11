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

export default function MamdaniRealtimeVoice({ onNewExchange, onClose }) {
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
    let closed        = false;
    let audioCtx      = null;
    let analyser      = null;
    let micStream     = null;
    let mediaRec      = null;
    let recChunks     = [];
    let hasSpeech     = false;
    let silTimer      = null;
    let silCheckInt   = null;
    let rafId         = null;
    let playingEl     = null;
    let interruptInt  = null;
    let phaseLocal    = 'connecting';

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

    // ── Play audio response with interrupt detection ──────────────────────
    // Strategy: buffer the ENTIRE response first, then attempt MediaSource
    // from the buffer. On any SourceBuffer error, immediately fall back to
    // a blob URL — both paths use the same in-memory data so no re-read needed.
    const playAudio = (response) => new Promise(async (resolve) => {
      const MIME = 'audio/mpeg';

      // Guard: resolve only once (handles ended + interrupt race)
      let resolved = false;
      const done_ = () => { if (!resolved) { resolved = true; resolve(); } };

      // Interrupt poller — checks mic RMS while speaking
      const startInterruptCheck = (el) => {
        interruptInt = setInterval(() => {
          if (!analyser || phaseLocal !== 'speaking') return;
          const td = new Uint8Array(analyser.fftSize);
          analyser.getByteTimeDomainData(td);
          if (calcRMS(td) > INTERRUPT_THRESHOLD) {
            console.log('[MamdaniRTV] Interrupted by user speech');
            clearInterval(interruptInt);
            interruptInt = null;
            try { el.pause(); } catch {}
            playingEl = null;
            done_();
          }
        }, 80);
      };

      const cleanup = (url) => {
        clearInterval(interruptInt);
        interruptInt = null;
        playingEl = null;
        if (url) try { URL.revokeObjectURL(url); } catch {}
      };

      // ── Step 1: Buffer entire response body ─────────────────────────────
      let allData;
      try {
        const reader = response.body.getReader();
        const rawChunks = [];
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          rawChunks.push(value);
        }
        const totalLen = rawChunks.reduce((s, c) => s + c.length, 0);
        allData = new Uint8Array(totalLen);
        let off = 0;
        for (const c of rawChunks) { allData.set(c, off); off += c.length; }
      } catch (readErr) {
        console.error('[MamdaniRTV] Failed to buffer response:', readErr);
        done_(); return;
      }

      if (!allData.length) { done_(); return; }

      // ── Step 2: Try MediaSource from buffer ─────────────────────────────
      const canStream =
        typeof window !== 'undefined' &&
        window.MediaSource &&
        typeof MediaSource.isTypeSupported === 'function' &&
        MediaSource.isTypeSupported(MIME);

      if (canStream) {
        let msUrl = null;
        try {
          const ms = new MediaSource();
          msUrl = URL.createObjectURL(ms);
          const el = new Audio(msUrl);
          playingEl = el;

          el.onended = () => { cleanup(msUrl); done_(); };
          el.onerror = (ev) => {
            console.warn('[MamdaniRTV] Audio element error during MS playback:', ev);
            cleanup(msUrl); done_();
          };
          startInterruptCheck(el);

          await new Promise((res, rej) => {
            ms.addEventListener('sourceopen', res, { once: true });
            ms.addEventListener('error',      rej,  { once: true });
          });

          const sb = ms.addSourceBuffer(MIME);

          // Surface SourceBuffer errors into a rejected promise
          let sbReject = null;
          sb.addEventListener('error', (ev) => {
            console.warn('[MamdaniRTV] SourceBuffer error:', ev);
            if (sbReject) sbReject(new Error('SourceBuffer error'));
          });

          el.play().catch(() => {});

          // Append buffered data in 128 KB chunks to avoid quota exceeded
          const CHUNK_SIZE = 128 * 1024;
          for (let offset = 0; offset < allData.length; offset += CHUNK_SIZE) {
            if (!playingEl) { if (ms.readyState === 'open') ms.endOfStream(); return; }
            const slice = allData.slice(offset, offset + CHUNK_SIZE);
            // Wait for any pending update, with error surface
            await new Promise((res, rej) => {
              sbReject = rej;
              if (!sb.updating) { sbReject = null; res(); return; }
              sb.addEventListener('updateend', () => { sbReject = null; res(); }, { once: true });
            });
            sb.appendBuffer(slice);
            await new Promise((res, rej) => {
              sbReject = rej;
              sb.addEventListener('updateend', () => { sbReject = null; res(); }, { once: true });
            });
          }

          // Final updateend before endOfStream
          await new Promise((res, rej) => {
            sbReject = rej;
            if (!sb.updating) { sbReject = null; res(); return; }
            sb.addEventListener('updateend', () => { sbReject = null; res(); }, { once: true });
          });
          if (ms.readyState === 'open') ms.endOfStream();
          return; // let el.onended fire done_()
        } catch (msErr) {
          console.warn('[MamdaniRTV] MediaSource path failed, using blob fallback:', msErr.message);
          clearInterval(interruptInt);
          interruptInt = null;
          playingEl = null;
          if (msUrl) try { URL.revokeObjectURL(msUrl); } catch {}
          resolved = false; // reset so blob path can resolve
        }
      }

      // ── Step 3: Blob fallback from the same buffered data ───────────────
      try {
        const blob = new Blob([allData], { type: MIME });
        const url  = URL.createObjectURL(blob);
        const el   = new Audio(url);
        playingEl = el;
        el.onended = () => { cleanup(url); done_(); };
        el.onerror = () => { cleanup(url); done_(); };
        startInterruptCheck(el);
        el.play().catch(() => { cleanup(url); done_(); });
      } catch (blobErr) {
        console.error('[MamdaniRTV] Blob fallback failed:', blobErr);
        done_();
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
        audioCtx  = new (window.AudioContext || window.webkitAudioContext)();
        analyser  = audioCtx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.8;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        // NOT connected to destination — avoids echo

        // Start waveform
        rafId = requestAnimationFrame(draw);

        // Silence detection interval
        silCheckInt = setInterval(() => {
          if (closed) return;
          checkSilence();
        }, 50);

        startListening();
      } catch (err) {
        console.error('[MamdaniRTV] getUserMedia error:', err);
        if (!closed) {
          go('error');
          setErrMsg('Microphone access denied');
        }
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
      if (playingEl) { playingEl.pause(); playingEl = null; }
      audioCtx?.close();
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
