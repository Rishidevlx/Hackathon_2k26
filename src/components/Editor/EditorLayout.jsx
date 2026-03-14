import React, { useState, useEffect, useRef } from 'react';
import CodeEditor from './CodeEditor';
import PatternView from './PatternView';
import Terminal from './Terminal';

const SuccessOverlay = ({ userData }) => {
    return (
        <div style={{ 
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
            background: '#000', zIndex: 10000, display: 'flex' 
        }}>
            {/* Left Side: Content */}
            <div style={{ 
                flex: 1.2, display: 'flex', flexDirection: 'column', justifyContent: 'center', 
                padding: '0 100px', background: '#000'
            }}>
                <div style={{ width: '100%' }}>
                    <div style={{ color: '#00e5ff', fontFamily: 'Orbitron', fontSize: '0.8rem', letterSpacing: '5px', marginBottom: '15px' }}>// SECURITY_OVERRIDE_SUCCESSFUL //</div>
                    <h1 style={{ 
                        color: '#fff', fontFamily: 'Orbitron', fontSize: '4.5rem', fontWeight: 900, 
                        letterSpacing: '5px', margin: 0, lineHeight: 1.1,
                        textShadow: '0 0 30px rgba(0,229,255,0.2)'
                    }}>
                        MISSION<br />
                        <span className="neon-pulse" style={{ color: '#00e5ff' }}>ACCOMPLISHED</span>
                    </h1>

                    <div style={{ marginTop: '40px', maxWidth: '550px' }}>
                        <div style={{ color: '#888', fontFamily: 'monospace', fontSize: '1rem', lineHeight: '1.8', marginBottom: '40px' }}>
                            Congratulations, Agent <span style={{ color: '#fff' }}>{userData.lotName || 'PARTICIPANT'}</span>. All cryptographic patterns have been solved. The system is now under your complete control. Your performance has been logged in the global leaderboard.
                        </div>

                        <div style={{ display: 'flex', gap: '40px' }}>
                            <div>
                                <div style={{ fontSize: '0.65rem', color: '#00e5ff', fontFamily: 'Orbitron', letterSpacing: '2px' }}>ACCESS_LEVEL</div>
                                <div style={{ fontSize: '1.5rem', color: '#fff', fontWeight: 'bold', fontFamily: 'Orbitron', marginTop: '5px' }}>ROOT_ADMIN</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.65rem', color: '#ff00ff', fontFamily: 'Orbitron', letterSpacing: '2px' }}>SYSTEM_STATUS</div>
                                <div style={{ fontSize: '1.5rem', color: '#fff', fontWeight: 'bold', fontFamily: 'Orbitron', marginTop: '5px' }}>SECURED</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Footer Text */}
                <div style={{ position: 'absolute', bottom: '50px', left: '100px' }}>
                    <div style={{ color: '#222', fontFamily: 'Orbitron', fontSize: '0.7rem', letterSpacing: '3px' }}>
                        HACKATHON_2K26_BCA // OFFICIAL_COMPLETION_PHASE
                    </div>
                </div>
            </div>

            {/* Right Side: Spline 3D Model */}
            <div style={{ flex: 0.8, position: 'relative', background: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ width: '100%', height: '100%', transform: 'scale(0.85)', transformOrigin: 'center center' }}>
                    <iframe 
                        src="https://my.spline.design/genkubgreetingrobot-dHkC8WmEOeObVhqQioTjKdt7/"
                        frameBorder="0" 
                        width="100%" 
                        height="100%"
                    />
                </div>
            </div>

            <style>{`
                .neon-pulse {
                    animation: neonPulse 2s ease-in-out infinite alternate;
                }
                @keyframes neonPulse {
                    from {
                        text-shadow: 0 0 10px #00e5ff, 0 0 20px #00e5ff;
                    }
                    to {
                        text-shadow: 0 0 20px #00e5ff, 0 0 40px #00e5ff, 0 0 60px #00e5ff;
                    }
                }
            `}</style>
        </div>
    );
};

