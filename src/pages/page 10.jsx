import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';

const customStyles = {
  sunburstLine: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '50%',
    height: '1px',
    background: '#6366F1',
    transformOrigin: '0 0',
  },
  connectionLine: {
    fill: 'none',
    stroke: '#E5E7EB',
    strokeWidth: 1.5,
    transition: 'stroke 0.4s ease, stroke-width 0.4s ease',
    opacity: 0.3,
  },
  connectionLineActive: {
    stroke: '#6366F1',
    strokeWidth: 2.5,
    opacity: 1,
  },
};

const HomePage = () => {
  const [activeNodes, setActiveNodes] = useState(new Set([1, 2]));
  const [visibleRows, setVisibleRows] = useState(new Set());
  const [visibleStatements, setVisibleStatements] = useState(new Set());
  const observerRef = useRef(null);
  const svgRef = useRef(null);
  const centerNodeRef = useRef(null);
  const orbitContainerRef = useRef(null);

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      :root {
        --primary: #6366F1;
        --primary-rgb: 99, 102, 241;
        --bg: #FFFFFF;
        --text-main: #1F2937;
        --text-muted: #6B7280;
        --border: #E5E7EB;
        --line-width: 1px;
        --font-display: 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif;
        --ease: cubic-bezier(0.23, 1, 0.32, 1);
      }

      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        -webkit-font-smoothing: antialiased;
      }

      body {
        background-color: var(--bg);
        color: var(--text-main);
        font-family: var(--font-display);
        overflow-x: hidden;
        line-height: 1.5;
      }

      .grid-container {
        display: grid;
        grid-template-columns: 1fr;
        width: 100%;
        max-width: 100%;
        margin: 0 auto;
        border-left: var(--line-width) solid var(--border);
        border-right: var(--line-width) solid var(--border);
      }

      h1, h2, h3 {
        font-weight: 700;
        letter-spacing: -0.02em;
      }

      .micro-label {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--text-muted);
        margin-bottom: 1rem;
        display: block;
      }

      header {
        position: relative;
        min-height: 90vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        border-bottom: var(--line-width) solid var(--border);
      }

      .sunburst-bg {
        position: absolute;
        top: -50%;
        left: 50%;
        transform: translateX(-50%);
        width: 150vw;
        height: 150vw;
        z-index: 0;
        opacity: 0.1;
        pointer-events: none;
      }

      @keyframes pulseLine {
        0%, 100% { opacity: 0.1; width: 50%; }
        50% { opacity: 0.2; width: 60%; }
      }

      .sunburst-line {
        animation: pulseLine 3s ease-in-out infinite;
      }

      .sunburst-line:nth-child(odd) {
        animation-delay: 0.5s;
      }

      .sunburst-line:nth-child(3n) {
        animation-delay: 1s;
      }

      .header-content {
        position: relative;
        z-index: 1;
        text-align: center;
        max-width: 800px;
        padding: 0 24px;
      }

      .main-title {
        font-size: clamp(32px, 5vw, 48px);
        line-height: 1.2;
        color: var(--text-main);
        margin-bottom: 24px;
      }

      .sub-title {
        font-size: 20px;
        color: var(--text-muted);
        line-height: 1.8;
      }

      .timeline-section {
        position: relative;
        padding: 0;
      }

      .timeline-header {
        padding: 80px 24px;
        text-align: center;
        border-bottom: var(--line-width) solid var(--border);
      }

      .timeline-row {
        display: grid;
        grid-template-columns: 1fr 120px 1fr;
        min-height: 300px;
        border-bottom: var(--line-width) solid var(--border);
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.8s var(--ease), transform 0.8s var(--ease);
      }

      .timeline-row.visible {
        opacity: 1;
        transform: translateY(0);
      }

      .t-col {
        padding: 40px;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }

      .t-year {
        text-align: right;
        font-size: 14px;
        font-weight: 700;
        letter-spacing: 0.05em;
      }

      .t-center {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        border-left: var(--line-width) solid var(--border);
        border-right: var(--line-width) solid var(--border);
      }

      .flow-line {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 2px;
        background: var(--border);
        z-index: 0;
      }

      .flow-line-fill {
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 2px;
        background: var(--primary);
        height: 0%;
        z-index: 1;
        transition: height 1s linear;
      }

      .timeline-row.visible .flow-line-fill {
        height: 100%;
      }

      .geo-icon {
        width: 48px;
        height: 48px;
        background: var(--bg);
        z-index: 2;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid transparent;
      }

      .geo-icon svg {
        width: 100%;
        height: 100%;
      }

      .t-content h3 {
        font-size: 24px;
        margin-bottom: 12px;
      }

      .t-content p {
        font-size: 16px;
        line-height: 1.6;
      }

      .fade-100 { color: rgba(var(--primary-rgb), 1); }
      .fade-100 .geo-icon svg path { fill: rgba(var(--primary-rgb), 1); }
      
      .fade-80 { color: rgba(var(--primary-rgb), 0.8); }
      .fade-80 .geo-icon svg path { fill: rgba(var(--primary-rgb), 0.8); }

      .fade-60 { color: rgba(var(--primary-rgb), 0.6); }
      .fade-60 .geo-icon svg path { fill: rgba(var(--primary-rgb), 0.6); }

      .fade-40 { color: rgba(var(--primary-rgb), 0.4); }
      .fade-40 .geo-icon svg path { fill: rgba(var(--primary-rgb), 0.4); }

      .fade-20 { color: rgba(var(--primary-rgb), 0.2); }
      .fade-20 .geo-icon svg path { fill: rgba(var(--primary-rgb), 0.2); }

      .control-section {
        padding: 120px 24px;
        background: #FAFAFA;
        border-bottom: var(--line-width) solid var(--border);
        overflow: hidden;
      }

      .control-header {
        text-align: center;
        margin-bottom: 80px;
      }

      .orbit-container {
        position: relative;
        width: 100%;
        max-width: 800px;
        height: 600px;
        margin: 0 auto;
      }

      .orbit-lines {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 0;
      }

      .node {
        position: absolute;
        background: var(--bg);
        border: 2px solid var(--border);
        border-radius: 50%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s var(--ease);
        z-index: 10;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        width: 100px;
        height: 100px;
      }

      .node:hover {
        transform: scale(1.08);
        border-color: var(--primary);
        box-shadow: 0 4px 16px rgba(99, 102, 241, 0.2);
      }

      .node.center-node {
        width: 120px;
        height: 120px;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        border: 3px solid var(--primary);
        background: var(--primary);
        color: white;
        z-index: 20;
        cursor: default;
        box-shadow: 0 8px 24px rgba(99, 102, 241, 0.3);
      }

      .node-label {
        font-size: 13px;
        font-weight: 600;
        margin-bottom: 6px;
        pointer-events: none;
        color: var(--text-main);
      }

      .toggle-switch {
        width: 36px;
        height: 20px;
        background: #E5E7EB;
        border-radius: 20px;
        position: relative;
        pointer-events: none;
        transition: background 0.3s;
      }

      .toggle-knob {
        width: 16px;
        height: 16px;
        background: white;
        border-radius: 50%;
        position: absolute;
        top: 2px;
        left: 2px;
        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        box-shadow: 0 2px 4px rgba(0,0,0,0.15);
      }

      .node.active {
        border-color: var(--primary);
        background: rgba(99, 102, 241, 0.03);
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15), 0 4px 12px rgba(99, 102, 241, 0.2);
      }

      .node.active .toggle-switch {
        background: var(--primary);
      }

      .node.active .toggle-knob {
        transform: translateX(16px);
      }

      .node.active .node-label {
        color: var(--primary);
      }

      .control-footer {
        text-align: center;
        max-width: 600px;
        margin: 60px auto 0;
        font-size: 16px;
        color: var(--text-muted);
      }

      .promise-section {
        padding: 120px 24px;
        text-align: center;
        border-bottom: var(--line-width) solid var(--border);
      }

      .statement-stack {
        display: flex;
        flex-direction: column;
        gap: 24px;
        margin-bottom: 64px;
      }

      .big-statement {
        font-size: 32px;
        font-weight: 700;
        color: var(--text-main);
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.6s var(--ease);
      }

      .big-statement.visible {
        opacity: 1;
        transform: translateY(0);
      }

      .emotional-close {
        font-size: 20px;
        font-style: italic;
        color: var(--text-muted);
        max-width: 600px;
        margin: 0 auto;
        line-height: 1.8;
      }

      .cta-section {
        padding: 100px 24px;
        text-align: center;
        background: #FAFAFA;
      }

      .cta-btn {
        display: inline-block;
        background: var(--primary);
        color: white;
        font-weight: 700;
        font-size: 18px;
        padding: 18px 48px;
        text-decoration: none;
        margin: 32px 0;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border: none;
        cursor: pointer;
        border-radius: 50px;
        box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.3);
      }

      .cta-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 24px -6px rgba(99, 102, 241, 0.5), 0 0 32px rgba(99, 102, 241, 0.4), 0 0 48px rgba(99, 102, 241, 0.25);
        background: #4f46e5;
      }

      @media (max-width: 768px) {
        .timeline-row {
          grid-template-columns: 1fr;
          grid-template-rows: auto auto auto;
          text-align: center;
          gap: 20px;
          padding: 40px 20px;
        }
        .t-year { text-align: center; }
        .t-center { border: none; height: 60px; }
        .flow-line { width: 2px; height: 100%; top: -50%; bottom: -50%; }
        
        .orbit-container { height: 500px; }
        .node { width: 90px; height: 90px; }
        .node.center-node { width: 110px; height: 110px; }
      }
    `;
    document.head.appendChild(styleElement);
    return () => document.head.removeChild(styleElement);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      drawLines();
    };
    
    drawLines();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [activeNodes]);

  useEffect(() => {
    const options = {
      threshold: 0.2,
      rootMargin: '0px',
    };

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.dataset.rowId || entry.target.dataset.statementId;
          if (entry.target.dataset.rowId) {
            setVisibleRows((prev) => new Set([...prev, id]));
          } else if (entry.target.dataset.statementId) {
            setVisibleStatements((prev) => new Set([...prev, id]));
          }
        }
      });
    }, options);

    const timelineRows = document.querySelectorAll('[data-row-id]');
    const statements = document.querySelectorAll('[data-statement-id]');
    
    timelineRows.forEach((el) => observerRef.current.observe(el));
    statements.forEach((el) => observerRef.current.observe(el));

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const drawLines = () => {
    if (!svgRef.current || !centerNodeRef.current || !orbitContainerRef.current) return;

    const svgCanvas = svgRef.current;
    const centerNode = centerNodeRef.current;
    const containerRect = orbitContainerRef.current.getBoundingClientRect();
    const centerRect = centerNode.getBoundingClientRect();

    const cX = centerRect.left - containerRect.left + centerRect.width / 2;
    const cY = centerRect.top - containerRect.top + centerRect.height / 2;

    const satellites = document.querySelectorAll('.node:not(.center-node)');
    const lines = [];

    satellites.forEach((node) => {
      const rect = node.getBoundingClientRect();
      const nX = rect.left - containerRect.left + rect.width / 2;
      const nY = rect.top - containerRect.top + rect.height / 2;
      const nodeId = parseInt(node.dataset.id);
      const isActive = activeNodes.has(nodeId);

      lines.push(
        <line
          key={nodeId}
          x1={cX}
          y1={cY}
          x2={nX}
          y2={nY}
          style={isActive ? { ...customStyles.connectionLine, ...customStyles.connectionLineActive } : customStyles.connectionLine}
        />
      );
    });

    svgCanvas.innerHTML = '';
    return lines;
  };

  const toggleNode = (nodeId) => {
    setActiveNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const sunburstLines = Array.from({ length: 36 }, (_, i) => (
    <div
      key={i}
      style={{
        ...customStyles.sunburstLine,
        transform: `rotate(${i * 10}deg)`,
      }}
    />
  ));

  const timelineData = [
    {
      id: 'row1',
      year: 'TODAY (2026)',
      fadeClass: 'fade-100',
      title: 'This moment. Your choice.',
      description: 'You are here, recording your truth. This is the seed of your legacy.',
      icon: <path d="M12 2L14.5 9.5H22L16 14L18.5 21.5L12 17L5.5 21.5L8 14L2 9.5H9.5L12 2Z" />,
    },
    {
      id: 'row2',
      year: '5 YEARS (2031)',
      fadeClass: 'fade-80',
      title: 'Your voice becomes their guide.',
      description: 'When they need advice, they don’t just remember you. They hear you.',
      icon: <path d="M8 0H16V8H24V16H16V24H8V16H0V8H8V0Z" style={{ borderRadius: '4px' }} />,
    },
    {
      id: 'row3',
      year: '20 YEARS (2046)',
      fadeClass: 'fade-60',
      title: 'You’re not gone. You’re still answering.',
      description: 'A new generation learns from your experiences, guided by your preserved wisdom.',
      icon: <path d="M12 0C12 0 24 10.7452 24 18C24 21.3137 21.3137 24 18 24H6C2.68629 24 0 21.3137 0 18C0 10.7452 12 0 12 0Z" />,
    },
    {
      id: 'row4',
      year: '50 YEARS (2076)',
      fadeClass: 'fade-40',
      title: 'Your thinking shapes their future.',
      description: 'The values you articulate today ripple through decades you will not see.',
      icon: <rect width="24" height="24" rx="6" />,
    },
    {
      id: 'row5',
      year: '100 YEARS (2126)',
      fadeClass: 'fade-20',
      title: 'You never really leave.',
      description: 'Ethereal, timeless. Your essence remains a fundamental part of your family’s story.',
      icon: <path d="M12 0L14.8 9.2L24 12L14.8 14.8L12 24L9.2 14.8L0 12L9.2 9.2L12 0Z" />,
    },
  ];

  const nodeData = [
    { id: 1, label: 'Partner', style: { top: '20%', left: '50%' } },
    { id: 2, label: 'Kids', style: { top: '35%', left: '80%' } },
    { id: 3, label: 'Grandkids', style: { top: '65%', left: '80%' } },
    { id: 4, label: 'Mentees', style: { top: '80%', left: '50%' } },
    { id: 5, label: 'Friends', style: { top: '50%', left: '20%' } },
  ];

  const statements = [
    'Your voice never disappears.',
    'Your thinking shapes generations.',
    'Your legacy compounds forever.',
  ];

  return (
    <div>
      <header>
        <div className="sunburst-bg">{sunburstLines}</div>
        <div className="header-content">
          <span className="micro-label">Family Sharing</span>
          <h1 className="main-title">
            Years from now, your child will face a decision.<br />
            They'll think of you.<br />
            They'll want to know: "What would they do?"
          </h1>
          <p className="sub-title">Right now, in this moment, you have the power to answer that question. Forever.</p>
        </div>
      </header>

      <section className="timeline-section">
        <div className="timeline-header">
          <h2>The Echo Through Time</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Scroll to view the legacy you are building.</p>
        </div>

        <div className="grid-container">
          {timelineData.map((row) => (
            <div
              key={row.id}
              data-row-id={row.id}
              className={`timeline-row ${row.fadeClass} ${visibleRows.has(row.id) ? 'visible' : ''}`}
            >
              <div className="t-col t-year">{row.year}</div>
              <div className="t-col t-center">
                <div className="flow-line">
                  <div className="flow-line-fill" />
                </div>
                <div className="geo-icon">
                  <svg viewBox="0 0 24 24" fill="none">
                    {row.icon}
                  </svg>
                </div>
              </div>
              <div className="t-col t-content">
                <h3>{row.title}</h3>
                <p>{row.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="control-section">
        <div className="control-header">
          <h2 className="main-title" style={{ fontSize: '40px' }}>You decide who gets to hear you</h2>
          <p className="sub-title">Your voice. Your control. Always.</p>
        </div>

        <div className="orbit-container" ref={orbitContainerRef}>
          <svg className="orbit-lines" ref={svgRef}>
            {drawLines()}
          </svg>

          <div className="node center-node" ref={centerNodeRef}>
            <div style={{ fontWeight: 700, fontSize: '18px' }}>YOU</div>
          </div>

          {nodeData.map((node) => (
            <div
              key={node.id}
              className={`node ${activeNodes.has(node.id) ? 'active' : ''}`}
              data-id={node.id}
              style={{ ...node.style, transform: 'translate(-50%, -50%)' }}
              onClick={() => toggleNode(node.id)}
            >
              <span className="node-label">{node.label}</span>
              <div className="toggle-switch">
                <div className="toggle-knob" />
              </div>
            </div>
          ))}
        </div>

        <p className="control-footer">
          These are YOUR relationships. These are YOUR boundaries. You’re not uploading to the cloud. You’re not giving data to companies. You’re giving YOURSELF to people you love.
        </p>
      </section>

      <section className="promise-section">
        <div className="statement-stack">
          {statements.map((statement, index) => (
            <div
              key={index}
              data-statement-id={`statement-${index}`}
              className={`big-statement ${visibleStatements.has(`statement-${index}`) ? 'visible' : ''}`}
              style={{ transitionDelay: `${index * 0.2}s` }}
            >
              {statement}
            </div>
          ))}
        </div>
        <p className="emotional-close">
          "This isn't about technology. This is about love. Your love, amplified across time. Your wisdom, given as a gift. Your voice, eternal."
        </p>
      </section>

      <section className="cta-section">
        <h2 style={{ fontSize: '36px', color: 'var(--text-main)' }}>Ready to start your legacy?</h2>
        <p style={{ fontSize: '18px', color: 'var(--text-muted)', marginTop: '16px' }}>Your voice. Your wisdom. Forever.</p>
        <a href="/journey" className="cta-btn">Begin Recording</a>
        <p style={{ fontSize: '14px', fontStyle: 'italic', color: '#9CA3AF' }}>
          By starting, you’re not just creating an account. You’re beginning something that lasts forever.
        </p>
      </section>
    </div>
  );
};

const App = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </>
  );
};

export default App;