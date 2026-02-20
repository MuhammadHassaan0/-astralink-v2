import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';

const customStyles = {
  root: {
    '--bg-color': '#FFFFFF',
    '--text-primary': '#1F2937',
    '--text-secondary': '#6B7280',
    '--accent-purple': '#6366F1',
    '--accent-purple-dark': '#4F46E5',
    '--accent-purple-light': '#E0E7FF',
    '--bg-card-hover': '#F9FAFB',
    '--bg-card-selected': '#F5F3FF',
    '--font-display': '"Times New Roman", Times, serif',
    '--font-body': '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    '--ease-out': 'cubic-bezier(0.215, 0.61, 0.355, 1)',
    '--ease-elastic': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
};

const TreeBackground = ({ visibleParts }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: -1,
      pointerEvents: 'none',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-end',
      paddingBottom: '5vh',
      overflow: 'hidden',
    }}>
      <svg 
        style={{
          width: '80%',
          maxWidth: '800px',
          height: '85vh',
          opacity: 0.2,
          transition: 'opacity 2s ease',
        }}
        viewBox="0 0 400 500" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="treeGradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#E8EBFF', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#A3E4D7', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        
        <g 
          className="tree-part roots" 
          stroke="url(#treeGradient)" 
          strokeWidth="2" 
          fill="none" 
          strokeLinecap="round"
          style={{
            opacity: visibleParts.roots ? 1 : 0,
            transition: 'opacity 1.5s ease-out, transform 2s cubic-bezier(0.215, 0.61, 0.355, 1)',
            transformOrigin: 'bottom center',
            transform: visibleParts.roots ? 'scale(1) translateY(0)' : 'scaleY(0.9) translateY(20px)',
          }}
        >
          <path d="M200,500 C200,480 180,490 160,500" />
          <path d="M200,500 C200,485 220,490 240,500" />
          <path d="M190,490 C180,495 170,498 150,500" />
          <path d="M210,490 C230,495 250,495 270,500" />
        </g>

        <g 
          className="tree-part trunk" 
          stroke="url(#treeGradient)" 
          strokeWidth="3" 
          fill="none" 
          strokeLinecap="round"
          style={{
            opacity: visibleParts.trunk ? 1 : 0,
            transition: 'opacity 1.5s ease-out, transform 2s cubic-bezier(0.215, 0.61, 0.355, 1)',
            transformOrigin: 'bottom center',
            transform: visibleParts.trunk ? 'scale(1) translateY(0)' : 'scaleY(0.8) translateY(50px)',
          }}
        >
          <path d="M200,500 C200,450 195,400 200,350 C205,300 198,250 200,200" />
          <path d="M198,480 C198,450 196,420 198,380" strokeWidth="1" opacity="0.6" />
          <path d="M202,480 C202,450 204,420 202,380" strokeWidth="1" opacity="0.6" />
        </g>

        <g 
          className="tree-part branches" 
          stroke="url(#treeGradient)" 
          strokeWidth="2" 
          fill="none" 
          strokeLinecap="round"
          style={{
            opacity: visibleParts.branches ? 1 : 0,
            transition: 'opacity 1.5s ease-out, transform 2s cubic-bezier(0.215, 0.61, 0.355, 1)',
            transformOrigin: 'bottom center',
            transform: visibleParts.branches ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(30px)',
          }}
        >
          <path d="M200,350 C180,320 150,300 120,280" />
          <path d="M200,300 C240,280 260,260 280,220" />
          <path d="M200,250 C160,230 140,200 130,150" />
          <path d="M198,220 C220,180 250,150 260,120" />
          <path d="M200,200 C190,150 200,100 200,80" />
        </g>

        <g 
          className="tree-part crown" 
          fill="url(#treeGradient)"
          style={{
            opacity: visibleParts.crown ? 0.5 : 0,
            transition: 'opacity 1.5s ease-out, transform 2s cubic-bezier(0.215, 0.61, 0.355, 1)',
            transformOrigin: 'bottom center',
            transform: visibleParts.crown ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(20px)',
          }}
        >
          <circle cx="120" cy="280" r="15" opacity="0.4" />
          <circle cx="280" cy="220" r="18" opacity="0.3" />
          <circle cx="130" cy="150" r="20" opacity="0.4" />
          <circle cx="260" cy="120" r="22" opacity="0.3" />
          <circle cx="200" cy="80" r="25" opacity="0.4" />
          <circle cx="180" cy="180" r="12" opacity="0.3" />
          <circle cx="230" cy="190" r="15" opacity="0.3" />
        </g>
      </svg>
    </div>
  );
};

