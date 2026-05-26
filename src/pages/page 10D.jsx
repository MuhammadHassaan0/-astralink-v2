import React, { useState, useEffect } from 'react';

const customStyles = {
  root: {
    '--c-white': '#FFFFFF',
    '--c-bg-light': '#F9FAFB',
    '--c-border-light': '#E5E7EB',
    '--c-border-accent': '#E8EBFF',
    '--c-text-light': '#9CA3AF',
    '--c-text-gray': '#6B7280',
    '--c-text-dark': '#1F2937',
    '--c-purple': '#6366F1',
    '--c-purple-dark': '#4F46E5',
    '--c-green': '#10B981',
    '--c-red': '#EF4444',
    '--c-border-header': '#F3F4F6',
    '--radius-sm': '4px',
    '--radius-md': '8px',
    '--radius-lg': '12px',
    '--space-xs': '6px',
    '--space-sm': '12px',
    '--space-md': '16px',
    '--space-lg': '24px',
    '--space-xl': '32px',
    '--space-xxl': '64px'
  }
};

const SettingsIcon = () => (
  <svg className="w-5 h-5 stroke-current stroke-2 fill-none" style={{ strokeLinecap: 'round', strokeLinejoin: 'round' }} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
);

const LinkIcon = () => (
  <svg className="w-8 h-8 stroke-current fill-none" style={{ strokeWidth: '1.5', strokeLinecap: 'round', strokeLinejoin: 'round', color: 'var(--c-purple)' }} viewBox="0 0 24 24">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
  </svg>
);

const DeleteIcon = () => (
  <svg className="w-4 h-4 stroke-current stroke-2 fill-none" style={{ strokeLinecap: 'round', strokeLinejoin: 'round' }} viewBox="0 0 24 24">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const Header = () => {
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      background: 'var(--c-white)',
      borderBottom: '1px solid var(--c-border-header)',
      padding: 'var(--space-sm) var(--space-xl)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 100,
      animation: 'fadeIn 0.6s ease-out'
    }}>
      <div style={{
        fontSize: '16px',
        fontWeight: 700,
        color: 'var(--c-purple)',
        letterSpacing: '-0.02em'
      }}>
        AstraLink
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: 'var(--c-bg-light)',
          border: '1px solid var(--c-border-light)',
          backgroundImage: "url('https://ui-avatars.com/api/?name=User&background=6366F1&color=fff&size=64')",
          backgroundSize: 'cover',
          transition: 'transform 0.3s ease',
          cursor: 'pointer'
        }} 
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}></div>
        <div style={{
          color: 'var(--c-text-light)',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--c-text-dark)';
          e.currentTarget.style.transform = 'rotate(45deg)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--c-text-light)';
          e.currentTarget.style.transform = 'rotate(0deg)';
        }}>
          <SettingsIcon />
        </div>
      </div>
    </header>
  );
};

const Hero = () => {
  return (
    <section style={{
      paddingTop: 'var(--space-xxl)',
      paddingBottom: '56px',
      textAlign: 'center',
      animation: 'fadeInUp 0.8s ease-out'
    }}>
      <h1 style={{
        fontSize: '32px',
        fontWeight: 700,
        color: 'var(--c-text-dark)',
        marginBottom: 'var(--space-sm)',
        letterSpacing: '-0.02em',
        animation: 'fadeInUp 0.8s ease-out 0.1s both'
      }}>
        Share your voice with the people you love
      </h1>
      <p style={{
        fontSize: '16px',
        color: 'var(--c-text-gray)',
        lineHeight: 1.6,
        animation: 'fadeInUp 0.8s ease-out 0.2s both'
      }}>
        They can ask you anything, forever. You’re always in control.
      </p>
    </section>
  );
};

