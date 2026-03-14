import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const Settings = () => {
    const [settings, setSettings] = useState({
        PASTE_SECURITY: 'true',
        FOCUS_SECURITY: 'true',
        SESSION_DURATION_MS: '3600000' // Default 1 hour
    });

    // Duration State
    const [duration, setDuration] = useState({ hours: 1, minutes: 0, seconds: 0, milis: 0 });
    const [loading, setLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState(null); // 'saving', 'success', 'error'
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/settings`);
            setSettings(res.data);

            // Parse MS to Time Units
            const ms = parseInt(res.data.SESSION_DURATION_MS || '3600000');
            if (!isNaN(ms)) {
                const h = Math.floor(ms / 3600000);
                const m = Math.floor((ms % 3600000) / 60000);
                const s = Math.floor((ms % 60000) / 1000);
                const mi = Math.floor((ms % 1000));
                setDuration({ hours: h, minutes: m, seconds: s, milis: mi });
            }
            setLoading(false);
        } catch (err) {
            console.error("Failed to load settings");
        }
    };

    const toggleSetting = async (key) => {
        const currentVal = settings[key] === 'true' || settings[key] === true;
        const newValue = !currentVal;

        // Optimistic update
        setSettings(prev => ({ ...prev, [key]: String(newValue) }));

        try {
            await axios.post(`${API_URL}/api/settings`, { key, value: String(newValue) });
        } catch (err) {
            console.error("Failed to update setting");
            // Revert on failure
            setSettings(prev => ({ ...prev, [key]: String(!newValue) }));
        }
    };

    const handleDurationChange = (field, val) => {
        setDuration(prev => ({ ...prev, [field]: parseInt(val) || 0 }));
    };

    const saveDuration = async () => {
        setSaveStatus('saving');
        try {
            const totalMs = (duration.hours * 3600000) + (duration.minutes * 60000) + (duration.seconds * 1000) + duration.milis;
            await axios.post(`${API_URL}/api/settings`, { key: 'SESSION_DURATION_MS', value: String(totalMs) });
            setSaveStatus('success');
            setTimeout(() => setSaveStatus(null), 2000);
        } catch (err) {
            console.error("Failed to update duration");
            setSaveStatus('error');
            setTimeout(() => setSaveStatus(null), 2000);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(0,229,255,0.12)', paddingBottom: '16px' }}>
                <h2 style={{ margin: 0, fontFamily: "'Orbitron', sans-serif", fontSize: '0.95rem', letterSpacing: '3px', color: '#fff' }}>SYSTEM_CONTROLS</h2>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* PASTE SECURITY */}
                <div style={{ padding: '18px 22px', border: '1px solid rgba(0,229,255,0.1)', background: 'rgba(5,10,20,0.8)', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.15), transparent)' }} />
                    <div>
                        <h3 style={{ margin: 0, fontFamily: "'Orbitron', sans-serif", fontSize: '0.82rem', letterSpacing: '2px', color: '#fff' }}>PASTE_SECURITY_PROTOCOL</h3>
                        <p style={{ margin: '6px 0 0 0', opacity: 0.5, fontSize: '0.82rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.65)' }}>
                            Block external clipboard data. If OFF, participants can paste freely.
                        </p>
                    </div>
                    <button
                        onClick={() => toggleSetting('PASTE_SECURITY')}
                        style={{
                            padding: '9px 22px', minWidth: '110px',
                            background: (settings.PASTE_SECURITY === 'true' || settings.PASTE_SECURITY === true) ? '#00e5ff' : 'rgba(255,255,255,0.06)',
                            color:      (settings.PASTE_SECURITY === 'true' || settings.PASTE_SECURITY === true) ? '#000'     : 'rgba(255,255,255,0.4)',
                            border: `1px solid ${(settings.PASTE_SECURITY === 'true' || settings.PASTE_SECURITY === true) ? '#00e5ff' : 'rgba(255,255,255,0.1)'}`,
                            fontWeight: 'bold', cursor: 'pointer', borderRadius: '3px',
                            fontFamily: "'Orbitron', sans-serif", fontSize: '0.7rem', letterSpacing: '1px',
                            boxShadow: (settings.PASTE_SECURITY === 'true' || settings.PASTE_SECURITY === true) ? '0 0 14px rgba(0,229,255,0.3)' : 'none',
                            transition: 'all 0.3s',
                        }}
                    >
                        {(settings.PASTE_SECURITY === 'true' || settings.PASTE_SECURITY === true) ? 'ENABLED' : 'DISABLED'}
                    </button>
                </div>

                {/* SESSION DURATION */}
                <div style={{ padding: '18px 22px', border: '1px solid rgba(0,229,255,0.1)', background: 'rgba(5,10,20,0.8)', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.15), transparent)' }} />
                    <div>
                        <h3 style={{ margin: 0, fontFamily: "'Orbitron', sans-serif", fontSize: '0.82rem', letterSpacing: '2px', color: '#fff' }}>SESSION_DURATION</h3>
                        <p style={{ margin: '6px 0 0 0', opacity: 0.5, fontSize: '0.82rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.65)' }}>Exact duration configuration (HR : MIN : SEC : MS).</p>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {['hours', 'minutes', 'seconds', 'milis'].map((field) => (
                            <div key={field} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <input type="number" value={duration[field]}
                                    onChange={(e) => handleDurationChange(field, e.target.value)}
                                    style={{
                                        background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0,229,255,0.2)',
                                        color: '#00e5ff', padding: '9px 6px', width: '58px',
                                        fontFamily: "'Orbitron', sans-serif", fontWeight: 'bold', textAlign: 'center',
                                        outline: 'none', borderRadius: '2px', fontSize: '0.9rem',
                                    }}
                                    onFocus={e => { e.target.style.borderColor = 'rgba(0,229,255,0.6)'; e.target.style.boxShadow = '0 0 8px rgba(0,229,255,0.1)'; }}
                                    onBlur={e  => { e.target.style.borderColor = 'rgba(0,229,255,0.2)'; e.target.style.boxShadow = 'none'; }}
                                />
                                <span style={{ fontSize: '0.55rem', color: 'rgba(0,229,255,0.3)', marginTop: '3px', fontFamily: 'Orbitron, sans-serif', letterSpacing: '1px' }}>{field.toUpperCase()}</span>
                            </div>
                        ))}
                        <button onClick={saveDuration} disabled={saveStatus === 'saving'}
                            style={{
                                padding: '9px 18px', height: '40px', minWidth: '80px', marginLeft: '8px',
                                background: saveStatus === 'success' ? '#00e5ff' : saveStatus === 'error' ? 'rgba(255,0,60,0.15)' : 'transparent',
                                color:      saveStatus === 'success' ? '#000'     : saveStatus === 'error' ? '#ff003c' : 'rgba(0,229,255,0.7)',
                                border:     `1px solid ${saveStatus === 'success' ? '#00e5ff' : saveStatus === 'error' ? '#ff003c' : 'rgba(0,229,255,0.3)'}`,
                                fontWeight: 'bold', cursor: 'pointer', borderRadius: '2px',
                                fontFamily: "'Orbitron', sans-serif", fontSize: '0.68rem', letterSpacing: '1px',
                                transition: 'all 0.3s',
                            }}
                        >
                            {saveStatus === 'saving' ? '...' : saveStatus === 'success' ? '✓ SAVED' : saveStatus === 'error' ? 'ERROR' : 'SAVE'}
                        </button>
                    </div>
                </div>

                {/* COLLEGE NAME */}
                <div style={{ padding: '18px 22px', border: '1px solid rgba(0,229,255,0.1)', background: 'rgba(5,10,20,0.8)', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.15), transparent)' }} />
                    <div>
                        <h3 style={{ margin: 0, fontFamily: "'Orbitron', sans-serif", fontSize: '0.82rem', letterSpacing: '2px', color: '#fff' }}>REPORT_IDENTITY (COLLEGE)</h3>
                        <p style={{ margin: '6px 0 0 0', opacity: 0.5, fontSize: '0.82rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.65)' }}>College name to display on the PDF report header.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input type="text" value={settings.COLLEGE_NAME || ''}
                            onChange={(e) => setSettings(prev => ({ ...prev, COLLEGE_NAME: e.target.value }))}
                            placeholder="COLLEGE NAME"
                            style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0,229,255,0.2)', color: '#fff', padding: '9px 12px', width: '250px', fontFamily: 'Share Tech Mono, monospace', outline: 'none', borderRadius: '2px', fontSize: '0.85rem' }}
                            onFocus={e => { e.target.style.borderColor = 'rgba(0,229,255,0.5)'; }}
                            onBlur={e  => { e.target.style.borderColor = 'rgba(0,229,255,0.2)'; }}
                        />
                        <button onClick={() => axios.post(`${API_URL}/api/settings`, { key: 'COLLEGE_NAME', value: settings.COLLEGE_NAME })}
                            style={{ padding: '9px 16px', background: 'transparent', color: '#00e5ff', border: '1px solid rgba(0,229,255,0.4)', cursor: 'pointer', borderRadius: '2px', fontFamily: "'Orbitron', sans-serif", fontSize: '0.68rem', fontWeight: 'bold', letterSpacing: '1px', transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#00e5ff'; e.currentTarget.style.color = '#000'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#00e5ff'; }}
                        >UPDATE</button>
                    </div>
                </div>

                {/* DEPT NAME */}
                <div style={{ padding: '18px 22px', border: '1px solid rgba(0,229,255,0.1)', background: 'rgba(5,10,20,0.8)', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.15), transparent)' }} />
                    <div>
                        <h3 style={{ margin: 0, fontFamily: "'Orbitron', sans-serif", fontSize: '0.82rem', letterSpacing: '2px', color: '#fff' }}>REPORT_IDENTITY (DEPT)</h3>
                        <p style={{ margin: '6px 0 0 0', opacity: 0.5, fontSize: '0.82rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.65)' }}>Department name to display on the PDF report header.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input type="text" value={settings.DEPT_NAME || ''}
                            onChange={(e) => setSettings(prev => ({ ...prev, DEPT_NAME: e.target.value }))}
                            placeholder="DEPARTMENT NAME"
                            style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0,229,255,0.2)', color: '#fff', padding: '9px 12px', width: '250px', fontFamily: 'Share Tech Mono, monospace', outline: 'none', borderRadius: '2px', fontSize: '0.85rem' }}
                            onFocus={e => { e.target.style.borderColor = 'rgba(0,229,255,0.5)'; }}
                            onBlur={e  => { e.target.style.borderColor = 'rgba(0,229,255,0.2)'; }}
                        />
                        <button onClick={() => axios.post(`${API_URL}/api/settings`, { key: 'DEPT_NAME', value: settings.DEPT_NAME })}
                            style={{ padding: '9px 16px', background: 'transparent', color: '#00e5ff', border: '1px solid rgba(0,229,255,0.4)', cursor: 'pointer', borderRadius: '2px', fontFamily: "'Orbitron', sans-serif", fontSize: '0.68rem', fontWeight: 'bold', letterSpacing: '1px', transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#00e5ff'; e.currentTarget.style.color = '#000'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#00e5ff'; }}
                        >UPDATE</button>
                    </div>
                </div>

                {/* FOCUS SECURITY */}
                <div style={{ padding: '18px 22px', border: '1px solid rgba(0,229,255,0.1)', background: 'rgba(5,10,20,0.8)', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.15), transparent)' }} />
                    <div>
                        <h3 style={{ margin: 0, fontFamily: "'Orbitron', sans-serif", fontSize: '0.82rem', letterSpacing: '2px', color: '#fff' }}>FOCUS_TRAP_PROTOCOL</h3>
                        <p style={{ margin: '6px 0 0 0', opacity: 0.5, fontSize: '0.82rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.65)' }}>Detect and warn when window focus is lost.</p>
                    </div>
                    <button
                        onClick={() => toggleSetting('FOCUS_SECURITY')}
                        style={{
                            padding: '9px 22px', minWidth: '110px',
                            background: (settings.FOCUS_SECURITY === 'true' || settings.FOCUS_SECURITY === true) ? '#00e5ff' : 'rgba(255,255,255,0.06)',
                            color:      (settings.FOCUS_SECURITY === 'true' || settings.FOCUS_SECURITY === true) ? '#000'     : 'rgba(255,255,255,0.4)',
                            border: `1px solid ${(settings.FOCUS_SECURITY === 'true' || settings.FOCUS_SECURITY === true) ? '#00e5ff' : 'rgba(255,255,255,0.1)'}`,
                            fontWeight: 'bold', cursor: 'pointer', borderRadius: '3px',
                            fontFamily: "'Orbitron', sans-serif", fontSize: '0.7rem', letterSpacing: '1px',
                            boxShadow: (settings.FOCUS_SECURITY === 'true' || settings.FOCUS_SECURITY === true) ? '0 0 14px rgba(0,229,255,0.3)' : 'none',
                            transition: 'all 0.3s',
                        }}
                    >
                        {(settings.FOCUS_SECURITY === 'true' || settings.FOCUS_SECURITY === true) ? 'ENABLED' : 'DISABLED'}
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default Settings;
