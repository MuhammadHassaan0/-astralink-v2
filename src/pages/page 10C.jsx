import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';

const customStyles = {
  root: {
    '--color-white': '#FFFFFF',
    '--color-bg-light': '#F9FAFB',
    '--color-border-light': '#E5E7EB',
    '--color-border-accent': '#E8EBFF',
    '--color-text-light': '#9CA3AF',
    '--color-text-gray': '#6B7280',
    '--color-text-dark': '#1F2937',
    '--color-primary': '#6366F1',
    '--color-primary-dark': '#4F46E5',
    '--color-success': '#10B981',
    '--font-main': "'Inter', sans-serif",
    '--spacing-xs': '8px',
    '--spacing-sm': '12px',
    '--spacing-md': '24px',
    '--spacing-lg': '32px',
    '--spacing-xl': '48px',
    '--spacing-xxl': '64px'
  }
};

const Avatar = () => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      style={{
        width: '32px',
        height: '32px',
        backgroundColor: '#E0E7FF',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-primary)',
        fontSize: '12px',
        fontWeight: '600',
        cursor: 'pointer',
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        transition: 'transform 0.2s ease'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      JM
    </div>
  );
};

const SettingsIcon = () => {
  return (
    <div style={{ width: '20px', height: '20px', color: 'var(--color-text-gray)', cursor: 'pointer' }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
      </svg>
    </div>
  );
};

const Header = () => {
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      background: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid #F3F4F6',
      padding: 'var(--spacing-sm) var(--spacing-lg)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 1000,
      animation: 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards'
    }}>
      <Link to="/" style={{
        fontSize: '16px',
        fontWeight: '700',
        color: 'var(--color-primary)',
        letterSpacing: '-0.02em',
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M2 17L12 22L22 17" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M2 12L12 17L22 12" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
        AstraLink
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <SettingsIcon />
        <Avatar />
      </div>
    </header>
  );
};