const InviteLink = () => {
  const [copied, setCopied] = useState(false);
  const inviteLink = 'astralink.com/join/xk8f2m9';

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--c-border-accent)',
      background: 'var(--c-bg-light)',
      padding: 'var(--space-xl)',
      marginBottom: 'var(--space-lg)',
      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease',
      animation: 'scaleIn 0.8s ease-out 0.4s both'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 10px 30px -10px rgba(99, 102, 241, 0.15)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
    }}>
      <div style={{
        marginBottom: 'var(--space-sm)',
        animation: 'scaleIn 0.6s ease-out 0.5s both'
      }}>
        <LinkIcon />
      </div>
      <h3 style={{
        fontSize: '18px',
        fontWeight: 700,
        color: 'var(--c-text-dark)',
        marginBottom: 'var(--space-sm)'
      }}>
        Share an invite link
      </h3>
      <p style={{
        fontSize: '14px',
        color: 'var(--c-text-gray)',
        marginBottom: 'var(--space-lg)'
      }}>
        Share this link with family members. They'll be able to hear your voice immediately.
      </p>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'var(--c-white)',
        border: '1px solid var(--c-border-light)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-sm) var(--space-md)',
        gap: '12px'
      }}>
        <span style={{
          flexGrow: 1,
          fontFamily: 'monospace',
          fontSize: '13px',
          color: 'var(--c-text-gray)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {inviteLink}
        </span>
        <button
          onClick={handleCopy}
          style={{
            background: copied ? 'var(--c-purple-dark)' : 'var(--c-purple)',
            color: 'var(--c-white)',
            fontSize: '12px',
            fontWeight: 700,
            padding: '6px 16px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            whiteSpace: 'nowrap',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--c-purple-dark)';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 6px 12px -2px rgba(99, 102, 241, 0.3)';
          }}
          onMouseLeave={(e) => {
            if (!copied) {
              e.currentTarget.style.background = 'var(--c-purple)';
            }
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
};

const EmailInvite = () => {
  const [email, setEmail] = useState('');

  const handleSend = () => {
    if (email) {
      const subject = encodeURIComponent("You've been invited to hear my voice on AstraLink");
      const body = encodeURIComponent(`Hi,\n\nI've preserved my voice, stories and thinking on AstraLink — a digital twin that lets you talk to me, ask me anything, even long after I'm gone.\n\nJoin here: https://astralink.life/join\n\nThis means a lot to me.`);
      window.open(`mailto:${email}?subject=${subject}&body=${body}`);
      setEmail('');
      setEmail('');
    }
  };

  return (
    <div style={{
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--c-border-light)',
      background: 'var(--c-white)',
      padding: 'var(--space-lg)',
      marginBottom: 'var(--space-lg)',
      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease',
      animation: 'fadeInUp 0.8s ease-out 0.5s both'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 10px 30px -10px rgba(99, 102, 241, 0.15)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
    }}>
      <h3 style={{
        fontSize: '16px',
        fontWeight: 700,
        color: 'var(--c-text-dark)',
        marginBottom: 'var(--space-sm)'
      }}>
        Invite by email
      </h3>
      <p style={{
        fontSize: '13px',
        color: 'var(--c-text-gray)',
        marginBottom: 'var(--space-md)'
      }}>
        Send an invite directly to their email
      </p>
      <div style={{
        display: 'flex',
        gap: 'var(--space-sm)'
      }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email address"
          style={{
            flexGrow: 1,
            background: 'var(--c-white)',
            border: '1px solid var(--c-border-light)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-sm) var(--space-md)',
            fontSize: '14px',
            fontFamily: "'Inter', sans-serif",
            color: 'var(--c-text-dark)',
            outline: 'none',
            transition: 'all 0.3s ease'
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--c-purple)';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--c-border-light)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        />
        <button
          onClick={handleSend}
          style={{
            background: 'var(--c-white)',
            border: '1px solid var(--c-border-light)',
            color: 'var(--c-text-dark)',
            fontSize: '13px',
            padding: '10px 20px',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--c-bg-light)';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 8px -2px rgba(0, 0, 0, 0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--c-white)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

const Toggle = ({ checked, onChange, disabled }) => {
  return (
    <label style={{
      position: 'relative',
      display: 'inline-block',
      width: '44px',
      height: '24px'
    }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        style={{
          opacity: 0,
          width: 0,
          height: 0
        }}
      />
      <span style={{
        position: 'absolute',
        cursor: disabled ? 'not-allowed' : 'pointer',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: checked ? 'var(--c-purple)' : '#E5E7EB',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        borderRadius: '34px',
        opacity: disabled ? 0.5 : 1
      }}>
        <span style={{
          position: 'absolute',
          content: '""',
          height: '18px',
          width: '18px',
          left: '3px',
          bottom: '3px',
          backgroundColor: 'white',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          borderRadius: '50%',
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
          transform: checked ? 'translateX(20px)' : 'translateX(0)'
        }}></span>
      </span>
    </label>
  );
};

const AccessRow = ({ name, relation, status, statusColor, isActive, isPending, index }) => {
  const [toggleChecked, setToggleChecked] = useState(isActive);

  const handleDelete = () => {
    if (confirm(`Are you sure you want to ${isPending ? 'revoke the invite for' : 'remove access for'} ${name}?`)) {
      alert(`Access ${isPending ? 'revoked' : 'removed'} for ${name}`);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 0',
      borderBottom: '1px solid var(--c-border-header)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      opacity: 0,
      animation: 'slideInLeft 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      animationDelay: `${0.7 + index * 0.1}s`,
      borderRadius: '8px'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = 'linear-gradient(to right, transparent, #FAFBFC, transparent)';
      e.currentTarget.style.paddingLeft = '8px';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = 'transparent';
      e.currentTarget.style.paddingLeft = '0';
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2px'
      }}>
        <div style={{
          fontSize: '16px',
          fontWeight: 700,
          color: 'var(--c-text-dark)'
        }}>
          {name}
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px'
        }}>
          <span style={{ color: 'var(--c-text-light)' }}>{relation}</span>
          <span>•</span>
          <span style={{ color: statusColor }}>{status}</span>
        </div>
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px'
      }}>
        <Toggle
          checked={toggleChecked}
          onChange={() => setToggleChecked(!toggleChecked)}
          disabled={isPending}
        />
        <button
          onClick={handleDelete}
          title={isPending ? 'Revoke invite' : 'Remove access'}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--c-text-light)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--c-red)';
            e.currentTarget.style.transform = 'scale(1.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--c-text-light)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <DeleteIcon />
        </button>
      </div>
    </div>
  );
};

const AccessSection = () => {
  const people = [
    {
      name: 'Mom',
      relation: 'Mother',
      status: 'Joined 1 day ago',
      statusColor: 'var(--c-green)',
      isActive: true,
      isPending: false
    },
    {
      name: 'Dad',
      relation: 'Father',
      status: 'Joined 1 day ago',
      statusColor: 'var(--c-green)',
      isActive: true,
      isPending: false
    },
    {
      name: 'Sister',
      relation: 'Sibling',
      status: 'Invited 3 days ago (pending)',
      statusColor: 'var(--c-text-gray)',
      isActive: false,
      isPending: true
    }
  ];

  return (
    <section style={{
      marginBottom: 'var(--space-xxl)',
      animation: 'fadeInUp 0.8s ease-out 0.6s both'
    }}>
      <h2 style={{
        fontSize: '20px',
        fontWeight: 700,
        color: 'var(--c-text-dark)',
        marginBottom: 'var(--space-lg)',
        letterSpacing: '-0.01em'
      }}>
        People who can hear you
      </h2>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%'
      }}>
        {people.map((person, index) => (
          <AccessRow key={index} {...person} index={index} />
        ))}
      </div>
      <p style={{
        fontSize: '12px',
        color: 'var(--c-text-light)',
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 'var(--space-lg)'
      }}>
        You can remove anyone at any time. Your voice is always under your control.
      </p>
    </section>
  );
};

