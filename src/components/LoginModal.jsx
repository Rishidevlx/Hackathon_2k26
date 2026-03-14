import React, { useState, useEffect } from 'react';
import './LoginModal.css';
import BackgroundEffect from './BackgroundEffect';

const LoginModal = ({ onLogin, onBack, category }) => {
    const [rollNo, setRollNo] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [isValidating, setIsValidating] = useState(false);

    // Force Uppercase for inputs
    const handleNameChange = (e) => setName(e.target.value.toUpperCase());
    const handleRollChange = (e) => setRollNo(e.target.value.toUpperCase());

    const validateForm = () => {
        if (!name.trim()) return "NAME_REQUIRED";
        if (!rollNo.trim()) return "ROLL_NO_REQUIRED";
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        const validationError = validateForm();
        if (validationError) {
            setError(`VALIDATION_ERROR: ${validationError}`);
            return;
        }

        setIsValidating(true);
        
        setTimeout(() => {
            const normalizedRollNo = rollNo.trim();
            const sessionData = {
                lotNo: normalizedRollNo,
                rollNo: normalizedRollNo,
                name: name.trim(),
                category: category,
                loginTime: Date.now()
            };
            localStorage.setItem('qmaze_user_session', JSON.stringify(sessionData));
            onLogin(normalizedRollNo, name.trim(), category);
            setIsValidating(false);
        }, 800);
    };

    return (
        <div className="login-page-container">
            <BackgroundEffect />
            <div className="vignette-overlay"></div>
            <div className="scanline-overlay"></div>

            {/* Corner Decorations */}
            <div className="corner-dec corner-tl"></div>
            <div className="corner-dec corner-tr"></div>
            <div className="corner-dec corner-bl"></div>
            <div className="corner-dec corner-br"></div>

            <div className="login-content-wrapper">
                <div className="login-header-section">
                    <div className="path-display">SECTOR_ID // {category}_PROGRAM // AUTH_LOCKED</div>
                    <h2 className="login-headline">PARTICIPANT_IDENTIFICATION</h2>
                    <div className="headline-underline"></div>
                </div>

                <div className="login-card-cyber">
                    <div className="card-glitch-bar"></div>
                    
                    <form onSubmit={handleSubmit} className="cyber-form">
                        <div className="input-group">
                            <label className="label-technical">
                                <span className="label-prefix">01</span> OPERATOR_NAME
                            </label>
                            <div className="cyber-input-wrapper">
                                <input
                                    type="text"
                                    value={name}
                                    onChange={handleNameChange}
                                    placeholder="TYPE_FULL_NAME..."
                                    autoComplete="off"
                                    disabled={isValidating}
                                />
                                <div className="input-glow"></div>
                            </div>
                        </div>

                        <div className="input-group">
                            <label className="label-technical">
                                <span className="label-prefix">02</span> ACCESS_CREDENTIAL (ROLL_NO)
                            </label>
                            <div className="cyber-input-wrapper">
                                <input
                                    type="text"
                                    value={rollNo}
                                    onChange={handleRollChange}
                                    placeholder="ID_AUTH_CODE..."
                                    autoComplete="off"
                                    disabled={isValidating}
                                />
                                <div className="input-glow"></div>
                            </div>
                        </div>

                        {error && (
                            <div className="login-error">
                                <div className="error-pulse"></div>
                                <span className="error-text">&gt; SYSTEM_ALERT: {error}</span>
                            </div>
                        )}

                        <div className="login-actions">
                            <button 
                                type="button" 
                                className="btn-abort" 
                                onClick={onBack}
                                disabled={isValidating}
                            >
                                [ ABORT_PROCESS ]
                            </button>
                            <button 
                                type="submit" 
                                className={`btn-confirm ${isValidating ? 'disabled' : ''}`}
                                disabled={isValidating}
                            >
                                {isValidating ? 'AUTHENTICATING...' : 'INITIALIZE_AUTH _>'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Bottom: Ticker Decoration */}
            <div className="bottom-ticker">
                <div className="ticker-track">
                        BCA_HACKATHON_2026 // AUTH_PROTOCOL // SECURE_ACCESS // LOGIN_REQUIRED // PARTICIPANT_SYNC // 
                        BCA_HACKATHON_2026 // AUTH_PROTOCOL // SECURE_ACCESS // LOGIN_REQUIRED // PARTICIPANT_SYNC // 
                </div>
            </div>
        </div>
    );
};

export default LoginModal;