const HeroSection = () => {
  return (
    <section style={{
      padding: 'var(--spacing-xxl) var(--spacing-xl)',
      textAlign: 'center',
      position: 'relative',
      animation: 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards',
      opacity: 0
    }}>
      <div style={{
        fontSize: '14px',
        color: 'var(--color-success)',
        marginBottom: '16px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        background: 'rgba(16, 185, 129, 0.05)',
        padding: '4px 12px',
        borderRadius: '100px',
        animation: 'slideDown 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="19" x2="12" y2="5"></line>
          <polyline points="5 12 12 5 19 12"></polyline>
        </svg>
        +8% this week
      </div>
      <div style={{
        fontSize: '96px',
        fontWeight: '700',
        color: 'var(--color-primary)',
        lineHeight: '1',
        marginBottom: 'var(--spacing-xs)',
        letterSpacing: '-0.04em',
        animation: 'scaleIn 1s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}>
        25%
      </div>
      <div style={{
        fontSize: '14px',
        color: 'var(--color-text-gray)',
        marginBottom: 'var(--spacing-lg)'
      }}>
        Your current accuracy
      </div>
      <div style={{
        fontSize: '13px',
        color: 'var(--color-text-light)',
        fontStyle: 'italic',
        marginBottom: 'var(--spacing-xxl)'
      }}>
        From 4 voices, 2 documents, and 15 questions
      </div>
    </section>
  );
};

const TimelineSection = () => {
  const timelineItems = [
    { label: 'Today', value: '25%', active: true },
    { label: 'Week 1', value: '~52%', active: false },
    { label: 'Week 2', value: '~65%', active: false },
    { label: 'Week 3', value: '~78%', active: false },
    { label: 'Week 4', value: '88%', active: false }
  ];

  return (
    <section style={{
      maxWidth: '700px',
      margin: '0 auto',
      padding: '0 var(--spacing-md)',
      animation: 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards',
      opacity: 0
    }}>
      <h2 style={{
        fontSize: '20px',
        fontWeight: '700',
        color: 'var(--color-text-dark)',
        textAlign: 'center',
        marginBottom: 'var(--spacing-lg)',
        letterSpacing: '-0.01em'
      }}>
        Your journey to mastery
      </h2>
      
      <div style={{
        position: 'relative',
        paddingLeft: '50%',
        marginBottom: 'var(--spacing-xxl)'
      }}>
        <div style={{
          position: 'absolute',
          left: '50%',
          top: 0,
          bottom: 0,
          width: '1px',
          background: 'linear-gradient(to bottom, var(--color-primary) 50%, transparent 100%)',
          transform: 'translateX(-50%)'
        }}></div>
        
        {timelineItems.map((item, index) => (
          <div key={index} style={{
            position: 'relative',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center'
          }}>
            <div style={{
              position: 'absolute',
              left: 0,
              transform: 'translateX(-50%)',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: item.active ? 'var(--color-primary)' : 'var(--color-white)',
              border: '1px solid var(--color-primary)',
              zIndex: 2,
              boxShadow: item.active ? '0 0 0 4px rgba(99, 102, 241, 0.15)' : 'none',
              animation: item.active ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
            }}></div>
            <div style={{ paddingLeft: '24px', textAlign: 'left' }}>
              <div style={{
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--color-text-light)',
                marginBottom: '2px'
              }}>
                {item.label}
              </div>
              <div style={{
                fontSize: item.active ? '16px' : '14px',
                fontWeight: item.active ? '700' : '400',
                color: item.active ? 'var(--color-primary)' : 'var(--color-text-light)'
              }}>
                {item.value}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div style={{
        fontSize: '12px',
        color: 'var(--color-text-light)',
        textAlign: 'center',
        fontStyle: 'italic',
        marginTop: 'var(--spacing-md)',
        marginBottom: 'var(--spacing-xxl)'
      }}>
        Based on real data from users like you. Your timeline may vary.
      </div>
    </section>
  );
};

const TraitCard = ({ name, confidence, description, delay }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      style={{
        background: 'var(--color-white)',
        border: '1px solid var(--color-border-light)',
        borderRadius: '12px',
        padding: 'var(--spacing-md)',
        textAlign: 'center',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
        boxShadow: isHovered ? '0 15px 40px -10px rgba(99, 102, 241, 0.15)' : 'none',
        borderColor: isHovered ? 'var(--color-primary)' : 'var(--color-border-light)',
        animation: `fadeInScale 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s forwards`,
        opacity: 0
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{
        fontSize: '18px',
        fontWeight: '700',
        color: 'var(--color-primary)',
        marginBottom: '8px'
      }}>
        {name}
      </div>
      <span style={{
        fontSize: '12px',
        color: 'var(--color-text-light)',
        fontStyle: 'italic',
        marginBottom: '16px',
        display: 'block'
      }}>
        {confidence}
      </span>
      <p style={{
        fontSize: '14px',
        color: 'var(--color-text-gray)',
        lineHeight: '1.6',
        margin: 0
      }}>
        {description}
      </p>
    </div>
  );
};

const TraitsSection = () => {
  const traits = [
    { name: 'Thoughtful', confidence: '(Discovered from 3 voices)', description: 'You take time to think before responding. You value depth over speed.' },
    { name: 'Detail-Oriented', confidence: '(Discovered from 2 docs)', description: 'You notice things others miss. You care about precision and nuance.' },
    { name: 'Listener', confidence: '(Inferred from behavior)', description: 'You understand people deeply. You listen more than you talk.' }
  ];

  return (
    <section style={{
      maxWidth: '700px',
      margin: '0 auto',
      padding: '0 var(--spacing-md)',
      animation: 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards',
      opacity: 0
    }}>
      <h2 style={{
        fontSize: '20px',
        fontWeight: '700',
        color: 'var(--color-text-dark)',
        textAlign: 'center',
        marginBottom: 'var(--spacing-lg)',
        letterSpacing: '-0.01em'
      }}>
        Here's who we're seeing
      </h2>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: 'var(--spacing-lg)'
      }}>
        {traits.map((trait, index) => (
          <TraitCard key={index} {...trait} delay={0.1 * (index + 1)} />
        ))}
      </div>

      <div style={{
        fontSize: '12px',
        color: 'var(--color-text-light)',
        textAlign: 'center',
        marginTop: 'var(--spacing-lg)',
        marginBottom: 'var(--spacing-xxl)'
      }}>
        More traits emerging as you train
      </div>
    </section>
  );
};

const ActivityRow = ({ time, icon, title, meta, delay, isLast }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: isHovered ? '16px 0 16px 8px' : '16px 0',
        borderBottom: isLast ? 'none' : '1px solid #F3F4F6',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        backgroundColor: isHovered ? '#FAFBFC' : 'transparent',
        borderRadius: isHovered ? '8px' : '0',
        animation: `slideInLeft 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s forwards`,
        opacity: 0
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{
        width: '100px',
        fontSize: '12px',
        color: 'var(--color-text-light)',
        flexShrink: 0
      }}>
        {time}
      </div>
      <div style={{
        width: '24px',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: '16px',
        color: isHovered ? 'white' : 'var(--color-primary)',
        background: isHovered ? 'var(--color-primary)' : '#EEF2FF',
        borderRadius: '6px',
        flexShrink: 0,
        transition: 'all 0.3s ease',
        transform: isHovered ? 'scale(1.1)' : 'scale(1)'
      }}>
        {icon}
      </div>
      <div style={{ flexGrow: 1 }}>
        <div style={{
          fontSize: '14px',
          color: 'var(--color-text-dark)',
          marginBottom: '2px'
        }}>
          {title}
        </div>
        <div style={{
          fontSize: '12px',
          color: 'var(--color-text-light)'
        }}>
          {meta}
        </div>
      </div>
    </div>
  );
};

const ActivitySection = () => {
  const activities = [
    {
      time: '2 hours ago',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
          <line x1="12" y1="19" x2="12" y2="23"></line>
          <line x1="8" y1="23" x2="16" y2="23"></line>
        </svg>
      ),
      title: "Recorded: 'What's a decision you’re proud of?'",
      meta: '3m 24s • Audio Analysis'
    },
    {
      time: '1 day ago',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      ),
      title: 'Uploaded: personal_letter.pdf',
      meta: 'Text Analysis'
    },
    {
      time: '2 days ago',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      ),
      title: "Answered: 'How do you want to be remembered?'",
      meta: 'Prompt Response'
    },
    {
      time: '4 days ago',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
          <line x1="12" y1="19" x2="12" y2="23"></line>
          <line x1="8" y1="23" x2="16" y2="23"></line>
        </svg>
      ),
      title: "Recorded: 'Childhood Memories'",
      meta: '5m 12s • Audio Analysis'
    }
  ];

  return (
    <section style={{
      maxWidth: '700px',
      margin: '0 auto',
      padding: '0 var(--spacing-md)',
      animation: 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards',
      opacity: 0
    }}>
      <h2 style={{
        fontSize: '20px',
        fontWeight: '700',
        color: 'var(--color-text-dark)',
        textAlign: 'center',
        marginBottom: 'var(--spacing-lg)',
        letterSpacing: '-0.01em'
      }}>
        Your recent submissions
      </h2>
      
      <div style={{
        marginBottom: 'var(--spacing-md)',
        borderTop: '1px solid #F3F4F6'
      }}>
        {activities.map((activity, index) => (
          <ActivityRow 
            key={index} 
            {...activity} 
            delay={0.1 * (index + 1)} 
            isLast={index === activities.length - 1}
          />
        ))}
      </div>

      <div style={{
        fontSize: '12px',
        color: 'var(--color-text-light)',
        textAlign: 'center',
        marginTop: 'var(--spacing-lg)',
        marginBottom: 'var(--spacing-xxl)'
      }}>
        Keep building your profile
      </div>
    </section>
  );
};

