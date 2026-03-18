import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FaFilePdf, FaFilter, FaGlobe, FaBullseye, FaGraduationCap, FaBolt } from 'react-icons/fa';

// ── Sorting & Filtering Logic ───────────────────────────────────────────────
const SORT_MODES = [
    { value: 'overall',          label: 'Overall (All)',       Icon: FaGlobe      },
    { value: 'score',            label: 'Score Wise',          Icon: FaBullseye   },
    { value: 'ug_score',         label: 'UG Score Wise',       Icon: FaGraduationCap },
    { value: 'pg_score',         label: 'PG Score Wise',       Icon: FaGraduationCap },
    { value: 'score_level_time', label: 'Score + Level + Time',Icon: FaBolt       },
];

const sortCompareFn = (a, b) => {
    const scoreA = (a.patterns_completed || 0) * 25;
    const scoreB = (b.patterns_completed || 0) * 25;
    const levelA = a.patterns_completed || 0;
    const levelB = b.patterns_completed || 0;
    const timeA  = a.total_time || 0;
    const timeB  = b.total_time || 0;

    if (scoreB !== scoreA) return scoreB - scoreA;
    if (levelB !== levelA) return levelB - levelA;
    return timeA - timeB;
};

const applyFilter = (users, mode) => {
    let filtered = [...users];
    if (mode === 'ug_score') filtered = filtered.filter(u => (u.category || '').toUpperCase().includes('UG'));
    if (mode === 'pg_score') filtered = filtered.filter(u => (u.category || '').toUpperCase().includes('PG'));
    filtered.sort(sortCompareFn);
    return filtered;
};

