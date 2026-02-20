import React, { useState, useEffect } from 'react';

const customStyles = {
  root: {
    '--accent-blue': '#2A44B6',
    '--accent-green': '#379555',
    '--accent-yellow': '#F6B828',
    '--text-headline': '#1F2937',
    '--bg-base': '#F3F4F6'
  },
  body: {
    fontFamily: "'Inter', sans-serif",
    backgroundColor: 'var(--bg-base)',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    margin: 0,
    padding: 0
  },
  bodyBefore: {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0.03,
    pointerEvents: 'none',
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E\")"
  }
};

const Badge = ({ position, children }) => {
  const badgeStyle = {
    position: 'fixed',
    background: 'white',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '9px',
    fontWeight: '800',
    color: 'var(--accent-blue)',
    textTransform: 'uppercase',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    zIndex: 5,
    ...(position === 'left' ? { top: '30px', left: '30px' } : { bottom: '30px', right: '30px' })
  };

  return <div style={badgeStyle}>{children}</div>;
};

const Card = ({ color, quote, name, location, delay }) => {
  const themeColors = {
    blue: '#2A44B6',
    green: '#379555',
    yellow: '#F6B828'
  };

  const cardStyle = {
    background: '#FFFFFF',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 4px 6px -1px rgba(0,0,0,0.05)',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '180px',
    transition: 'all 0.3s ease',
    '--theme-color': themeColors[color]
  };

  const cardBeforeStyle = {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '20px',
    width: '30px',
    height: '4px',
    backgroundColor: themeColors[color],
    borderBottomLeftRadius: '2px',
    borderBottomRightRadius: '2px'
  };

  const quoteStyle = {
    fontSize: '13px',
    color: '#4B5563',
    lineHeight: '1.5',
    marginBottom: '16px'
  };

  const authorInfoStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    paddingTop: '12px',
    borderTop: '1px solid #F3F4F6'
  };

  const avatarStyle = {
    width: '28px',
    height: '28px',
    backgroundColor: themeColors[color],
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '11px',
    fontWeight: '800',
    flexShrink: 0
  };

  const authorMetaStyle = {
    display: 'flex',
    flexDirection: 'column'
  };

  const authorNameStyle = {
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#111827'
  };

  const authorLocStyle = {
    fontSize: '10px',
    color: '#9CA3AF'
  };

  return (
    <div style={cardStyle}>
      <div style={cardBeforeStyle}></div>
      <p style={quoteStyle}>{quote}</p>
      <div style={authorInfoStyle}>
        <div style={avatarStyle}>{name.charAt(0)}</div>
        <div style={authorMetaStyle}>
          <span style={authorNameStyle}>{name}</span>
          <span style={authorLocStyle}>{location}</span>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
      
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        -webkit-font-smoothing: antialiased;
      }

      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-12px); }
      }

      @keyframes floatAlt {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-8px); }
      }

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

      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }

      @keyframes wiggle {
        0%, 100% { transform: rotate(-4deg); }
        50% { transform: rotate(-6deg); }
      }

      @keyframes wiggleRight {
        0%, 100% { transform: rotate(3deg); }
        50% { transform: rotate(5deg); }
      }

      .hero-section {
        animation: fadeInUp 0.8s ease-out;
      }

      .hero-headline {
        animation: fadeInUp 1s ease-out 0.2s backwards;
      }

      .testimonials-grid > div:nth-child(1) {
        animation: float 5s ease-in-out infinite;
        animation-delay: 0s;
      }

      .testimonials-grid > div:nth-child(2) {
        animation: floatAlt 6s ease-in-out infinite;
        animation-delay: 0.5s;
      }

      .testimonials-grid > div:nth-child(3) {
        animation: float 5.5s ease-in-out infinite;
        animation-delay: 1s;
      }

      .testimonials-grid > div:nth-child(4) {
        animation: floatAlt 6.5s ease-in-out infinite;
        animation-delay: 1.5s;
      }

      .testimonials-grid > div:nth-child(5) {
        animation: float 5.8s ease-in-out infinite;
        animation-delay: 2s;
      }

      .testimonials-grid > div:nth-child(6) {
        animation: floatAlt 6.2s ease-in-out infinite;
        animation-delay: 2.5s;
      }

      .testimonials-grid > div:hover {
        animation: pulse 0.5s ease-in-out;
        z-index: 2;
      }

      .avatar-pulse {
        animation: pulse 2s ease-in-out infinite;
      }

      .badge-left {
        animation: wiggle 3s ease-in-out infinite;
      }

      .badge-right {
        animation: wiggleRight 3s ease-in-out infinite;
      }

      @media (max-width: 768px) {
        .testimonials-grid {
          grid-template-columns: repeat(2, 1fr) !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const containerStyle = {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    maxWidth: '900px',
    padding: '40px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '32px'
  };

  const heroSectionStyle = {
    textAlign: 'center',
    maxWidth: '500px',
    margin: '0 auto'
  };

  const heroHeadlineStyle = {
    fontSize: '18px',
    fontWeight: '500',
    color: 'var(--text-headline)',
    lineHeight: '1.4'
  };

  const heroHighlightStyle = {
    display: 'block',
    fontSize: '22px',
    fontWeight: '700',
    color: 'var(--accent-blue)',
    marginTop: '4px'
  };

  const testimonialsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px'
  };

  const testimonials = [
    {
      color: 'blue',
      quote: '"I realized my kids will ask me things one day that I won\'t be around to answer. This ensures they get my actual thinking."',
      name: 'Sarah',
      location: 'Toronto, Canada'
    },
    {
      color: 'green',
      quote: '"We have group chats, but those disappear. AstraLink feels permanent. Like a digital safety deposit box for emotional history."',
      name: 'Marcus',
      location: 'Austin, Texas'
    },
    {
      color: 'yellow',
      quote: '"My grandfather passed before I was born. I would give anything to hear his voice. I\'m doing this for my grandkids."',
      name: 'Elena',
      location: 'Madrid, Spain'
    },
    {
      color: 'yellow',
      quote: '"Capturing these memories now means my legacy isn\'t just photos, but the wisdom behind them for the next generation."',
      name: 'David',
      location: 'London, UK'
    },
    {
      color: 'blue',
      quote: '"It\'s the only platform that prioritizes long-term preservation over temporary engagement. Truly invaluable for us."',
      name: 'Julia',
      location: 'Berlin, Germany'
    },
    {
      color: 'green',
      quote: '"A simple way to ensure the stories we tell at dinner aren\'t lost to time. It\'s become a weekly family ritual for us."',
      name: 'Thomas',
      location: 'Sydney, AU'
    }
  ];

  return (
    <div style={{ ...customStyles.root, ...customStyles.body }}>
      <div style={customStyles.bodyBefore}></div>
      <div className="badge-left">
        <Badge position="left">Actual Thinking</Badge>
      </div>
      <div className="badge-right">
        <Badge position="right">Family Safe</Badge>
      </div>

      <div style={containerStyle}>
        <div className="hero-section" style={heroSectionStyle}>
          <h2 className="hero-headline" style={heroHeadlineStyle}>
            People are already using this.<br />
            <span style={{ opacity: 0.6 }}>Because they realized:</span>
            <span style={heroHighlightStyle}>I need this. For my family.</span>
          </h2>
        </div>

        <div className="testimonials-grid" style={testimonialsGridStyle}>
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              color={testimonial.color}
              quote={testimonial.quote}
              name={testimonial.name}
              location={testimonial.location}
              delay={index * 0.5}
            />
          ))}
        </div>
      </div>
    
    </div>
  );
};

const CTAButton = () => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', background: '#f9fafb' }}>
    <button
      onClick={() => window.location.href = '/why'}
      style={{ background: '#6366F1', color: '#fff', border: 'none', borderRadius: '999px', padding: '18px 48px', fontSize: '16px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', boxShadow: '0 4px 24px rgba(99,102,241,0.3)' }}
    >
      See Why It Matters →
    </button>
  </div>
);

export default function Page3() {
  return (
    <>
      <App />
      <div style={{ display: "flex", justifyContent: "center", padding: "60px 0", background: "#f9fafb" }}>
        <button
          onClick={() => window.location.href = "/why"}
          style={{ background: "#6366F1", color: "#fff", border: "none", borderRadius: "999px", padding: "18px 48px", fontSize: "16px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif", boxShadow: "0 4px 24px rgba(99,102,241,0.3)" }}
        >
          See Why It Matters →
        </button>
      </div>
    </>
  );
}