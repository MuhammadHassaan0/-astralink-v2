import React, { useState } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';

const customStyles = {
  root: {
    '--c-primary': '#6366F1',
    '--c-primary-hover': '#4F46E5',
    '--c-bg-page-start': '#FFFFFF',
    '--c-bg-page-end': '#FAFBFC',
    '--c-bg-card': '#FFFFFF',
    '--c-text-main': '#1F2937',
    '--c-text-secondary': '#6B7280',
    '--c-text-tertiary': '#9CA3AF',
    '--c-border': '#E5E7EB',
    '--c-border-hover': '#D1D5DB',
    '--c-input-bg': '#FFFFFF',
    '--r-card': '12px',
    '--r-input': '8px',
    '--r-button': '8px',
    '--shadow-card': '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
    '--shadow-focus': '0 0 0 3px rgba(99, 102, 241, 0.15)'
  },
  body: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    background: 'linear-gradient(180deg, var(--c-bg-page-start) 0%, var(--c-bg-page-end) 100%)',
    color: 'var(--c-text-main)',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '24px',
    boxSizing: 'border-box',
    margin: 0,
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale'
  },
  authContainer: {
    width: '100%',
    maxWidth: '480px',
    background: 'var(--c-bg-card)',
    border: '1px solid var(--c-border)',
    borderRadius: 'var(--r-card)',
    padding: '56px',
    boxShadow: 'var(--shadow-card)',
    position: 'relative',
    overflow: 'hidden',
    animation: 'fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
    animation: 'fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s backwards'
  },
  logo: {
    fontWeight: 700,
    fontSize: '20px',
    color: 'var(--c-primary)',
    marginBottom: '32px',
    display: 'inline-block',
    letterSpacing: '-0.02em',
    animation: 'fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.3s backwards'
  },
  h1: {
    fontFamily: "'Geist', 'Inter', sans-serif",
    fontWeight: 700,
    fontSize: '32px',
    lineHeight: 1.2,
    color: 'var(--c-text-main)',
    marginBottom: '12px',
    letterSpacing: '-0.03em',
    animation: 'fadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.4s backwards'
  },
  subhead: {
    fontSize: '16px',
    color: 'var(--c-text-secondary)',
    lineHeight: 1.5,
    animation: 'fadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.5s backwards'
  },
  formGroup: {
    marginBottom: '24px',
    animation: 'fadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.6s backwards'
  },
  formGroupTight: {
    marginBottom: '12px',
    animation: 'fadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.6s backwards'
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--c-text-main)',
    marginBottom: '8px'
  },
  input: {
    width: '100%',
    height: '44px',
    padding: '10px 16px',
    fontSize: '16px',
    color: 'var(--c-text-main)',
    background: 'var(--c-input-bg)',
    border: '1px solid var(--c-border)',
    borderRadius: 'var(--r-input)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    outline: 'none',
    boxSizing: 'border-box'
  },
  inputHover: {
    borderColor: 'var(--c-border-hover)'
  },
  inputFocus: {
    borderColor: 'var(--c-primary)',
    boxShadow: 'var(--shadow-focus)'
  },
  helperText: {
    display: 'block',
    fontSize: '12px',
    color: 'var(--c-text-tertiary)',
    marginTop: '8px',
    marginBottom: '24px'
  },
  checkboxGroup: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '32px',
    cursor: 'pointer',
    animation: 'fadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.8s backwards'
  },
  checkbox: {
    appearance: 'none',
    WebkitAppearance: 'none',
    width: '18px',
    height: '18px',
    minWidth: '18px',
    border: '1px solid var(--c-border)',
    borderRadius: '4px',
    marginTop: '2px',
    background: 'var(--c-input-bg)',
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  },
  checkboxChecked: {
    backgroundColor: 'var(--c-primary)',
    borderColor: 'var(--c-primary)'
  },
  checkboxLabel: {
    fontSize: '14px',
    color: 'var(--c-text-main)',
    lineHeight: 1.4,
    fontWeight: 400,
    textTransform: 'none',
    letterSpacing: 'normal'
  },
  btnPrimary: {
    width: '100%',
    height: '48px',
    backgroundColor: 'var(--c-primary)',
    color: 'white',
    fontSize: '16px',
    fontWeight: 600,
    border: 'none',
    borderRadius: 'var(--r-button)',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  btnPrimaryHover: {
    backgroundColor: 'var(--c-primary-hover)',
    transform: 'translateY(-2px)',
    boxShadow: '0 12px 24px -6px rgba(99, 102, 241, 0.45), 0 0 24px rgba(99, 102, 241, 0.35), 0 0 40px rgba(99, 102, 241, 0.2)'
  },
  btnPrimaryActive: {
    transform: 'translateY(0)'
  },
  authFooter: {
    textAlign: 'center',
    fontSize: '14px',
    color: 'var(--c-text-main)',
    animation: 'fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1) 1s backwards'
  },
  authLink: {
    color: 'var(--c-primary)',
    textDecoration: 'none',
    fontWeight: 500,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  }
};

const CreateAccountPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    termsAccepted: false
  });
  const [inputFocus, setInputFocus] = useState({
    email: false,
    password: false
  });
  const [inputHover, setInputHover] = useState({
    email: false,
    password: false
  });
  const [buttonHover, setButtonHover] = useState(false);
  const [buttonActive, setButtonActive] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    window.location.href = '/share';
  };

  const getInputStyle = (field) => {
    return {
      ...customStyles.input,
      ...(inputHover[field] && !inputFocus[field] ? customStyles.inputHover : {}),
      ...(inputFocus[field] ? customStyles.inputFocus : {})
    };
  };

  const getButtonStyle = () => {
    return {
      ...customStyles.btnPrimary,
      ...(buttonHover && !buttonActive ? customStyles.btnPrimaryHover : {}),
      ...(buttonActive ? customStyles.btnPrimaryActive : {})
    };
  };

  return (
    <div style={customStyles.body}>
      <main style={customStyles.authContainer}>
        <header style={customStyles.header}>
          <div style={customStyles.logo}>AstraLink</div>
          <h1 style={customStyles.h1}>Create your account</h1>
          <p style={customStyles.subhead}>Start preserving your wisdom today.</p>
        </header>

        <form onSubmit={handleSubmit}>
          <div style={customStyles.formGroup}>
            <label htmlFor="email" style={customStyles.label}>Email address</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
              value={formData.email}
              onChange={handleInputChange}
              onFocus={() => setInputFocus(prev => ({ ...prev, email: true }))}
              onBlur={() => setInputFocus(prev => ({ ...prev, email: false }))}
              onMouseEnter={() => setInputHover(prev => ({ ...prev, email: true }))}
              onMouseLeave={() => setInputHover(prev => ({ ...prev, email: false }))}
              style={getInputStyle('email')}
            />
          </div>

          <div style={customStyles.formGroupTight}>
            <label htmlFor="password" style={customStyles.label}>Password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Create a strong password"
              required
              autoComplete="new-password"
              value={formData.password}
              onChange={handleInputChange}
              onFocus={() => setInputFocus(prev => ({ ...prev, password: true }))}
              onBlur={() => setInputFocus(prev => ({ ...prev, password: false }))}
              onMouseEnter={() => setInputHover(prev => ({ ...prev, password: true }))}
              onMouseLeave={() => setInputHover(prev => ({ ...prev, password: false }))}
              style={getInputStyle('password')}
            />
          </div>

          <div style={customStyles.helperText}>
            At least 8 characters with uppercase, number, and symbol
          </div>

          <label style={customStyles.checkboxGroup}>
            <input
              type="checkbox"
              name="termsAccepted"
              required
              checked={formData.termsAccepted}
              onChange={handleInputChange}
              style={{
                ...customStyles.checkbox,
                ...(formData.termsAccepted ? customStyles.checkboxChecked : {})
              }}
            />
            {formData.termsAccepted && (
              <span style={{
                position: 'absolute',
                left: '5px',
                top: '2px',
                width: '4px',
                height: '8px',
                border: 'solid white',
                borderWidth: '0 2px 2px 0',
                transform: 'rotate(45deg)',
                pointerEvents: 'none'
              }}></span>
            )}
            <span style={customStyles.checkboxLabel}>
              I agree to the Terms of Service and Privacy Policy
            </span>
          </label>

          <button
            type="submit"
            style={getButtonStyle()}
            onMouseEnter={() => setButtonHover(true)}
            onMouseLeave={() => setButtonHover(false)}
            onMouseDown={() => setButtonActive(true)}
            onMouseUp={() => setButtonActive(false)}
          >
            Create Account
          </button>
        </form>

        <div style={customStyles.authFooter}>
          Already have an account?{' '}
          <Link to="/signin" style={customStyles.authLink}>
            Sign in
          </Link>
        </div>
      </main>
    </div>
  );
};

const SignInPage = () => {
  const navigate = useNavigate();

  return (
    <div style={customStyles.body}>
      <main style={customStyles.authContainer}>
        <header style={customStyles.header}>
          <div style={customStyles.logo}>AstraLink</div>
          <h1 style={customStyles.h1}>Welcome back</h1>
          <p style={customStyles.subhead}>Sign in to continue preserving your wisdom.</p>
        </header>

        <div style={customStyles.authFooter}>
          Don't have an account?{' '}
          <Link to="/" style={customStyles.authLink}>
            Create account
          </Link>
        </div>
      </main>
    </div>
  );
};

const App = () => {
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
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

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      @media (max-width: 768px) {
        .auth-container {
          padding: 40px !important;
          max-width: 100% !important;
        }
      }

      @media (max-width: 480px) {
        body {
          padding: 16px !important;
          background: var(--c-bg-card) !important;
        }
        
        .auth-container {
          padding: 24px 16px !important;
          box-shadow: none !important;
          border: none !important;
        }

        h1 {
          font-size: 28px !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <>
      <div style={customStyles.root}>
        <Routes>
          <Route path="/" element={<CreateAccountPage />} />
          <Route path="/signin" element={<SignInPage />} />
        </Routes>
      </div>
    </>
  );
};

export default App;