const MonologueCard = ({ text, isRevealed, isSelected, isHovered, onClick, isOtherHovered }) => {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: isSelected ? 'var(--bg-card-selected)' : (isHovered ? 'var(--bg-card-hover)' : 'transparent'),
        borderLeft: `3px solid ${isSelected ? 'var(--accent-purple)' : (isHovered ? '#E5E7EB' : 'transparent')}`,
        padding: '24px 32px',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.215, 0.61, 0.355, 1)',
        position: 'relative',
        opacity: isRevealed ? (isSelected ? 1 : (isOtherHovered ? 0.5 : 1)) : 0,
        transform: isRevealed ? 'translateY(0)' : 'translateY(10px)',
        borderRadius: '0 8px 8px 0',
        pointerEvents: isSelected ? 'none' : 'auto',
      }}
    >
      <div style={{
        fontFamily: 'var(--font-body)',
        fontSize: '1.125rem',
        color: 'var(--text-primary)',
        lineHeight: 1.6,
        fontWeight: 400,
      }}>
        {text}
      </div>
    </div>
  );
};

const FeedbackMessage = ({ visible, text }) => {
  return (
    <div style={{
      textAlign: 'center',
      height: '24px',
      color: '#10B981',
      fontSize: '0.9rem',
      fontWeight: 500,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(10px)',
      transition: 'all 0.3s ease',
      marginBottom: '24px',
    }}>
      {text}
    </div>
  );
};

const PrimaryButton = ({ visible, onClick, children }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: isHovered ? 'var(--accent-purple-dark)' : 'var(--accent-purple)',
        color: 'white',
        border: 'none',
        padding: '14px 40px',
        fontSize: '1rem',
        fontWeight: 600,
        borderRadius: '100px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'block',
        margin: '0 auto',
        opacity: visible ? 1 : 0,
        transform: visible ? (isHovered ? 'translateY(-1px)' : 'translateY(0)') : 'translateY(10px)',
        pointerEvents: visible ? 'auto' : 'none',
        boxShadow: isHovered ? '0 6px 8px -1px rgba(99, 102, 241, 0.3)' : '0 4px 6px -1px rgba(99, 102, 241, 0.2)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {children}
    </button>
  );
};

const QuestionScreen = ({ screenNum, title, options, onSelect, selectedIndex, onNext }) => {
  const [revealedCards, setRevealedCards] = useState([]);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    options.forEach((_, index) => {
      setTimeout(() => {
        setRevealedCards(prev => [...prev, index]);
      }, index * 600);
    });
  }, [options]);

  const handleSelect = (index) => {
    onSelect(index);
    setShowFeedback(true);
    setShowButton(true);
  };

  const isAnyOtherHovered = hoveredCard !== null && hoveredCard !== selectedIndex;

  return (
    <div style={{
      animation: 'fadeIn 0.6s ease-out',
    }}>
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '3rem',
        fontWeight: 400,
        color: 'var(--text-primary)',
        textAlign: 'center',
        marginBottom: '60px',
        letterSpacing: '-0.02em',
        lineHeight: 1.1,
      }}>
        {title}
      </h1>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        marginBottom: '48px',
      }}>
        {options.map((text, index) => (
          <div
            key={index}
            onMouseEnter={() => selectedIndex === null && setHoveredCard(index)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <MonologueCard
              text={text}
              isRevealed={revealedCards.includes(index)}
              isSelected={selectedIndex === index}
              isHovered={hoveredCard === index}
              isOtherHovered={isAnyOtherHovered && selectedIndex !== index}
              onClick={() => selectedIndex === null && handleSelect(index)}
            />
          </div>
        ))}
      </div>
      <FeedbackMessage 
        visible={showFeedback} 
        text="Got it. That says something real about you." 
      />
      <PrimaryButton visible={showButton} onClick={onNext}>
        Next
      </PrimaryButton>
    </div>
  );
};

