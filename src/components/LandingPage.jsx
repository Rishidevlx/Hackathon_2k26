import React, { useState, useEffect, useCallback } from 'react';
import './LandingPage.css';
import BackgroundEffect from './BackgroundEffect';

const LandingPage = ({ onStart, forceSelection = false, onBack }) => {
    const [showCategories, setShowCategories] = useState(forceSelection);
    const [scrambledTitle, setScrambledTitle] = useState('HACKATHON 2K26');
    const [showSub, setShowSub] = useState(false);
    const [logs, setLogs] = useState([]);
    
    // Sync internal state with prop
    useEffect(() => {
        setShowCategories(forceSelection);
    }, [forceSelection]);

    // Scramble effect for the main title
    const scramble = useCallback((text, duration = 1500) => {
        let iterations = 0;
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
        const interval = setInterval(() => {
            setScrambledTitle(
                text.split("").map((letter, index) => {
                    if (index < iterations) return text[index];
                    return chars[Math.floor(Math.random() * chars.length)];
                }).join("")
            );

            if (iterations >= text.length) {
                clearInterval(interval);
                setShowSub(true);
            }
            iterations += 1 / 3;
        }, 30);
    }, []);

    useEffect(() => {
        scramble("HACKATHON 2K26");
        
        // System logs simulation
        const logMessages = [
            "> LOADING_VIRTUAL_ENV [OK]",
            "> CONNECTING_TIDB_CLUSTER [OK]",
            "> BYPASSING_FIREWALL ... ACCESS_GRANTED",
            "> BCA_DEPT_PROTOCOL_ACTIVE",
            "> SYSTEM_VERSION_2.0.4_READY"
        ];
        
        let logIndex = 0;
        const logInterval = setInterval(() => {
            if (logIndex < logMessages.length) {
                setLogs(prev => [...prev, logMessages[logIndex]]);
                logIndex++;
            } else {
                clearInterval(logInterval);
            }
        }, 500);
        
        return () => {
            clearInterval(logInterval);
        };
    }, [scramble]);

    return (
        <div className="landing-container">
            {/* Background & Overlays */}
            <BackgroundEffect />
            <div className="vignette-overlay"></div>
            <div className="scanline-overlay"></div>
            
            {/* Full Screen Decorations */}
            <div className="corner-dec corner-tl"></div>
            <div className="corner-dec corner-tr"></div>
            <div className="corner-dec corner-bl"></div>
            <div className="corner-dec corner-br"></div>

            <div className="data-stream" style={{ left: '10%', animationDelay: '0s' }}></div>
            <div className="data-stream" style={{ left: '30%', animationDelay: '1.5s' }}></div>
            <div className="data-stream" style={{ left: '70%', animationDelay: '0.8s' }}></div>
            <div className="data-stream" style={{ left: '90%', animationDelay: '2.2s' }}></div>

            {!showCategories ? (
                <div className="main-viewport">
                    {/* Left: System Logs */}
                    <div className="system-logs">
                        {logs.map((log, i) => (
                            <div key={i} className="log-line">{log}</div>
                        ))}
                    </div>

                    {/* Right: Technical Badges */}
                    <div className="tech-badges">
                        <div className="badge">SEC_STATE: ENCRYPTED</div>
                        <div className="badge">UPTIME: 99.9%</div>
                        <div className="badge">LOCATION: RM_04_BCA</div>
                    </div>

                    {/* Center Content */}
                    <div className="center-content">
                        <header className="header-meta">
                            <span className="meta-line">AYYA NADAR JANAKI AMMAL COLLEGE</span>
                            <span className="meta-line highlight">BCA DEPARTMENT SPECIAL UNIT</span>
                        </header>

                        <div className="title-reconstruction">
                            <h1 className="main-title" data-text={scrambledTitle}>
                                {scrambledTitle.split(' ')[0]}<br />
                                {scrambledTitle.split(' ')[1]}
                            </h1>
                            {showSub && (
                                <div className="sub-header-container">
                                    <div className="line-dec"></div>
                                    <span className="sub-text">CHALLENGE_YOUR_LIMITS</span>
                                    <div className="line-dec"></div>
                                </div>
                            )}
                        </div>

                        <div className="call-to-action">
                            <button className="hacker-btn" onClick={onStart}>
                                <div className="btn-content">
                                    <span className="btn-glitch-text">ACCESS_SYSTEM</span>
                                    <span className="btn-icon">_</span>
                                </div>
                                <div className="btn-border"></div>
                            </button>
                        </div>
                    </div>

                    {/* Bottom: Ticker Decoration */}
                    <div className="bottom-ticker">
                        <div className="ticker-track">
                                BCA_HACKATHON_2026 // CODE_MATCHING // LOGIC_TEST // SYSTEM_LOCKED // PERSIST_DATA // 
                                BCA_HACKATHON_2026 // CODE_MATCHING // LOGIC_TEST // SYSTEM_LOCKED // PERSIST_DATA // 
                        </div>
                    </div>
                </div>
            ) : (
                <div className="category-section">
                    <div className="category-header">
                        <h2 className="title-glow">SECTOR_SELECTION</h2>
                        <div className="path-indicator">PATH: ROOT/SELECTION</div>
                    </div>

                    <div className="category-list">
                        {/* PG LEVEL */}
                        <div className="rect-card" onClick={() => onStart('PG')}>
                            <h3 className="card-title">PG_LEVEL</h3>
                            <p className="card-desc">
                                ADVANCED DATA VECTORS & LOGIC ARCHITECTURE ARCHETYPE
                            </p>
                            <div className="card-status">STATUS: INITIALIZED</div>
                        </div>

                        {/* UG LEVEL */}
                        <div className="rect-card" onClick={() => onStart('UG')}>
                            <h3 className="card-title">UG_LEVEL</h3>
                            <p className="card-desc">
                                FOUNDATIONAL ALGORITHMS & PATTERN SYNTHESIS MODULES
                            </p>
                            <div className="card-status">STATUS: INITIALIZED</div>
                        </div>
                    </div>

                    <button className="terminate-btn" onClick={onBack}>
                        [ TERMINATE_SELECTION ]
                    </button>
                </div>
            )}
        </div>
    );
};

export default LandingPage;