const formatTime = (ms) => {
    if (!ms || ms < 0) return '00:00:00:00';
    const h    = Math.floor(ms / 3600000);
    const m    = Math.floor((ms % 3600000) / 60000);
    const s    = Math.floor((ms % 60000) / 1000);
    const mili = Math.floor((ms % 1000) / 10);
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}:${String(mili).padStart(2,'0')}`;
};

// ── Main Dashboard Component ────────────────────────────────────────────────
const Dashboard = () => {
    const [rawUsers, setRawUsers] = useState([]);
    const [patternCounts, setPatternCounts] = useState({ UG: 4, PG: 4 });
    const [sortMode, setSortMode] = useState('overall');
    const [config, setConfig]     = useState({ COLLEGE_NAME: 'HACKATHON_2K26', DEPT_NAME: 'BCA DEPARTMENT' });
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [leaderboardRes, settingsRes, statsRes] = await Promise.all([
                    axios.get(`${API_URL}/api/leaderboard`),
                    axios.get(`${API_URL}/api/settings`),
                    axios.get(`${API_URL}/api/admin/pattern-stats`)
                ]);
                setRawUsers(leaderboardRes.data);
                if (settingsRes.data) {
                    setConfig({
                        COLLEGE_NAME: settingsRes.data.COLLEGE_NAME || 'HACKATHON_2K26',
                        DEPT_NAME:    settingsRes.data.DEPT_NAME    || 'BCA DEPARTMENT'
                    });
                }
                if (statsRes.data) setPatternCounts(statsRes.data);
            } catch (err) { console.error('Dashboard fetch failed', err); }
        };
        const interval = setInterval(fetchDashboardData, 3000);
        fetchDashboardData();
        return () => clearInterval(interval);
    }, []);

    const users = useMemo(() => applyFilter(rawUsers, sortMode), [rawUsers, sortMode]);

    const stats = {
        total: rawUsers.length,
        ug:    rawUsers.filter(u => (u.category || '').toUpperCase().includes('UG') && !u.category.toUpperCase().includes('PG')).length,
        pg:    rawUsers.filter(u => (u.category || '').toUpperCase().includes('PG')).length,
        active: rawUsers.filter(u => u.status === 'active').length,
        qualified: rawUsers.filter(u => u.status === 'finished').length,
        disqualified: rawUsers.filter(u => u.status === 'disqualified').length,
    };

    const generatePDF = () => {
        const doc = new jsPDF();
        doc.setFillColor(0, 8, 16);
        doc.rect(0, 0, 210, 42, 'F');
        doc.setTextColor(0, 229, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text(config.COLLEGE_NAME.toUpperCase(), 105, 14, { align: 'center' });
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(13);
        doc.text(config.DEPT_NAME.toUpperCase(), 105, 24, { align: 'center' });
        doc.setFontSize(9);
        doc.setTextColor(130, 130, 130);
        doc.text(`LEADERBOARD — SORT: ${sortMode.toUpperCase()} — ${new Date().toLocaleString()}`, 105, 33, { align: 'center' });

        const tableData = users.map((u, i) => [
            i === 0 ? '🥇' : `#${i + 1}`,
            u.lot_number,
            u.lot_name || '',
            u.department || '',
            `${(u.patterns_completed || 0) * 25}/100`,
            `LVL ${u.patterns_completed || 0}`,
            formatTime(u.total_time),
            u.lines_of_code || 0,
            (u.category || '—').toUpperCase(),
            u.status.toUpperCase()
        ]);

        autoTable(doc, {
            startY: 46,
            head: [['RANK','ROLL NO','NAME','DEPT','SCORE','LEVEL','TIME','LOC','CAT','STATUS']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [0, 40, 60], textColor: [0, 229, 255], fontStyle: 'bold', fontSize: 8 },
            styles:     { fontSize: 8, cellPadding: 3 },
            alternateRowStyles: { fillColor: [235, 245, 255] }
        });

        doc.save(`${config.COLLEGE_NAME}_Leaderboard_${sortMode}.pdf`);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard-container">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,229,255,0.12)', paddingBottom: '20px', marginBottom: '28px' }}>
                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'Orbitron, sans-serif', fontSize: '1rem', color: '#fff' }}>
                    <span style={{ width: '9px', height: '9px', background: '#00e5ff', borderRadius: '50%', boxShadow: '0 0 10px #00e5ff' }} />
                    LIVE_LEADERBOARD
                </h2>
                <div style={{ display: 'flex', gap: '14px' }}>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={generatePDF}
                        style={{ background: '#00e5ff', color: '#000', border: 'none', padding: '8px 18px', borderRadius: '3px', fontWeight: 'bold', fontFamily: 'Orbitron, sans-serif', fontSize: '0.68rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <FaFilePdf /> EXPORT PDF
                    </motion.button>
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', marginBottom: '28px' }}>
                <StatCard label="TOTAL"        value={stats.total}        color="#fff"    />
                <StatCard label="UG"           value={stats.ug}           color="#00a2ff" />
                <StatCard label="PG"           value={stats.pg}           color="#7c3aed" />
                <StatCard label="ACTIVE"       value={stats.active}       color="#00e5ff" />
                <StatCard label="QUALIFIED"    value={stats.qualified}     color="#00e5ff" />
                <StatCard label="DISQUALIFIED" value={stats.disqualified} color="#ff003c" />
            </div>

            {/* Table wrapper */}
            <div style={{ background: '#050a14', border: '1px solid rgba(0,229,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                {/* Filters */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', borderBottom: '1px solid rgba(0,229,255,0.08)', background: 'rgba(0,229,255,0.02)' }}>
                    <FaFilter style={{ color: 'rgba(0,229,255,0.5)', fontSize: '0.8rem' }} />
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {SORT_MODES.map(({ value, label, Icon }) => (
                            <button key={value} onClick={() => setSortMode(value)}
                                style={{ padding: '5px 14px', background: sortMode === value ? '#00e5ff' : 'transparent', color: sortMode === value ? '#000' : 'rgba(0,229,255,0.5)', border: `1px solid ${sortMode === value ? '#00e5ff' : 'rgba(0,229,255,0.2)'}`, borderRadius: '3px', fontFamily: 'Orbitron, sans-serif', fontSize: '0.62rem', fontWeight: 'bold', cursor: 'pointer' }}>
                                <Icon style={{ marginRight: '6px' }} /> {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table content */}
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'rgba(0,229,255,0.03)', borderBottom: '1px solid rgba(0,229,255,0.1)' }}>
                                <th style={{ padding: '15px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>RANK</th>
                                <th style={{ padding: '15px', textAlign: 'left',   color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>ROLL NO</th>
                                <th style={{ padding: '15px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>SCORE</th>
                                <th style={{ padding: '15px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>FINISHED LEVEL</th>
                                <th style={{ padding: '15px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>TIME</th>
                                <th style={{ padding: '15px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>LOC</th>
                                <th style={{ padding: '15px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>STATUS</th>
                                <th style={{ padding: '15px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>CATEGORY</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence mode="popLayout">
                                {users.map((user, index) => (
                                    <LeaderboardRow key={user.lot_number} user={user} index={index} patternCounts={patternCounts} />
                                ))}
                            </AnimatePresence>
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '60px', color: 'rgba(0,229,255,0.2)', fontFamily: 'Orbitron, sans-serif', fontSize: '0.78rem' }}>
                                        /// NO SIGNALS DETECTED...
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
};

// ── LeaderboardRow: Expand-on-hover logic ───────────────────────────────────
const LeaderboardRow = ({ user, index, patternCounts }) => {
    const [isHovered, setIsHovered] = useState(false);
    const catTotal = patternCounts[user.category?.toUpperCase()] || 4;
    const score = Math.round(((user.patterns_completed || 0) / catTotal) * 100);

    return (
        <motion.tr
            layout
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{ 
                borderBottom: '1px solid rgba(0,229,255,0.05)',
                background: isHovered ? 'rgba(0,229,255,0.04)' : 'transparent',
                transition: 'background 0.2s ease'
            }}
        >
            {/* RANK */}
            <td style={{ textAlign: 'center', fontWeight: 'bold', color: index < 3 ? 'inherit' : '#444', fontSize: '1rem', fontFamily: 'Orbitron, sans-serif' }}>
                {index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
            </td>

            {/* ROLL NO — Expand in-line */}
            <td style={{ padding: '12px 15px', verticalAlign: 'top' }}>
                <div style={{ fontWeight: 'bold', color: isHovered ? '#00e5ff' : '#fff', fontFamily: 'Share Tech Mono, monospace', letterSpacing: '1px' }}>
                    {user.lot_number}
                </div>
                <motion.div
                    initial={false}
                    animate={{ height: isHovered ? 'auto' : 0, opacity: isHovered ? 1 : 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden' }}
                >
                    <div style={{ marginTop: '8px', borderLeft: '2px solid #00e5ff', paddingLeft: '10px' }}>
                        <div style={{ fontSize: '0.78rem', color: '#fff', fontFamily: 'Share Tech Mono, monospace', fontWeight: 'bold' }}>
                            {user.lot_name || '—'}
                        </div>
                        <div style={{ fontSize: '0.6rem', color: 'rgba(0,229,255,0.6)', fontFamily: 'Orbitron, sans-serif', letterSpacing: '1px', marginTop: '2px', textTransform: 'uppercase' }}>
                            {user.department || 'GENERAL'}
                        </div>
                        {user.year && (
                            <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'Orbitron, sans-serif', letterSpacing: '1px', marginTop: '1px' }}>
                                YEAR_{user.year}
                            </div>
                        )}
                    </div>
                </motion.div>
            </td>

            {/* SCORE */}
            <td style={{ textAlign: 'center', verticalAlign: 'top', paddingTop: '12px' }}>
                <div style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 'bold', color: '#00e5ff' }}>
                    {score}<span style={{fontSize:'0.7rem', opacity: 0.5}}>/100</span>
                </div>
            </td>

            {/* FINISHED LEVEL */}
            <td style={{ textAlign: 'center', verticalAlign: 'top', paddingTop: '12px' }}>
                <div style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 'bold', fontSize: '0.82rem', color: (user.patterns_completed || 0) > 0 ? '#00a2ff' : 'rgba(255,255,255,0.15)' }}>
                    LVL {user.patterns_completed || 0}
                </div>
            </td>

            {/* TIME */}
            <td style={{ textAlign: 'center', verticalAlign: 'top', paddingTop: '12px', fontFamily: 'Share Tech Mono, monospace', color: '#00e5ff', fontSize: '0.9rem' }}>
                {formatTime(user.total_time)}
            </td>

            {/* LOC */}
            <td style={{ textAlign: 'center', verticalAlign: 'top', paddingTop: '12px', color: 'rgba(255,255,255,0.5)', fontFamily: 'Share Tech Mono, monospace' }}>
                {user.lines_of_code || 0}
            </td>

            {/* STATUS */}
            <td style={{ textAlign: 'center', verticalAlign: 'top', paddingTop: '12px' }}>
                <StatusBadge status={user.status} />
            </td>

            {/* CATEGORY */}
            <td style={{ textAlign: 'center', verticalAlign: 'top', paddingTop: '12px' }}>
                <CategoryBadge category={user.category} />
            </td>
        </motion.tr>
    );
};

// ── Sub-components ───────────────────────────────────────────────────────────
const StatCard = ({ label, value, color }) => (
    <div style={{ background: '#050a14', border: `1px solid ${color}22`, padding: '16px 18px', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ fontSize: '0.58rem', color, letterSpacing: '2px', marginBottom: '6px', fontFamily: 'Orbitron, sans-serif', opacity: 0.75 }}>{label}</div>
        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff', fontFamily: 'Orbitron, sans-serif', textShadow: `0 0 18px ${color}40` }}>{value}</div>
        <div style={{ position: 'absolute', right: '-8px', top: '-8px', width: '50px', height: '50px', background: color, filter: 'blur(30px)', opacity: 0.12 }} />
    </div>
);

const StatusBadge = ({ status }) => {
    const map = {
        active:       { color: '#00a2ff', bg: 'rgba(0,162,255,0.1)' },
        finished:     { color: '#00e5ff', bg: 'rgba(0,229,255,0.1)' },
        disqualified: { color: '#ff003c', bg: 'rgba(255,0,60,0.1)'  },
    };
    const { color = '#fff', bg = '#1a1a1a' } = map[status] || {};
    return (
        <span style={{ background: bg, color, padding: '3px 9px', borderRadius: '3px', fontSize: '0.62rem', fontWeight: 'bold', fontFamily: 'Orbitron, sans-serif', border: `1px solid ${color}30`, textTransform: 'uppercase' }}>
            {status}
        </span>
    );
};

const CategoryBadge = ({ category }) => {
    const color = (category || '').toUpperCase().includes('PG') ? '#7c3aed' : '#00a2ff';
    return (
        <span style={{ color, padding: '3px 12px', borderRadius: '3px', fontSize: '0.7rem', fontWeight: 'bold', fontFamily: 'Orbitron, sans-serif', border: `1px solid ${color}35` }}>
            {(category || '').toUpperCase()}
        </span>
    );
};

export default Dashboard;
