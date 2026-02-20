import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';

const customStyles = {
  waveGradient: {
    background: 'linear-gradient(to bottom, rgba(99,102,241,0.2) 0%, rgba(232,235,255,0) 100%)'
  }
};

const WaveVisualization = () => {
  const [isActive, setIsActive] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsActive(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="w-full max-w-5xl mx-auto px-6 py-12 mb-24 reveal-on-scroll">
      <div className="relative w-full h-[300px]">
        <div className="absolute bottom-[-30px] w-full flex justify-between text-xs text-gray font-medium uppercase tracking-wide">
          <span>Day 1</span>
          <span>Day 3</span>
          <span>Week 1</span>
          <span>Week 2</span>
          <span>Week 3</span>
          <span>Week 4</span>
        </div>

        <svg viewBox="0 0 1000 300" preserveAspectRatio="none" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="waveGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#E8EBFF" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          <path 
            d="M0,250 C150,250 250,220 500,150 C750,80 850,50 1000,20 L1000,300 L0,300 Z" 
            fill="url(#waveGradient)" 
            className={`transition-all duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`}
          />
          
          <path 
            d="M0,250 C150,250 250,220 500,150 C750,80 850,50 1000,20" 
            fill="none" 
            stroke="#6366F1" 
            strokeWidth="4" 
            strokeLinecap="round" 
            style={{
              strokeDasharray: '1000',
              strokeDashoffset: isActive ? '0' : '1000',
              transition: 'stroke-dashoffset 2s ease-out'
            }}
          />

          <circle 
            cx="0" 
            cy="250" 
            r="6" 
            fill="#6366F1" 
            className={`transition-opacity duration-1000 delay-100 ${isActive ? 'opacity-100' : 'opacity-0'}`}
          />
          <text 
            x="15" 
            y="240" 
            fill="#6366F1" 
            fontSize="14" 
            fontWeight="bold" 
            className={`transition-opacity duration-1000 delay-100 ${isActive ? 'opacity-100' : 'opacity-0'}`}
          >
            25%
          </text>

          <circle 
            cx="500" 
            cy="150" 
            r="4" 
            fill="#6366F1" 
            className={`transition-opacity duration-1000 delay-500 ${isActive ? 'opacity-100' : 'opacity-0'}`}
          />
          
          <circle 
            cx="1000" 
            cy="20" 
            r="6" 
            fill="#6366F1" 
            className={`transition-opacity duration-1000 delay-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`}
          />
          <text 
            x="960" 
            y="50" 
            fill="#6366F1" 
            fontSize="14" 
            fontWeight="bold" 
            className={`transition-opacity duration-1000 delay-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`}
          >
            88%
          </text>
        </svg>
      </div>

      <p className="text-[16px] text-gray text-center mt-16">
        You give us more signal. We understand better. Not a promise. A measurement.
      </p>
    </section>
  );
};

const FogCircle = ({ title, description, delay }) => {
  const [isCleared, setIsCleared] = useState(false);
  const itemRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsCleared(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className="flex flex-col items-center">
      <div className="w-[240px] h-[240px] flex items-center justify-center relative mb-6">
        <div className="absolute inset-0 bg-secondary rounded-full opacity-50 blur-xl animate-pulse"></div>
        <div 
          ref={itemRef}
          className={`relative z-10 flex flex-col items-center justify-center w-full h-full bg-secondary/30 rounded-full backdrop-blur-sm border border-secondary/50 transition-all duration-1500 ${isCleared ? 'opacity-100 blur-0' : 'opacity-0 blur-[20px]'}`}
        >
          <span className="text-[28px] font-bold text-primary mb-2">{title}</span>
          <div className="w-8 h-1 bg-primary/20 rounded-full"></div>
        </div>
      </div>
      <p className={`text-[14px] text-gray max-w-[200px] transition-all duration-1500 ${isCleared ? 'opacity-100 blur-0' : 'opacity-0 blur-[20px]'}`}>
        {description}
      </p>
    </div>
  );
};

