import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';

const customStyles = {
  root: {
    '--primary-purple': '#6366F1',
    '--bg-gradient-start': '#F3F4F6',
    '--bg-gradient-end': '#E8EBFF',
    '--text-dark': '#1F2937',
    '--text-gray': '#6B7280',
    '--text-light-gray': '#9CA3AF',
    '--white': '#FFFFFF',
    '--spacing-xs': '8px',
    '--spacing-sm': '12px',
    '--spacing-md': '24px',
    '--spacing-lg': '32px',
    '--spacing-xl': '48px',
    '--spacing-xxl': '64px',
    '--radius-std': '12px',
    '--font-serif': "'Playfair Display', serif",
    '--font-sans': "'Inter', sans-serif"
  }
};

const Button = ({ children, onClick, variant = 'primary', className = '', ...props }) => {
  const baseClasses = "inline-flex items-center justify-center py-3.5 px-6 rounded-md cursor-pointer transition-all duration-200 no-underline w-fit";
  const variantClasses = variant === 'primary' 
    ? "bg-[#6366F1] text-white font-semibold text-base shadow-[0_4px_6px_-1px_rgba(99,102,241,0.2)] border border-transparent hover:bg-[#4F46E5] hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-6px_rgba(99,102,241,0.45),0_0_24px_rgba(99,102,241,0.35),0_0_40px_rgba(99,102,241,0.2)]"
    : "bg-transparent text-[#1F2937] border border-[#E5E7EB] font-medium text-sm hover:border-[#1F2937] hover:bg-[#FAFAFA] hover:shadow-[0_8px_16px_-4px_rgba(0,0,0,0.1),0_0_15px_rgba(99,102,241,0.15)]";
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

const WaveAnimation = () => (
  <svg viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto max-w-[300px]">
    <style>
      {`
        @keyframes drawWave {
          to { stroke-dashoffset: 0; }
        }
        @keyframes pulseWave {
          0%, 100% { stroke: #6366F1; transform: scaleY(1); }
          50% { stroke: #818CF8; transform: scaleY(0.95); }
        }
        .wave-path {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: drawWave 3s ease-out forwards, pulseWave 4s ease-in-out infinite 3s;
        }
      `}
    </style>
    <path 
      className="wave-path" 
      d="M10 100 C 40 100, 40 40, 70 40 C 100 40, 100 160, 130 160 C 160 160, 160 60, 190 60 C 220 60, 220 140, 250 140 C 280 140, 280 80, 310 80 C 340 80, 340 100, 390 100" 
      stroke="#6366F1" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <circle cx="390" cy="100" r="4" fill="#6366F1" />
    <circle cx="10" cy="100" r="4" fill="#6366F1" />
  </svg>
);

const BookAnimation = () => (
  <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto max-w-[300px]">
    <path d="M20 140 L 20 20 L 90 20 C 100 20, 100 30, 100 30 L 100 150 C 100 150, 100 140, 90 140 L 20 140 Z" stroke="#9CA3AF" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M180 140 L 180 20 L 110 20 C 100 20, 100 30, 100 30 L 100 150 C 100 150, 100 140, 110 140 L 180 140 Z" stroke="#9CA3AF" strokeWidth="1.5" strokeLinejoin="round" />
    <line x1="100" y1="20" x2="100" y2="150" stroke="#9CA3AF" strokeWidth="1.5" />
    <line x1="35" y1="40" x2="80" y2="40" stroke="#E5E7EB" strokeWidth="2" />
    <line x1="35" y1="55" x2="80" y2="55" stroke="#E5E7EB" strokeWidth="2" />
    <line x1="35" y1="70" x2="70" y2="70" stroke="#E5E7EB" strokeWidth="2" />
    <line x1="120" y1="40" x2="165" y2="40" stroke="#E5E7EB" strokeWidth="2" />
    <line x1="120" y1="55" x2="165" y2="55" stroke="#E5E7EB" strokeWidth="2" />
    <line x1="120" y1="70" x2="165" y2="70" stroke="#E5E7EB" strokeWidth="2" />
  </svg>
);

const ChatAnimation = () => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto max-w-[300px]">
    <path d="M100 40 C 60 40, 30 65, 30 100 C 30 120, 45 135, 65 145 L 60 170 L 90 155 C 95 156, 100 156, 100 156 C 140 156, 170 130, 170 100 C 170 65, 140 40, 100 40 Z" stroke="#D1D5DB" strokeWidth="1.5" strokeLinejoin="round" />
    <circle cx="80" cy="100" r="2" fill="#D1D5DB" />
    <circle cx="100" cy="100" r="2" fill="#D1D5DB" />
    <circle cx="120" cy="100" r="2" fill="#D1D5DB" />
  </svg>
);

