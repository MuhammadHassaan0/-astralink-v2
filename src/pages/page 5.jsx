import React, { useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';

const SocialLink = ({ href, ariaLabel, children }) => {
  const [isHovered, setIsHovered] = useState(false);

  const socialLinkStyle = {
    color: isHovered ? '#FFFFFF' : '#BDB4D6',
    backgroundColor: isHovered ? '#6C5DD3' : 'rgba(255, 255, 255, 0.05)',
    transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '50%'
  };

  return (
    <a 
      href={href} 
      style={socialLinkStyle}
      aria-label={ariaLabel}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </a>
  );
};

const NavLink = ({ href, children }) => {
  const [isHovered, setIsHovered] = useState(false);

  const linkStyle = {
    color: isHovered ? '#8B7EF0' : '#FFFFFF',
    textDecoration: 'none',
    fontWeight: '500',
    transition: 'color 0.2s ease',
    position: 'relative',
    display: 'inline-block',
    paddingBottom: '4px'
  };

  const underlineStyle = {
    content: '',
    position: 'absolute',
    bottom: '0',
    left: '0',
    width: isHovered ? '100%' : '0',
    height: '2px',
    backgroundColor: '#6C5DD3',
    transition: 'width 0.2s ease',
    borderRadius: '2px'
  };

  return (
    <a 
      href={href} 
      style={linkStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      <span style={underlineStyle}></span>
    </a>
  );
};

const Footer = () => {
  return (
    <footer style={{
      backgroundColor: '#2B1C55',
      color: '#FFFFFF',
      padding: '32px 24px',
      borderTop: '1px solid #42307D',
      width: '100%',
      boxSsizing: 'border-box'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'row',
        gap: '48px',
        fontSize: '12px',
        lineHeight: '1.5',
        alignItems: 'center',
        justifyContent: 'space-between'
      }} className="footer-content-responsive">
        <div style={{ flex: '1', textAlign: 'left' }} className="footer-left-responsive">
          <span style={{ color: '#BDB4D6', fontWeight: '400' }}>
            © 2026 AstraLink. Your wisdom, forever.
          </span>
        </div>

        <div style={{ flex: '2', display: 'flex', justifyContent: 'center' }} className="footer-center-responsive">
          <ul style={{
            display: 'flex',
            gap: '32px',
            listStyle: 'none',
            padding: '0',
            margin: '0'
          }} className="nav-links-responsive">
            <li><NavLink href="#">Privacy</NavLink></li>
            <li><NavLink href="#">Terms</NavLink></li>
            <li><NavLink href="#">Contact</NavLink></li>
          </ul>
        </div>

        <div style={{ flex: '1', display: 'flex', justifyContent: 'flex-end' }} className="footer-right-responsive">
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <SocialLink href="#" ariaLabel="Twitter">
              <svg viewBox="0 0 24 24" style={{ width: '16px', height: '16px', fill: 'currentColor' }}>
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"></path>
              </svg>
            </SocialLink>
            <SocialLink href="#" ariaLabel="LinkedIn">
              <svg viewBox="0 0 24 24" style={{ width: '16px', height: '16px', fill: 'currentColor' }}>
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"></path>
              </svg>
            </SocialLink>
            <SocialLink href="#" ariaLabel="GitHub">
              <svg viewBox="0 0 24 24" style={{ width: '16px', height: '16px', fill: 'currentColor' }}>
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path>
              </svg>
            </SocialLink>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 767px) {
          .footer-content-responsive {
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            gap: 24px !important;
          }
          
          .nav-links-responsive {
            flex-direction: column !important;
            gap: 16px !important;
          }

          .footer-center-responsive {
            order: 2 !important;
            width: 100% !important;
            border-top: 1px solid #42307D !important;
            border-bottom: 1px solid #42307D !important;
            padding: 24px 0 !important;
          }
          
          .footer-left-responsive {
            order: 3 !important;
          }
          
          .footer-right-responsive {
            order: 1 !important;
            margin-bottom: 8px !important;
          }
        }

        @media (min-width: 768px) {
          footer {
            padding: 32px 64px !important;
          }
        }
      `}</style>
    </footer>
  );
};

const App = () => {
  return (
    <>
      <div style={{
        margin: '0',
        padding: '0',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        backgroundColor: '#f3f4f6',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        justifyContent: 'flex-end'
      }}>
        <Routes>
          <Route path="/" element={<Footer />} />
        </Routes>
      </div>
    </>
  );
};

export default App;