const MilestoneCard = ({ title, description, progress, isActive, delay }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      style={{
        padding: 'var(--spacing-md)',
        borderRadius: '12px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        background: isActive ? 'var(--color-bg-light)' : 'var(--color-white)',
        border: `1px solid ${isActive ? 'var(--color-border-accent)' : 'var(--color-border-light)'}`,
        transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: isHovered ? '0 10px 30px -10px rgba(99, 102, 241, 0.2)' : 'none',
        animation: `fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s forwards`,
        opacity: 0
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{
        fontSize: '16px',
        fontWeight: '700',
        marginBottom: '8px',
        color: isActive ? 'var(--color-primary)' : 'var(--color-text-dark)'
      }}>
        {title}
      </div>
      <div style={{
        fontSize: '13px',
        color: 'var(--color-text-gray)',
        marginBottom: '16px'
      }}>
        {description}
      </div>
      <div style={{
        height: '4px',
        background: 'var(--color-border-light)',
        borderRadius: '2px',
        width: '100%',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          background: isActive ? 'var(--color-primary)' : '#E5E7EB',
          borderRadius: '2px',
          width: `${progress}%`,
          transition: 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {isActive && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
              animation: 'shimmer 2s infinite'
            }}></div>
          )}
        </div>
      </div>
    </div>
  );
};

