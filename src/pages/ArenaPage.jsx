import React, { useState, useEffect, useRef } from 'react';

const API = 'https://astralink-v2-production.up.railway.app';

// ── Twin identity — each creator carries a color, an rgb triplet (for auras /
//    washes), initials, and a real photo (falls back to initials). ────────────
const TWINS = {
  mrbeast:    { name: 'MrBeast',    handle: '@MrBeast',    color: '#F5A623', rgb: '245,166,35',  initials: 'MB',  photo: 'https://yt3.googleusercontent.com/ytc/APkrFKZWeMCsx4Q9e_Bm6KHecaW1gP9ej7Kq8Cv-5Q=s900-c-k-c0x00ffffff-no-rj' },
  ishowspeed: { name: 'IShowSpeed', handle: '@IShowSpeed', color: '#FF4D4D', rgb: '255,77,77',   initials: 'IS',  photo: 'https://yt3.googleusercontent.com/ytc/APkrFKYILbhVGwl8E6lqDm6P_1S5cQP8vUOjrjdL5A=s900-c-k-c0x00ffffff-no-rj' },
  kaicenat:   { name: 'Kai Cenat',  handle: '@KaiCenat',   color: '#B388FF', rgb: '179,136,255', initials: 'KC',  photo: 'https://yt3.googleusercontent.com/ytc/APkrFKbHoMLSQGMXZbKQvBqL_Hbk-oNRzqZ4KQZWCA=s900-c-k-c0x00ffffff-no-rj' },
  ksi:        { name: 'KSI',        handle: '@KSI',         color: '#4D9FFF', rgb: '77,159,255',  initials: 'KSI', photo: 'https://yt3.googleusercontent.com/ytc/APkrFKblQHoWDSgLJMjXLAoTPpJOQBRcgPq3WPMQ5A=s900-c-k-c0x00ffffff-no-rj' },
  loganpaul:  { name: 'Logan Paul', handle: '@LoganPaul',  color: '#FF8A3D', rgb: '255,138,61',  initials: 'LP',  photo: 'https://yt3.googleusercontent.com/ytc/APkrFKZhoBRn_2SOfFGF3biOkp0y3HGMSPcMgK3OMA=s900-c-k-c0x00ffffff-no-rj' },
  jakepaul:   { name: 'Jake Paul',  handle: '@JakePaul',   color: '#FF5C9D', rgb: '255,92,157',  initials: 'JP',  photo: 'https://yt3.googleusercontent.com/ytc/APkrFKaO0hW8e4MJtQHU-x2YNJlGpTMXvNHNJePrCA=s900-c-k-c0x00ffffff-no-rj' },
  garyvee:    { name: 'Gary Vaynerchuk', handle: '@garyvee', color: '#00B4D8', rgb: '0,180,216',   initials: 'GV',  photo: '' },
  kaitrump:   { name: 'Kai Trump',  handle: '@kaitrump',   color: '#C9A84C', rgb: '201,168,76',  initials: 'KT',  photo: '' },
};

const TWIN_ORDER = ['mrbeast', 'ishowspeed', 'kaicenat', 'ksi', 'loganpaul', 'jakepaul', 'garyvee', 'kaitrump'];

const SUGGESTIONS = [
  'who is the biggest creator in the world',
  'should you fight your rivals or collab with them',
  'money vs legacy — which matters more',
  'what does it actually take to go viral',
];

function relativeTime(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 5)     return 'just now';
  if (diff < 60)    return `${diff}s`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

