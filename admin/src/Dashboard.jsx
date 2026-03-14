import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FaFilePdf, FaFilter, FaTrophy, FaBullseye, FaGraduationCap, FaBolt, FaGlobe } from 'react-icons/fa';

// ── Sorting functions ────────────────────────────────────────────────────────
const SORT_MODES = [
    { value: 'overall',          label: 'Overall (All)',       Icon: FaGlobe      },
    { value: 'score',            label: 'Score Wise',          Icon: FaBullseye   },
    { value: 'ug_score',         label: 'UG Score Wise',       Icon: FaGraduationCap },
    { value: 'pg_score',         label: 'PG Score Wise',       Icon: FaGraduationCap },
    { value: 'score_level_time', label: 'Score + Level + Time',Icon: FaBolt       },
];

const sortCompareFn = (a, b, mode) => {
    const scoreA = (a.patterns_completed || 0) * 25;
    const scoreB = (b.patterns_completed || 0) * 25;
    const levelA = a.patterns_completed || 0;
    const levelB = b.patterns_completed || 0;
    const timeA  = a.total_time || 0;
    const timeB  = b.total_time || 0;

    // Score desc → level desc → time asc
    if (scoreB !== scoreA) return scoreB - scoreA;
    if (levelB !== levelA) return levelB - levelA;
    return timeA - timeB;
};