const FinalQuestionScreen = ({ options, onSelect, selectedIndex, userInput, onInputChange, onNext }) => {
  const [revealedCards, setRevealedCards] = useState([]);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    options.forEach((_, index) => {
      setTimeout(() => {
        setRevealedCards(prev => [...prev, index]);
      }, index * 600);
    });
  }, [options]);

  const handleSelect = (index) => {
    onSelect(index);
    setShowFeedback(true);
    setShowInput(true);
  };

  const handleInputChange = (e) => {
    onInputChange(e.target.value);
    if (e.target.value.length > 3) {
      setShowButton(true);
    } else {
      setShowButton(false);
    }
  };

  const isAnyOtherHovered = hoveredCard !== null && hoveredCard !== selectedIndex;

  return (
    <div style={{
      animation: 'fadeIn 0.6s ease-out',
    }}>
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '3rem',
        fontWeight: 400,
        color: 'var(--text-primary)',
        textAlign: 'center',
        marginBottom: '60px',
        letterSpacing: '-0.02em',
        lineHeight: 1.1,
      }}>
        People come to you for...
      </h1>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        marginBottom: '48px',
      }}>
        {options.map((text, index) => (
          <div
            key={index}
            onMouseEnter={() => selectedIndex === null && setHoveredCard(index)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <MonologueCard
              text={text}
              isRevealed={revealedCards.includes(index)}
              isSelected={selectedIndex === index}
              isHovered={hoveredCard === index}
              isOtherHovered={isAnyOtherHovered && selectedIndex !== index}
              onClick={() => selectedIndex === null && handleSelect(index)}
            />
          </div>
        ))}
      </div>
      
      <div style={{
        marginTop: '32px',
        opacity: showInput ? 1 : 0,
        transform: showInput ? 'translateY(0)' : 'translateY(10px)',
        transition: 'all 0.5s ease',
        pointerEvents: showInput ? 'auto' : 'none',
      }}>
        <textarea
          value={userInput}
          onChange={handleInputChange}
          placeholder="e.g., career decisions, parenting, how to stay calm..."
          style={{
            width: '100%',
            padding: '16px',
            fontFamily: 'var(--font-body)',
            fontSize: '1rem',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            resize: 'none',
            minHeight: '100px',
            transition: 'border-color 0.2s',
            outline: 'none',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--accent-purple)';
            e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#E5E7EB';
            e.target.style.boxShadow = 'none';
          }}
        />
      </div>

      <FeedbackMessage 
        visible={showFeedback} 
        text="Saved." 
      />
      <PrimaryButton visible={showButton} onClick={onNext}>
        See Results
      </PrimaryButton>
    </div>
  );
};

const FinalScreen = ({ summary }) => {
  return (
    <div style={{
      animation: 'fadeIn 0.6s ease-out',
    }}>
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '3rem',
        fontWeight: 400,
        color: 'var(--text-primary)',
        textAlign: 'center',
        marginBottom: '60px',
        letterSpacing: '-0.02em',
        lineHeight: 1.1,
      }}>
        This is you.
      </h1>
      <div 
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.5rem',
          textAlign: 'center',
          lineHeight: 1.6,
          marginBottom: '48px',
          color: 'var(--text-primary)',
        }}
        dangerouslySetInnerHTML={{ __html: summary }}
      />
      <PrimaryButton visible={true} onClick={() => window.location.href = '/reveal'}>
        I’m ready. Show me.
      </PrimaryButton>
    </div>
  );
};

