import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';

const customStyles = {
  fadeInUp: {
    animation: 'fadeInUp 0.8s ease-out'
  },
  glowingWindow: {
    animation: 'glow 3s ease-in-out infinite'
  },
  pulseButton: {
    animation: 'pulse 2s ease-in-out infinite'
  },
  pulseMic: {
    animation: 'pulse 2.5s ease-in-out infinite'
  }
};

const MicIcon = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
  </svg>
);

const DocumentIcon = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
  </svg>
);

const ChatIcon = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
  </svg>
);

const UsersIcon = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
  </svg>
);

const HomePage = () => {
  const [hoveredDay, setHoveredDay] = useState(null);

  const timelineDays = [
    {
      day: 2,
      label: "Day 2",
      headline: "Record Another Voice",
      description: "Different topic. Help us see multiple sides of you.",
      note: "(Optional but recommended)",
      icon: MicIcon,
      delay: "0.8s"
    },
    {
      day: 3,
      label: "Day 3",
      headline: "Record a Third Voice",
      description: "One more voice. Cover new ground.",
      note: null,
      icon: MicIcon,
      delay: "0.9s"
    },
    {
      day: 4,
      label: "Day 4",
      headline: "Upload a Document",
      description: "Journal entry, letter, or personal note.",
      note: null,
      icon: DocumentIcon,
      delay: "1.0s"
    },
    {
      day: 5,
      label: "Day 5",
      headline: "Share More Stories",
      description: "Another writing that shows your thinking.",
      note: "(Optional)",
      icon: DocumentIcon,
      delay: "1.1s"
    },
    {
      day: 6,
      label: "Day 6",
      headline: "Answer Guided Questions",
      description: "5 guided questions. 10 minutes total.",
      note: null,
      icon: ChatIcon,
      delay: "1.2s"
    },
    {
      day: 7,
      label: "Day 7",
      headline: "Invite Your Family",
      description: "Share your journey with people you love.",
      note: "This is when the magic happens.",
      icon: UsersIcon,
      delay: "1.3s"
    }
  ];

  return (
    <div className="page-container" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
      <section className="intro-section" style={{ textAlign: 'center', maxWidth: '800px', margin: '80px auto 80px auto', paddingTop: '40px', animation: 'fadeInUp 0.8s ease-out' }}>
        <div className="user-goal-tag" style={{ fontSize: '16px', color: '#6366F1', marginBottom: '8px', fontWeight: 400, letterSpacing: 0, textTransform: 'none' }}>
          Preserving wisdom for your family
        </div>
        <h1 className="journey-title" style={{ fontFamily: "'Instrument Serif', serif", fontSize: '48px', lineHeight: '1.1', fontWeight: 400, marginBottom: '24px', color: '#1F2937' }}>
          Your 7-Day Journey: Building Your Family's Forever Guide
        </h1>
        <p className="emotional-promise" style={{ fontSize: '18px', color: '#6B7280', maxWidth: '500px', margin: '0 auto' }}>
          In 7 days, you'll have the foundation. In 4 weeks, they'll really know you.
        </p>
      </section>

      <section className="day-one-container" style={{ marginBottom: '80px', position: 'relative', animation: 'fadeInUp 1s ease-out 0.2s both' }}>
        <div className="day-one-card" style={{ backgroundColor: '#6366F1', color: 'white', borderRadius: '12px', overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '500px' }}>
          <div className="day-one-content" style={{ padding: '64px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="day-marker" style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px', opacity: 0.8 }}>
              Day 1 • Start Here
            </div>
            <h2 className="day-one-headline" style={{ fontFamily: "'Instrument Serif', serif", fontSize: '42px', lineHeight: '1.1', marginBottom: '24px' }}>
              Record Your Voice
            </h2>
            <p className="day-one-desc" style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '40px', opacity: 0.9, maxWidth: '400px' }}>
              Tell us about a tough decision you made. Share advice you'd give. 
              Describe how you handle pressure. Just be yourself. 2 minutes.
            </p>
            <p className="why-it-matters" style={{ fontSize: '14px', fontStyle: 'italic', opacity: 0.7, marginBottom: '40px' }}>
              We hear your tone, your thinking, your authenticity. Your family gets to know YOU. The AI learns more with each submission.
            </p>
            <button 
              className="cta-button" 
              style={{ backgroundColor: '#FFFFFF', color: '#6366F1', border: 'none', padding: '16px 32px', fontSize: '16px', fontWeight: 600, borderRadius: '4px', cursor: 'pointer', width: 'fit-content', transition: 'transform 0.3s ease, box-shadow 0.3s ease', animation: 'pulse 2s ease-in-out infinite' }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
              onClick={() => window.location.href = '/record'}
            >
              Start Now
            </button>
          </div>
          <div className="day-one-visual" style={{ position: 'relative', backgroundColor: '#5558E3', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <div className="arch-window" style={{ width: '60%', height: '85%', backgroundColor: '#F3F4F6', borderTopLeftRadius: '200px', borderTopRightRadius: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', animation: 'glow 3s ease-in-out infinite' }}>
              <MicIcon className="mic-icon" style={{ width: '64px', height: '64px', color: '#6366F1', animation: 'pulse 2.5s ease-in-out infinite' }} />
            </div>
          </div>
        </div>
      </section>

      <section className="timeline-section" style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', animation: 'fadeInUp 1.2s ease-out 0.4s both' }}>
        <div className="timeline-line" style={{ position: 'absolute', left: '24px', top: '20px', bottom: '20px', width: '1px', backgroundColor: '#E5E7EB', zIndex: 0, animation: 'drawLine 1.5s ease-out 0.6s both', transformOrigin: 'top' }}></div>

        {timelineDays.map((dayData, index) => (
          <div 
            key={dayData.day}
            className="day-row" 
            style={{ 
              display: 'flex', 
              gap: '48px', 
              padding: '32px 0', 
              borderBottom: index === timelineDays.length - 1 ? 'none' : '1px solid #E5E7EB', 
              backgroundColor: hoveredDay === dayData.day ? '#FAFBFC' : '#FFFFFF', 
              position: 'relative', 
              zIndex: 1, 
              transition: 'background-color 0.3s ease, transform 0.3s ease', 
              opacity: 1, 
              animation: `fadeInUp 0.6s ease-out ${dayData.delay} both`,
              transform: hoveredDay === dayData.day ? 'translateX(4px)' : 'translateX(0)'
            }}
            onMouseEnter={() => setHoveredDay(dayData.day)}
            onMouseLeave={() => setHoveredDay(null)}
          >
            <div className="day-meta" style={{ minWidth: '120px', paddingLeft: '56px', position: 'relative' }}>
              <div className="timeline-dot" style={{ position: 'absolute', left: '19px', top: '6px', width: '11px', height: '11px', backgroundColor: '#FFFFFF', border: '2px solid #6B7280', borderRadius: '50%', zIndex: 2 }}></div>
              <div className="day-label" style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', color: '#6B7280', textTransform: 'uppercase', marginBottom: '8px' }}>
                {dayData.label}
              </div>
              <dayData.icon className="day-icon-small" style={{ color: '#6B7280', opacity: 0.7 }} />
            </div>
            <div className="day-content" style={{ flex: 1 }}>
              <h3 className="day-headline" style={{ fontFamily: "'Instrument Serif', serif", fontSize: '24px', color: '#1F2937', marginBottom: '8px', fontWeight: 400 }}>
                {dayData.headline}
              </h3>
              <p className="day-desc" style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#6B7280', lineHeight: '1.6', marginBottom: '8px' }}>
                {dayData.description}
              </p>
              {dayData.note && (
                <span className="day-note" style={{ fontSize: '12px', fontStyle: 'italic', color: '#6B7280', opacity: 0.8 }}>
                  {dayData.note}
                </span>
              )}
            </div>
          </div>
        ))}
      </section>

      <div className="bottom-message" style={{ textAlign: 'center', marginTop: '80px', marginBottom: '64px', paddingTop: '32px', fontFamily: "'Instrument Serif', serif", fontSize: '16px', fontStyle: 'italic', color: '#6B7280', animation: 'fadeInUp 1s ease-out 1s both' }}>
        "You can complete this in any order. This 7-day foundation is just the start. Keep training for deeper accuracy."
      </div>
    </div>
  );
};

const App = () => {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600&display=swap');

      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes drawLine {
        from {
          height: 0;
        }
        to {
          height: 100%;
        }
      }

      @keyframes pulse {
        0%, 100% {
          transform: scale(1);
          opacity: 1;
        }
        50% {
          transform: scale(1.05);
          opacity: 0.9;
        }
      }

      @keyframes glow {
        0%, 100% {
          box-shadow: 0 0 20px rgba(99, 102, 241, 0.3), inset 0 0 30px rgba(255, 255, 255, 0.1);
        }
        50% {
          box-shadow: 0 0 40px rgba(99, 102, 241, 0.5), inset 0 0 50px rgba(255, 255, 255, 0.2);
        }
      }

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        -webkit-font-smoothing: antialiased;
      }

      body {
        background-color: #FFFFFF;
        color: #1F2937;
        font-family: 'Inter', sans-serif;
        line-height: 1.5;
        overflow-x: hidden;
      }

      @media (max-width: 768px) {
        .page-container {
          padding: 0 16px !important;
        }

        .intro-section {
          margin: 40px auto 40px auto !important;
        }

        .journey-title {
          font-size: 28px !important;
          line-height: 1.2 !important;
        }

        .emotional-promise {
          font-size: 15px !important;
        }

        .day-one-container {
          margin-bottom: 40px !important;
        }

        .day-one-card {
          grid-template-columns: 1fr !important;
          min-height: auto !important;
          border-radius: 12px !important;
        }

        .day-one-visual {
          height: 180px !important;
          order: -1;
        }

        .arch-window {
          height: 160px !important;
          width: 110px !important;
          border-top-left-radius: 80px !important;
          border-top-right-radius: 80px !important;
        }

        .mic-icon {
          width: 40px !important;
          height: 40px !important;
        }

        .day-one-content {
          padding: 28px 20px !important;
        }

        .day-one-headline {
          font-size: 28px !important;
        }

        .day-one-desc {
          font-size: 14px !important;
          margin-bottom: 24px !important;
        }

        .cta-button {
          width: 100% !important;
          text-align: center !important;
          padding: 14px 24px !important;
        }

        .timeline-section {
          padding: 0 !important;
        }

        .timeline-line {
          left: 12px !important;
        }

        .day-row {
          flex-direction: row !important;
          gap: 16px !important;
          padding: 20px 0 20px 36px !important;
        }

        .day-meta {
          padding-left: 0 !important;
          min-width: 60px !important;
        }

        .day-icon-small {
          width: 16px !important;
          height: 16px !important;
        }

        .timeline-dot {
          left: -24px !important;
          top: 6px !important;
        }

        .day-headline {
          font-size: 18px !important;
        }

        .day-desc {
          font-size: 13px !important;
        }

        .bottom-message {
          margin-top: 40px !important;
          margin-bottom: 40px !important;
          font-size: 14px !important;
          padding: 0 8px !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <>
      <div style={{ width: '100%', minHeight: '100vh' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </div>
    </>
  );
};

export default App;