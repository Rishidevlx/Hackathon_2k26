import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEye, FaEyeSlash, FaLock, FaEnvelope, FaExclamationTriangle } from 'react-icons/fa';

// ── Theme tokens (matches frontend exactly) ──────────────────────────────────
const T = {
    cyan:       '#00e5ff',
    blue:       '#00a2ff',
    red:        '#ff003c',
    bgDark:     '#000810',
    bgPanel:    'rgba(5, 10, 20, 0.92)',
    cyanAlpha:  (a) => `rgba(0, 229, 255, ${a})`,
    blueAlpha:  (a) => `rgba(0, 162, 255, ${a})`,
    redAlpha:   (a) => `rgba(255, 0, 60, ${a})`,
};

const Login = () => {
    const [email, setEmail]           = useState('');
    const [password, setPassword]     = useState('');
    const [error, setError]           = useState('');
    const [isLoading, setIsLoading]   = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passFocused, setPassFocused]   = useState(false);
    const [glitchText, setGlitchText] = useState('ADMIN_ACCESS');
    const [logs, setLogs]             = useState([]);
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    // ── Scramble title ──────────────────────────────────────────────────────
    useEffect(() => {
        const chars  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        const target = 'ADMIN_ACCESS';
        let iterations = 0;
        const iv = setInterval(() => {
            setGlitchText(
                target.split('').map((_, idx) =>
                    idx < iterations ? target[idx] : chars[Math.floor(Math.random() * chars.length)]
                ).join('')
            );
            if (iterations >= target.length) clearInterval(iv);
            iterations += 0.4;
        }, 40);
        return () => clearInterval(iv);
    }, []);

    // ── Boot logs ───────────────────────────────────────────────────────────
    useEffect(() => {
        const bootLogs = [
            '> INITIALIZING_SECURE_CHANNEL...',
            '> CONNECTING_TO_DB_CLUSTER [OK]',
            '> LOADING_ADMIN_PROTOCOLS...',
            '> AUTHENTICATION_MODULE_READY',
        ];
        let i = 0;
        const iv = setInterval(() => {
            if (i < bootLogs.length) { setLogs(prev => [...prev, bootLogs[i]]); i++; }
            else clearInterval(iv);
        }, 400);
        return () => clearInterval(iv);
    }, []);

    // ── Validation ──────────────────────────────────────────────────────────
    const validate = () => {
        if (!email.trim())    return 'EMAIL_FIELD_REQUIRED';
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRe.test(email.trim())) return 'INVALID_EMAIL_FORMAT';
        if (!password.trim()) return 'PASSWORD_FIELD_REQUIRED';
        if (password.trim().length < 4)  return 'PASSWORD_TOO_SHORT (MIN: 4 CHARS)';
        return null;
    };

    // ── Submit ──────────────────────────────────────────────────────────────
    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        const err = validate();
        if (err) { setError(err); return; }
        setIsLoading(true);
        try {
            const res = await axios.post(`${API_URL}/api/admin/login`, {
                email: email.trim(), password: password.trim()
            });
            if (res.data.success) {
                localStorage.setItem('adminToken', res.data.token);
                navigate('/dashboard');
            }
        } catch {
            setError('ACCESS_DENIED: INVALID_CREDENTIALS');
        } finally {
            setIsLoading(false);
        }
    };

    // ── Shared input style builder ──────────────────────────────────────────
    const inputStyle = (focused) => ({
        width: '100%',
        background: focused ? T.cyanAlpha(0.04) : 'rgba(0,0,0,0.45)',
        border: `1px solid ${focused ? T.cyanAlpha(0.7) : T.cyanAlpha(0.15)}`,
        color: '#fff',
        padding: '13px 14px 13px 42px',
        fontFamily: "'Courier New', monospace",
        fontSize: '0.95rem',
        letterSpacing: '1px',
        outline: 'none',
        transition: 'all 0.3s',
        boxShadow: focused
            ? `0 0 18px ${T.cyanAlpha(0.12)}, inset 0 0 12px ${T.cyanAlpha(0.05)}`
            : 'none',
        boxSizing: 'border-box',
        borderRadius: '2px',
    });

    const labelStyle = (focused) => ({
        display: 'flex', alignItems: 'center', gap: '8px',
        fontSize: '0.7rem',
        color: focused ? T.cyan : T.cyanAlpha(0.45),
        letterSpacing: '2px',
        marginBottom: '8px',
        transition: 'color 0.3s',
        fontFamily: "'Courier New', monospace",
    });

    const numBadgeStyle = (focused) => ({
        background: focused ? T.cyan : 'transparent',
        color: focused ? '#000' : T.cyanAlpha(0.45),
        border: `1px solid ${T.cyanAlpha(0.3)}`,
        padding: '1px 6px',
        fontSize: '0.65rem',
        transition: 'all 0.3s',
    });

    const iconStyle = (focused) => ({
        position: 'absolute', left: '14px', top: '50%',
        transform: 'translateY(-50%)',
        color: focused ? T.cyan : T.cyanAlpha(0.3),
        transition: 'color 0.3s', pointerEvents: 'none',
    });

    // ────────────────────────────────────────────────────────────────────────
    return (
        <div style={{
            width: '100vw', height: '100vh',
            background: T.bgDark,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Courier New', monospace",
            position: 'relative', overflow: 'hidden',
        }}>
            {/* ── Animated grid ──────────────────────────────────────────── */}
            <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `
                    linear-gradient(${T.cyanAlpha(0.03)} 1px, transparent 1px),
                    linear-gradient(90deg, ${T.cyanAlpha(0.03)} 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px',
                pointerEvents: 'none',
            }} />

            {/* ── Radial centre glow ─────────────────────────────────────── */}
            <div style={{
                position: 'absolute', inset: 0,
                background: `radial-gradient(ellipse at center, ${T.cyanAlpha(0.05)} 0%, transparent 65%)`,
                pointerEvents: 'none',
            }} />

            {/* ── Scanline ──────────────────────────────────────────────── */}
            <div style={{
                position: 'fixed', left: 0, top: 0, width: '100%', height: '2px',
                background: `linear-gradient(90deg, transparent, ${T.cyan}, transparent)`,
                animation: 'scanMove 5s linear infinite',
                pointerEvents: 'none', zIndex: 9999, opacity: 0.35,
            }} />

            {/* ── Corner decorations ────────────────────────────────────── */}
            {[
                { top:'20px',  left:'20px',  borderTop:`2px solid ${T.cyanAlpha(0.35)}`,  borderLeft:`2px solid ${T.cyanAlpha(0.35)}`  },
                { top:'20px',  right:'20px', borderTop:`2px solid ${T.cyanAlpha(0.35)}`,  borderRight:`2px solid ${T.cyanAlpha(0.35)}` },
                { bottom:'20px', left:'20px',  borderBottom:`2px solid ${T.cyanAlpha(0.35)}`, borderLeft:`2px solid ${T.cyanAlpha(0.35)}`  },
                { bottom:'20px', right:'20px', borderBottom:`2px solid ${T.cyanAlpha(0.35)}`, borderRight:`2px solid ${T.cyanAlpha(0.35)}` },
            ].map((s, i) => (
                <div key={i} style={{ position:'absolute', width:'30px', height:'30px', ...s }} />
            ))}

            {/* ── Boot logs – bottom-left ───────────────────────────────── */}
            <div style={{
                position: 'absolute', left: '30px', bottom: '30px',
                fontFamily: 'monospace', fontSize: '0.7rem',
                color: T.cyanAlpha(0.45), lineHeight: '1.8',
            }}>
                {logs.map((log, i) => (
                    <motion.div key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                    >{log}</motion.div>
                ))}
            </div>

            {/* ── System badges – right ─────────────────────────────────── */}
            <div style={{
                position: 'absolute', right: '30px', top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex', flexDirection: 'column', gap: '10px',
            }}>
                {['SEC: ENCRYPTED', 'SSL: TLSv1.2', 'MODE: LOCKED'].map((badge, i) => (
                    <div key={i} style={{
                        fontSize: '0.65rem', color: T.cyanAlpha(0.45),
                        border: `1px solid ${T.cyanAlpha(0.15)}`,
                        padding: '5px 10px', letterSpacing: '1px',
                        background: T.cyanAlpha(0.03),
                    }}>{badge}</div>
                ))}
            </div>

            {/* ══════════════ MAIN CARD ═══════════════════════════════════ */}
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.165, 0.84, 0.44, 1] }}
                style={{
                    width: '460px',
                    background: T.bgPanel,
                    border: `1px solid ${T.cyanAlpha(0.2)}`,
                    boxShadow: `0 0 60px ${T.cyanAlpha(0.07)}, 0 0 120px ${T.blueAlpha(0.04)}, inset 0 0 40px rgba(0,0,0,0.6)`,
                    position: 'relative', zIndex: 10,
                    backdropFilter: 'blur(12px)',
                    borderRadius: '2px',
                }}
            >
                {/* Top animated bar */}
                <div style={{
                    height: '2px', width: '100%',
                    background: `linear-gradient(90deg, transparent, ${T.cyan}, ${T.blue}, transparent)`,
                    animation: 'glitchBar 3s ease-in-out infinite',
                }} />

                <div style={{ padding: '42px' }}>

                    {/* ── Header ─────────────────────────────────────────── */}
                    <div style={{ textAlign: 'center', marginBottom: '36px' }}>

                        {/* Lock icon circle */}
                        <div style={{
                            width: '62px', height: '62px',
                            border: `2px solid ${T.cyanAlpha(0.4)}`,
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 20px',
                            background: T.cyanAlpha(0.05),
                            boxShadow: `0 0 25px ${T.cyanAlpha(0.15)}`,
                        }}>
                            <FaLock style={{ color: T.cyan, fontSize: '1.3rem' }} />
                        </div>

                        {/* Eyebrow */}
                        <div style={{
                            fontFamily: "'Courier New', monospace",
                            fontSize: '0.68rem', color: T.cyanAlpha(0.45),
                            letterSpacing: '4px', marginBottom: '8px',
                        }}>// SYSTEM_PANEL //</div>

                        {/* Scramble title */}
                        <h1 style={{
                            margin: 0,
                            fontFamily: "'Orbitron', sans-serif",
                            fontSize: '1.75rem', fontWeight: 'bold',
                            color: T.cyan,
                            letterSpacing: '4px',
                            textShadow: `0 0 18px ${T.cyanAlpha(0.55)}, 0 0 40px ${T.blueAlpha(0.3)}`,
                            textTransform: 'uppercase',
                        }}>{glitchText}</h1>

                        {/* Underline */}
                        <div style={{
                            width: '80px', height: '1px',
                            background: `linear-gradient(90deg, transparent, ${T.cyan}, transparent)`,
                            margin: '14px auto 0',
                            boxShadow: `0 0 8px ${T.cyanAlpha(0.5)}`,
                        }} />
                    </div>

                    {/* ── Form ───────────────────────────────────────────── */}
                    <form onSubmit={handleLogin}>

                        {/* Email */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={labelStyle(emailFocused)}>
                                <span style={numBadgeStyle(emailFocused)}>01</span>
                                IDENTIFIER (EMAIL)
                            </label>
                            <div style={{ position: 'relative' }}>
                                <div style={iconStyle(emailFocused)}>
                                    <FaEnvelope style={{ fontSize: '0.9rem' }} />
                                </div>
                                <input
                                    type="text"
                                    value={email}
                                    onChange={e => { setEmail(e.target.value); setError(''); }}
                                    onFocus={() => setEmailFocused(true)}
                                    onBlur={() => setEmailFocused(false)}
                                    placeholder="admin@hackathon.com"
                                    disabled={isLoading}
                                    style={inputStyle(emailFocused)}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={labelStyle(passFocused)}>
                                <span style={numBadgeStyle(passFocused)}>02</span>
                                SECURITY_KEY (PASSWORD)
                            </label>
                            <div style={{ position: 'relative' }}>
                                <div style={iconStyle(passFocused)}>
                                    <FaLock style={{ fontSize: '0.85rem' }} />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => { setPassword(e.target.value); setError(''); }}
                                    onFocus={() => setPassFocused(true)}
                                    onBlur={() => setPassFocused(false)}
                                    placeholder="••••••••••••"
                                    disabled={isLoading}
                                    style={{ ...inputStyle(passFocused), paddingRight: '44px', letterSpacing: '3px' }}
                                />
                                {/* Eye toggle */}
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(p => !p)}
                                    style={{
                                        position: 'absolute', right: '12px', top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'transparent', border: 'none',
                                        color: showPassword ? T.cyan : T.cyanAlpha(0.35),
                                        cursor: 'pointer', padding: '4px',
                                        transition: 'color 0.3s',
                                        display: 'flex', alignItems: 'center',
                                    }}
                                    title={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword
                                        ? <FaEyeSlash style={{ fontSize: '1rem' }} />
                                        : <FaEye     style={{ fontSize: '1rem' }} />
                                    }
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8, height: 0 }}
                                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                                    exit={{ opacity: 0, y: -8, height: 0 }}
                                    transition={{ duration: 0.25 }}
                                    style={{
                                        background: T.redAlpha(0.08),
                                        border: `1px solid ${T.redAlpha(0.3)}`,
                                        borderLeft: `3px solid ${T.red}`,
                                        padding: '10px 14px',
                                        marginBottom: '20px',
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        borderRadius: '2px',
                                    }}
                                >
                                    <FaExclamationTriangle style={{ color: T.red, flexShrink: 0 }} />
                                    <span style={{
                                        color: T.red,
                                        fontFamily: "'Courier New', monospace",
                                        fontSize: '0.75rem', letterSpacing: '1px',
                                    }}>{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Submit */}
                        <motion.button
                            type="submit"
                            disabled={isLoading}
                            whileHover={!isLoading ? { scale: 1.01 } : {}}
                            whileTap={!isLoading  ? { scale: 0.98 } : {}}
                            style={{
                                width: '100%', padding: '14px',
                                background: isLoading ? T.cyanAlpha(0.06) : 'transparent',
                                border: `1px solid ${isLoading ? T.cyanAlpha(0.2) : T.cyanAlpha(0.55)}`,
                                color: isLoading ? T.cyanAlpha(0.35) : T.cyan,
                                fontFamily: "'Orbitron', sans-serif",
                                fontSize: '0.85rem', fontWeight: 'bold',
                                letterSpacing: '3px',
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s',
                                borderRadius: '2px', textTransform: 'uppercase',
                            }}
                            onMouseEnter={e => {
                                if (!isLoading) {
                                    e.currentTarget.style.background = T.cyan;
                                    e.currentTarget.style.color = '#000';
                                    e.currentTarget.style.boxShadow = `0 0 28px ${T.cyanAlpha(0.45)}`;
                                }
                            }}
                            onMouseLeave={e => {
                                if (!isLoading) {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = T.cyan;
                                    e.currentTarget.style.boxShadow = 'none';
                                }
                            }}
                        >
                            {isLoading ? (
                                <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' }}>
                                    <span style={{
                                        display:'inline-block', width:'14px', height:'14px',
                                        border:`2px solid ${T.cyanAlpha(0.25)}`,
                                        borderTop:`2px solid ${T.cyan}`,
                                        borderRadius:'50%',
                                        animation:'spin 0.7s linear infinite',
                                    }} />
                                    AUTHENTICATING...
                                </span>
                            ) : '[ INITIATE_HANDSHAKE ]'}
                        </motion.button>
                    </form>

                    {/* Footer */}
                    <div style={{
                        marginTop: '26px', paddingTop: '20px',
                        borderTop: `1px solid ${T.cyanAlpha(0.08)}`,
                        textAlign: 'center',
                        fontFamily: "'Courier New', monospace",
                        fontSize: '0.62rem', color: T.cyanAlpha(0.22),
                        letterSpacing: '2px',
                    }}>
                        HACKATHON_2K26 // ADMIN_PANEL // SECURE_ACCESS
                    </div>
                </div>

                {/* Bottom line */}
                <div style={{
                    height: '1px', width: '100%',
                    background: `linear-gradient(90deg, transparent, ${T.cyanAlpha(0.25)}, transparent)`,
                }} />
            </motion.div>

            {/* ── Global keyframes ────────────────────────────────────────── */}
            <style>{`
                @keyframes scanMove {
                    0%   { top: -2px; }
                    100% { top: 100vh; }
                }
                @keyframes glitchBar {
                    0%, 100% { opacity: 0.3; transform: scaleX(0.3); }
                    50%       { opacity: 1;   transform: scaleX(1);   }
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                input::placeholder { color: rgba(0,229,255,0.22); }
                input:disabled     { opacity: 0.5; cursor: not-allowed; }
            `}</style>
        </div>
    );
};

export default Login;