const RevealSection = ({ children, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={sectionRef}
      className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'} ${className}`}
    >
      {children}
    </div>
  );
};

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white text-dark font-sans antialiased">
      <RevealSection>
        <section className="min-h-[40vh] flex flex-col justify-center items-center text-center px-4 pt-20 pb-12">
          <h1 className="text-[40px] font-bold text-dark mb-4 tracking-tight leading-tight">
            Here's how we see you right now
          </h1>
          <p className="text-[20px] text-gray font-normal max-w-lg mx-auto leading-relaxed">
            Not perfect. Just starting. That's the magic.
          </p>
        </section>
      </RevealSection>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <FogCircle 
            title="Thoughtful"
            description="You take time to process before responding, valuing precision over speed."
            delay={300}
          />
          
          <FogCircle 
            title="Detail-Oriented"
            description="Small nuances capture your attention where others might miss them."
            delay={600}
          />
          
          <FogCircle 
            title="Listener"
            description="You prioritize understanding the speaker's intent over formulating a reply."
            delay={900}
          />
        </div>
      </section>

      <RevealSection>
        <section className="max-w-4xl mx-auto px-6 py-24 text-center">
          <div className="relative inline-block">
            <h2 className="text-[120px] font-bold text-primary leading-none tracking-tighter">25%</h2>
            <div className="absolute -right-8 top-8 w-4 h-4 bg-secondary rounded-full animate-ping"></div>
          </div>
          
          <p className="text-[18px] text-dark mt-8 max-w-[600px] mx-auto leading-relaxed">
            From 4 questions, we're at 25% confidence. Not because we're guessing poorly. Because 4 questions = limited signal. That's the honest truth.
          </p>
        </section>
      </RevealSection>

      <WaveVisualization />

      <RevealSection>
        <section className="max-w-2xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h3 className="text-2xl font-bold text-dark mb-2">The Signal Journey</h3>
            <p className="text-gray">You give us more, we understand better.</p>
          </div>

          <div className="relative flex flex-col items-center">
            <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-secondary -translate-x-1/2 z-0"></div>

            <div className="relative z-10 bg-white p-4 mb-12 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full border-2 border-primary bg-white flex items-center justify-center text-primary font-bold text-xl shadow-lg shadow-primary/10 mb-4 transition-transform hover:scale-110 duration-300">
                4
              </div>
              <h4 className="text-dark font-semibold">4 Questions</h4>
              <p className="text-gray text-sm">We see patterns</p>
            </div>

            <div className="mb-12 text-primary/30 animate-bounce relative z-10 bg-white p-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <polyline points="19 12 12 19 5 12"></polyline>
              </svg>
            </div>

            <div className="relative z-10 bg-white p-4 mb-12 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full border-2 border-primary bg-white flex items-center justify-center text-primary shadow-lg shadow-primary/10 mb-4 transition-transform hover:scale-110 duration-300">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                </svg>
              </div>
              <h4 className="text-dark font-semibold">Your Voice</h4>
              <p className="text-gray text-sm">We hear tone, emotion, thinking</p>
            </div>

            <div className="mb-12 text-primary/30 animate-bounce relative z-10 bg-white p-2" style={{ animationDelay: '0.2s' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <polyline points="19 12 12 19 5 12"></polyline>
              </svg>
            </div>

            <div className="relative z-10 bg-white p-4 mb-12 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full border-2 border-primary bg-white flex items-center justify-center text-primary shadow-lg shadow-primary/10 mb-4 transition-transform hover:scale-110 duration-300">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
              </div>
              <h4 className="text-dark font-semibold">Your Stories</h4>
              <p className="text-gray text-sm">We understand context and values</p>
            </div>

            <div className="mb-12 text-primary/30 animate-bounce relative z-10 bg-white p-2" style={{ animationDelay: '0.4s' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <polyline points="19 12 12 19 5 12"></polyline>
              </svg>
            </div>

            <div className="relative z-10 bg-white p-6 flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-primary text-white flex items-center justify-center shadow-xl shadow-primary/30 mb-6 scale-110 ring-4 ring-secondary">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <h4 className="text-2xl font-bold text-primary">88% Confident</h4>
              <p className="text-gray mt-2">Not guessing anymore. We know you.</p>
            </div>
          </div>
        </section>
      </RevealSection>

      <RevealSection>
        <section className="py-24 px-6 text-center bg-gradient-to-b from-white to-secondary/30">
          <h2 className="text-[28px] font-bold text-dark mb-4">Ready to go deeper?</h2>
          <p className="text-[18px] text-gray mb-10 max-w-xl mx-auto leading-[1.8]">
            Your voice is next. That's where the real understanding begins.
          </p>
          
          <div className="flex flex-col items-center gap-6">
            <button 
              onClick={() => window.location.href = '/collect'}
              className="bg-primary hover:bg-indigo-600 text-white font-bold text-[18px] py-[14px] px-[36px] rounded-lg shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all transform hover:-translate-y-1 relative overflow-hidden group"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></span>
              <span className="relative">Share Your Voice</span>
            </button>
            
            <a 
              href="#" 
              href="/collect" onClick={(e) => { e.preventDefault(); window.location.href="/collect"; }}
              className="text-primary text-[14px] hover:text-indigo-800 transition-colors border-b border-transparent hover:border-primary pb-0.5"
            >
              Ask me more questions
            </a>
          </div>
        </section>
      </RevealSection>
    </div>
  );
};

const App = () => {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      body {
        background-color: #FFFFFF;
        font-family: 'Inter', sans-serif;
        -webkit-font-smoothing: antialiased;
        overflow-x: hidden;
      }
      
      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      
      .animate-float {
        animation: float 6s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);

    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);

    return () => {
      document.head.removeChild(style);
      document.head.removeChild(fontLink);
    };
  }, []);

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </>
  );
};

export default App;