const App = () => {
  const [currentScreen, setCurrentScreen] = useState(1);
  const [selections, setSelections] = useState({});
  const [userInput, setUserInput] = useState('');
  const [visibleParts, setVisibleParts] = useState({
    roots: false,
    trunk: false,
    branches: false,
    crown: false,
  });

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-20px); }
      }

      @media (max-width: 600px) {
        h1 { font-size: 2rem !important; margin-bottom: 40px !important; }
      }
    `;
    document.head.appendChild(style);

    setTimeout(() => {
      setVisibleParts(prev => ({ ...prev, roots: true }));
    }, 3000);

    return () => document.head.removeChild(style);
  }, []);

  const content = {
    1: [
      "You don’t move until you understand. You gather information like puzzle pieces. You’re methodical, not reckless.",
      "You trust the feeling before the facts. Analysis is for people who aren't sure of themselves. You move fast.",
      "You know that no one figures it out alone. You ask because you care. Other people's perspective is your superpower.",
      "You let things settle. You don’t rush AND you don’t overthink. You sit with the uncertainty."
    ],
    2: [
      "Your words are weapons when they need to be. You don’t soften the truth. Honesty is your love language.",
      "Every word matters. You choose them carefully. You paint pictures with language.",
      "You make people feel safe. Your voice is warm. Connection is your native language.",
      "You know exactly what to say and when. You read the room. You’re strategic without being manipulative."
    ],
    3: [
      "You don’t back down. You stand for what you believe. You'd rather fight for what's right than keep the peace.",
      "You seek to understand before you judge. Disagreement is an opportunity to learn.",
      "You find the bridge. Both sides have truth. You’re the person who brings people together.",
      "You listen more than you argue. You respect expertise. Humility is your strength."
    ],
    4: [
      "People come to you for the hard truth. When they need someone to be real with them, they call you.",
      "People trust your discernment. You see things others miss.",
      "People come to you when they need to be heard. You’re the shoulder, the ear, the safe space.",
      "People come to you for wisdom. Not just answers—real wisdom."
    ]
  };

  const summaryFragments = {
    1: ["methodical", "instinctive", "collaborative", "patient"],
    2: ["speak truth", "speak with care", "create safety", "communicate strategically"],
    3: ["stand your ground", "seek to learn", "build bridges", "listen first"],
    4: ["honesty", "insight", "comfort", "wisdom"]
  };

  const titles = {
    1: "Which of these is you?",
    2: "How do you communicate?",
    3: "When someone disagrees..."
  };

  const handleSelect = (screenNum, index) => {
    setSelections(prev => ({ ...prev, [screenNum]: index }));
  };

  const handleNext = (screenNum) => {
    if (screenNum === 1) {
      setVisibleParts(prev => ({ ...prev, trunk: true }));
    } else if (screenNum === 2) {
      setVisibleParts(prev => ({ ...prev, branches: true }));
    } else if (screenNum === 3) {
      setVisibleParts(prev => ({ ...prev, crown: true }));
    }
    
    setCurrentScreen(screenNum + 1);
  };

  const generateSummary = () => {
    const s1 = summaryFragments[1][selections[1]];
    const s2 = summaryFragments[2][selections[2]];
    const s3 = summaryFragments[3][selections[3]];
    const s4 = summaryFragments[4][selections[4]];

    return `
      You’re <span style="color: var(--accent-purple); font-style: italic;">${s1}</span>. 
      You <span style="color: var(--accent-purple); font-style: italic;">${s2}</span>. 
      When challenged, you <span style="color: var(--accent-purple); font-style: italic;">${s3}</span>. 
      People trust you for your <span style="color: var(--accent-purple); font-style: italic;">${s4}</span>.<br><br>
      Specifically regarding <span style="color: var(--accent-purple); font-style: italic;">${userInput}</span>.<br><br>
      This is your tree. This is you.
    `;
  };

  return (
    <div style={{
      ...customStyles.root,
      backgroundColor: 'var(--bg-color)',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-body)',
      lineHeight: 1.5,
      minHeight: '100vh',
      overflowX: 'hidden',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      WebkitFontSmoothing: 'antialiased',
    }}>
      <TreeBackground visibleParts={visibleParts} />
      
      <div style={{
        width: '100%',
        maxWidth: '700px',
        minHeight: '100vh',
        padding: '48px 24px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}>
        {currentScreen === 1 && (
          <QuestionScreen
            screenNum={1}
            title={titles[1]}
            options={content[1]}
            onSelect={(index) => handleSelect(1, index)}
            selectedIndex={selections[1] ?? null}
            onNext={() => handleNext(1)}
          />
        )}

        {currentScreen === 2 && (
          <QuestionScreen
            screenNum={2}
            title={titles[2]}
            options={content[2]}
            onSelect={(index) => handleSelect(2, index)}
            selectedIndex={selections[2] ?? null}
            onNext={() => handleNext(2)}
          />
        )}

        {currentScreen === 3 && (
          <QuestionScreen
            screenNum={3}
            title={titles[3]}
            options={content[3]}
            onSelect={(index) => handleSelect(3, index)}
            selectedIndex={selections[3] ?? null}
            onNext={() => handleNext(3)}
          />
        )}

        {currentScreen === 4 && (
          <FinalQuestionScreen
            options={content[4]}
            onSelect={(index) => handleSelect(4, index)}
            selectedIndex={selections[4] ?? null}
            userInput={userInput}
            onInputChange={setUserInput}
            onNext={() => handleNext(4)}
          />
        )}

        {currentScreen === 5 && (
          <FinalScreen summary={generateSummary()} />
        )}
      </div>
    </div>
  );
};

export default App;