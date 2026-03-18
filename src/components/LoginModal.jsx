import React, { useState, useEffect } from 'react';
import './LoginModal.css';
import BackgroundEffect from './BackgroundEffect';

// Category-based dynamic options
const CATEGORY_CONFIG = {
    UG: {
        departments: ['BCA', 'BSC.CS (R)', 'BSC.CS (SF)', 'DATA SCIENCE'],
        years:       ['I', 'II', 'III'],
    },
    PG: {
        departments: ['MCA','MSC.CS (R)', 'MSC.CS (SF)', 'DATA SCIENCE'],
        years:       ['I', 'II'],
    },
};

const LoginModal = ({ onLogin, onBack, category }) => {
    const [rollNo, setRollNo] = useState('');
    const [name, setName] = useState('');
    const [department, setDepartment] = useState('');
    const [year, setYear] = useState('');
    const [error, setError] = useState('');
    const [isValidating, setIsValidating] = useState(false);

    // Reset dept + year whenever UG/PG changes
    useEffect(() => {
        setDepartment('');
        setYear('');
    }, [category]);

    // Derive allowed options from category (fallback to UG if unknown)
    const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.UG;

    // Force Uppercase for inputs
    const handleNameChange = (e) => setName(e.target.value.toUpperCase());
    const handleRollChange = (e) => setRollNo(e.target.value.toUpperCase());

    const validateForm = () => {
        if (!name.trim())   return 'NAME_REQUIRED';
        if (!rollNo.trim()) return 'ROLL_NO_REQUIRED';
        if (!department)    return 'DEPARTMENT_REQUIRED';
        if (!year)          return 'YEAR_REQUIRED';
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
                category,
                department,
                year,
                loginTime: Date.now(),
            };
            localStorage.setItem('qmaze_user_session', JSON.stringify(sessionData));
            onLogin(normalizedRollNo, name.trim(), category, department, year);
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
                        {/* Row 1: Name */}
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

                        {/* Row 2: Roll No */}
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

                        {/* Row 3: Department + Year — side by side */}
                        <div className="input-row-split">
                            {/* Department */}
                            <div className="input-group">
                                <label className="label-technical">
                                    <span className="label-prefix">03</span> DEPARTMENT_SECTOR
                                </label>
                                <div className="cyber-input-wrapper">
                                    <select
                                        className="cyber-select"
                                        value={department}
                                        onChange={(e) => setDepartment(e.target.value)}
                                        disabled={isValidating}
                                    >
                                        <option value="">-- SELECT --</option>
                                        {config.departments.map((d) => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                    <div className="input-glow"></div>
                                </div>
                            </div>

                            {/* Year */}
                            <div className="input-group">
                                <label className="label-technical">
                                    <span className="label-prefix">04</span> ACADEMIC_YEAR
                                </label>
                                <div className="cyber-input-wrapper">
                                    <select
                                        className="cyber-select"
                                        value={year}
                                        onChange={(e) => setYear(e.target.value)}
                                        disabled={isValidating}
                                    >
                                        <option value="">-- SELECT --</option>
                                        {config.years.map((y) => (
                                            <option key={y} value={y}>YEAR {y}</option>
                                        ))}
                                    </select>
                                    <div className="input-glow"></div>
                                </div>
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
