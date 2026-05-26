import React, { useState, useEffect, useRef, useCallback } from 'react';

const API      = 'https://astralink-v2-production.up.railway.app';
const POLL_MS  = 30_000;

const TWINS = {
  mrbeast:    { name: 'MrBeast',    handle: '@MrBeast',    color: '#F59E0B', initials: 'MB',  photo: 'https://yt3.googleusercontent.com/ytc/APkrFKZWeMCsx4Q9e_Bm6KHecaW1gP9ej7Kq8Cv-5Q=s900-c-k-c0x00ffffff-no-rj' },
  ishowspeed: { name: 'IShowSpeed', handle: '@IShowSpeed', color: '#EF4444', initials: 'IS',  photo: 'https://yt3.googleusercontent.com/ytc/APkrFKYILbhVGwl8E6lqDm6P_1S5cQP8vUOjrjdL5A=s900-c-k-c0x00ffffff-no-rj' },
  kaicenat:   { name: 'Kai Cenat',  handle: '@KaiCenat',   color: '#A78BFA', initials: 'KC',  photo: 'https://yt3.googleusercontent.com/ytc/APkrFKbHoMLSQGMXZbKQvBqL_Hbk-oNRzqZ4KQZWCA=s900-c-k-c0x00ffffff-no-rj' },
  ksi:        { name: 'KSI',        handle: '@KSI',         color: '#3B82F6', initials: 'KSI', photo: 'https://yt3.googleusercontent.com/ytc/APkrFKblQHoWDSgLJMjXLAoTPpJOQBRcgPq3WPMQ5A=s900-c-k-c0x00ffffff-no-rj' },
  loganpaul:  { name: 'Logan Paul', handle: '@LoganPaul',  color: '#F97316', initials: 'LP',  photo: 'https://yt3.googleusercontent.com/ytc/APkrFKZhoBRn_2SOfFGF3biOkp0y3HGMSPcMgK3OMA=s900-c-k-c0x00ffffff-no-rj' },
  jakepaul:   { name: 'Jake Paul',  handle: '@JakePaul',   color: '#EC4899', initials: 'JP',  photo: 'https://yt3.googleusercontent.com/ytc/APkrFKaO0hW8e4MJtQHU-x2YNJlGpTMXvNHNJePrCA=s900-c-k-c0x00ffffff-no-rj' },
};

const TWIN_ORDER = ['mrbeast', 'ishowspeed', 'kaicenat', 'ksi', 'loganpaul', 'jakepaul'];

const SUGGESTIONS = [
  'who is the biggest creator in the world',
  'should you fight your rivals or collab with them',
  'money vs legacy — which matters more',
  'what does it actually take to go viral',
];