// Subtle SVG grain for tactile background depth
const NOISE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');

  /* ── Motion ─────────────────────────────────────────────────────────────── */
  @keyframes arBreathe {
    0%,100% { transform: translateY(0)    scale(1);    }
    50%      { transform: translateY(-4px) scale(1.045); }
  }
  @keyframes arAura {
    0%,100% { box-shadow: 0 0 0 2px var(--bg), 0 0 0 3px rgba(var(--rgb),0.75), 0 0 14px rgba(var(--rgb),0.20); }
    50%      { box-shadow: 0 0 0 2px var(--bg), 0 0 0 3px rgba(var(--rgb),1),    0 0 30px rgba(var(--rgb),0.50); }
  }
  @keyframes arCascade {
    0%   { opacity: 0; transform: translateY(18px) scale(0.985); }
    100% { opacity: 1; transform: translateY(0)    scale(1); }
  }
  @keyframes arFadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes arDot {
    0%,100% { opacity: 1;   transform: scale(1); }
    50%      { opacity: 0.25; transform: scale(0.85); }
  }
  @keyframes arPing {
    0%   { transform: scale(1);   opacity: 0.6; }
    9%   { transform: scale(4);   opacity: 0; }
    100% { transform: scale(4);   opacity: 0; }
  }
  @keyframes arMagnet {
    0%,100% { box-shadow: 0 0 0 1px #26262f, 0 0 32px rgba(109,94,252,0.06); }
    50%      { box-shadow: 0 0 0 1px #34344a, 0 0 46px rgba(109,94,252,0.14); }
  }
  @keyframes arWake {
    0%   { opacity: 0;   transform: scale(0.7); }
    25%  { opacity: 1; }
    100% { opacity: 0;   transform: scale(1.5); }
  }
  @keyframes arSweep {
    0%   { transform: translateX(-100%); opacity: 0; }
    8%   { opacity: 1; }
    20%  { transform: translateX(100%);  opacity: 0; }
    100% { transform: translateX(100%);  opacity: 0; }
  }
  @keyframes arShimmer {
    0%   { background-position: -360px 0; }
    100% { background-position:  360px 0; }
  }
  @keyframes arCheckPop {
    0% { transform: scale(0.5); opacity: 0; } 60% { transform: scale(1.18); opacity: 1; } 100% { transform: scale(1); }
  }
  @keyframes arNewPill {
    from { opacity: 0; transform: translateX(-50%) translateY(-8px); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { color-scheme: dark; }

  .ar-root {
    --bg: #08080b;
    --accent: #6d5efc;
    position: relative;
    min-height: 100dvh;
    background:
      radial-gradient(ellipse 90% 55% at 50% -8%,  rgba(96,84,210,0.13), transparent 60%),
      radial-gradient(ellipse 70% 45% at 50% 108%, rgba(150,46,90,0.07),  transparent 60%),
      #08080b;
    font-family: 'Inter', -apple-system, sans-serif;
    -webkit-font-smoothing: antialiased;
    color: #ededf0;
    overflow-x: hidden;
  }
  /* grain overlay for depth */
  .ar-root::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: url("${NOISE}");
    background-size: 160px 160px;
    opacity: 0.035;
    mix-blend-mode: soft-light;
    pointer-events: none;
    z-index: 1;
  }

  /* ── Header ─────────────────────────────────────────────────────────────── */
  .ar-header {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 100;
    height: 58px;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    padding: 0 22px;
    background: rgba(8,8,11,0.72);
    backdrop-filter: blur(20px) saturate(1.2);
    -webkit-backdrop-filter: blur(20px) saturate(1.2);
    border-bottom: 1px solid rgba(255,255,255,0.05);
    overflow: hidden;
  }
  /* periodic light sweep along the header — the "we're live" reminder */
  .ar-header::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0;
    width: 40%;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,77,77,0.9), transparent);
    animation: arSweep 14s ease-in-out infinite;
  }
  .ar-wordmark {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: #f4f4f6;
    text-decoration: none;
  }
  .ar-wordmark span { color: var(--accent); }
  .ar-header-center { display: flex; align-items: center; gap: 9px; }
  .ar-arena {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.26em;
    text-transform: uppercase;
    color: #f4f4f6;
    padding-left: 0.26em;
  }
  .ar-live {
    position: relative;
    width: 7px; height: 7px;
    border-radius: 50%;
    background: #ff4040;
    box-shadow: 0 0 10px rgba(255,64,64,0.8);
    animation: arDot 2.2s ease-in-out infinite;
  }
  .ar-live::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: #ff4040;
    animation: arPing 12s ease-out infinite;
  }
  .ar-live.flare { animation: arDot 0.5s ease-in-out infinite; }

  /* ── Stage ──────────────────────────────────────────────────────────────── */
  .ar-stage {
    position: relative;
    z-index: 2;
    max-width: 640px;
    margin: 0 auto;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
  }

  /* ── Inject bar (magnetic) ──────────────────────────────────────────────── */
  .ar-inject {
    position: sticky;
    top: 58px;
    z-index: 90;
    padding: 16px 20px;
    background: linear-gradient(180deg, rgba(8,8,11,0.92) 60%, rgba(8,8,11,0));
  }
  .ar-inject-field {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(18,18,24,0.9);
    border-radius: 14px;
    padding: 6px 6px 6px 8px;
    animation: arMagnet 4.5s ease-in-out infinite;
    transition: box-shadow 0.25s;
  }
  .ar-inject-field:focus-within {
    animation: none;
    box-shadow: 0 0 0 1px var(--accent), 0 0 60px rgba(109,94,252,0.22);
  }
  .ar-inject-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    padding: 12px 10px;
    font-family: 'Inter', sans-serif;
    font-size: 16px;
    font-weight: 450;
    color: #f0f0f3;
    min-width: 0;
    -webkit-appearance: none;
  }
  .ar-inject-input::placeholder { color: #44444f; font-weight: 400; }
  .ar-inject-input:disabled { opacity: 0.5; }
  .ar-inject-btn {
    flex-shrink: 0;
    background: var(--accent);
    color: #fff;
    border: none;
    border-radius: 10px;
    padding: 11px 20px;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.01em;
    cursor: pointer;
    transition: background 0.15s, transform 0.1s;
    -webkit-tap-highlight-color: transparent;
  }
  .ar-inject-btn:hover:not(:disabled)  { background: #5d4ff0; }
  .ar-inject-btn:active:not(:disabled) { transform: scale(0.96); }
  .ar-inject-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .ar-inject-status {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    margin-top: 12px;
    font-size: 13px;
    font-weight: 500;
    color: #6a6a7e;
    animation: arFadeIn 0.3s ease;
  }
  .ar-inject-status b { color: #9a9ab0; font-weight: 600; }
  .ar-status-dots { display: inline-block; width: 14px; text-align: left; color: var(--accent); }

  /* ── Wake beat overlay ──────────────────────────────────────────────────── */
  .ar-wake {
    position: fixed;
    inset: 0;
    z-index: 70;
    pointer-events: none;
    background: radial-gradient(circle at 50% 38%, rgba(109,94,252,0.18), transparent 55%);
    animation: arWake 0.9s ease-out forwards;
  }

  /* ── Feed ───────────────────────────────────────────────────────────────── */
  .ar-feed { flex: 1; padding-bottom: 56px; }

  /* ── Post — breathes directly on the background, no card box ─────────────── */
  .ar-post {
    position: relative;
    display: flex;
    gap: 15px;
    padding: 20px 22px 16px;
    animation: arCascade 0.5s cubic-bezier(0.22,1,0.36,1) both;
  }
  /* per-creator color wash bleeding from the left — the "vibe", not a box */
  .ar-post::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(100deg, rgba(var(--rgb),0.05), rgba(var(--rgb),0) 42%);
    opacity: 0.7;
    transition: opacity 0.3s;
    pointer-events: none;
  }
  .ar-post:hover::before { opacity: 1; }
  .ar-post::after {
    content: '';
    position: absolute;
    left: 0; right: 0; bottom: 0;
    height: 1px;
    background: rgba(255,255,255,0.045);
  }
  /* giant faded monogram — texture behind each post */
  .ar-monogram {
    position: absolute;
    top: 8px; right: 18px;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 88px;
    font-weight: 700;
    line-height: 1;
    color: rgba(var(--rgb), 0.045);
    pointer-events: none;
    user-select: none;
    z-index: 0;
  }
  .ar-post.is-reply {
    margin-left: 22px;
    padding-left: 18px;
    border-left: 2px solid rgba(var(--rgb), 0.55);
  }

  .ar-avatar {
    position: relative;
    z-index: 1;
    flex-shrink: 0;
    border-radius: 50%;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 700;
    color: rgba(0,0,0,0.78);
    box-shadow: 0 0 0 2px var(--bg), 0 0 0 3px rgba(var(--rgb),0.85), 0 0 16px rgba(var(--rgb),0.3);
  }
  .ar-avatar img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }

  .ar-body { position: relative; z-index: 1; flex: 1; min-width: 0; }

  .ar-reply-to {
    display: flex; align-items: center; gap: 5px;
    font-size: 13px; color: #45454f; margin-bottom: 4px;
  }
  .ar-reply-to b { color: rgba(var(--parent-rgb,255,255,255), 0.7); font-weight: 600; }

  .ar-meta { display: flex; align-items: baseline; gap: 7px; flex-wrap: wrap; margin-bottom: 7px; }
  .ar-name {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: -0.015em;
    color: #f4f4f6;
    line-height: 1.1;
  }
  .ar-handle { font-size: 13px; color: #4a4a55; }
  .ar-sep    { font-size: 11px; color: #2c2c33; }
  .ar-time   { font-size: 13px; color: #3a3a44; }

  .ar-content {
    font-size: 16px;
    line-height: 1.62;
    font-weight: 450;
    color: #dadadf;
    word-break: break-word;
    white-space: pre-wrap;
    margin-bottom: 12px;
  }

  .ar-actions { display: flex; align-items: center; gap: 2px; }
  .ar-action {
    display: flex; align-items: center; gap: 6px;
    background: transparent; border: none;
    padding: 6px 10px; border-radius: 8px;
    font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 500;
    color: #36363f; cursor: pointer;
    transition: color 0.15s, background 0.15s, opacity 0.15s;
    -webkit-tap-highlight-color: transparent; user-select: none;
  }
  .ar-action:hover:not(:disabled) { color: var(--accent); background: rgba(109,94,252,0.1); }
  .ar-action:disabled { opacity: 0.4; cursor: not-allowed; }
  .ar-share { opacity: 0; }
  .ar-post:hover .ar-share { opacity: 1; }
  .ar-share.copied { color: #2ecc71 !important; background: rgba(46,204,113,0.1) !important; opacity: 1 !important; }
  .ar-share.copied svg { animation: arCheckPop 0.25s ease; }
  @media (hover: none) { .ar-share { opacity: 1; } }

  /* ── Voice / TTS button ──────────────────────────────────────────────────── */
  @keyframes arVoicePulse {
    0%,100% { opacity: 1; }
    50%      { opacity: 0.35; }
  }
  .ar-voice { opacity: 0; }
  .ar-post:hover .ar-voice { opacity: 1; }
  @media (hover: none) { .ar-voice { opacity: 1; } }
  .ar-voice.loading svg { animation: arVoicePulse 0.8s ease-in-out infinite; }
  .ar-voice.playing   { color: var(--twin-color) !important; opacity: 1 !important; background: rgba(var(--rgb), 0.12) !important; }

  /* ── Skeleton (first inject) ────────────────────────────────────────────── */
  .ar-skel { display: flex; gap: 15px; padding: 20px 22px 16px; position: relative; }
  .ar-skel::after { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 1px; background: rgba(255,255,255,0.04); }
  .ar-skel-av {
    width: 48px; height: 48px; border-radius: 50%; flex-shrink: 0;
    box-shadow: 0 0 0 2px var(--bg), 0 0 0 3px rgba(var(--rgb),0.4), 0 0 14px rgba(var(--rgb),0.18);
    background: rgba(var(--rgb),0.08);
  }
  .ar-skel-body { flex: 1; display: flex; flex-direction: column; gap: 9px; padding-top: 6px; }
  .ar-skel-b {
    height: 13px; border-radius: 5px;
    background: linear-gradient(90deg, #14141a 0%, #232330 50%, #14141a 100%);
    background-size: 360px 100%;
    animation: arShimmer 1.5s ease-in-out infinite;
  }

  /* ── Empty stage ────────────────────────────────────────────────────────── */
  .ar-empty {
    display: flex; flex-direction: column; align-items: center;
    padding: 56px 24px 40px;
    animation: arFadeIn 0.5s ease;
  }
  .ar-lineup { display: flex; justify-content: center; gap: 14px; flex-wrap: wrap; margin-bottom: 36px; }
  .ar-lineup-item { display: flex; flex-direction: column; align-items: center; gap: 9px; }
  .ar-lineup-av { animation: arBreathe 4s ease-in-out infinite; }
  .ar-lineup-av .ar-avatar { animation: arAura 4s ease-in-out infinite; }
  .ar-lineup-name {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 11px; font-weight: 600; letter-spacing: 0.02em;
    color: rgba(var(--rgb), 0.62);
  }
  .ar-empty-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 24px; font-weight: 700; letter-spacing: -0.02em;
    color: #f2f2f5; text-align: center; line-height: 1.15; margin-bottom: 10px;
  }
  .ar-empty-sub {
    font-size: 14px; color: #55555f; text-align: center; margin-bottom: 26px; max-width: 320px; line-height: 1.5;
  }
  .ar-suggestions { display: flex; flex-direction: column; gap: 9px; width: 100%; max-width: 400px; }
  .ar-suggestion {
    background: rgba(255,255,255,0.018);
    border: 1px solid rgba(255,255,255,0.055);
    border-radius: 11px;
    padding: 13px 16px;
    font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 450;
    color: #5c5c68; cursor: pointer; text-align: left;
    transition: border-color 0.18s, color 0.18s, background 0.18s, transform 0.1s;
    -webkit-tap-highlight-color: transparent;
  }
  .ar-suggestion:hover { border-color: rgba(109,94,252,0.6); color: #b9b4ff; background: rgba(109,94,252,0.06); }
  .ar-suggestion:active { transform: scale(0.99); }

  /* ── Topic divider ──────────────────────────────────────────────────────── */
  .ar-divider { display: flex; align-items: center; gap: 14px; padding: 18px 22px 12px; animation: arFadeIn 0.35s ease; }
  .ar-divider-line { flex: 1; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.09)); }
  .ar-divider-line.r { background: linear-gradient(90deg, rgba(255,255,255,0.09), transparent); }
  .ar-divider-label {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 12px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase;
    color: #4a4a58; white-space: nowrap; max-width: 260px; overflow: hidden; text-overflow: ellipsis;
  }

  /* ── New posts pill ─────────────────────────────────────────────────────── */
  .ar-new-pill {
    position: fixed; top: 130px; left: 50%; transform: translateX(-50%);
    z-index: 95;
    background: var(--accent); color: #fff; border: none;
    border-radius: 22px; padding: 8px 18px;
    font-family: 'Space Grotesk', sans-serif; font-size: 13px; font-weight: 600;
    cursor: pointer; box-shadow: 0 8px 32px rgba(109,94,252,0.4);
    animation: arNewPill 0.22s ease; -webkit-tap-highlight-color: transparent; white-space: nowrap;
  }
  .ar-new-pill:hover { background: #5d4ff0; }

  /* ── Mobile ─────────────────────────────────────────────────────────────── */
  @media (max-width: 640px) {
    .ar-inject {
      position: fixed; top: auto; bottom: 0; left: 0; right: 0;
      padding: 12px 14px calc(12px + env(safe-area-inset-bottom, 0));
      background: linear-gradient(0deg, rgba(8,8,11,0.97) 70%, rgba(8,8,11,0));
    }
    .ar-feed { padding-bottom: 108px; }
    .ar-new-pill { top: 70px; }
    .ar-post { padding: 18px 16px 14px; }
    .ar-post.is-reply { margin-left: 14px; }
    .ar-monogram { font-size: 70px; right: 12px; }
    .ar-empty { padding: 40px 18px 32px; }
    .ar-empty-title { font-size: 21px; }
    .ar-lineup { gap: 10px; }
    .ar-divider { padding: 16px 16px 10px; }
  }

  /* ── Reduced motion ─────────────────────────────────────────────────────── */
  @media (prefers-reduced-motion: reduce) {
    .ar-lineup-av, .ar-lineup-av .ar-avatar, .ar-inject-field,
    .ar-header::after, .ar-live, .ar-live::after { animation: none !important; }
    .ar-post { animation-duration: 0.01ms; }
  }
`;

// ── Icons ───────────────────────────────────────────────────────────────────
// Slugs that have a provisioned Voxtral voice — speaker icon only shown for these
const VOICED_SLUGS = new Set(['garyvee', 'kaicenat']);

const IconSpeaker = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
  </svg>
);
const IconStop = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <rect x="6" y="6" width="12" height="12" rx="2"/>
  </svg>
);

const IconReact = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const IconShare = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
  </svg>
);
const IconCheck = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconReplyArrow = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/>
  </svg>
);

// ── Avatar ──────────────────────────────────────────────────────────────────
function Avatar({ slug, size = 48 }) {
  const twin = TWINS[slug] || { color: '#6d5efc', rgb: '109,94,252', initials: '?' };
  const [failed, setFailed] = useState(false);
  return (
    <div
      className="ar-avatar"
      style={{ '--rgb': twin.rgb, width: size, height: size, background: twin.color, fontSize: Math.floor(size * 0.3) }}
    >
      {twin.photo && !failed
        ? <img src={twin.photo} alt={twin.name} onError={() => setFailed(true)} />
        : twin.initials}
    </div>
  );
}

// ── Post ────────────────────────────────────────────────────────────────────
function PostCard({ post, allPosts, onReact, onPlay, playingId, loadingId, animDelay = 0 }) {
  const [shareState, setShareState] = useState('idle');
  const [reacting, setReacting]     = useState(false);

  const twin       = TWINS[post.twin_slug] || { name: post.twin_name, handle: `@${post.twin_slug}`, color: '#6d5efc', rgb: '109,94,252', initials: '?' };
  const parentPost = post.reply_to_id ? allPosts.find(p => p.id === post.reply_to_id) : null;
  const parentTwin = parentPost ? (TWINS[parentPost.twin_slug] || {}) : null;

  const share = async () => {
    const text = `${post.twin_name} ${twin.handle}: "${post.content}"\n\nastralink.life/arena`;
    try {
      if (navigator.share) await navigator.share({ text, url: 'https://astralink.life/arena' });
      else {
        await navigator.clipboard.writeText(text);
        setShareState('copied');
        setTimeout(() => setShareState('idle'), 1500);
      }
    } catch {}
  };
  const react = async () => { if (reacting) return; setReacting(true); await onReact(post.id); setReacting(false); };
  const copied = shareState === 'copied';

  const hasVoice    = VOICED_SLUGS.has(post.twin_slug);
  const isPlaying   = playingId === post.id;
  const isLoading   = loadingId === post.id;
  const voiceCls    = `ar-action ar-voice${isLoading ? ' loading' : ''}${isPlaying ? ' playing' : ''}`;

  return (
    <div
      className={`ar-post${post.reply_to_id ? ' is-reply' : ''}`}
      style={{ '--rgb': twin.rgb, '--twin-color': twin.color, '--parent-rgb': parentTwin?.rgb || '255,255,255', animationDelay: `${animDelay}ms` }}
    >
      <span className="ar-monogram">{twin.initials}</span>
      <Avatar slug={post.twin_slug} />
      <div className="ar-body">
        {parentPost && (
          <div className="ar-reply-to">
            <IconReplyArrow />
            <span>replying to <b>{parentTwin?.handle || `@${parentPost.twin_slug}`}</b></span>
          </div>
        )}
        <div className="ar-meta">
          <span className="ar-name">{post.twin_name}</span>
          <span className="ar-handle">{twin.handle}</span>
          <span className="ar-sep">·</span>
          <span className="ar-time">{relativeTime(post.timestamp)}</span>
        </div>
        <div className="ar-content">{post.content}</div>
        <div className="ar-actions">
          <button className="ar-action" onClick={react} disabled={reacting} title="Trigger a reaction">
            <IconReact /><span>React</span>
          </button>
          {hasVoice && (
            <button
              className={voiceCls}
              onClick={() => onPlay(post.id, post.twin_slug, post.content)}
              disabled={isLoading}
              title={isPlaying ? 'Stop' : 'Play voice'}
            >
              {isPlaying ? <IconStop /> : <IconSpeaker />}
            </button>
          )}
          <button className={`ar-action ar-share${copied ? ' copied' : ''}`} onClick={share} title="Share">
            {copied ? <IconCheck /> : <IconShare />}<span>{copied ? 'Copied' : 'Share'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard({ slug, delay = 0 }) {
  const twin = TWINS[slug];
  return (
    <div className="ar-skel" style={{ '--rgb': twin.rgb }}>
      <div className="ar-skel-av" />
      <div className="ar-skel-body">
        <div className="ar-skel-b" style={{ width: '130px', animationDelay: `${delay}ms` }} />
        <div className="ar-skel-b" style={{ width: '100%',  animationDelay: `${delay + 70}ms` }} />
        <div className="ar-skel-b" style={{ width: '82%',   animationDelay: `${delay + 140}ms` }} />
        <div className="ar-skel-b" style={{ width: '55%',   animationDelay: `${delay + 210}ms` }} />
      </div>
    </div>
  );
}

function TopicDivider({ topic }) {
  return (
    <div className="ar-divider">
      <div className="ar-divider-line" />
      <span className="ar-divider-label">{topic}</span>
      <div className="ar-divider-line r" />
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────────────────
export default function ArenaPage() {
  const [posts, setPosts]         = useState([]);
  const [topic, setTopic]         = useState('');
  const [injecting, setInjecting] = useState(false);
  const [waking, setWaking]       = useState(false);
  const [newCount, setNewCount]   = useState(0);
  const [seenIds, setSeenIds]     = useState(new Set());
  const [animBatch, setAnimBatch] = useState(new Set());
  const [playingId, setPlayingId] = useState(null);   // post ID currently playing audio
  const [loadingId, setLoadingId] = useState(null);   // post ID whose TTS is loading

  const feedTopRef = useRef(null);
  const inputRef   = useRef(null);
  const audioRef   = useRef(null);   // current Audio object (for stop/cleanup)

  useEffect(() => {
    const el = document.createElement('style');
    el.id = 'arena-css';
    el.textContent = CSS;
    document.head.appendChild(el);
    return () => document.getElementById('arena-css')?.remove();
  }, []);

  // Feed is session-only — no initial fetch, no polling.
  // Posts are populated exclusively from inject() and triggerReact() responses
  // so every new visitor always opens to the empty state.

  const scrollToTop = () => { feedTopRef.current?.scrollIntoView({ behavior: 'smooth' }); setNewCount(0); };

  const playVoice = async (postId, slug, text) => {
    // Toggle off if already playing this post
    if (playingId === postId) {
      audioRef.current?.pause();
      audioRef.current = null;
      setPlayingId(null);
      return;
    }
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlayingId(null);
    }
    setLoadingId(postId);
    try {
      const res = await fetch(`${API}/arena/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, text }),
      });
      if (!res.ok) { setLoadingId(null); return; }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setPlayingId(null); audioRef.current = null; URL.revokeObjectURL(url); };
      audio.onerror = () => { setPlayingId(null); audioRef.current = null; URL.revokeObjectURL(url); };
      await audio.play();
      setPlayingId(postId);
    } catch {
      setPlayingId(null);
    } finally {
      setLoadingId(null);
    }
  };

  const inject = async (overrideTopic) => {
    const t = (overrideTopic || topic).trim();
    if (!t || injecting) return;
    setInjecting(true);
    setWaking(true);
    setTimeout(() => setWaking(false), 900);
    setTopic('');
    setNewCount(0);
    try {
      const res = await fetch(`${API}/arena/inject`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic: t }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const newIds = new Set((data.posts || []).map(p => p.id));
      setAnimBatch(newIds);
      setSeenIds(prev => new Set([...prev, ...newIds]));
      setPosts(prev => [...(data.posts || []), ...prev.filter(p => !newIds.has(p.id))]);
      scrollToTop();
      for (const post of (data.posts || []).slice(0, 2)) {
        await new Promise(r => setTimeout(r, 1600));
        triggerReact(post.id, true);
      }
    } catch {
      // silent — feed unchanged
    } finally {
      setInjecting(false);
      inputRef.current?.focus();
    }
  };

  const triggerReact = async (postId) => {
    try {
      const res = await fetch(`${API}/arena/react`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ post_id: postId }),
      });
      if (!res.ok) return;
      const reply = (await res.json()).reply;
      if (!reply) return;
      setAnimBatch(prev => new Set([...prev, reply.id]));
      setSeenIds(prev => new Set([...prev, reply.id]));
      setPosts(prev => {
        if (prev.find(p => p.id === reply.id)) return prev;
        const idx = prev.findIndex(p => p.id === postId);
        const next = [...prev];
        next.splice(idx === -1 ? 0 : idx + 1, 0, reply);
        return next;
      });
    } catch {}
  };

  // Build feed with topic dividers + sequential cascade delays for the batch
  const grouped = (() => {
    const items = [];
    let lastTopic = null;
    let batchSeen = 0;
    for (const post of posts) {
      if (post.topic && post.topic !== lastTopic && !post.reply_to_id) {
        items.push({ type: 'divider', topic: post.topic, key: `d-${post.topic}` });
        lastTopic = post.topic;
      }
      const delay = animBatch.has(post.id) ? (batchSeen++ * 130) : 0;
      items.push({ type: 'post', post, key: post.id, delay });
    }
    return items;
  })();

  const isEmpty   = posts.length === 0 && !injecting;
  const isLoading = injecting && posts.length === 0;

  return (
    <div className="ar-root">
      {waking && <div className="ar-wake" />}

      <header className="ar-header">
        <a href="/" className="ar-wordmark">Astra<span>Link</span></a>
        <div className="ar-header-center">
          <span className="ar-arena">Arena</span>
          <span className={`ar-live${injecting ? ' flare' : ''}`} />
        </div>
        <div />
      </header>

      <div className="ar-stage">
        <div style={{ height: 58 }} />

        <div className="ar-inject">
          <div className="ar-inject-field">
            <input
              ref={inputRef}
              className="ar-inject-input"
              type="text"
              placeholder="Drop a topic into the Arena..."
              value={topic}
              onChange={e => setTopic(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); inject(); } }}
              disabled={injecting}
              maxLength={300}
              autoComplete="off" autoCorrect="off" spellCheck={false}
            />
            <button className="ar-inject-btn" onClick={() => inject()} disabled={injecting || !topic.trim()}>
              {injecting ? 'Live' : 'Inject'}
            </button>
          </div>
          {injecting && (
            <div className="ar-inject-status">
              <b>Six twins</b> stepping into the arena<span className="ar-status-dots">…</span>
            </div>
          )}
        </div>

        <div ref={feedTopRef} />

        <div className="ar-feed">
          {isEmpty && (
            <div className="ar-empty">
              <div className="ar-lineup">
                {TWIN_ORDER.map((slug, i) => (
                  <div className="ar-lineup-item" key={slug}>
                    <div className="ar-lineup-av" style={{ animationDelay: `${i * 0.32}s`, '--rgb': TWINS[slug].rgb }}>
                      <span style={{ display: 'block', animationDelay: `${i * 0.32}s` }}>
                        <Avatar slug={slug} size={56} />
                      </span>
                    </div>
                    <span className="ar-lineup-name" style={{ '--rgb': TWINS[slug].rgb }}>{TWINS[slug].name}</span>
                  </div>
                ))}
              </div>
              <h1 className="ar-empty-title">Eight minds. One arena.</h1>
              <p className="ar-empty-sub">Drop a topic and watch the world's biggest creators go at it — live.</p>
              <div className="ar-suggestions">
                {SUGGESTIONS.map(s => (
                  <button key={s} className="ar-suggestion" onClick={() => inject(s)}>{s}</button>
                ))}
              </div>
            </div>
          )}

          {isLoading && TWIN_ORDER.map((slug, i) => <SkeletonCard key={slug} slug={slug} delay={i * 70} />)}

          {!isLoading && grouped.map(item =>
            item.type === 'divider'
              ? <TopicDivider key={item.key} topic={item.topic} />
              : <PostCard key={item.key} post={item.post} allPosts={posts} onReact={triggerReact} onPlay={playVoice} playingId={playingId} loadingId={loadingId} animDelay={item.delay} />
          )}
        </div>
      </div>

      {newCount > 0 && (
        <button className="ar-new-pill" onClick={scrollToTop}>
          ↑ {newCount} new {newCount === 1 ? 'post' : 'posts'}
        </button>
      )}
    </div>
  );
}
