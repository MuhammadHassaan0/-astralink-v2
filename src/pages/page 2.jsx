import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';

const customStyles = {
  playfairDisplay: {
    fontFamily: "'Playfair Display', serif"
  },
  interFont: {
    fontFamily: "'Inter', sans-serif"
  }
};

const MomentNode = ({ children, altBg = false, isLast = false, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const nodeRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.2
      }
    );

    if (nodeRef.current) {
      observer.observe(nodeRef.current);
    }

    return () => {
      if (nodeRef.current) {
        observer.unobserve(nodeRef.current);
      }
    };
  }, []);

  const animationStyle = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
    transition: `opacity 1s cubic-bezier(0.165, 0.84, 0.44, 1) ${delay}s, transform 1s cubic-bezier(0.165, 0.84, 0.44, 1) ${delay}s`
  };

  return (
    <section
      ref={nodeRef}
      className={`flex flex-col items-center justify-center py-20 px-6 relative text-center ${
        altBg ? 'bg-gray-50' : 'bg-white'
      } ${!isLast ? 'after:content-[\'\'] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-px after:h-10 after:bg-gray-200 after:z-10' : ''}`}
      style={animationStyle}
    >
      {children}
    </section>
  );
};

const LabelText = ({ children }) => (
  <div className="text-sm uppercase tracking-widest text-gray-500 mb-4 font-semibold" style={customStyles.interFont}>
    {children}
  </div>
);

const HeadlineText = ({ children, large = false }) => (
  <h2 className={`${large ? 'text-5xl' : 'text-4xl'} text-gray-800 mb-12 tracking-tight`} style={customStyles.playfairDisplay}>
    {children}
  </h2>
);

const SubHeadline = ({ children }) => (
  <h3 className="text-3xl text-indigo-500 mt-8 mb-4" style={customStyles.playfairDisplay}>
    {children}
  </h3>
);

const BodyText = ({ children }) => (
  <p className="text-lg text-gray-500 max-w-xl mx-auto" style={customStyles.interFont}>
    {children}
  </p>
);

const QuoteStack = ({ quotes }) => (
  <div className="mt-6 flex flex-col gap-2 text-lg text-gray-500 italic" style={customStyles.playfairDisplay}>
    {quotes.map((quote, index) => (
      <span key={index}>{quote}</span>
    ))}
  </div>
);

const VisualStage = ({ children, height = 200 }) => (
  <div className="w-full max-w-2xl flex items-center justify-center mb-6 relative" style={{ height: `${height}px` }}>
    {children}
  </div>
);

const ProblemSection = () => (
  <MomentNode delay={0.1}>
    <LabelText>The Problem Nobody Talks About</LabelText>
    <HeadlineText>What would you do?</HeadlineText>

    <VisualStage>
      <svg width="400" height="140" viewBox="0 0 400 140">
        <g transform="translate(60, 30)">
          <circle cx="20" cy="20" r="16" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 70 C4 50 10 40 20 40 C30 40 36 50 36 70" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        
        <g transform="translate(300, 30)">
          <circle cx="20" cy="20" r="16" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 70 C4 50 10 40 20 40 C30 40 36 50 36 70" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        <line x1="120" y1="70" x2="280" y2="70" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="8 8" />
        
        <text x="180" y="60" fill="#9CA3AF" fontFamily="serif" fontSize="24" opacity="0.5">?</text>
        <text x="220" y="80" fill="#9CA3AF" fontFamily="serif" fontSize="18" opacity="0.3">?</text>
      </svg>
    </VisualStage>

    <QuoteStack quotes={['[Silence]', '[Waiting]', '[Guessing]']} />
  </MomentNode>
);

