import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';

const CTAComponent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const customStyles = {
    root: {
      backgroundColor: '#F3F4F6',
      fontFamily: "'Geist', sans-serif",
      WebkitFontSmoothing: 'antialiased'
    },
    container: {
      width: '100%',
      maxWidth: '800px',
      padding: '64px',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '24px',
      position: 'relative'
    },
    headline: {
      fontSize: '32px',
      fontWeight: '700',
      lineHeight: '1.4',
      letterSpacing: '-0.02em',
      position: 'relative',
      zIndex: 10,
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'opacity 1s ease-out 0.2s, transform 1s ease-out 0.2s',
      color: '#1F2937'
    },
    highlightContainer: {
      position: 'relative',
      display: 'inline-block'
    },
    squiggleSvg: {
      position: 'absolute',
      bottom: '-12px',
      left: 0,
      width: '100%',
      height: '14px',
      zIndex: -1,
      pointerEvents: 'none',
      overflow: 'visible'
    },
    button: {
      backgroundColor: '#7C3AED',
      color: '#ffffff',
      fontSize: '18px',
      fontWeight: '600',
      padding: '16px 32px',
      borderRadius: '24px',
      border: 'none',
      cursor: 'pointer',
      boxShadow: '0 4px 6px -1px rgba(124, 58, 237, 0.1), 0 2px 4px -1px rgba(124, 58, 237, 0.06)',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 1s ease-out 0.6s, transform 1s ease-out 0.6s',
      position: 'relative',
      overflow: 'hidden'
    }
  };

  const [buttonHover, setButtonHover] = useState(false);
  const [shimmerPosition, setShimmerPosition] = useState(-100);

  useEffect(() => {
    if (buttonHover) {
      setShimmerPosition(-100);
      const timer = setTimeout(() => setShimmerPosition(100), 50);
      return () => clearTimeout(timer);
    }
  }, [buttonHover]);

  const buttonStyle = {
    ...customStyles.button,
    backgroundColor: buttonHover ? '#6D28D9' : '#7C3AED',
    transform: buttonHover ? 'translateY(-2px)' : (isVisible ? 'translateY(0)' : 'translateY(20px)'),
    boxShadow: buttonHover 
      ? '0 10px 15px -3px rgba(124, 58, 237, 0.2), 0 4px 6px -2px rgba(124, 58, 237, 0.1)'
      : '0 4px 6px -1px rgba(124, 58, 237, 0.1), 0 2px 4px -1px rgba(124, 58, 237, 0.06)'
  };

  const shimmerStyle = {
    position: 'absolute',
    top: 0,
    left: `${shimmerPosition}%`,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
    transition: 'left 0.6s ease',
    pointerEvents: 'none'
  };

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;600;700&display=swap');
      
      @keyframes drawSquiggle {
        from {
          stroke-dashoffset: 400;
        }
        to {
          stroke-dashoffset: 0;
        }
      }
      
      .squiggle-path {
        fill: none;
        stroke: #1F2937;
        stroke-width: 2.5;
        stroke-linecap: round;
        stroke-linejoin: round;
        stroke-dasharray: 400;
        stroke-dashoffset: 400;
        animation: drawSquiggle 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards 1.2s;
      }
      
      @media (max-width: 640px) {
        .cta-container {
          padding: 48px 24px !important;
        }
        .headline {
          font-size: 28px !important;
        }
        .primary-btn {
          width: 100%;
          justify-content: center;
        }
      }
    `;
    document.head.appendChild(styleElement);
    return () => document.head.removeChild(styleElement);
  }, []);

  return (
    <section className="cta-container" style={customStyles.container}>
      <h2 className="headline" style={customStyles.headline}>
        This isn't morbid. It's not about death.<br />
        It's about making sure the <span style={customStyles.highlightContainer}>people you love
          <svg style={customStyles.squiggleSvg} viewBox="0 0 200 14" preserveAspectRatio="none">
            <path className="squiggle-path" d="M5,10 C50,12 80,12 110,8 C140,4 160,5 195,9"></path>
          </svg>
        </span><br />
        never have to guess what you'd do.
      </h2>

      <button 
        className="primary-btn"
        style={buttonStyle}
        onMouseEnter={() => setButtonHover(true)}
        onMouseLeave={() => setButtonHover(false)}
        onClick={() => window.location.href = '/start'}
      >
        <span style={shimmerStyle}></span>
        See How It Works
        <svg 
          className="btn-icon" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          style={{
            transition: 'transform 0.3s ease',
            transform: buttonHover ? 'translateX(4px)' : 'translateX(0)'
          }}
        >
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
      </button>
    </section>
  );
};

const App = () => {
  const appStyle = {
    fontFamily: "'Geist', sans-serif",
    backgroundColor: '#F3F4F6',
    margin: 0,
    padding: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    color: '#1F2937',
    WebkitFontSmoothing: 'antialiased'
  };

  return (
    <>
      <div style={appStyle}>
        <Routes>
          <Route path="/" element={<CTAComponent />} />
        </Routes>
      </div>
    </>
  );
};

export default App;