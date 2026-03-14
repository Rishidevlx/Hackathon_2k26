import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    FaTrophy, FaCode, FaUsers, FaSignOutAlt, FaCog, FaShieldAlt
} from 'react-icons/fa';

const NAV_ITEMS = [
    { to: '/dashboard',    Icon: FaTrophy,    label: 'LEADERBOARD' },
    { to: '/patterns',     Icon: FaCode,       label: 'PATTERNS'    },
    { to: '/participants', Icon: FaUsers,      label: 'PARTICIPANTS'},
    { to: '/settings',     Icon: FaCog,        label: 'SETTINGS'    },
];

const Sidebar = () => {
    const navigate  = useNavigate();
    const location  = useLocation();

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        navigate('/');
    };

    return (
        <div className="sidebar">

            {/* ── Brand Header ───────────────────────────────────── */}
            <div className="sidebar-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div style={{
                        width: '32px', height: '32px',
                        border: '1.5px solid rgba(0,229,255,0.4)',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(0,229,255,0.06)',
                        boxShadow: '0 0 12px rgba(0,229,255,0.15)',
                        flexShrink: 0,
                    }}>
                        <FaShieldAlt style={{ color: '#00e5ff', fontSize: '0.85rem' }} />
                    </div>
                    <div>
                        <span className="sidebar-brand">HACKATHON</span>
                        <span className="sidebar-brand" style={{ color: '#00a2ff', letterSpacing: '4px' }}>2K26</span>
                    </div>
                </div>
                <span className="sidebar-sub">// ADMIN_PANEL //</span>
            </div>

            {/* ── Nav Section Label ──────────────────────────────── */}
            <div style={{
                padding: '18px 16px 6px',
                fontSize: '0.58rem',
                fontFamily: "'Orbitron', sans-serif",
                color: 'rgba(0,229,255,0.3)',
                letterSpacing: '3px',
            }}>
                NAVIGATION
            </div>

            {/* ── Nav Items ──────────────────────────────────────── */}
            <nav style={{ flex: 1, padding: '4px 12px 12px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {NAV_ITEMS.map(({ to, Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <Icon />
                        {label}
                    </NavLink>
                ))}
            </nav>

            {/* ── System Status ──────────────────────────────────── */}
            <div style={{
                margin: '0 12px 12px',
                padding: '10px 12px',
                background: 'rgba(0,229,255,0.03)',
                border: '1px solid rgba(0,229,255,0.1)',
                borderRadius: '3px',
                fontSize: '0.6rem',
                fontFamily: "'Share Tech Mono', monospace",
                color: 'rgba(0,229,255,0.35)',
                lineHeight: '1.7',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{
                        width: '6px', height: '6px',
                        background: '#00e5ff',
                        borderRadius: '50%',
                        boxShadow: '0 0 6px #00e5ff',
                        animation: 'pulse 2s infinite'
                    }} />
                    SYS_STATUS: ONLINE
                </div>
                <div style={{ marginTop: '4px', opacity: 0.7 }}>
                    DB: TIDB_CLUSTER [OK]
                </div>
            </div>

            {/* ── Logout ─────────────────────────────────────────── */}
            <div className="sidebar-logout">
                <div
                    className="nav-item"
                    onClick={handleLogout}
                    style={{
                        color: 'rgba(255,0,60,0.55)',
                        borderColor: 'transparent',
                        margin: 0,
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.color = '#ff003c';
                        e.currentTarget.style.background = 'rgba(255,0,60,0.08)';
                        e.currentTarget.style.borderColor = 'rgba(255,0,60,0.25)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.color = 'rgba(255,0,60,0.55)';
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = 'transparent';
                    }}
                >
                    <FaSignOutAlt style={{ fontSize: '0.85rem' }} />
                    LOGOUT
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