const HomePage = () => {
  const navigate = useNavigate();
  
  const handleRecordVoice = () => { window.location.href = '/record'; };

  const handleUploadStories = () => { window.location.href = '/record'; };

  const handleAnswerQuestions = () => { window.location.href = '/record'; };

  return (
    <div className="w-full bg-white text-[#1F2937] font-['Inter',sans-serif] leading-normal min-h-screen flex flex-col items-center" style={customStyles.root}>
      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fadeInUp {
            animation: fadeInUp 0.8s ease-out backwards;
          }
        `}
      </style>
      
      <div className="w-full max-w-[1000px] px-6 py-16 flex flex-col gap-12">
        <header className="text-center mb-8 max-w-[700px] mx-auto animate-fadeInUp">
          <h1 className="font-['Playfair_Display',serif] text-5xl font-bold text-[#1F2937] mb-3 tracking-tight" style={{ animationDelay: '0.2s' }}>
            Let's make this real
          </h1>
          <p className="font-['Playfair_Display',serif] text-xl text-[#6B7280] leading-relaxed italic" style={{ animation: 'fadeInUp 0.8s ease-out 0.4s backwards' }}>
            Your voice. Your stories. Your thinking.<br />
            That's what changes everything.
          </p>
        </header>

        <div className="flex flex-col gap-0">
          <article className="flex items-center rounded-xl overflow-hidden transition-all duration-300 bg-gradient-to-br from-[#F3F4F6] to-[#E8EBFF] mb-14 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-10px_rgba(99,102,241,0.15)]" style={{ animation: 'fadeInUp 0.8s ease-out 0.6s backwards' }}>
            <div className="flex-[0_0_40%] p-12 flex flex-col justify-center md:flex-1 md:p-6">
              <span className="text-[11px] uppercase tracking-widest font-semibold mb-3 block text-[#6366F1]">
                Primary Method
              </span>
              <h2 className="font-['Playfair_Display',serif] font-bold text-[#1F2937] mb-3 leading-tight text-4xl">
                Record Your Voice
              </h2>
              <p className="text-[15px] text-[#6B7280] leading-relaxed mb-6">
                2 minutes is all it takes. Talk about a decision. Share advice. Describe how you handle pressure. Be unfiltered. Be YOU.
              </p>
              <div className="flex flex-col gap-2 mb-8">
                <div className="text-[13px] text-[#1F2937] flex items-baseline gap-2">
                  <span className="text-[#6366F1] font-['Playfair_Display',serif]">→</span> Your tone (energy, pace, confidence)
                </div>
                <div className="text-[13px] text-[#1F2937] flex items-baseline gap-2">
                  <span className="text-[#6366F1] font-['Playfair_Display',serif]">→</span> Your thinking (not just words)
                </div>
                <div className="text-[13px] text-[#1F2937] flex items-baseline gap-2">
                  <span className="text-[#6366F1] font-['Playfair_Display',serif]">→</span> Your authenticity (real you)
                </div>
              </div>
              <Button variant="primary" onClick={handleRecordVoice}>
                Record Your Voice
              </Button>
            </div>
            <div className="flex-[0_0_60%] h-full min-h-[320px] flex items-center justify-center relative md:min-h-[200px] md:flex-[0_0_200px] md:order-[-1]">
              <WaveAnimation />
            </div>
          </article>

          <article className="flex items-center rounded-xl overflow-hidden transition-all duration-300 bg-white flex-row-reverse p-0 relative mb-12" style={{ animation: 'fadeInUp 0.8s ease-out 0.8s backwards' }}>
            <div className="absolute left-0 top-5 bottom-5 w-0.5 bg-[#E5E7EB] md:hidden" />
            <div className="flex-[0_0_60%] h-full min-h-[320px] flex items-center justify-center relative bg-transparent md:min-h-[200px] md:flex-[0_0_200px] md:order-[-1]">
              <BookAnimation />
            </div>
            <div className="flex-[0_0_40%] p-12 flex flex-col justify-center md:flex-1 md:p-6">
              <span className="text-[11px] uppercase tracking-widest font-semibold mb-3 block text-[#6B7280]">
                Secondary Method
              </span>
              <h2 className="font-['Playfair_Display',serif] font-bold text-[#1F2937] mb-3 leading-tight text-[28px]">
                Share Your Stories
              </h2>
              <p className="text-[15px] text-[#6B7280] leading-relaxed mb-6">
                Journal entries. Personal letters. Notes. Any writing that shows your thinking. We see depth. We understand your values.
              </p>
              <div className="flex flex-col gap-2 mb-8">
                <div className="text-[13px] text-[#1F2937] flex items-baseline gap-2">
                  <span className="text-[#6366F1] font-['Playfair_Display',serif]">→</span> How you think in depth
                </div>
                <div className="text-[13px] text-[#1F2937] flex items-baseline gap-2">
                  <span className="text-[#6366F1] font-['Playfair_Display',serif]">→</span> What matters to you
                </div>
                <div className="text-[13px] text-[#1F2937] flex items-baseline gap-2">
                  <span className="text-[#6366F1] font-['Playfair_Display',serif]">→</span> Your writing voice
                </div>
              </div>
              <Button variant="secondary" onClick={handleUploadStories}>
                Upload Stories
              </Button>
            </div>
          </article>

          <div className="w-full h-px border-t border-dashed border-[#E5E7EB] m-0" />

          <article className="flex items-center rounded-xl overflow-hidden transition-all duration-300 bg-white" style={{ animation: 'fadeInUp 0.8s ease-out 1s backwards' }}>
            <div className="flex-[0_0_60%] h-full min-h-[320px] flex items-center justify-center relative md:min-h-[200px] md:flex-[0_0_200px] md:order-[-1]">
              <ChatAnimation />
            </div>
            <div className="flex-[0_0_40%] p-12 flex flex-col justify-center md:flex-1 md:p-6">
              <span className="text-[11px] uppercase tracking-widest font-semibold mb-3 block text-[#9CA3AF]">
                Quick Start
              </span>
              <h2 className="font-['Playfair_Display',serif] font-bold text-[#1F2937] mb-3 leading-tight text-[28px]">
                Answer Questions
              </h2>
              <p className="text-[15px] text-[#6B7280] leading-relaxed mb-6">
                5 questions. 10 minutes. Smart prompts that help us understand you. Structured, easy, focused.
              </p>
              <div className="flex flex-col gap-2 mb-8">
                <div className="text-[13px] text-[#1F2937] flex items-baseline gap-2">
                  <span className="text-[#6366F1] font-['Playfair_Display',serif]">•</span> What's a decision you’re proud of?
                </div>
                <div className="text-[13px] text-[#1F2937] flex items-baseline gap-2">
                  <span className="text-[#6366F1] font-['Playfair_Display',serif]">•</span> How do you want to be remembered?
                </div>
                <div className="text-[13px] text-[#1F2937] flex items-baseline gap-2">
                  <span className="text-[#6366F1] font-['Playfair_Display',serif]">•</span> What drives you forward?
                </div>
              </div>
              <Button variant="secondary" onClick={handleAnswerQuestions}>
                Answer Questions
              </Button>
            </div>
          </article>
        </div>

        <footer className="text-center font-['Playfair_Display',serif] italic text-[#6B7280] text-[17px] mt-14 mb-12 max-w-[600px] leading-[1.75] mx-auto" style={{ animation: 'fadeInUp 0.8s ease-out 1.2s backwards' }}>
          All three together is best. But start with one. Pick whichever feels natural to you. No pressure. Just progress.
        </footer>
      </div>
    </div>
  );
};

const App = () => {
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    return () => {
      document.head.removeChild(link);
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

export default function Page9() {
  return (
    <>
      <App />
      <div style={{ display: "flex", justifyContent: "center", padding: "60px 0", background: "#fff" }}>
        <button
          onClick={() => window.location.href = "/auth"}
          style={{ background: "#6366F1", color: "#fff", border: "none", borderRadius: "999px", padding: "18px 48px", fontSize: "16px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif", boxShadow: "0 4px 24px rgba(99,102,241,0.3)" }}
        >
          Create My Account →
        </button>
      </div>
    </>
  );
}