const applyFilter = (users, mode) => {
    let filtered = [...users];

    if (mode === 'ug_score')    filtered = filtered.filter(u => (u.category || '').toUpperCase().includes('UG'));
    if (mode === 'pg_score')    filtered = filtered.filter(u => (u.category || '').toUpperCase().includes('PG'));

    // All modes sort by: score DESC → level DESC → time ASC
    filtered.sort((a, b) => sortCompareFn(a, b, mode));
    return filtered;
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const formatTime = (ms) => {
    if (!ms) return '00:00:00';
    const h    = Math.floor(ms / 3600000);
    const m    = Math.floor((ms % 3600000) / 60000);
    const s    = Math.floor((ms % 60000) / 1000);
    const mili = Math.floor((ms % 1000) / 10);
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}:${String(mili).padStart(2,'0')}`;
};

const Dashboard = () => {
    const [rawUsers, setRawUsers] = useState([]);
    const [sortMode, setSortMode] = useState('overall');
    const [config, setConfig]     = useState({ COLLEGE_NAME: 'HACKATHON_2K26', DEPT_NAME: 'BCA DEPARTMENT' });
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [leaderboardRes, settingsRes] = await Promise.all([
                    axios.get(`${API_URL}/api/leaderboard`),
                    axios.get(`${API_URL}/api/settings`)
                ]);
                setRawUsers(leaderboardRes.data);
                if (settingsRes.data) {
                    setConfig({
                        COLLEGE_NAME: settingsRes.data.COLLEGE_NAME || 'HACKATHON_2K26',
                        DEPT_NAME:    settingsRes.data.DEPT_NAME    || 'BCA DEPARTMENT'
                    });
                }
            } catch (err) { console.error('Dashboard fetch failed', err); }
        };
        const interval = setInterval(fetchDashboardData, 3000);
        fetchDashboardData();
        return () => clearInterval(interval);
    }, []);

    // Derived sorted + filtered list
    const users = useMemo(() => applyFilter(rawUsers, sortMode), [rawUsers, sortMode]);

    // Stats (always calculated from rawUsers)
    const totalUsers        = rawUsers.length;
    const activeUsers       = rawUsers.filter(u => u.status === 'active').length;
    const finishedUsers     = rawUsers.filter(u => u.status === 'finished').length;
    const disqualifiedUsers = rawUsers.filter(u => u.status === 'disqualified').length;
    const ugCount           = rawUsers.filter(u => (u.category || '').toUpperCase().includes('UG') && !u.category.toUpperCase().includes('PG')).length;
    const pgCount           = rawUsers.filter(u => (u.category || '').toUpperCase().includes('PG')).length;

    // PDF Export
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
            `${(u.patterns_completed || 0) * 25}/100`,
            `LVL ${u.patterns_completed || 0}`,
            u.no_of_loops || 0,
            formatTime(u.total_time),
            u.lines_of_code || 0,
            u.warnings || 0,
            (u.category || '—').toUpperCase(),
            u.status.toUpperCase()
        ]);

        autoTable(doc, {
            startY: 46,
            head: [['RANK','ROLL NO','SCORE','LEVEL','LOOPS','TIME','LOC','WARN','CAT','STATUS']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [0, 40, 60], textColor: [0, 229, 255], fontStyle: 'bold', fontSize: 8 },
            styles:     { fontSize: 8, cellPadding: 3 },
            alternateRowStyles: { fillColor: [235, 245, 255] }
        });

        doc.save(`${config.COLLEGE_NAME}_Leaderboard_${sortMode}.pdf`);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="dashboard-container"
        >
            {/* ── Header Row ──────────────────────────────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,229,255,0.12)', paddingBottom: '20px', marginBottom: '28px' }}>
                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'Orbitron, sans-serif', fontSize: '1rem', letterSpacing: '2px', color: '#fff' }}>
                    <span style={{ width: '9px', height: '9px', background: '#00e5ff', borderRadius: '50%', boxShadow: '0 0 10px #00e5ff', animation: 'pulse 2s infinite', flexShrink: 0 }} />
                    LIVE_LEADERBOARD
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    {/* Sync badge */}
                    <div style={{ fontSize: '0.68rem', color: 'rgba(0,229,255,0.4)', fontFamily: 'Share Tech Mono, monospace', letterSpacing: '1px' }}>
                        SYNC: AUTO (3s)
                    </div>
                    {/* PDF */}
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={generatePDF}
                        style={{ background: '#00e5ff', color: '#000', border: 'none', padding: '8px 18px', borderRadius: '3px', fontWeight: 'bold', fontFamily: 'Orbitron, sans-serif', fontSize: '0.68rem', letterSpacing: '1px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px', boxShadow: '0 0 15px rgba(0,229,255,0.3)' }}>
                        <FaFilePdf /> EXPORT PDF
                    </motion.button>
                </div>
            </div>

            {/* ── Stat Cards ──────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', marginBottom: '28px' }}>
                <StatCard label="TOTAL"        value={totalUsers}        color="#fff"    />
                <StatCard label="UG"           value={ugCount}           color="#00a2ff" />
                <StatCard label="PG"           value={pgCount}           color="#7c3aed" />
                <StatCard label="ACTIVE"       value={activeUsers}       color="#00e5ff" />
                <StatCard label="QUALIFIED"    value={finishedUsers}     color="#00e5ff" />
                <StatCard label="DISQUALIFIED" value={disqualifiedUsers} color="#ff003c" />
            </div>

            {/* ── Table Wrapper ───────────────────────────────────────── */}
            <div style={{ background: '#050a14', border: '1px solid rgba(0,229,255,0.1)', borderRadius: '4px', overflow: 'hidden', boxShadow: '0 0 30px rgba(0,0,0,0.5)' }}>

                {/* Filter Bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', borderBottom: '1px solid rgba(0,229,255,0.08)', background: 'rgba(0,229,255,0.02)' }}>
                    <FaFilter style={{ color: 'rgba(0,229,255,0.5)', fontSize: '0.8rem', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.65rem', fontFamily: 'Orbitron, sans-serif', color: 'rgba(0,229,255,0.45)', letterSpacing: '2px', flexShrink: 0 }}>
                        FILTER_MODE:
                    </span>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {SORT_MODES.map(({ value, label, Icon }) => (
                            <button
                                key={value}
                                onClick={() => setSortMode(value)}
                                style={{
                                    padding: '5px 14px',
                                    background:   sortMode === value ? '#00e5ff'                     : 'transparent',
                                    color:        sortMode === value ? '#000'                        : 'rgba(0,229,255,0.5)',
                                    border:       `1px solid ${sortMode === value ? '#00e5ff' : 'rgba(0,229,255,0.2)'}`,
                                    borderRadius: '3px',
                                    fontFamily:   'Orbitron, sans-serif',
                                    fontSize:     '0.62rem',
                                    fontWeight:   'bold',
                                    letterSpacing:'1px',
                                    cursor:       'pointer',
                                    transition:   'all 0.2s',
                                    boxShadow:    sortMode === value ? '0 0 10px rgba(0,229,255,0.3)' : 'none',
                                    whiteSpace:   'nowrap',
                                    display:      'flex',
                                    alignItems:   'center',
                                    gap:          '6px',
                                }}
                                onMouseEnter={e => { if (sortMode !== value) { e.currentTarget.style.background = 'rgba(0,229,255,0.08)'; e.currentTarget.style.color = '#00e5ff'; }}}
                                onMouseLeave={e => { if (sortMode !== value) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(0,229,255,0.5)'; }}}
                            >
                                <Icon style={{ fontSize: '0.7rem', flexShrink: 0 }} />
                                {label}
                            </button>
                        ))}
                    </div>
                    {/* Result count */}
                    <div style={{ marginLeft: 'auto', fontSize: '0.62rem', color: 'rgba(0,229,255,0.3)', fontFamily: 'Share Tech Mono, monospace', flexShrink: 0 }}>
                        {users.length} RECORD{users.length !== 1 ? 'S' : ''}
                    </div>
                </div>

                {/* Table */}
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ minWidth: '900px' }}>
                        <thead>
                            <tr style={{ background: 'rgba(0,229,255,0.03)' }}>
                                <th style={{ width: '55px', textAlign: 'center' }}>RANK</th>
                                <th>ROLL NO</th>
                                <th style={{ color: '#00e5ff', textAlign: 'center' }}>SCORE</th>
                                <th style={{ textAlign: 'center' }}>FINISHED LEVEL</th>
                                <th style={{ textAlign: 'center' }}>LOOP COUNT</th>
                                <th style={{ textAlign: 'center' }}>TIME (HR:MN:SC:MS)</th>
                                <th style={{ textAlign: 'center' }}>LOC</th>
                                <th style={{ textAlign: 'center' }}>WARNING</th>
                                <th style={{ textAlign: 'center' }}>STATUS</th>
                                <th style={{ textAlign: 'center' }}>CATEGORY</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence mode="popLayout">
                                {users.map((user, index) => (
                                    <motion.tr
                                        key={user.lot_number}
                                        layout
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ delay: index * 0.04, duration: 0.3 }}
                                        style={{ borderBottom: '1px solid rgba(0,229,255,0.05)' }}
                                    >
                                        {/* RANK */}
                                        <td style={{ textAlign: 'center', fontWeight: 'bold', color: index < 3 ? 'inherit' : '#444', fontSize: '1rem', fontFamily: 'Orbitron, sans-serif' }}>
                                            {index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                                        </td>

                                        {/* ROLL NO + Name */}
                                        <td>
                                            <div style={{ fontWeight: 'bold', color: '#fff', fontFamily: 'Share Tech Mono, monospace', letterSpacing: '1px' }}>
                                                {user.lot_number}
                                            </div>
                                            {user.lot_name && (
                                                <div style={{ fontSize: '0.7rem', color: 'rgba(0,229,255,0.4)', marginTop: '2px' }}>
                                                    {user.lot_name}
                                                </div>
                                            )}
                                        </td>

                                        {/* SCORE */}
                                        <td style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: '2px', fontFamily: 'Orbitron, sans-serif', fontWeight: 'bold', fontSize: '1.1rem', color: '#00e5ff', textShadow: '0 0 10px rgba(0,229,255,0.4)' }}>
                                                {(user.patterns_completed || 0) * 25}
                                                <span style={{ fontSize: '0.6rem', color: 'rgba(0,229,255,0.35)' }}>/100</span>
                                            </div>
                                        </td>

                                        {/* FINISHED LEVEL */}
                                        <td style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: 'Orbitron, sans-serif', fontWeight: 'bold', fontSize: '0.82rem', color: (user.patterns_completed || 0) > 0 ? '#00a2ff' : 'rgba(255,255,255,0.15)' }}>
                                                LVL&nbsp;{user.patterns_completed || 0}
                                                <span style={{ fontSize: '0.55rem', color: 'rgba(0,229,255,0.25)' }}>/ 4</span>
                                            </div>
                                        </td>

                                        {/* LOOP COUNT */}
                                        <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#ffc107', fontFamily: 'Share Tech Mono, monospace' }}>
                                            {user.no_of_loops || 0}
                                        </td>

                                        {/* TIME */}
                                        <td style={{ textAlign: 'center', fontFamily: 'Share Tech Mono, monospace', color: '#00e5ff', fontSize: '0.9rem' }}>
                                            {formatTime(user.total_time)}
                                        </td>

                                        {/* LOC */}
                                        <td style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontFamily: 'Share Tech Mono, monospace' }}>
                                            {user.lines_of_code || 0}
                                        </td>

                                        {/* WARNING */}
                                        <td style={{ textAlign: 'center' }}>
                                            {(user.warnings || 0) > 0
                                                ? <span style={{ color: '#ff003c', fontWeight: 'bold', fontSize: '0.85rem' }}>⚠️ {user.warnings}</span>
                                                : <span style={{ opacity: 0.2, fontSize: '0.9rem' }}>—</span>
                                            }
                                        </td>

                                        {/* STATUS */}
                                        <td style={{ textAlign: 'center' }}>
                                            <StatusBadge status={user.status} />
                                        </td>

                                        {/* CATEGORY */}
                                        <td style={{ textAlign: 'center' }}>
                                            <CategoryBadge category={user.category} />
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>

                            {users.length === 0 && (
                                <tr>
                                    <td colSpan="10" style={{ textAlign: 'center', padding: '60px', color: 'rgba(0,229,255,0.2)', fontFamily: 'Orbitron, sans-serif', fontSize: '0.78rem', letterSpacing: '3px' }}>
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

// ── Sub-components ───────────────────────────────────────────────────────────
const StatCard = ({ label, value, color }) => (
    <div style={{ background: '#050a14', border: `1px solid ${color}22`, padding: '16px 18px', borderRadius: '4px', position: 'relative', overflow: 'hidden', transition: 'border-color 0.3s' }}>
        <div style={{ fontSize: '0.58rem', color, letterSpacing: '2px', marginBottom: '6px', fontFamily: 'Orbitron, sans-serif', opacity: 0.75 }}>{label}</div>
        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff', fontFamily: 'Orbitron, sans-serif', textShadow: `0 0 18px ${color}40` }}>{value}</div>
        <div style={{ position: 'absolute', right: '-8px', top: '-8px', width: '50px', height: '50px', background: color, filter: 'blur(30px)', opacity: 0.12 }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${color}55, transparent)` }} />
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
        <span style={{ background: bg, color, padding: '3px 9px', borderRadius: '3px', fontSize: '0.62rem', fontWeight: 'bold', fontFamily: 'Orbitron, sans-serif', border: `1px solid ${color}30`, textTransform: 'uppercase', letterSpacing: '1px', boxShadow: `0 0 6px ${color}18` }}>
            {status}
        </span>
    );
};

const CategoryBadge = ({ category }) => {
    const cat = (category || '').toUpperCase();
    const isPG = cat.includes('PG');
    const isUG = cat.includes('UG') && !isPG;
    const color = isPG ? '#7c3aed' : isUG ? '#00a2ff' : '#555';
    const bg    = isPG ? 'rgba(124,58,237,0.12)' : isUG ? 'rgba(0,162,255,0.1)' : 'rgba(85,85,85,0.1)';
    const label = isPG ? 'PG' : isUG ? 'UG' : '—';
    return (
        <span style={{ background: bg, color, padding: '3px 12px', borderRadius: '3px', fontSize: '0.7rem', fontWeight: 'bold', fontFamily: 'Orbitron, sans-serif', border: `1px solid ${color}35`, letterSpacing: '2px', boxShadow: `0 0 6px ${color}18` }}>
            {label}
        </span>
    );
};

export default Dashboard;
