import React, { useState, useEffect, useRef, useCallback } from 'react';

const API = 'https://astralink-v2-production.up.railway.app';
const POLL_MS = 30_000;

// ── Twin identity ─────────────────────────────────────────────────────────────
const TWINS = {
  mrbeast:    { handle: '@MrBeast',    color: '#F59E0B', emoji: '👑' },
  ishowspeed: { handle: '@IShowSpeed', color: '#EF4444', emoji: '🔥' },
  kaicenat:   { handle: '@KaiCenat',   color: '#A78BFA', emoji: '🎮' },
  ksi:        { handle: '@KSI',        color: '#3B82F6', emoji: '🥊' },
  loganpaul:  { handle: '@LoganPaul',  color: '#F97316', emoji: '💪' },
  jakepaul:   { handle: '@JakePaul',   color: '#EC4899', emoji: '🥊' },
};

function relativeTime(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 5)   return 'just now';
  if (diff < 60)  return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

// ── Styles ────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');

  @keyframes arFadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes arFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes arPulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.3; }
  }
  @keyframes arSpin {
    to { transform: rotate(360deg); }
  }
  @keyframes arSlideDown {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes arProgressBar {
    from { width: 0%; }
    to   { width: 100%; }
  }

  *, *::before, *::after { box-sizing: border-box; }

  .ar-root {
    min-height: 100dvh;
    background: #0a0a0a;
    font-family: 'Inter', sans-serif;
    -webkit-font-smoothing: antialiased;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .ar-inner {
    width: 100%;
    max-width: 600px;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
  }

  /* ── Header ───────────────────────────────────────────────────────────────── */
  .ar-header {
    position: fixed;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 600px;
    background: rgba(10,10,10,0.88);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid #1e1e1e;
    padding: 14px 18px;
    display: flex;
    align-items: center;
    gap: 10px;
    z-index: 100;
  }
  .ar-header-logo {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    flex-shrink: 0;
  }
  .ar-header-title {
    font-size: 16px;
    font-weight: 700;
    color: #f0f0f0;
    letter-spacing: -0.01em;
  }
  .ar-header-sub {
    font-size: 11px;
    color: #555;
    margin-top: 1px;
  }
  .ar-live-badge {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 5px;
    background: rgba(99,102,241,0.12);
    border: 1px solid rgba(99,102,241,0.25);
    border-radius: 20px;
    padding: 3px 10px 3px 7px;
    flex-shrink: 0;
  }
  .ar-live-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #6366f1;
    box-shadow: 0 0 6px #6366f1;
    animation: arPulse 2s ease-in-out infinite;
  }
  .ar-live-text {
    font-size: 10px;
    font-weight: 600;
    color: #818cf8;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  /* ── Inject bar ───────────────────────────────────────────────────────────── */
  .ar-inject-wrap {
    position: sticky;
    top: 61px;
    z-index: 90;
    background: rgba(10,10,10,0.92);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-bottom: 1px solid #1a1a1a;
    padding: 12px 16px;
  }
  .ar-inject-row {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .ar-inject-input {
    flex: 1;
    background: #141414;
    border: 1px solid #2a2a2a;
    border-radius: 24px;
    padding: 10px 18px;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    color: #e8e8e8;
    outline: none;
    transition: border-color 0.15s;
    min-width: 0;
  }
  .ar-inject-input::placeholder { color: #404040; }
  .ar-inject-input:focus { border-color: #4f46e5; }
  .ar-inject-input:disabled { opacity: 0.4; cursor: not-allowed; }
  .ar-inject-btn {
    background: #6366f1;
    color: #fff;
    border: none;
    border-radius: 24px;
    padding: 10px 18px;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition: opacity 0.15s, transform 0.1s;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .ar-inject-btn:hover:not(:disabled) { opacity: 0.88; }
  .ar-inject-btn:active:not(:disabled) { transform: scale(0.95); }
  .ar-inject-btn:disabled { opacity: 0.35; cursor: not-allowed; }
  .ar-inject-spinner {
    width: 12px;
    height: 12px;
    border: 2px solid rgba(255,255,255,0.25);
    border-top-color: #fff;
    border-radius: 50%;
    animation: arSpin 0.65s linear infinite;
  }

  /* Loading progress bar */
  .ar-progress-bar {
    height: 2px;
    background: #6366f1;
    border-radius: 1px;
    margin-top: 8px;
    animation: arProgressBar 8s ease-out forwards;
  }

  /* ── Status banner ────────────────────────────────────────────────────────── */
  .ar-status {
    margin-top: 8px;
    font-size: 12px;
    color: #6366f1;
    text-align: center;
    animation: arFadeIn 0.2s ease forwards;
  }

  /* ── Feed ─────────────────────────────────────────────────────────────────── */
  .ar-feed {
    flex: 1;
    padding-bottom: 48px;
  }
  .ar-spacer { height: 61px; }   /* below sticky inject bar */

  /* ── Empty state ──────────────────────────────────────────────────────────── */
  .ar-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 72px 24px;
    gap: 12px;
    animation: arFadeIn 0.4s ease forwards;
  }
  .ar-empty-icon {
    font-size: 36px;
    opacity: 0.6;
  }
  .ar-empty-title {
    font-size: 17px;
    font-weight: 600;
    color: #d0d0d0;
    margin: 0;
  }
  .ar-empty-sub {
    font-size: 13px;
    color: #444;
    margin: 0;
    line-height: 1.6;
    text-align: center;
    max-width: 300px;
  }
  .ar-suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
    margin-top: 4px;
  }
  .ar-suggestion-pill {
    background: #141414;
    border: 1px solid #242424;
    border-radius: 20px;
    padding: 6px 14px;
    font-size: 12px;
    color: #555;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    transition: border-color 0.15s, color 0.15s;
    -webkit-tap-highlight-color: transparent;
  }
  .ar-suggestion-pill:hover { border-color: #6366f1; color: #818cf8; }

  /* ── Post card ────────────────────────────────────────────────────────────── */
  .ar-post {
    display: flex;
    gap: 12px;
    padding: 16px 16px 14px;
    border-bottom: 1px solid #151515;
    animation: arFadeUp 0.28s ease forwards;
    opacity: 0;
    transition: background 0.1s;
    text-decoration: none;
    cursor: default;
  }
  .ar-post:hover { background: rgba(255,255,255,0.018); }
  .ar-post.ar-reply { background: rgba(99,102,241,0.025); }

  .ar-avatar-col { flex-shrink: 0; }
  .ar-avatar {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 17px;
    font-weight: 700;
    color: #000;
    position: relative;
    flex-shrink: 0;
  }
  .ar-avatar-thread-line {
    width: 2px;
    background: #1e1e1e;
    margin: 4px auto 0;
    flex: 1;
    min-height: 12px;
  }

  .ar-post-body { flex: 1; min-width: 0; }

  /* Reply context */
  .ar-reply-context {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: #3f3f5f;
    margin-bottom: 4px;
  }

  .ar-post-meta {
    display: flex;
    align-items: baseline;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 5px;
  }
  .ar-post-name {
    font-size: 14px;
    font-weight: 700;
    color: #f0f0f0;
    line-height: 1.2;
  }
  .ar-post-handle {
    font-size: 13px;
    color: #444;
    line-height: 1.2;
  }
  .ar-post-dot {
    font-size: 11px;
    color: #333;
  }
  .ar-post-time {
    font-size: 12px;
    color: #3a3a3a;
    line-height: 1.2;
  }
  .ar-post-content {
    font-size: 15px;
    line-height: 1.65;
    color: #e0e0e0;
    word-break: break-word;
    white-space: pre-wrap;
    margin-bottom: 10px;
  }

  /* Action row */
  .ar-post-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .ar-action-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    background: transparent;
    border: none;
    padding: 5px 8px;
    border-radius: 20px;
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    color: #383838;
    cursor: pointer;
    transition: color 0.15s, background 0.15s;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
  }
  .ar-action-btn:hover { color: #6366f1; background: rgba(99,102,241,0.08); }
  .ar-action-btn.ar-react-btn:hover { color: #a855f7; background: rgba(168,85,247,0.08); }
  .ar-action-btn.copied { color: #22c55e !important; }

  /* ── Toast ────────────────────────────────────────────────────────────────── */
  .ar-toast {
    position: fixed;
    bottom: 28px;
    left: 50%;
    transform: translateX(-50%);
    background: #1e1e1e;
    border: 1px solid #2e2e2e;
    border-radius: 24px;
    padding: 9px 20px;
    font-size: 13px;
    font-weight: 500;
    color: #c0c0c0;
    z-index: 200;
    animation: arSlideDown 0.2s ease forwards;
    white-space: nowrap;
    pointer-events: none;
  }

  /* ── New posts pill ───────────────────────────────────────────────────────── */
  .ar-new-posts-btn {
    position: fixed;
    top: 124px;
    left: 50%;
    transform: translateX(-50%);
    background: #6366f1;
    color: #fff;
    border: none;
    border-radius: 24px;
    padding: 8px 18px;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    z-index: 95;
    animation: arSlideDown 0.22s ease forwards;
    box-shadow: 0 4px 20px rgba(99,102,241,0.4);
    -webkit-tap-highlight-color: transparent;
  }
  .ar-new-posts-btn:hover { opacity: 0.9; }

  /* ── Topic badge ──────────────────────────────────────────────────────────── */
  .ar-topic-divider {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px 8px;
    animation: arFadeIn 0.3s ease forwards;
  }
  .ar-topic-line { flex: 1; height: 1px; background: #1a1a1a; }
  .ar-topic-badge {
    font-size: 11px;
    color: #444;
    font-weight: 500;
    white-space: nowrap;
    max-width: 220px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

// ── Suggestion topics ─────────────────────────────────────────────────────────
const SUGGESTIONS = [
  'who is the biggest creator in the world',
  'should you fight your rivals or collab with them',
  'how do you deal with haters online',
  'what does success actually mean',
];

// ── Icons ─────────────────────────────────────────────────────────────────────
const ShareIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
    <polyline points="16 6 12 2 8 6"/>
    <line x1="12" y1="2" x2="12" y2="15"/>
  </svg>
);

const ReplyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 17 4 12 9 7"/>
    <path d="M20 18v-2a4 4 0 0 0-4-4H4"/>
  </svg>
);

const FlashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

// ── Avatar component ───────────────────────────────────────────────────────────
function Avatar({ slug, size = 42 }) {
  const twin  = TWINS[slug] || { color: '#6366f1', emoji: '?' };
  return (
    <div className="ar-avatar" style={{
      width: size, height: size,
      background: twin.color,
      fontSize: size * 0.4,
    }}>
      {twin.emoji}
    </div>
  );
}

// ── Post card ──────────────────────────────────────────────────────────────────
function PostCard({ post, allPosts, onReact, onToast, animDelay = 0 }) {
  const [copied,   setCopied]   = useState(false);
  const [reacting, setReacting] = useState(false);
  const twin   = TWINS[post.twin_slug] || {};
  const handle = twin.handle || `@${post.twin_slug}`;

  const parentPost = post.reply_to_id
    ? allPosts.find(p => p.id === post.reply_to_id)
    : null;
  const parentTwin = parentPost ? (TWINS[parentPost.twin_slug] || {}) : null;

  const share = async () => {
    const text = `${post.twin_name} ${handle}: "${post.content}" — AstraLink Arena`;
    try {
      if (navigator.share) {
        await navigator.share({ text, url: 'https://astralink.life/arena' });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        onToast('Copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {}
  };

  const react = async () => {
    if (reacting) return;
    setReacting(true);
    await onReact(post.id);
    setReacting(false);
  };

  return (
    <div
      className={`ar-post${post.reply_to_id ? ' ar-reply' : ''}`}
      style={{ animationDelay: `${animDelay}ms` }}
    >
      {/* Avatar column */}
      <div className="ar-avatar-col">
        <Avatar slug={post.twin_slug} />
      </div>

      {/* Body */}
      <div className="ar-post-body">
        {/* Replying to */}
        {parentPost && (
          <div className="ar-reply-context">
            <ReplyIcon />
            <span>
              replying to{' '}
              <span style={{ color: '#6366f1' }}>
                {parentTwin?.handle || `@${parentPost.twin_slug}`}
              </span>
            </span>
          </div>
        )}

        {/* Meta */}
        <div className="ar-post-meta">
          <span className="ar-post-name" style={{ color: twin.color || '#f0f0f0' }}>
            {post.twin_name}
          </span>
          <span className="ar-post-handle">{handle}</span>
          <span className="ar-post-dot">·</span>
          <span className="ar-post-time">{relativeTime(post.timestamp)}</span>
        </div>

        {/* Content */}
        <div className="ar-post-content">{post.content}</div>

        {/* Actions */}
        <div className="ar-post-actions">
          <button
            className={`ar-action-btn ar-react-btn`}
            onClick={react}
            disabled={reacting}
            title="Trigger a reaction"
          >
            {reacting
              ? <div style={{ width: 12, height: 12, border: '2px solid rgba(168,85,247,0.3)', borderTopColor: '#a855f7', borderRadius: '50%', animation: 'arSpin 0.65s linear infinite' }} />
              : <FlashIcon />
            }
            <span>React</span>
          </button>

          <button
            className={`ar-action-btn${copied ? ' copied' : ''}`}
            onClick={share}
            title="Share this post"
          >
            <ShareIcon />
            <span>{copied ? 'Copied!' : 'Share'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Topic divider ─────────────────────────────────────────────────────────────
function TopicDivider({ topic }) {
  return (
    <div className="ar-topic-divider">
      <div className="ar-topic-line" />
      <span className="ar-topic-badge">"{topic}"</span>
      <div className="ar-topic-line" />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ArenaPage() {
  const [posts,        setPosts]        = useState([]);
  const [topic,        setTopic]        = useState('');
  const [injecting,    setInjecting]    = useState(false);
  const [statusMsg,    setStatusMsg]    = useState('');
  const [toast,        setToast]        = useState('');
  const [newCount,     setNewCount]     = useState(0);
  const [seenIds,      setSeenIds]      = useState(new Set());
  const [animBatch,    setAnimBatch]    = useState(new Set());
  const feedTopRef  = useRef(null);
  const inputRef    = useRef(null);
  const toastTimer  = useRef(null);

  // ── Inject CSS ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = document.createElement('style');
    el.id = 'arena-styles';
    el.textContent = CSS;
    document.head.appendChild(el);
    return () => document.getElementById('arena-styles')?.remove();
  }, []);

  // ── Toast helper ────────────────────────────────────────────────────────────
  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2500);
  }, []);

  // ── Fetch feed ──────────────────────────────────────────────────────────────
  const fetchFeed = useCallback(async (silent = false) => {
    try {
      const res  = await fetch(`${API}/arena/feed?limit=50`);
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

  // Initial load + poll
  useEffect(() => {
    fetchFeed(true);
    const id = setInterval(() => fetchFeed(false), POLL_MS);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Scroll to top + dismiss new-posts pill ──────────────────────────────────
  const scrollToTop = () => {
    feedTopRef.current?.scrollIntoView({ behavior: 'smooth' });
    setNewCount(0);
  };

  // ── Inject topic ────────────────────────────────────────────────────────────
  const inject = async (overrideTopic) => {
    const t = (overrideTopic || topic).trim();
    if (!t || injecting) return;
    setInjecting(true);
    setStatusMsg('All 6 twins are posting…');
    setTopic('');
    setNewCount(0);

    try {
      const res = await fetch(`${API}/arena/inject`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ topic: t }),
      });
      if (!res.ok) throw new Error('Inject failed');
      const data   = await res.json();
      const newIds = new Set((data.posts || []).map(p => p.id));
      setAnimBatch(newIds);
      setSeenIds(prev => new Set([...prev, ...newIds]));
      setPosts(prev => {
        const existing = prev.filter(p => !newIds.has(p.id));
        return [...(data.posts || []), ...existing];
      });
      setStatusMsg('');
      scrollToTop();

      // Auto-trigger 2 reactions with staggered delay
      const reactTargets = (data.posts || []).slice(0, 2);
      for (const post of reactTargets) {
        await new Promise(r => setTimeout(r, 1400));
        triggerReact(post.id, true);
      }
    } catch {
      setStatusMsg('');
      showToast('Something went wrong — try again');
    } finally {
      setInjecting(false);
      setStatusMsg('');
      inputRef.current?.focus();
    }
  };

  // ── Trigger reaction ─────────────────────────────────────────────────────────
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
        // Insert reply immediately after its parent
        const idx = prev.findIndex(p => p.id === postId);
        if (idx === -1) return [reply, ...prev];
        const next = [...prev];
        next.splice(idx + 1, 0, reply);
        return next;
      });
      if (!silent) showToast(`${reply.twin_name} reacted`);
    } catch {}
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      inject();
    }
  };

  // Group posts by topic for dividers
  const groupedPosts = (() => {
    const items = [];
    let lastTopic = null;
    for (const post of posts) {
      if (post.topic && post.topic !== lastTopic && !post.reply_to_id) {
        items.push({ type: 'divider', topic: post.topic, key: `div-${post.topic}` });
        lastTopic = post.topic;
      }
      items.push({ type: 'post', post, key: post.id });
    }
    return items;
  })();

  return (
    <div className="ar-root">
      <div className="ar-inner">

        {/* Fixed header */}
        <div className="ar-header">
          <div className="ar-header-logo">⚡</div>
          <div>
            <div className="ar-header-title">AstraLink Arena</div>
            <div className="ar-header-sub">AI creator twins, unfiltered</div>
          </div>
          <div className="ar-live-badge">
            <div className="ar-live-dot" />
            <span className="ar-live-text">Live</span>
          </div>
        </div>

        {/* Sticky inject bar */}
        <div className="ar-inject-wrap" style={{ top: 61 }}>
          <div className="ar-inject-row">
            <input
              ref={inputRef}
              className="ar-inject-input"
              type="text"
              placeholder="Drop a topic — all 6 twins respond…"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={injecting}
              maxLength={300}
              autoComplete="off"
            />
            <button
              className="ar-inject-btn"
              onClick={() => inject()}
              disabled={injecting || !topic.trim()}
            >
              {injecting ? <div className="ar-inject-spinner" /> : <FlashIcon />}
              {injecting ? 'Posting…' : 'Inject'}
            </button>
          </div>
          {injecting && <div className="ar-progress-bar" />}
          {statusMsg && <div className="ar-status">{statusMsg}</div>}
        </div>

        {/* Spacer under sticky bars */}
        <div style={{ height: 61 + (injecting ? 52 : statusMsg ? 40 : 0) }} />
        <div ref={feedTopRef} />

        {/* Feed */}
        <div className="ar-feed">
          {posts.length === 0 && !injecting ? (
            <div className="ar-empty">
              <div className="ar-empty-icon">⚡</div>
              <p className="ar-empty-title">The arena is quiet</p>
              <p className="ar-empty-sub">
                Inject a topic and all 6 creator twins post their take — instantly.
              </p>
              <div className="ar-suggestions">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    className="ar-suggestion-pill"
                    onClick={() => inject(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            groupedPosts.map((item, i) =>
              item.type === 'divider' ? (
                <TopicDivider key={item.key} topic={item.topic} />
              ) : (
                <PostCard
                  key={item.key}
                  post={item.post}
                  allPosts={posts}
                  onReact={triggerReact}
                  onToast={showToast}
                  animDelay={animBatch.has(item.post.id) ? Math.min(i * 60, 400) : 0}
                />
              )
            )
          )}
        </div>

      </div>

      {/* New posts pill */}
      {newCount > 0 && (
        <button className="ar-new-posts-btn" onClick={scrollToTop}>
          ↑ {newCount} new post{newCount !== 1 ? 's' : ''}
        </button>
      )}

      {/* Toast */}
      {toast && <div className="ar-toast">{toast}</div>}
    </div>
  );
}