const App = () => {
  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        background-color: #FFFFFF;
        color: #6B7280;
        line-height: 1.5;
        min-height: 100vh;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

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

      @keyframes scaleIn {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      @media (max-width: 640px) {
        header { padding: 12px 16px !important; }
      }
    `;
    document.head.appendChild(styleSheet);

    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  return (
    <div style={customStyles.root}>
      <Header />
      <main style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '0 24px'
      }}>
        <Hero />
        
        <section style={{ marginBottom: 'var(--space-xxl)' }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 700,
            color: 'var(--c-text-dark)',
            marginBottom: 'var(--space-lg)',
            letterSpacing: '-0.01em',
            animation: 'fadeInUp 0.8s ease-out 0.3s both'
          }}>
            Invite your family
          </h2>
          <InviteLink />
          <EmailInvite />
        </section>

        <AccessSection />

        <section style={{
          textAlign: 'center',
          marginTop: 'var(--space-xxl)',
          marginBottom: 'var(--space-xxl)',
          fontSize: '16px',
          color: 'var(--c-text-gray)',
          lineHeight: 1.8,
          fontStyle: 'italic',
          maxWidth: '480px',
          marginLeft: 'auto',
          marginRight: 'auto',
          animation: 'fadeIn 1s ease-out 1s both'
        }}>
          This is YOUR family. YOUR voice. YOUR control.<br />
          You decide who knows you.
        </section>
      </main>
    </div>
  );
};

export default function Page10D() {
  return (
    <>
      <App />
      <div style={{ display: "flex", justifyContent: "center", padding: "40px 0", background: "#fff" }}>
        <button
          onClick={() => window.location.href = "/settings"}
          style={{ background: "#6366F1", color: "#fff", border: "none", borderRadius: "999px", padding: "18px 48px", fontSize: "16px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif", boxShadow: "0 4px 24px rgba(99,102,241,0.3)" }}
        >
          Go to Settings →
        </button>
      </div>
    </>
  );
}