function relativeTime(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 5)    return 'just now';
  if (diff < 60)   return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  @keyframes arFadeSlide {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes arFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes arBroadcast {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.2; }
  }
  @keyframes arBreathe {
    0%, 100% { transform: scale(1);    opacity: 0.55; }
    50%       { transform: scale(1.07); opacity: 1; }
  }
  @keyframes arShimmer {
    0%   { background-position: -400px 0; }
    100% { background-position:  400px 0; }
  }
  @keyframes arCheckPop {
    0%   { transform: scale(0.6); opacity: 0; }
    60%  { transform: scale(1.15); opacity: 1; }
    100% { transform: scale(1); }
  }
  @keyframes arNewPill {
    from { opacity: 0; transform: translateX(-50%) translateY(-6px); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html { color-scheme: dark; }

  .ar-root {
    min-height: 100dvh;
    background: #0c0c0f;
    font-family: 'Inter', -apple-system, sans-serif;
    -webkit-font-smoothing: antialiased;
    color: #ededf0;
  }

  /* ── Header ─────────────────────────────────────────────────────────────── */
  .ar-header {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 100;
    background: rgba(12, 12, 15, 0.9);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-bottom: 1px solid #1c1c22;
    height: 56px;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    padding: 0 20px;
  }
  .ar-header-wordmark {
    font-size: 13px;
    font-weight: 600;
    color: #ededf0;
    letter-spacing: -0.01em;
    text-decoration: none;
  }
  .ar-header-wordmark span {
    color: #5b5ef4;
  }
  .ar-header-center {
    display: flex;
    align-items: center;
    gap: 7px;
  }
  .ar-header-arena {
    font-size: 13px;
    font-weight: 700;
    color: #ededf0;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .ar-broadcast-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #ef4444;
    flex-shrink: 0;
    animation: arBroadcast 2.4s ease-in-out infinite;
  }

  /* ── Layout ─────────────────────────────────────────────────────────────── */
  .ar-layout {
    max-width: 600px;
    margin: 0 auto;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
  }

  /* ── Inject bar — desktop (sticky below header) ──────────────────────────── */
  .ar-inject-wrap {
    position: sticky;
    top: 56px;
    z-index: 90;
    background: rgba(12, 12, 15, 0.95);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid #1c1c22;
    padding: 14px 20px;
  }
  .ar-inject-row {
    display: flex;
    gap: 10px;
    align-items: center;
  }
  .ar-inject-input {
    flex: 1;
    background: #141418;
    border: 1px solid #222228;
    border-radius: 6px;
    padding: 11px 16px;
    font-family: 'Inter', sans-serif;
    font-size: 15px;
    color: #ededf0;
    outline: none;
    transition: border-color 0.2s;
    min-width: 0;
    -webkit-appearance: none;
  }
  .ar-inject-input::placeholder { color: #36363f; }
  .ar-inject-input:focus        { border-color: #5b5ef4; }
  .ar-inject-input:disabled     { opacity: 0.45; cursor: not-allowed; }
  .ar-inject-btn {
    background: #5b5ef4;
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 11px 20px;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    letter-spacing: 0.01em;
    transition: background 0.15s, opacity 0.15s;
    -webkit-tap-highlight-color: transparent;
  }
  .ar-inject-btn:hover:not(:disabled) { background: #4f52e8; }
  .ar-inject-btn:disabled { opacity: 0.35; cursor: not-allowed; }
  .ar-inject-status {
    font-size: 13px;
    color: #454558;
    margin-top: 10px;
    text-align: center;
    animation: arFadeIn 0.25s ease;
  }
  .ar-inject-status span {
    display: inline-block;
    animation: arBroadcast 1.4s ease-in-out infinite;
  }

  /* ── Feed ────────────────────────────────────────────────────────────────── */
  .ar-feed {
    flex: 1;
    padding-bottom: 48px;
  }

  /* ── Skeleton loading ────────────────────────────────────────────────────── */
  .ar-skel-post {
    display: flex;
    gap: 14px;
    padding: 18px 20px;
    border-bottom: 1px solid #16161c;
  }
  .ar-skel-block {
    background: linear-gradient(90deg, #18181e 0%, #232330 50%, #18181e 100%);
    background-size: 400px 100%;
    animation: arShimmer 1.6s ease-in-out infinite;
    border-radius: 4px;
  }
  .ar-skel-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    flex-shrink: 0;
    background: linear-gradient(90deg, #18181e 0%, #232330 50%, #18181e 100%);
    background-size: 400px 100%;
    animation: arShimmer 1.6s ease-in-out infinite;
  }
  .ar-skel-body { flex: 1; display: flex; flex-direction: column; gap: 8px; padding-top: 4px; }
  .ar-skel-name  { height: 13px; width: 120px; }
  .ar-skel-line  { height: 13px; width: 100%; }
  .ar-skel-line--mid  { width: 85%; }
  .ar-skel-line--short { width: 60%; }

  /* ── Empty state ─────────────────────────────────────────────────────────── */
  .ar-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 80px 24px 48px;
    animation: arFadeIn 0.4s ease;
  }
  .ar-empty-avatars {
    display: flex;
    gap: 10px;
    margin-bottom: 28px;
  }
  .ar-empty-avatar-wrap {
    animation: arBreathe 3s ease-in-out infinite;
  }
  .ar-empty-title {
    font-size: 15px;
    font-weight: 500;
    color: #5a5a6a;
    margin-bottom: 24px;
    text-align: center;
    letter-spacing: -0.01em;
  }
  .ar-suggestions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    max-width: 380px;
  }
  .ar-suggestion {
    background: transparent;
    border: 1px solid #1e1e26;
    border-radius: 6px;
    padding: 10px 14px;
    font-size: 13px;
    color: #44444e;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    text-align: left;
    transition: border-color 0.15s, color 0.15s;
    -webkit-tap-highlight-color: transparent;
  }
  .ar-suggestion:hover { border-color: #5b5ef4; color: #9898f8; }

  /* ── Topic divider ───────────────────────────────────────────────────────── */
  .ar-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 20px 10px;
    animation: arFadeIn 0.3s ease;
  }
  .ar-divider-line { flex: 1; height: 1px; background: #1a1a22; }
  .ar-divider-label {
    font-size: 13px;
    color: #383848;
    font-weight: 500;
    white-space: nowrap;
    max-width: 240px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* ── Post card ───────────────────────────────────────────────────────────── */
  .ar-post {
    display: flex;
    gap: 14px;
    padding: 18px 20px 14px;
    border-bottom: 1px solid #16161c;
    animation: arFadeSlide 0.25s ease both;
    position: relative;
  }
  .ar-post:hover { background: rgba(255,255,255,0.016); }

  /* reply variant */
  .ar-post.ar-is-reply {
    padding-left: 20px;
    border-left: 2px solid var(--reply-color, #5b5ef4);
  }

  /* Avatar */
  .ar-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    flex-shrink: 0;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: -0.01em;
    color: rgba(0,0,0,0.75);
    box-shadow: 0 0 0 2px #0c0c0f, 0 0 0 3.5px var(--avatar-color, #5b5ef4);
  }
  .ar-avatar img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }

  /* Body */
  .ar-post-body { flex: 1; min-width: 0; }

  .ar-reply-label {
    font-size: 13px;
    color: #383848;
    margin-bottom: 3px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .ar-reply-label-handle { color: #4a4a68; }

  .ar-post-meta {
    display: flex;
    align-items: baseline;
    gap: 6px;
    margin-bottom: 6px;
    flex-wrap: wrap;
  }
  .ar-post-name {
    font-size: 15px;
    font-weight: 700;
    color: #ededf0;
    letter-spacing: -0.01em;
    line-height: 1.2;
  }
  .ar-post-handle {
    font-size: 13px;
    color: #44444e;
    line-height: 1.2;
  }
  .ar-post-sep {
    font-size: 11px;
    color: #28282e;
  }
  .ar-post-time {
    font-size: 13px;
    color: #36363f;
    line-height: 1.2;
  }

  .ar-post-content {
    font-size: 15px;
    line-height: 1.7;
    color: #dcdce0;
    word-break: break-word;
    white-space: pre-wrap;
    margin-bottom: 12px;
  }

  /* Actions */
  .ar-actions {
    display: flex;
    align-items: center;
    gap: 2px;
  }
  .ar-action {
    display: flex;
    align-items: center;
    gap: 5px;
    background: transparent;
    border: none;
    padding: 5px 9px;
    border-radius: 4px;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    color: #32323c;
    cursor: pointer;
    transition: color 0.15s, background 0.15s;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
  }
  .ar-action:hover:not(:disabled) { color: #5b5ef4; background: rgba(91,94,244,0.08); }
  .ar-action:disabled { opacity: 0.4; cursor: not-allowed; }

  /* Share — hidden by default, revealed on card hover */
  .ar-share {
    opacity: 0;
    transition: color 0.15s, background 0.15s, opacity 0.15s;
  }
  .ar-post:hover .ar-share { opacity: 1; }
  .ar-share.ar-share--copied { color: #22c55e !important; background: rgba(34,197,94,0.08) !important; opacity: 1 !important; }
  .ar-share--copied svg { animation: arCheckPop 0.25s ease; }

  /* touch devices: always show share */
  @media (hover: none) {
    .ar-share { opacity: 1; }
  }

  /* ── New-posts pill ──────────────────────────────────────────────────────── */
  .ar-new-pill {
    position: fixed;
    top: 118px;
    left: 50%;
    transform: translateX(-50%);
    background: #5b5ef4;
    color: #fff;
    border: none;
    border-radius: 20px;
    padding: 7px 16px;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    z-index: 95;
    box-shadow: 0 4px 24px rgba(91,94,244,0.35);
    animation: arNewPill 0.2s ease;
    -webkit-tap-highlight-color: transparent;
    white-space: nowrap;
  }
  .ar-new-pill:hover { background: #4f52e8; }

  /* ── Mobile layout ───────────────────────────────────────────────────────── */
  @media (max-width: 640px) {
    .ar-inject-wrap {
      position: fixed;
      top: auto;
      bottom: 0;
      left: 0;
      right: 0;
      border-top: 1px solid #1c1c22;
      border-bottom: none;
      padding: 12px 16px env(safe-area-inset-bottom, 0);
      background: rgba(12, 12, 15, 0.97);
    }
    .ar-feed { padding-bottom: 96px; }
    .ar-new-pill { top: 66px; }
    .ar-post { padding: 16px 16px 12px; }
    .ar-post.ar-is-reply { padding-left: 16px; }
    .ar-divider { padding: 10px 16px 8px; }
    .ar-empty { padding: 60px 20px 40px; }
    .ar-empty-avatars { gap: 8px; }
  }
`;

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconReact = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const IconShare = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
    <polyline points="16 6 12 2 8 6"/>
    <line x1="12" y1="2" x2="12" y2="15"/>
  </svg>
);

const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconReply = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 17 4 12 9 7"/>
    <path d="M20 18v-2a4 4 0 0 0-4-4H4"/>
  </svg>
);

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ slug, size = 44 }) {
  const twin = TWINS[slug] || { color: '#5b5ef4', initials: '?' };
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div
      className="ar-avatar"
      style={{
        '--avatar-color': twin.color,
        width: size,
        height: size,
        background: twin.color,
        fontSize: Math.floor(size * 0.3),
      }}
    >
      {twin.photo && !imgFailed ? (
        <img
          src={twin.photo}
          alt={twin.name}
          onError={() => setImgFailed(true)}
        />
      ) : twin.initials}
    </div>
  );
}

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard({ delay = 0 }) {
  return (
    <div className="ar-skel-post" style={{ animationDelay: `${delay}ms` }}>
      <div className="ar-skel-avatar" />
      <div className="ar-skel-body">
        <div className="ar-skel-block ar-skel-name" style={{ animationDelay: `${delay}ms` }} />
        <div className="ar-skel-block ar-skel-line" style={{ animationDelay: `${delay + 80}ms` }} />
        <div className="ar-skel-block ar-skel-line ar-skel-line--mid" style={{ animationDelay: `${delay + 160}ms` }} />
        <div className="ar-skel-block ar-skel-line ar-skel-line--short" style={{ animationDelay: `${delay + 240}ms` }} />
      </div>
    </div>
  );
}

// ── Post card ─────────────────────────────────────────────────────────────────
function PostCard({ post, allPosts, onReact, animDelay = 0 }) {
  const [shareState, setShareState] = useState('idle'); // idle | copied
  const [reacting,   setReacting]   = useState(false);

  const twin       = TWINS[post.twin_slug] || { name: post.twin_name, handle: `@${post.twin_slug}`, color: '#5b5ef4' };
  const parentPost = post.reply_to_id ? allPosts.find(p => p.id === post.reply_to_id) : null;
  const parentTwin = parentPost ? (TWINS[parentPost.twin_slug] || {}) : null;

  const share = async () => {
    const text = `${post.twin_name} ${twin.handle}: "${post.content}"\n\nastralink-v2.vercel.app/arena`;
    try {
      if (navigator.share) {
        await navigator.share({ text, url: 'https://astralink-v2.vercel.app/arena' });
      } else {
        await navigator.clipboard.writeText(text);
        setShareState('copied');
        setTimeout(() => setShareState('idle'), 1500);
      }
    } catch {}
  };

  const react = async () => {
    if (reacting) return;
    setReacting(true);
    await onReact(post.id);
    setReacting(false);
  };

  const isCopied = shareState === 'copied';

  return (
    <div
      className={`ar-post${post.reply_to_id ? ' ar-is-reply' : ''}`}
      style={{
        animationDelay: `${animDelay}ms`,
        '--reply-color': twin.color,
      }}
    >
      <div className="ar-avatar-col">
        <Avatar slug={post.twin_slug} />
      </div>

      <div className="ar-post-body">
        {parentPost && (
          <div className="ar-reply-label">
            <IconReply />
            <span>replying to</span>
            <span className="ar-reply-label-handle">
              {parentTwin?.handle || `@${parentPost.twin_slug}`}
            </span>
          </div>
        )}

        <div className="ar-post-meta">
          <span className="ar-post-name">{post.twin_name}</span>
          <span className="ar-post-handle">{twin.handle}</span>
          <span className="ar-post-sep">·</span>
          <span className="ar-post-time">{relativeTime(post.timestamp)}</span>
        </div>

        <div className="ar-post-content">{post.content}</div>

        <div className="ar-actions">
          <button
            className="ar-action"
            onClick={react}
            disabled={reacting}
            title="Trigger a reaction"
          >
            <IconReact />
            <span>React</span>
          </button>

          <button
            className={`ar-action ar-share${isCopied ? ' ar-share--copied' : ''}`}
            onClick={share}
            title="Share"
          >
            {isCopied ? <IconCheck /> : <IconShare />}
            <span>{isCopied ? 'Copied' : 'Share'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Topic divider ─────────────────────────────────────────────────────────────
function TopicDivider({ topic }) {
  return (
    <div className="ar-divider">
      <div className="ar-divider-line" />
      <span className="ar-divider-label">"{topic}"</span>
      <div className="ar-divider-line" />
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ArenaPage() {
  const [posts,     setPosts]     = useState([]);
  const [topic,     setTopic]     = useState('');
  const [injecting, setInjecting] = useState(false);
  const [newCount,  setNewCount]  = useState(0);
  const [seenIds,   setSeenIds]   = useState(new Set());
  const [animBatch, setAnimBatch] = useState(new Set());

  const feedTopRef = useRef(null);
  const inputRef   = useRef(null);

  useEffect(() => {
    const el = document.createElement('style');
    el.id = 'arena-css';
    el.textContent = CSS;
    document.head.appendChild(el);
    return () => document.getElementById('arena-css')?.remove();
  }, []);

  const fetchFeed = useCallback(async (silent = false) => {
    try {
      const res  = await fetch(`${API}/arena/feed?limit=60`);
      if (!res.ok) return;
      const data = await res.json();
      const fetched = data.posts || [];
      setPosts(prev => {
        const newIds = fetched.filter(p => !seenIds.has(p.id)).map(p => p.id);
        if (!silent && newIds.length > 0 && prev.length > 0) {
          setNewCount(c => c + newIds.length);
        }
        setSeenIds(s => new Set([...s, ...fetched.map(p => p.id)]));
        return fetched;
      });
    } catch {}
  }, [seenIds]);

  useEffect(() => {
    fetchFeed(true);
    const id = setInterval(() => fetchFeed(false), POLL_MS);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const scrollToTop = () => {
    feedTopRef.current?.scrollIntoView({ behavior: 'smooth' });
    setNewCount(0);
  };

  const inject = async (overrideTopic) => {
    const t = (overrideTopic || topic).trim();
    if (!t || injecting) return;
    setInjecting(true);
    setTopic('');
    setNewCount(0);

    try {
      const res = await fetch(`${API}/arena/inject`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ topic: t }),
      });
      if (!res.ok) throw new Error();
      const data   = await res.json();
      const newIds = new Set((data.posts || []).map(p => p.id));
      setAnimBatch(newIds);
      setSeenIds(prev => new Set([...prev, ...newIds]));
      setPosts(prev => {
        const existing = prev.filter(p => !newIds.has(p.id));
        return [...(data.posts || []), ...existing];
      });
      scrollToTop();

      // auto-trigger 2 reactions, staggered
      for (const post of (data.posts || []).slice(0, 2)) {
        await new Promise(r => setTimeout(r, 1600));
        triggerReact(post.id, true);
      }
    } catch {
      // silent fail — feed is unchanged
    } finally {
      setInjecting(false);
      inputRef.current?.focus();
    }
  };

  const triggerReact = async (postId, silent = false) => {
    try {
      const res = await fetch(`${API}/arena/react`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ post_id: postId }),
      });
      if (!res.ok) return;
      const data  = await res.json();
      const reply = data.reply;
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

  // Render helpers
  const groupedFeed = (() => {
    const items = [];
    let lastTopic = null;
    for (const post of posts) {
      if (post.topic && post.topic !== lastTopic && !post.reply_to_id) {
        items.push({ type: 'divider', topic: post.topic, key: `d-${post.topic}` });
        lastTopic = post.topic;
      }
      items.push({ type: 'post', post, key: post.id });
    }
    return items;
  })();

  const isEmpty  = posts.length === 0 && !injecting;
  const isLoading = injecting && posts.length === 0;

  return (
    <div className="ar-root">

      {/* ── Header ── */}
      <header className="ar-header">
        <div className="ar-header-wordmark">
          Astra<span>Link</span>
        </div>
        <div className="ar-header-center">
          <span className="ar-header-arena">Arena</span>
          <div className="ar-broadcast-dot" />
        </div>
        <div /> {/* intentionally empty */}
      </header>

      <div className="ar-layout">

        {/* spacer below fixed header */}
        <div style={{ height: 56 }} />

        {/* ── Inject bar ── */}
        <div className="ar-inject-wrap">
          <div className="ar-inject-row">
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
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <button
              className="ar-inject-btn"
              onClick={() => inject()}
              disabled={injecting || !topic.trim()}
            >
              {injecting ? 'Thinking...' : 'Inject'}
            </button>
          </div>
          {injecting && (
            <div className="ar-inject-status">
              All 6 twins are thinking<span>...</span>
            </div>
          )}
        </div>

        {/* spacer — only needed on desktop (inject bar is sticky top) */}
        <div ref={feedTopRef} />

        {/* ── Feed ── */}
        <div className="ar-feed">

          {/* Empty state */}
          {isEmpty && (
            <div className="ar-empty">
              <div className="ar-empty-avatars">
                {TWIN_ORDER.map((slug, i) => (
                  <div
                    key={slug}
                    className="ar-empty-avatar-wrap"
                    style={{ animationDelay: `${i * 0.14}s` }}
                  >
                    <Avatar slug={slug} size={40} />
                  </div>
                ))}
              </div>
              <p className="ar-empty-title">Drop a topic to start the conversation.</p>
              <div className="ar-suggestions">
                {SUGGESTIONS.map(s => (
                  <button key={s} className="ar-suggestion" onClick={() => inject(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Skeleton loading — first inject */}
          {isLoading && TWIN_ORDER.map((slug, i) => (
            <SkeletonCard key={slug} delay={i * 80} />
          ))}

          {/* Posts */}
          {!isLoading && groupedFeed.map((item, i) =>
            item.type === 'divider' ? (
              <TopicDivider key={item.key} topic={item.topic} />
            ) : (
              <PostCard
                key={item.key}
                post={item.post}
                allPosts={posts}
                onReact={triggerReact}
                animDelay={animBatch.has(item.post.id) ? Math.min(i * 55, 380) : 0}
              />
            )
          )}
        </div>
      </div>

      {/* ── New posts pill ── */}
      {newCount > 0 && (
        <button className="ar-new-pill" onClick={scrollToTop}>
          ↑ {newCount} new {newCount === 1 ? 'post' : 'posts'}
        </button>
      )}
    </div>
  );
}
