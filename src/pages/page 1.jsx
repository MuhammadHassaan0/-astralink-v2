import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';

const App = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Manrope:wght@700;800&display=swap');

      :root {
        --color-text-primary: #1F2937;
        --color-text-secondary: #6B7280;
        --color-text-tertiary: #9CA3AF;
        --color-primary: #6366F1;
        --color-slate: #3F3F7F;
        --color-white: #FFFFFF;
        --pad-edge: 64px;
        --gap-h1-h2: 16px;
        --gap-h2-btn: 24px;
        --gap-btn-sec: 8px;
      }

      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      body {
        font-family: 'Inter', sans-serif;
        background-color: #F9FAFB;
        color: var(--color-text-primary);
        overflow-x: hidden;
        -webkit-font-smoothing: antialiased;
      }

      .grain-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9999;
        opacity: 0.05;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
      }

      .hero-container {
        display: flex;
        min-height: 100vh;
        width: 100vw;
        background: #fff;
        position: relative;
      }

      .content-side {
        width: 60%;
        padding: var(--pad-edge);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-start;
        z-index: 10;
        position: relative;
      }

      .visual-side {
        width: 40%;
        position: relative;
        overflow: hidden;
        background: linear-gradient(135deg, #F3F4F6 0%, #E0E7FF 100%);
      }

      h1 {
        font-family: 'Manrope', sans-serif;
        font-weight: 800;
        font-size: 56px;
        line-height: 1.2;
        color: var(--color-text-primary);
        margin-bottom: var(--gap-h1-h2);
        letter-spacing: -0.02em;
        max-width: 90%;
      }

      h2 {
        font-family: 'Inter', sans-serif;
        font-weight: 400;
        font-size: 24px;
        color: var(--color-text-secondary);
        margin-bottom: var(--gap-h2-btn);
        line-height: 1.5;
        max-width: 80%;
      }

      .cta-button {
        background-color: var(--color-primary);
        color: white;
        font-size: 16px;
        font-weight: 500;
        padding: 16px 32px;
        border-radius: 9999px;
        border: none;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.2), 0 2px 4px -1px rgba(99, 102, 241, 0.1);
        position: relative;
        overflow: hidden;
      }

      .cta-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.3);
      }

      .cta-button::after {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        transition: 0.5s;
      }

      .cta-button:hover::after {
        left: 100%;
      }

      .secondary-text {
        margin-top: var(--gap-btn-sec);
        font-size: 14px;
        color: var(--color-text-tertiary);
        font-weight: 400;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .cloud-gradient {
        position: absolute;
        width: 150%;
        height: 150%;
        top: -25%;
        left: -25%;
        background: radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.4), rgba(63, 63, 127, 0.1) 60%, transparent 80%);
        filter: blur(60px);
        animation: cloudDrift 20s infinite alternate ease-in-out;
        opacity: 0.6;
      }

      .cloud-gradient-2 {
        position: absolute;
        width: 120%;
        height: 120%;
        bottom: -10%;
        right: -10%;
        background: radial-gradient(circle at 50% 50%, rgba(224, 231, 255, 0.8), rgba(99, 102, 241, 0.1) 50%, transparent 70%);
        filter: blur(40px);
        animation: cloudDrift 15s infinite alternate-reverse ease-in-out;
      }

      @keyframes cloudDrift {
        0% { transform: translate(0, 0) scale(1); }
        100% { transform: translate(-20px, 20px) scale(1.1); }
      }

      .floating-bubble {
        position: absolute;
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(10px);
        border-radius: 24px 24px 24px 4px;
        padding: 16px 24px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        font-family: 'Inter', sans-serif;
        color: #1F2937;
        font-size: 14px;
        max-width: 240px;
        opacity: 0;
        animation: floatUp 6s ease-out forwards;
        transition: transform 0.3s ease-out;
      }

      .bubble-1 {
        top: 40%;
        left: 20%;
        animation-delay: 0.5s;
      }

      .bubble-2 {
        top: 55%;
        right: 15%;
        border-radius: 24px 24px 4px 24px;
        background: #6366F1;
        color: white;
        animation-delay: 1.5s;
      }

      .scribble {
        position: absolute;
        left: 0;
        bottom: -25px;
        width: 80px;
        height: auto;
        stroke: var(--color-primary);
        stroke-width: 2;
        fill: none;
        opacity: 0.6;
        stroke-linecap: round;
        stroke-dasharray: 100;
        stroke-dashoffset: 100;
        animation: drawScribble 1s ease-out 1s forwards;
        pointer-events: none;
      }

      @keyframes floatUp {
        0% { transform: translateY(40px) scale(0.9); opacity: 0; }
        100% { transform: translateY(0) scale(1); opacity: 1; }
      }

      @keyframes drawScribble {
        to { stroke-dashoffset: 0; }
      }

      .scroll-hint {
        position: absolute;
        bottom: 32px;
        left: var(--pad-edge);
        font-size: 12px;
        color: var(--color-text-tertiary);
        opacity: 0.5;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      @media (max-width: 1024px) {
        .hero-container {
          flex-direction: column;
          height: auto;
          min-height: 100vh;
        }
        .content-side {
          width: 100%;
          padding: 48px 32px;
          order: 2;
        }
        .visual-side {
          width: 100%;
          height: 40vh;
          order: 1;
        }
        h1 { font-size: 42px; }
        .pad-edge { padding: 32px; }
      }
    `;
    document.head.appendChild(styleElement);

    const handleMouseMove = (e) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.head.removeChild(styleElement);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleCTAClick = () => {
    window.location.href = '/story';
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage mousePosition={mousePosition} handleCTAClick={handleCTAClick} />} />
      </Routes>
    </>
  );
};

const HomePage = ({ mousePosition, handleCTAClick }) => {
  const bubble1Transform = {
    transform: `translate(${mousePosition.x * 20}px, ${mousePosition.y * 20}px)`
  };

  const bubble2Transform = {
    transform: `translate(${mousePosition.x * 40}px, ${mousePosition.y * 40}px)`
  };

  return (
    <>
      <div className="grain-overlay"></div>

      <header style={{position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 64px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #F3F4F6'}}>
        <span style={{fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: '18px', color: '#6366F1'}}>AstraLink</span>
        <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
          <span style={{fontSize: '14px', color: '#6B7280'}}>Preserve how you think. So it outlives you.</span>
          <a href="/auth" style={{background: '#6366F1', color: 'white', padding: '10px 24px', borderRadius: '9999px', fontSize: '14px', fontWeight: 500, textDecoration: 'none'}}>Sign In</a>
        </div>
      </header>

      <main className="hero-container" style={{paddingTop: '72px'}}>
        <div className="content-side">
          <h1>Your kids will ask you a question you'll never hear.</h1>
          <h2>Unless you make sure you're there to answer.</h2>

          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button className="cta-button" onClick={handleCTAClick}>See How It Works</button>
            <div className="secondary-text">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              Takes 2 minutes. No credit card needed.
            </div>

            <svg className="scribble" viewBox="0 0 100 30" xmlns="http://www.w3.org/2000/svg">
              <path d="M5,20 Q30,5 50,20 T95,15"></path>
            </svg>
          </div>

          <div className="scroll-hint">AstraLink Legacy Systems</div>
        </div>

        <div className="visual-side">
          <div className="cloud-gradient"></div>
          <div className="cloud-gradient-2"></div>

          <div className="floating-bubble bubble-1" style={bubble1Transform}>
            Hey Dad, what was your favorite song?
          </div>

          <div className="floating-bubble bubble-2" style={bubble2Transform}>
            Let me play it for you...
          </div>
        </div>
      </main>
    </>
  );
};

export default App;