const EditorLayout = ({ userData, onLogout }) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const STORAGE_KEY_MAP = `qmaze_codemap_${userData.lotNo}`;
    const STORAGE_KEY_COMPLETED = `qmaze_completed_${userData.lotNo}`;

    // --- BOILERPLATES ---
    const BOILERPLATES = {
        c: '#include <stdio.h>\n\nint main() {\n    \n    return 0;\n}',
        java: 'public class Main {\n    public static void main(String[] args) {\n        \n    }\n}'
    };

    const [codeMap, setCodeMap] = useState(() => {
        if (userData.dbCodeData) {
            try {
                const parsed = JSON.parse(userData.dbCodeData);
                if (parsed && parsed.map) return parsed.map;
                return parsed;
            } catch (e) { }
        }
        try {
            const saved = localStorage.getItem(STORAGE_KEY_MAP);
            return saved ? JSON.parse(saved) : {};
        } catch (e) { return {}; }
    });

    const [language, setLanguage] = useState(() => {
        try {
            const savedLang = localStorage.getItem(`qmaze_lang_${userData.lotNo}`);
            return savedLang ? savedLang : 'c';
        } catch (e) { return 'c'; }
    });

    useEffect(() => {
        if (userData.lotNo) localStorage.setItem(`qmaze_lang_${userData.lotNo}`, language);
    }, [language, userData]);

    const [initialDuration, setInitialDuration] = useState(7200000); // fallback: 120 mins
    const [metrics, setMetrics] = useState({ time: 7200000 }); // updated after settings fetch

    // ── Fetch SESSION_DURATION_MS once on mount (single lightweight DB call) ──
    useEffect(() => {
        const fetchSessionDuration = async () => {
            try {
                const res  = await fetch(`${API_URL}/api/settings`);
                const data = await res.json();
                const ms   = parseInt(data.SESSION_DURATION_MS);
                if (!isNaN(ms) && ms > 0) {
                    setInitialDuration(ms);
                    setMetrics(prev => ({ ...prev, time: ms }));
                }
            } catch (e) {
                // Fallback stays — 7200000 (2 hrs) already set in useState
                console.warn('[Timer] Settings fetch failed — using default 2hr duration.');
            }
        };
        fetchSessionDuration();
    }, []); // ← [] means: runs ONCE only on mount, NOT a recurring poll


    const [isSessionActive, setIsSessionActive] = useState(Boolean(userData.dbStartTime));
    const [isSuccess, setIsSuccess] = useState(userData.dbStatus === 'finished');
    const [attempts, setAttempts] = useState(0);
    const [warningCount, setWarningCount] = useState(0);
    const [isDisqualified, setIsDisqualified] = useState(userData.dbStatus === 'disqualified');

    const [currentPattern, setCurrentPattern] = useState(null);
    const [allPatterns, setAllPatterns] = useState([]);
    const [completedPatterns, setCompletedPatterns] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_COMPLETED);
            return saved ? JSON.parse(saved) : [];
        } catch (e) { return []; }
    });

    const [showLevelSuccess, setShowLevelSuccess] = useState(false);

    useEffect(() => {
        if (userData.dbCodeData) {
            try {
                const parsed = JSON.parse(userData.dbCodeData);
                if (parsed.language) {
                    setLanguage(parsed.language);
                    localStorage.setItem(`qmaze_lang_${userData.lotNo}`, parsed.language);
                }
            } catch (err) { }
        }

        if (initialDuration > 0 && userData.dbStartTime) {
            const startTimestamp = new Date(userData.dbStartTime).getTime();
            const timeElapsed = Date.now() - startTimestamp;
            const remaining = Math.max(0, initialDuration - timeElapsed);
            setMetrics(prev => ({ ...prev, time: remaining }));
            if (userData.dbStatus === 'disqualified' || remaining === 0) {
                setIsDisqualified(true);
                setIsSessionActive(false);
            }
        }
    }, [initialDuration, userData]);

    useEffect(() => {
        if (userData.lotNo) {
            localStorage.setItem(STORAGE_KEY_MAP, JSON.stringify(codeMap));
            localStorage.setItem(STORAGE_KEY_COMPLETED, JSON.stringify(completedPatterns));
        }
    }, [codeMap, completedPatterns, userData]);

    useEffect(() => {
        const fetchPatterns = async () => {
            try {
                const res = await fetch(`${API_URL}/api/patterns/${userData.category || 'UG'}`);
                const data = await res.json();
                setAllPatterns(data);
                if (data.length > 0) {
                    // Start at the first incomplete pattern
                    const completedInServer = userData.dbPatternsCompleted || 0;
                    const targetIndex = Math.min(completedInServer, data.length - 1);
                    setCurrentPattern(data[targetIndex]);
                }
            } catch (err) { console.error("Patterns fetch failed", err); }
        };
        fetchPatterns();
    }, [userData]);

    const handleCodeChange = (newCode) => {
        if (!currentPattern) return;
        // Block editing if completed
        if (completedPatterns.includes(currentPattern.id)) return;
        
        setCodeMap(prev => ({ ...prev, [currentPattern.id]: newCode }));
    };

    // Correctly derive current code based on map or boilerplate
    const currentCode = (currentPattern && codeMap[currentPattern.id] !== undefined)
        ? codeMap[currentPattern.id]
        : BOILERPLATES[language];

    const [logs, setLogs] = useState([
        { time: new Date().toLocaleTimeString(), text: 'System Initialized...', type: 'system' },
        { time: new Date().toLocaleTimeString(), text: 'Press START SYSTEM to begin session...', type: 'info' }
    ]);

    const handleClearLogs = () => {
        setLogs([{ time: new Date().toLocaleTimeString(), text: 'Terminal Cleared', type: 'system' }]);
    };

    useEffect(() => {
        let timer;
        if (isSessionActive && metrics.time > 0 && !isSuccess && !isDisqualified) {
            timer = setInterval(() => {
                setMetrics(prev => {
                    const startTimestamp = new Date(userData.dbStartTime).getTime();
                    const elapsed = Date.now() - startTimestamp;
                    const newTime = Math.max(0, initialDuration - elapsed);
                    if (newTime === 0) clearInterval(timer);
                    return { ...prev, time: newTime };
                });
            }, 50);
        }
        return () => clearInterval(timer);
    }, [isSessionActive, metrics.time, isSuccess, isDisqualified, initialDuration, userData.dbStartTime]);

    useEffect(() => {
        if (isSessionActive && metrics.time === 0 && !isSuccess && !isDisqualified) handleDisqualify();
    }, [metrics.time, isSessionActive, isSuccess, isDisqualified]);

    const handleDisqualify = async () => {
        setIsSessionActive(false);
        setIsDisqualified(true);
        setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text: '>>> TIME LIMIT EXCEEDED. SYSTEM HALTED. <<<', type: 'error' }]);
        try {
            await fetch(`${API_URL}/api/disqualify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lotNumber: userData.lotNo })
            });
        } catch (err) { }
    };

    const formatTime = (ms) => {
        const h = Math.floor(ms / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        const mili = Math.floor((ms % 1000) / 10);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${mili.toString().padStart(2, '0')}`;
    };

    const handleStartSession = async () => {
        setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text: '> INITIATING SESSION START...', type: 'info' }]);
        try {
            const response = await fetch(`${API_URL}/api/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lotNumber: userData.lotNo, language: language })
            });
            const data = await response.json();
            if (data.success && data.start_time) {
                userData.dbStartTime = data.start_time;
                setIsSessionActive(true);
                setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text: '> SESSION STARTED. EDITOR UNLOCKED.', type: 'system' }]);
            }
        } catch (err) { }
    };

    const stateRef = React.useRef();
    useEffect(() => {
        stateRef.current = { codeMap, metrics, initialDuration, completedPatterns, currentCode, currentPattern, attempts, warningCount };
    }, [codeMap, metrics, initialDuration, completedPatterns, currentCode, currentPattern, attempts, warningCount]);

    const triggerSync = async (overrides = {}) => {
        if (!userData.lotNo) return;
        try {
            const s = stateRef.current;
            const activeCode = overrides.code || s.currentCode;
            const activeMap = overrides.codeMap || s.codeMap;
            const activeCompleted = overrides.completedPatterns || s.completedPatterns;
            const cleanMap = { ...activeMap };
            if (s.currentPattern) cleanMap[s.currentPattern.id] = activeCode;

            const timeTaken = s.initialDuration - s.metrics.time;
            await fetch(`${API_URL}/api/update-progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lotNumber: userData.lotNo,
                    code: activeCode,
                    codeMap: { language, map: cleanMap },
                    totalTime: timeTaken,
                    warnings: s.warningCount,
                    attempts: s.attempts,
                    patternsCompleted: activeCompleted.length
                })
            });
        } catch (err) { }
    };

    useEffect(() => {
        if (!isSessionActive || isSuccess) return;
        const interval = setInterval(() => triggerSync(), 5000);
        return () => clearInterval(interval);
    }, [isSessionActive, isSuccess]);

    const handleRun = async (isSubmit = false) => {
        if (isRunning || !isSessionActive) return;
        // Block run if completed
        if (completedPatterns.includes(currentPattern.id)) return;

        setIsRunning(true);
        if (isSubmit) setAttempts(prev => prev + 1);
        const startTime = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, { time: startTime, text: `> ${isSubmit ? 'SUBMITTING' : 'RUNNING'} code on compiler...`, type: 'info' }]);

        try {
            const response = await fetch(`${API_URL}/api/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ language, code: currentCode, lotNumber: userData.lotNo })
            });
            const result = await response.json();
            setIsRunning(false);
            if (result.run) {
                const output = result.run.stdout || result.run.stderr;
                setLogs(prev => [...prev, 
                    { time: new Date().toLocaleTimeString(), text: `> ${isSubmit ? 'Submission' : 'Execution'} Complete.`, type: 'system' },
                    { time: '', text: output, type: result.run.stderr ? 'error' : 'output' }
                ]);

                if (isSubmit && !result.run.stderr && checkPatternMatch(output)) {
                    const newCompleted = [ ...new Set([...completedPatterns, currentPattern.id])];
                    setCompletedPatterns(newCompleted);
                    triggerSync({ completedPatterns: newCompleted });
                    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text: '>>> CHALLENGE SECURED! SCORE UPDATED. <<<', type: 'success' }]);
                    setShowLevelSuccess(true);
                    
                    if (newCompleted.length < allPatterns.length) {
                        setTimeout(() => {
                            setShowLevelSuccess(false);
                            const idx = allPatterns.findIndex(p => p.id === currentPattern.id);
                            // Auto move to next level
                            setCurrentPattern(allPatterns[idx + 1]);
                        }, 2000);
                    } else {
                        setTimeout(() => setShowLevelSuccess(false), 500);
                        setIsSuccess(true);
                        setIsSessionActive(false);
                        fetch(`${API_URL}/api/finish`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ lotNumber: userData.lotNo, totalTime: initialDuration - metrics.time, patternsCompleted: newCompleted.length, codeMap: { language, map: { ...codeMap, [currentPattern.id]: currentCode } } })
                        }).catch(console.error);
                    }
                } else if (isSubmit) {
                    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text: '>>> OUTPUT MISMATCH. ACCESS DENIED. <<<', type: 'error' }]);
                }
            }
        } catch (err) { setIsRunning(false); }
    };

    const checkPatternMatch = (output) => {
        if (!currentPattern) return false;
        const norm = (s) => s.replace(/\r\n/g, '\n').split('\n').map(l => l.trim()).filter(l => l !== '').join('\n').toUpperCase();
        return norm(output) === norm(currentPattern.target_output);
    };

    const handleLanguageChange = (e) => {
        const newLang = e.target.value;
        const oldLang = language;
        setLanguage(newLang);
        
        // If the current code for the current pattern is exactly the boilerplate of the old language,
        // swap it to the new language's boilerplate immediately.
        if (currentPattern) {
            const currentVal = codeMap[currentPattern.id] || BOILERPLATES[oldLang];
            if (currentVal === BOILERPLATES[oldLang]) {
                setCodeMap(prev => ({ ...prev, [currentPattern.id]: BOILERPLATES[newLang] }));
            }
        }
    };

    const [isFocused, setIsFocused] = useState(true);
    useEffect(() => {
        const hFocus = () => { if (document.hidden && isSessionActive && !isSuccess) { setIsFocused(false); setWarningCount(prev => prev + 1); setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text: '>>> VIOLATION: FOCUS LOST! <<<', type: 'error' }]); } };
        document.addEventListener('visibilitychange', hFocus);
        const hCtx = (e) => e.preventDefault();
        document.addEventListener('contextmenu', hCtx);
        return () => { document.removeEventListener('visibilitychange', hFocus); document.removeEventListener('contextmenu', hCtx); };
    }, [isSessionActive, isSuccess]);

    const [terminalHeight, setTerminalHeight] = useState(180);
    const [isResizing, setIsResizing] = useState(false);
    const stopResizing = () => setIsResizing(false);
    const resize = (e) => { if (isResizing) { const h = window.innerHeight - e.clientY; if (h > 50 && h < window.innerHeight - 100) setTerminalHeight(h); } };
    useEffect(() => {
        window.addEventListener("mousemove", resize);
        window.addEventListener("mouseup", stopResizing);
        return () => { window.removeEventListener("mousemove", resize); window.removeEventListener("mouseup", stopResizing); };
    }, [isResizing]);

    return (
        <div className="editor-layout" style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', background: '#0e1015', color: '#e0e0e0', fontFamily: 'Inter, sans-serif' }}>
            {/* Security Overlay */}
            {!isFocused && !isDisqualified && !isSuccess && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999, background: 'rgba(200, 0, 0, 0.98)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white', textAlign: 'center' }}>
                    <h1 style={{ fontFamily: 'Orbitron', fontSize: '3rem', textShadow: '0 0 20px black' }}>⚠️ SECURITY ALERT ⚠️</h1>
                    <div style={{ fontSize: '1.5rem', margin: '20px 0', fontFamily: 'Consolas' }}>
                        VIOLATION_COUNT: <span style={{ color: 'yellow', fontWeight: 'bold' }}>{warningCount}</span>
                    </div>
                    <p style={{ maxWidth: '600px', marginBottom: '30px', fontSize: '1.2rem' }}>You have moved out of the system environment. Any further switches will be logged for review.</p>
                    <button onClick={() => setIsFocused(true)} style={{ padding: '12px 40px', background: 'transparent', color: 'white', border: '2px solid white', cursor: 'pointer', fontFamily: 'Orbitron', fontWeight: 'bold', fontSize: '1.1rem', transition: 'all 0.3s' }} onMouseEnter={(e) => e.target.style.background='white' + ' color:black'} onMouseLeave={(e) => {e.target.style.background='transparent'; e.target.style.color='white'}}>RETURN TO SESSION</button>
                </div>
            )}

            {/* Top Nav */}
            <div className="top-nav" style={{ height: '60px', background: '#11131a', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <div className="brand" style={{ fontFamily: 'Orbitron', color: '#00e5ff', fontWeight: 'bold', fontSize: '1.3rem', letterSpacing: '1px', textShadow: '0 0 10px rgba(0,229,255,0.4)' }}>HACKATHON_2K26_BCA</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ position: 'relative' }} title={isSessionActive ? "Compiler locked after session start" : ""}>
                        <select 
                            value={language} 
                            onChange={handleLanguageChange} 
                            disabled={isSessionActive} 
                            style={{ 
                                background: '#000', 
                                color: isSessionActive ? '#444' : '#00e5ff', 
                                border: `1px solid ${isSessionActive ? '#333' : '#00e5ff'}`, 
                                padding: '6px 12px', 
                                fontFamily: 'Orbitron', 
                                outline: 'none',
                                cursor: isSessionActive ? 'not-allowed' : 'pointer',
                                borderRadius: '4px'
                            }}
                        >
                            <option value="c">C (GCC 10.2)</option>
                            <option value="java">Java (OpenJDK 15)</option>
                        </select>
                        {isSessionActive && <span style={{ position: 'absolute', right: '-10px', top: '-10px', fontSize: '0.8rem' }}>🔒</span>}
                    </div>

                    {!isSessionActive ? (
                        isSuccess ? null : <button onClick={handleStartSession} style={{ background: '#00e5ff', border: 'none', padding: '8px 25px', fontWeight: 'bold', fontFamily: 'Orbitron', cursor: 'pointer', borderRadius: '4px', boxShadow: '0 0 15px rgba(0,229,255,0.3)', color: '#000' }}>START SYSTEM</button>
                    ) : (
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button 
                                onClick={() => handleRun(false)} 
                                disabled={completedPatterns.includes(currentPattern?.id) || isRunning}
                                style={{ 
                                    background: '#1a1d26', 
                                    border: '1px solid #00e5ff', 
                                    color: completedPatterns.includes(currentPattern?.id) ? '#333' : '#00e5ff', 
                                    padding: '6px 18px', 
                                    fontFamily: 'Orbitron', 
                                    cursor: (completedPatterns.includes(currentPattern?.id) || isRunning) ? 'not-allowed' : 'pointer',
                                    borderRadius: '4px',
                                    fontWeight: 'bold'
                                }}
                            >RUN_CODE</button>
                            <button 
                                onClick={() => handleRun(true)}
                                disabled={completedPatterns.includes(currentPattern?.id) || isRunning}
                                style={{ 
                                    background: completedPatterns.includes(currentPattern?.id) ? '#333' : '#00e5ff', 
                                    color: '#000', 
                                    padding: '6px 20px', 
                                    fontFamily: 'Orbitron', 
                                    cursor: (completedPatterns.includes(currentPattern?.id) || isRunning) ? 'not-allowed' : 'pointer',
                                    borderRadius: '4px',
                                    border: 'none',
                                    fontWeight: 'bold',
                                    boxShadow: completedPatterns.includes(currentPattern?.id) ? 'none' : '0 0 15px rgba(0,229,255,0.3)'
                                }}
                            >SUBMIT</button>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <div className="timer-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                         <span style={{ fontSize: '0.6rem', color: '#666', fontFamily: 'Orbitron', marginBottom: '2px' }}>TIME_REMAINING</span>
                         <div className="timer" style={{ 
                            fontFamily: '"Share Tech Mono", monospace', 
                            fontSize: '1.8rem', 
                            color: isSuccess ? '#00e5ff' : '#ff0055', 
                            border: `2px solid ${isSuccess ? '#00e5ff' : '#ff0055'}`, 
                            padding: '2px 15px', 
                            borderRadius: '4px', 
                            background: 'rgba(0,0,0,0.4)',
                            boxShadow: `0 0 10px ${isSuccess ? 'rgba(0,229,255,0.2)' : 'rgba(255,0,85,0.2)'}`,
                            minWidth: '160px',
                            textAlign: 'center'
                         }}>{formatTime(metrics.time)}</div>
                    </div>

                    <div className="score-wrapper" style={{ 
                        background: 'rgba(0,229,255,0.1)', 
                        border: '2px solid #00e5ff', 
                        padding: '5px 20px', 
                        borderRadius: '4px', 
                        textAlign: 'center',
                        boxShadow: '0 0 20px rgba(0,229,255,0.4)',
                        minWidth: '120px'
                    }}>
                        <div style={{ fontSize: '0.65rem', color: '#00e5ff', fontFamily: 'Orbitron', fontWeight: 'bold', marginBottom: '2px' }}>TOTAL_SCORE</div>
                        <div className="score" style={{ fontFamily: 'Orbitron', color: '#fff', fontSize: '1.4rem', fontWeight: 'bold', textShadow: '0 0 10px #00e5ff' }}>
                            {completedPatterns.length * 25} <span style={{fontSize:'0.8rem', color:'#00e5ff', opacity: 0.7}}>/ 100</span>
                        </div>
                    </div>

                    <div className="user" style={{ textAlign: 'right', fontSize: '0.8rem', borderLeft: '1px solid #333', paddingLeft: '20px' }}>
                        <div style={{ color: '#666', fontFamily: 'Orbitron', fontSize: '0.6rem' }}>OPERATOR</div>
                        <div style={{ color: '#ff00ff', fontWeight: 'bold', fontFamily: 'Consolas' }}>{userData.lotName || 'USER'}</div>
                    </div>
                </div>
            </div>

            {/* Workspace */}
            <div className="workspace" style={{ flex: 1, display: 'flex', minHeight: 0, background: '#15171e', width: '100%' }}>
                {/* Left Side: Editor + Tabs */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #222', minHeight: 0 }}>
                    {/* Tabs */}
                    <div style={{ display: 'flex', background: '#0e1015', borderBottom: '1px solid #222' }}>
                        {allPatterns.map((p, idx) => {
                            const isCompleted = completedPatterns.includes(p.id);
                            const isLocked = idx > completedPatterns.length;
                            const isActive = currentPattern?.id === p.id;

                            return (
                                <div 
                                    key={p.id} 
                                    onClick={() => !isLocked && setCurrentPattern(p)} 
                                    style={{ 
                                        padding: '12px 20px', 
                                        borderRight: '1px solid #222', 
                                        cursor: isLocked ? 'not-allowed' : 'pointer', 
                                        background: isActive ? '#15171e' : '#0e1015', 
                                        color: isLocked ? '#333' : (isActive ? '#00e5ff' : '#666'), 
                                        fontSize: '0.8rem',
                                        fontFamily: 'Orbitron',
                                        transition: 'all 0.2s',
                                        position: 'relative'
                                    }}
                                >
                                    {p.name} 
                                    {isCompleted && <span style={{ color: '#00e5ff', marginLeft: '8px' }}>[✔]</span>}
                                    {isLocked && <span style={{ opacity: 0.5, marginLeft: '8px' }}>🔐</span>}
                                    {isActive && <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '2px', background: '#00e5ff' }}></div>}
                                </div>
                            );
                        })}
                    </div>
                    <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
                        <div style={{ 
                            height: '100%', 
                            filter: (currentPattern && completedPatterns.includes(currentPattern.id)) ? 'blur(2px) grayscale(80%)' : 'none',
                            transition: 'filter 0.5s',
                            pointerEvents: (currentPattern && completedPatterns.includes(currentPattern.id)) ? 'none' : 'auto'
                        }}>
                            <CodeEditor key={currentPattern?.id} value={currentCode} onChange={handleCodeChange} language={language} readOnly={!isSessionActive || isSuccess || (currentPattern && completedPatterns.includes(currentPattern.id))} />
                        </div>
                        
                        {(currentPattern && completedPatterns.includes(currentPattern.id)) && (
                            <div style={{ 
                                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                                display: 'flex', justifyContent: 'center', alignItems: 'center', 
                                background: 'rgba(0,0,0,0.3)', zIndex: 5, pointerEvents: 'none'
                             }}>
                                <div style={{ 
                                    background: 'rgba(0,229,255,0.1)', 
                                    border: '2px solid #00e5ff', 
                                    padding: '10px 30px', 
                                    color: '#00e5ff', 
                                    fontFamily: 'Orbitron', 
                                    fontWeight: 'bold', 
                                    letterSpacing: '2px',
                                    boxShadow: '0 0 20px rgba(0,229,255,0.2)'
                                }}>
                                    CHALLENGE_SECURED_BY_{userData.lotName || 'USER'}
                                </div>
                            </div>
                        )}

                        {(!isSessionActive) && (
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', zIndex: 10, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                 <div style={{ color: '#444', fontFamily: 'Orbitron', fontSize: '1.2rem', letterSpacing: '5px' }}>SYSTEM_OFFLINE</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Challenge Info */}
                <div style={{ width: '40%', display: 'flex', flexDirection: 'column', background: '#0e1015', minHeight: 0 }}>
                    <div style={{ padding: '12px 15px', background: '#11131a', borderBottom: '1px solid #222', color: '#00e5ff', fontFamily: 'Orbitron', fontSize: '0.8rem', letterSpacing: '1px' }}>CHALLENGE_SPECIFICATION</div>
                    <div style={{ flex: 1, padding: '25px', overflowY: 'auto' }}>
                        <div style={{ color: '#00e5ff', fontFamily: 'Consolas', marginBottom: '30px', fontSize: '1rem', lineHeight: '1.6', background: 'rgba(0,229,255,0.03)', padding: '15px', borderLeft: '3px solid #00e5ff' }}>
                             &gt; {currentPattern?.description || 'Awaiting system initialization...'}
                        </div>
                        <div style={{ color: '#ff00ff', fontFamily: 'Orbitron', fontSize: '0.7rem', marginBottom: '15px', letterSpacing: '1px', textShadow: '0 0 5px rgba(255,0,255,0.3)' }}>&gt; EXPECTED_OUTPUT:</div>
                        <div style={{ background: '#07080a', border: '1px solid #1a1c22', borderRadius: '4px', padding: '10px' }}>
                            <PatternView pattern={currentPattern?.target_output || ''} color="#ff00ff" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Terminal Section */}
            <div style={{ height: `${terminalHeight}px`, background: '#050608', borderTop: '2px solid #222', position: 'relative', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                <div 
                    onMouseDown={() => setIsResizing(true)} 
                    style={{ 
                        height: '6px', width: '100%', cursor: 'ns-resize', position: 'absolute', top: -3, zIndex: 100,
                        background: isResizing ? '#00e5ff' : 'transparent',
                        transition: 'background 0.2s'
                    }} 
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#11131a', height: '32px', padding: '0 15px', borderBottom: '1px solid #222' }}>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'Orbitron', color: '#888', letterSpacing: '1px' }}>SYSTEM_TERMINAL</span>
                    <button onClick={handleClearLogs} style={{ background: 'transparent', border: 'none', color: '#00e5ff', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'Orbitron', fontWeight: 'bold' }}>[CLEAR]</button>
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                    <Terminal logs={logs} onClear={handleClearLogs} />
                </div>
            </div>

            {/* Overlays */}
            {showLevelSuccess && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.5s' }}>
                    <div style={{ textAlign: 'center' }}>
                         <h1 style={{ color: '#00e5ff', fontFamily: 'Orbitron', fontSize: '3rem', letterSpacing: '5px', textShadow: '0 0 30px #00e5ff' }}>CHALLENGE_SECURED</h1>
                         <div style={{ color: '#666', marginTop: '10px', fontFamily: 'Consolas' }}>UPDATING_PROGRESS_IN_DB...</div>
                    </div>
                </div>
            )}
            
            {isSuccess && (
                <SuccessOverlay userData={userData} stats={{ timeTaken: initialDuration - metrics.time, warnings: warningCount }} />
            )}

            {isDisqualified && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(50,0,0,0.95)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                     <div style={{ textAlign: 'center' }}>
                        <h1 style={{ color: 'red', fontFamily: 'Orbitron', fontSize: '4rem' }}>SYSTEM_LOCKOUT</h1>
                        <div style={{ color: '#fff', marginTop: '20px', fontFamily: 'monospace' }}>REASON: TIME_LIMIT_EXCEEDED</div>
                     </div>
                </div>
            )}
        </div>
    );
};

export default EditorLayout;
