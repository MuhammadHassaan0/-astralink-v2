import React, { useState } from 'react';

const customStyles = {
  root: {
    '--bg-white': '#FFFFFF',
    '--bg-light': '#F9FAFB',
    '--border-light': '#E5E7EB',
    '--text-light-gray': '#9CA3AF',
    '--text-gray': '#6B7280',
    '--text-dark': '#1F2937',
    '--primary': '#6366F1',
    '--primary-dark': '#4F46E5',
    '--warning': '#F59E0B',
    '--danger': '#EF4444',
    '--danger-dark': '#DC2626',
    '--radius-pill': '999px',
    '--radius-card': '12px',
    '--font-sans': "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    '--line-weight': '1px',
    '--section-gap': '48px',
    '--item-gap': '32px'
  }
};

const ToggleSwitch = ({ isActive, onClick }) => {
  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        width: '40px',
        height: '24px',
        background: isActive ? 'var(--primary)' : 'var(--border-light)',
        borderRadius: 'var(--radius-pill)',
        cursor: 'pointer',
        transition: '0.3s'
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '2px',
          left: '2px',
          width: '20px',
          height: '20px',
          background: 'white',
          borderRadius: '50%',
          transition: '0.3s',
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
          transform: isActive ? 'translateX(16px)' : 'translateX(0)'
        }}
      />
    </div>
  );
};

const Button = ({ children, variant = 'default', onClick, className = '' }) => {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '500',
    borderRadius: '6px',
    border: '1px solid var(--border-light)',
    background: 'white',
    color: 'var(--text-dark)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    textDecoration: 'none',
    whiteSpace: 'nowrap'
  };

  const variants = {
    primary: {
      background: 'var(--primary)',
      color: 'white',
      border: 'none'
    },
    danger: {
      background: 'var(--danger)',
      color: 'white',
      border: 'none'
    }
  };

  const style = variant !== 'default' ? { ...baseStyle, ...variants[variant] } : baseStyle;

  return (
    <button style={style} onClick={onClick} className={className}>
      {children}
    </button>
  );
};

const NavItem = ({ children, active, onClick, isLogout }) => {
  const baseStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 16px',
    fontSize: '13px',
    fontWeight: '500',
    color: active ? 'white' : isLogout ? 'var(--danger)' : 'var(--text-gray)',
    borderRadius: 'var(--radius-pill)',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    background: active ? 'var(--primary)' : 'transparent',
    boxShadow: active ? '0 4px 12px rgba(99, 102, 241, 0.15)' : 'none',
    marginTop: isLogout ? 'auto' : '0'
  };

  return (
    <a style={baseStyle} onClick={onClick}>
      {children}
    </a>
  );
};

const SettingItem = ({ label, value, badge, actionButton, children }) => {
  return (
    <div style={{ marginBottom: '32px' }}>
      {children || (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px' }}>
          <div style={{ flex: 1 }}>
            <span style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: '700',
              color: 'var(--text-dark)',
              marginBottom: '8px',
              display: 'block'
            }}>
              {label}
            </span>
            {badge && (
              <div style={{
                display: 'inline-block',
                fontSize: '12px',
                color: 'var(--warning)',
                marginBottom: '12px',
                fontWeight: '500'
              }}>
                {badge}
              </div>
            )}
            {value && (
              <div style={{
                fontSize: '14px',
                color: 'var(--text-gray)',
                lineHeight: '1.5'
              }}>
                {value}
              </div>
            )}
          </div>
          {actionButton}
        </div>
      )}
    </div>
  );
};

const SectionTitle = ({ number, children, isDanger }) => {
  return (
    <h2 style={{
      fontSize: '20px',
      color: isDanger ? 'var(--danger)' : 'var(--text-dark)',
      marginBottom: '24px',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontWeight: '700'
    }}>
      <span style={{
        fontSize: '12px',
        color: isDanger ? 'var(--danger)' : 'var(--text-gray)',
        border: `1px solid ${isDanger ? 'var(--danger)' : 'var(--border-light)'}`,
        borderRadius: '50%',
        width: '24px',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '400'
      }}>
        {number}
      </span>
      {children}
    </h2>
  );
};