const MilestonesSection = () => {
  const milestones = [
    { title: '50% Accuracy', description: '3 more voices to go', progress: 70, isActive: true },
    { title: '88% Accuracy', description: 'Your family will really know you', progress: 0, isActive: false }
  ];

  return (
    <section style={{
      maxWidth: '700px',
      margin: '0 auto',
      padding: '0 var(--spacing-md)',
      animation: 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards',
      opacity: 0
    }}>
      <h2 style={{
        fontSize: '20px',
        fontWeight: '700',
        color: 'var(--color-text-dark)',
        textAlign: 'center',
        marginBottom: 'var(--spacing-lg)',
        letterSpacing: '-0.01em'
      }}>
        What's coming next
      </h2>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: 'var(--spacing-md)'
      }}>
        {milestones.map((milestone, index) => (
          <MilestoneCard key={index} {...milestone} delay={0.1 * (index + 1)} />
        ))}
      </div>
      
      <div style={{
        fontSize: '12px',
        color: 'var(--color-success)',
        textAlign: 'center',
        marginTop: 'var(--spacing-md)',
        marginBottom: 'var(--spacing-xxl)'
      }}>
        You’re on track to reach 50% by end of week
      </div>
    </section>
  );
};

const CTASection = () => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section style={{
      textAlign: 'center',
      paddingBottom: '80px',
      maxWidth: '700px',
      margin: '0 auto',
      padding: '0 var(--spacing-md) 80px',
      animation: 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards',
      opacity: 0
    }}>
      <h2 style={{
        fontSize: '18px',
        fontWeight: '700',
        color: 'var(--color-text-dark)',
        marginBottom: '8px'
      }}>
        Ready to strengthen your profile?
      </h2>
      <p style={{
        fontSize: '14px',
        color: 'var(--color-text-gray)',
        marginBottom: 'var(--spacing-md)'
      }}>
        Record another voice or upload a story
      </p>
      <button
        onClick={() => window.location.href = '/chat'}
        style={{
          display: 'inline-block',
          backgroundColor: 'var(--color-primary)',
          color: 'white',
          fontWeight: '600',
          fontSize: '14px',
          padding: '12px 32px',
          borderRadius: '100px',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isHovered 
            ? '0 15px 25px -5px rgba(99, 102, 241, 0.4), 0 10px 10px -5px rgba(99, 102, 241, 0.2)' 
            : '0 4px 6px -1px rgba(99, 102, 241, 0.2), 0 2px 4px -1px rgba(99, 102, 241, 0.1)',
          transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        Go to Recording Hub
      </button>
    </section>
  );
};

const HomePage = () => {
  return (
    <>
      <HeroSection />
      <TimelineSection />
      <TraitsSection />
      <ActivitySection />
      <MilestonesSection />
      <CTASection />
    </>
  );
};

const App = () => {
  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      body {
        font-family: 'Inter', sans-serif;
        background-color: #FFFFFF;
        color: #1F2937;
        line-height: 1.5;
        overflow-x: hidden;
      }

      @keyframes fadeInUp {
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes scaleIn {
        from {
          opacity: 0;
          transform: scale(0.8);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      @keyframes pulse {
        0%, 100% {
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15);
        }
        50% {
          box-shadow: 0 0 0 8px rgba(99, 102, 241, 0.1);
        }
      }

      @keyframes fadeInScale {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      @keyframes slideInLeft {
        from {
          opacity: 0;
          transform: translateX(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
    `;
    document.head.appendChild(styleSheet);

    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  return (
    <>
      <div style={customStyles.root}>
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/recording" element={<HomePage />} />
        </Routes>
      </div>
    </>
  );
};

export default function Page10C() { return <App />; }