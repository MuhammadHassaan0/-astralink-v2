import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';

const customStyles = {
  body: {
    background: 'linear-gradient(135deg, #fdfcfb 0%, #f7f5f2 100%)',
    fontFamily: '"Playfair Display", Georgia, serif',
    color: '#000000',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: '1.4',
    padding: '40px 20px'
  }
};

const ProfileQuestionPage = () => {
  const [selectedOption, setSelectedOption] = useState('');
  const [otherText, setOtherText] = useState('');
  const [isFormActive, setIsFormActive] = useState(false);

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        -webkit-font-smoothing: antialiased;
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

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      .card {
        background: transparent;
        width: 100%;
        max-width: 680px;
        border: none;
        padding: 0;
        position: relative;
        display: flex;
        flex-direction: column;
        animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }

      .card-header {
        padding: 0 0 44px 0;
        text-align: center;
        animation: fadeIn 1s ease-out 0.3s both;
      }

      h1 {
        font-family: "Playfair Display", Georgia, serif;
        font-weight: 400;
        font-size: 36px;
        letter-spacing: -0.8px;
        margin-bottom: 20px;
        color: #000000;
        animation: fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both;
        line-height: 1.2;
      }

      h2 {
        font-family: "Playfair Display", Georgia, serif;
        font-weight: 400;
        font-size: 18px;
        color: #555555;
        text-transform: none;
        letter-spacing: 0;
        animation: fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) 0.6s both;
      }

      .options-container {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 32px;
      }

      .option-label {
        display: flex;
        align-items: center;
        padding: 14px 16px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        position: relative;
        background: transparent;
        border: none;
        border-radius: 12px;
        animation: slideIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
      }

      .option-label:nth-child(1) { animation-delay: 0.7s; }
      .option-label:nth-child(2) { animation-delay: 0.8s; }
      .option-label:nth-child(3) { animation-delay: 0.9s; }
      .option-label:nth-child(4) { animation-delay: 1s; }

      .option-label:hover {
        background-color: rgba(99, 102, 241, 0.05);
      }

      .option-label:active {
        transform: scale(0.98);
      }

      .radio-circle {
        height: 24px;
        width: 24px;
        border: 2px solid #c0c0c0;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 16px;
        flex-shrink: 0;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .radio-circle.checked {
        border-color: #6366F1;
        background-color: #6366F1;
        transform: scale(1.1);
      }

      .radio-circle::after {
        content: "";
        width: 8px;
        height: 8px;
        background: white;
        border-radius: 50%;
        display: none;
      }

      .radio-circle.checked::after {
        display: block;
      }

      .option-text {
        font-family: "Playfair Display", Georgia, serif;
        font-size: 18px;
        color: #000000;
        letter-spacing: -0.2px;
        font-weight: 400;
      }

      .option-text.checked {
        color: #000000;
        font-weight: 700;
      }

      .helper-section {
        padding: 0 0 28px 0;
        text-align: center;
        animation: fadeIn 0.8s ease-out 1.1s both;
      }

      .helper-text {
        font-family: "Playfair Display", Georgia, serif;
        font-size: 14px;
        color: #3a3a3a;
        line-height: 1.5;
        max-width: 480px;
        margin: 0 auto;
        font-weight: 400;
      }

      .action-container {
        padding: 0;
        text-align: center;
        animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 1.2s both;
      }

      .btn-primary {
        background-color: #6366F1;
        color: white;
        border: none;
        padding: 0;
        height: 48px;
        width: 280px;
        font-family: "Playfair Display", Georgia, serif;
        font-weight: 600;
        font-size: 16px;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        cursor: pointer;
        transition: all 200ms ease;
        border-radius: 32px;
        opacity: 1;
        pointer-events: none;
        position: relative;
        overflow: hidden;
        box-shadow: 0 4px 16px rgba(99, 102, 241, 0.2);
        margin: 0 auto;
      }

      .btn-primary::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
        transition: left 0.5s ease;
      }

      .btn-primary.active {
        opacity: 1;
        pointer-events: auto;
      }

      .btn-primary.active:hover {
        background-color: #4338CA;
        box-shadow: 0 8px 24px rgba(99, 102, 241, 0.35);
      }

      .btn-primary.active:hover::before {
        left: 150%;
      }

      .btn-primary:active {
        transform: translateY(0);
      }

      .other-input-container {
        display: none;
        margin-top: 8px;
        margin-bottom: 16px;
        animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
        opacity: 0;
      }

      .other-input-container.active {
        display: block;
        opacity: 1;
      }

      .other-input {
        width: 100%;
        padding: 20px 24px;
        font-family: "Playfair Display", Georgia, serif;
        font-size: 18px;
        border: 2px solid rgba(0, 0, 0, 0.08);
        border-radius: 16px;
        outline: none;
        transition: all 0.3s ease;
        background: white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      }

      .other-input:focus {
        border-color: #6366F1;
        box-shadow: 0 4px 16px rgba(99, 102, 241, 0.15);
      }

      @media (max-width: 768px) {
        .card {
          height: 100vh;
          max-width: none;
          border: none;
        }
        
        .card-header {
          padding: 48px 24px;
        }

        .option-label {
          padding: 24px;
        }
        
        .helper-section, .action-container {
          padding: 24px;
        }
        
        h1 { font-size: 28px; }
      }
    `;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const handleOptionChange = (value) => {
    setSelectedOption(value);
    setIsFormActive(true);
    if (value !== 'other') {
      setOtherText('');
    }
  };

  const handleSubmit = () => {
    console.log('Selected option:', selectedOption);
    if (selectedOption === 'other') {
      console.log('Other text:', otherText);
    }
    console.log('Proceeding...');
  };

  const options = [
    { value: 'family', label: 'Preserving wisdom for my family' },
    { value: 'business', label: 'Building a lasting business legacy' },
    { value: 'people', label: 'Helping people long after I\'m gone' },
    { value: 'other', label: 'Something else' }
  ];

  return (
    <div style={customStyles.body}>
      <main className="card">
        <div className="card-header">
          <h1>So we understand you better...</h1>
          <h2>Which matters most to you?</h2>
        </div>

        <form id="preference-form">
          <div className="options-container">
            {options.map((option) => (
              <label 
                key={option.value}
                className="option-label"
                onClick={() => window.location.href = '/questions'}
              >
                <input
                  type="radio"
                  name="motivation"
                  value={option.value}
                  checked={selectedOption === option.value}
                  onChange={() => handleOptionChange(option.value)}
                  style={{ position: 'absolute', opacity: 0, cursor: 'pointer', height: 0, width: 0 }}
                />
                <div className={`radio-circle ${selectedOption === option.value ? 'checked' : ''}`}></div>
                <span className={`option-text ${selectedOption === option.value ? 'checked' : ''}`}>
                  {option.label}
                </span>
              </label>
            ))}
          </div>

          <div className={`other-input-container ${selectedOption === 'other' ? 'active' : ''}`}>
            <input
              type="text"
              className="other-input"
              placeholder="Tell us what matters to you..."
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
            />
          </div>

          <div className="helper-section">
            <p className="helper-text">
              This helps us customize your experience (and understand what you’re trying to preserve)
            </p>
          </div>

          <div className="action-container">
            <button
              type="button"
              className={`btn-primary ${isFormActive ? 'active' : ''}`}
              onClick={() => window.location.href = '/questions'}
            >
              Let's Go
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<ProfileQuestionPage />} />
      </Routes>
    </>
  );
};

export default App;