const Divider = () => {
  return (
    <div style={{
      height: '1px',
      backgroundColor: 'var(--border-light)',
      margin: '32px 0',
      width: '100%'
    }} />
  );
};

const App = () => {
  const [activeSection, setActiveSection] = useState('account');
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  const handleNavClick = (section) => {
    setActiveSection(section);
    const element = document.getElementById(section);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLogout = () => {
    alert('Logging out...');
  };

  const handleChangeEmail = () => {
    alert('Change email functionality would open here');
  };

  const handleChangePassword = () => {
    alert('Change password functionality would open here');
  };

  const handleEnable2FA = () => {
    alert('Two-factor authentication setup would open here');
  };

  const handleExportData = () => {
    alert('Data export initiated. You will receive a download link via email.');
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('Are you sure you want to delete your account? This cannot be undone.');
    if (confirmed) {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:3001/delete-account', {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      localStorage.clear();
      window.location.href = '/';
    }
  };

  const handleSignOut = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    <div style={customStyles.root}>
      <style>
        {`
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: var(--font-sans);
            background-color: var(--bg-white);
            color: var(--text-dark);
            -webkit-font-smoothing: antialiased;
          }
          @media (max-width: 768px) {
            .app-container {
              flex-direction: column !important;
              height: auto !important;
              overflow: visible !important;
            }
            .sidebar {
              width: 100% !important;
              flex-direction: row !important;
              overflow-x: auto !important;
              border-right: none !important;
              border-bottom: 1px solid var(--border-light) !important;
              padding: 16px !important;
            }
            .main-content {
              padding: 24px !important;
            }
            .setting-row {
              flex-direction: column !important;
              gap: 16px !important;
            }
            .btn {
              width: 100% !important;
            }
          }
        `}
      </style>
      
      {/* Top Header */}
      <header style={{
        height: '64px',
        borderBottom: '1px solid var(--border-light)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 32px',
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(8px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        width: '100%'
      }}>
        <div style={{
          fontWeight: '700',
          fontSize: '16px',
          color: 'var(--text-dark)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--primary)' }}>
            <circle cx="12" cy="12" r="10" />
          </svg>
          AstraLink
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            background: 'var(--bg-light)',
            borderRadius: '50%',
            border: '1px solid var(--border-light)'
          }} />
        </div>
      </header>

      {/* App Container */}
      <div className="app-container" style={{
        display: 'flex',
        flex: 1,
        height: '100vh',
        overflow: 'hidden'
      }}>
        {/* Sidebar */}
        <nav className="sidebar" style={{
          width: '240px',
          borderRight: '1px solid var(--border-light)',
          padding: '32px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          background: 'var(--bg-white)',
          flexShrink: 0
        }}>
          <NavItem active={activeSection === 'account'} onClick={() => handleNavClick('account')}>
            Account
          </NavItem>
          <NavItem active={activeSection === 'privacy'} onClick={() => handleNavClick('privacy')}>
            Privacy & Data
          </NavItem>
          <NavItem active={activeSection === 'support'} onClick={() => handleNavClick('support')}>
            Support
          </NavItem>
          <NavItem isLogout onClick={handleLogout}>
            Log Out
          </NavItem>
        </nav>

        {/* Main Content */}
        <main className="main-content" style={{
          flex: 1,
          overflowY: 'auto',
          padding: '48px',
          scrollBehavior: 'smooth'
        }}>
          <div style={{
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            {/* Account Settings */}
            <section id="account" style={{ marginBottom: 'var(--section-gap)', position: 'relative' }}>
              <SectionTitle number="I">Account Settings</SectionTitle>

              <SettingItem
                label="Email Address"
                value="user@example.com"
                actionButton={<Button onClick={handleChangeEmail}>Change Email</Button>}
              />

              <SettingItem
                label="Password"
                value="Last changed 2 months ago"
                actionButton={<Button onClick={handleChangePassword}>Change Password</Button>}
              />

              <SettingItem
                label="Two-Factor Authentication"
                badge="Not enabled"
                actionButton={<Button onClick={handleEnable2FA}>Enable</Button>}
              />
            </section>

            <Divider />

            {/* Privacy & Data */}
            <section id="privacy" style={{ marginBottom: 'var(--section-gap)', position: 'relative' }}>
              <SectionTitle number="II">Privacy & Data</SectionTitle>

              <SettingItem
                label="Download Your Data"
                value="Export all your recordings, documents, and metadata as a ZIP file"
                actionButton={<Button onClick={handleExportData}>Export Data</Button>}
              />

              <SettingItem
                label="Analytics & Usage"
                value="Help us improve by sharing anonymous usage data"
                actionButton={<ToggleSwitch isActive={analyticsEnabled} onClick={() => setAnalyticsEnabled(!analyticsEnabled)} />}
              />

              <SettingItem label="Legal">
                <div>
                  <span style={{
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: '700',
                    color: 'var(--text-dark)',
                    marginBottom: '8px',
                    display: 'block'
                  }}>
                    Legal
                  </span>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                    <a href="#" style={{
                      color: 'var(--primary)',
                      textDecoration: 'none',
                      fontSize: '14px',
                      borderBottom: '1px solid transparent',
                      transition: 'border-color 0.2s'
                    }}>
                      Privacy Policy
                    </a>
                    <a href="#" style={{
                      color: 'var(--primary)',
                      textDecoration: 'none',
                      fontSize: '14px',
                      borderBottom: '1px solid transparent',
                      transition: 'border-color 0.2s'
                    }}>
                      Terms of Service
                    </a>
                  </div>
                </div>
              </SettingItem>
            </section>

            <Divider />

            {/* Support */}
            <section id="support" style={{ marginBottom: 'var(--section-gap)', position: 'relative' }}>
              <SectionTitle number="III">Support</SectionTitle>

              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <a href="#" style={{
                    color: 'var(--primary)',
                    textDecoration: 'none',
                    fontSize: '14px',
                    borderBottom: '1px solid transparent',
                    transition: 'border-color 0.2s'
                  }}>
                    Help Center
                  </a>
                  <a href="#" style={{
                    color: 'var(--primary)',
                    textDecoration: 'none',
                    fontSize: '14px',
                    borderBottom: '1px solid transparent',
                    transition: 'border-color 0.2s'
                  }}>
                    Contact Support
                  </a>
                  <a href="#" style={{
                    color: 'var(--primary)',
                    textDecoration: 'none',
                    fontSize: '14px',
                    borderBottom: '1px solid transparent',
                    transition: 'border-color 0.2s'
                  }}>
                    Report a Bug
                  </a>
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-light-gray)', fontSize: '14px', lineHeight: '1.5' }}>
                  App Version: 1.0<br />
                  Last Updated: Feb 18, 2026
                </div>
              </div>
            </section>

            <Divider />

            {/* Danger Zone */}
            <section id="danger" style={{ marginBottom: 'var(--section-gap)', position: 'relative' }}>
              <SectionTitle number="!" isDanger>Danger Zone</SectionTitle>

              <SettingItem>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px' }}>
                  <div style={{ flex: 1 }}>
                    <span style={{
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontWeight: '700',
                      color: 'var(--text-dark)',
                      marginBottom: '8px',
                      display: 'block'
                    }}>
                      Delete Account
                    </span>
                    <div style={{
                      fontSize: '14px',
                      color: 'var(--danger)',
                      lineHeight: '1.5'
                    }}>
                      Permanently delete your account and all associated data. This cannot be undone.
                    </div>
                  </div>
                  <Button variant="danger" onClick={handleDeleteAccount}>Delete Account</Button>
                </div>
              </SettingItem>

              <SettingItem
                label="Sign Out"
                value="Sign out of this device"
                actionButton={<Button onClick={handleSignOut}>Sign Out</Button>}
              />
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;