const SolutionSection = () => (
  <MomentNode altBg delay={0.2}>
    <HeadlineText>What if they could just ask you?</HeadlineText>
    
    <VisualStage>
      <svg width="420" height="140" viewBox="0 0 420 140">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#6366F1', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#6366F1', stopOpacity: 0.2 }} />
          </linearGradient>
        </defs>

        <g transform="translate(60, 30)">
          <circle cx="20" cy="20" r="16" fill="none" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 70 C4 50 10 40 20 40 C30 40 36 50 36 70" fill="none" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        
        <g transform="translate(320, 30)">
          <circle cx="20" cy="20" r="16" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 70 C4 50 10 40 20 40 C30 40 36 50 36 70" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        <path d="M100 65 Q 155 35 210 65 T 320 65" fill="none" stroke="url(#grad1)" strokeWidth="3">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="3s" repeatCount="indefinite" />
        </path>
        
        <circle cx="160" cy="50" r="2" fill="#6366F1" opacity="0.6">
          <animate attributeName="cy" values="50;45;50" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="240" cy="80" r="3" fill="#6366F1" opacity="0.4">
          <animate attributeName="cy" values="80;85;80" dur="2.5s" repeatCount="indefinite" />
        </circle>
      </svg>
    </VisualStage>

    <SubHeadline>Your Voice, Forever</SubHeadline>
    <BodyText>
      Not a recording. Your thinking, preserved. Your tone. Your reasoning. Your actual words.
    </BodyText>
  </MomentNode>
);

const JourneySection = () => (
  <MomentNode delay={0.3}>
    <LabelText>The Journey</LabelText>
    
    <VisualStage height={240}>
      <svg width="500" height="200" viewBox="0 0 500 200">
        <g transform="translate(50, 0)">
          <text x="30" y="160" textAnchor="middle" fill="#9CA3AF" fontSize="12" fontFamily="Inter">WEEK 1</text>
          <text x="30" y="180" textAnchor="middle" fill="#1F2937" fontWeight="bold" fontSize="14" fontFamily="Inter">45%</text>
          
          <rect x="15" y="100" width="30" height="40" rx="4" fill="#E5E7EB" />
          <rect x="15" y="100" width="30" height="40" rx="4" fill="#6366F1" opacity="0.4">
            <animate attributeName="height" from="0" to="40" dur="1s" fill="freeze" />
            <animate attributeName="y" from="140" to="100" dur="1s" fill="freeze" />
          </rect>
          
          <text x="30" y="80" textAnchor="middle" fill="#9CA3AF" fontSize="20">?</text>
        </g>

        <g transform="translate(160, 0)">
          <text x="30" y="160" textAnchor="middle" fill="#9CA3AF" fontSize="12" fontFamily="Inter">WEEK 2</text>
          <text x="30" y="180" textAnchor="middle" fill="#1F2937" fontWeight="bold" fontSize="14" fontFamily="Inter">62%</text>
          
          <rect x="15" y="80" width="30" height="60" rx="4" fill="#E5E7EB" />
          <rect x="15" y="80" width="30" height="60" rx="4" fill="#6366F1" opacity="0.6">
            <animate attributeName="height" from="0" to="60" dur="1.2s" fill="freeze" />
            <animate attributeName="y" from="140" to="80" dur="1.2s" fill="freeze" />
          </rect>
          
          <circle cx="20" cy="60" r="2" fill="#6366F1" />
          <circle cx="30" cy="60" r="2" fill="#6366F1" />
          <circle cx="40" cy="60" r="2" fill="#6366F1" />
        </g>

        <g transform="translate(270, 0)">
          <text x="30" y="160" textAnchor="middle" fill="#9CA3AF" fontSize="12" fontFamily="Inter">WEEK 3</text>
          <text x="30" y="180" textAnchor="middle" fill="#1F2937" fontWeight="bold" fontSize="14" fontFamily="Inter">80%</text>
          
          <rect x="15" y="50" width="30" height="90" rx="4" fill="#E5E7EB" />
          <rect x="15" y="50" width="30" height="90" rx="4" fill="#6366F1" opacity="0.8">
            <animate attributeName="height" from="0" to="90" dur="1.4s" fill="freeze" />
            <animate attributeName="y" from="140" to="50" dur="1.4s" fill="freeze" />
          </rect>
          
          <path d="M15 35 Q 30 25 45 35" fill="none" stroke="#6366F1" strokeWidth="2" />
        </g>

        <g transform="translate(380, 0)">
          <text x="30" y="160" textAnchor="middle" fill="#9CA3AF" fontSize="12" fontFamily="Inter">WEEK 4</text>
          <text x="30" y="180" textAnchor="middle" fill="#1F2937" fontWeight="bold" fontSize="14" fontFamily="Inter">95%</text>
          
          <rect x="15" y="20" width="30" height="120" rx="4" fill="#E5E7EB" />
          <rect x="15" y="20" width="30" height="120" rx="4" fill="#6366F1">
            <animate attributeName="height" from="0" to="120" dur="1.6s" fill="freeze" />
            <animate attributeName="y" from="140" to="20" dur="1.6s" fill="freeze" />
          </rect>
          
          <path d="M30 0 L 32 10 L 42 12 L 32 14 L 30 24 L 28 14 L 18 12 L 28 10 Z" fill="#6366F1" />
        </g>

        <path d="M65 100 L 175 80 L 285 50 L 395 20" fill="none" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4 4" />
      </svg>
    </VisualStage>

    <SubHeadline>It Gets Better Every Time</SubHeadline>
    <BodyText>
      The more they interact, the more accurate it becomes. Starting at 45% in week 1, reaching 88% by week 4.
    </BodyText>
  </MomentNode>
);

const PrivacySection = () => (
  <MomentNode altBg delay={0.4}>
    <HeadlineText>What about privacy?</HeadlineText>
    
    <VisualStage>
      <svg width="400" height="160" viewBox="0 0 400 160">
        <circle cx="200" cy="80" r="60" fill="white" stroke="#6366F1" strokeWidth="1.5" />
        
        <g transform="translate(170, 65) scale(0.6)">
          <circle cx="20" cy="20" r="16" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 70 C4 50 10 40 20 40 C30 40 36 50 36 70" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          
          <g transform="translate(60, 0)">
            <circle cx="20" cy="20" r="16" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 70 C4 50 10 40 20 40 C30 40 36 50 36 70" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          
          <path d="M30 40 Q 50 30 70 40" fill="none" stroke="#6366F1" strokeWidth="2" />
        </g>

        <circle cx="200" cy="140" r="12" fill="#6366F1" stroke="white" strokeWidth="2" />
        <path d="M196 140 L 204 140 M 200 136 L 200 144" stroke="white" strokeWidth="2" strokeLinecap="round" />

        <circle cx="200" cy="80" r="60" fill="none" stroke="#6366F1" strokeWidth="1" opacity="0.5">
          <animate attributeName="r" from="60" to="70" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.5" to="0" dur="3s" repeatCount="indefinite" />
        </circle>
      </svg>
    </VisualStage>

    <SubHeadline>It Stays Between You</SubHeadline>
    <BodyText>
      Your data. Your words. Your control. No company harvests it. No algorithm learns from it. Only you decide who sees this.
    </BodyText>
  </MomentNode>
);

const FinalSection = () => (
  <MomentNode isLast={true}>
    <VisualStage height={200}>
      <svg width="600" height="200" viewBox="0 0 600 200">
        <g transform="translate(150, 50)" opacity="0.4">
          <circle cx="30" cy="30" r="20" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 90 C10 60 20 50 30 50 C40 50 50 60 50 90" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        <g transform="translate(260, 50)">
          <circle cx="30" cy="30" r="24" fill="none" stroke="#6366F1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 100 C6 60 20 50 30 50 C40 50 54 60 54 100" fill="none" stroke="#6366F1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        <g transform="translate(390, 80) scale(0.8)">
          <circle cx="30" cy="30" r="20" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 90 C10 60 20 50 30 50 C40 50 50 60 50 90" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        <path d="M 100 150 C 200 150, 250 150, 300 150 C 350 150, 450 150, 500 150" fill="none" stroke="#E5E7EB" strokeWidth="1" />
        
        <path d="M250 160 C 220 160 220 180 250 180 C 280 180 320 160 350 160 C 380 160 380 180 350 180 C 320 180 280 160 250 160" fill="none" stroke="#6366F1" strokeWidth="1" opacity="0.3" transform="translate(0, 10)" />
      </svg>
    </VisualStage>

    <HeadlineText large>This conversation lasts forever.</HeadlineText>
    <BodyText>
      Your voice. Your thinking. Preserved for generations.
    </BodyText>
  </MomentNode>
);

const HomePage = () => {
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return (
    <div className="w-full max-w-full overflow-hidden">
      <ProblemSection />
      <SolutionSection />
      <JourneySection />
      <PrivacySection />
      <FinalSection />
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', background: '#fff' }}>
        <button
          onClick={() => window.location.href = '/proof'}
          style={{ background: '#6366F1', color: '#fff', border: 'none', borderRadius: '999px', padding: '18px 48px', fontSize: '16px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
        >
          See What Others Say →
        </button>
      </div>
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

export default HomePage;