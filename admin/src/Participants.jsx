import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTrash, FaEye, FaCode, FaTimes } from 'react-icons/fa';

const Participants = () => {
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null); // For Code View Modal
    const [deleteConfirm, setDeleteConfirm] = useState(null); // For Delete Confirmation
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const [selectedIds, setSelectedIds] = useState([]);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        fetchParticipants();
        const interval = setInterval(fetchParticipants, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const fetchParticipants = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/admin/participants`);
            setParticipants(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch participants");
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await axios.delete(`${API_URL}/api/admin/participants/${deleteConfirm.lot_number}`);
            setParticipants(participants.filter(p => p.lot_number !== deleteConfirm.lot_number));
            setDeleteConfirm(null);
        } catch (err) {
            console.error("Failed to delete user");
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} users?`)) return;

        setIsBulkDeleting(true);
        try {
            // Delete one by one as there is no bulk endpoint
            await Promise.all(selectedIds.map(id =>
                axios.delete(`${API_URL}/api/admin/participants/${id}`)
            ));
            setParticipants(participants.filter(p => !selectedIds.includes(p.lot_number)));
            setSelectedIds([]);
        } catch (err) {
            console.error("Bulk delete failed");
        } finally {
            setIsBulkDeleting(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredParticipants.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredParticipants.map(p => p.lot_number));
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const formatTime = (ms) => {
        if (!ms) return "00:00:00";
        const h = Math.floor(ms / 3600000).toString().padStart(2, '0');
        const m = Math.floor((ms % 3600000) / 60000).toString().padStart(2, '0');
        const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    // Helper to parse code_data
    const parseCodeData = (data) => {
        if (!data) return { "Main": "No code submitted." };
        try {
            // Try parsing as JSON first (codeMap)
            const parsed = JSON.parse(data);
            if (typeof parsed === 'object') {
                // If it's the new nested structure { language, map }
                if (parsed.map) return parsed.map;
                return parsed;
            }
            return { "Main": data }; // fallback
        } catch (e) {
            return { "Main": data }; // plain text fallback
        }
    };

    // Filter Logic
    const filteredParticipants = participants.filter(user => {
        const term = searchTerm.toLowerCase();
        const matchesSearch = (user.lot_name?.toLowerCase() || '').includes(term) ||
            (user.lot_number?.toString().toLowerCase() || '').includes(term) ||
            (user.college_name?.toLowerCase() || '').includes(term);

        const matchesFilter = filterStatus === 'all' || user.status === filterStatus;

        return matchesSearch && matchesFilter;
    });

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="participants-page">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(0,229,255,0.12)', paddingBottom: '16px', marginBottom: '0' }}>
                <h2 style={{ margin: 0, fontFamily: "'Orbitron', sans-serif", fontSize: '0.95rem', letterSpacing: '3px', color: '#fff' }}>PARTICIPANT_DATABASE</h2>
                <span style={{ marginLeft: 'auto', fontSize: '0.62rem', color: 'rgba(0,229,255,0.3)', fontFamily: 'Share Tech Mono, monospace' }}>{filteredParticipants.length} RECORDS</span>
            </div>

            {/* CONTROLS */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', marginTop: '20px', alignItems: 'center' }}>
                <input
                    type="text"
                    placeholder="Search by Name, Lot #, or College..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        padding: '10px 15px',
                        background: 'rgba(0,0,0,0.4)',
                        border: '1px solid rgba(0,229,255,0.15)',
                        color: '#fff',
                        borderRadius: '3px',
                        flex: 1,
                        outline: 'none',
                        fontFamily: 'Share Tech Mono, monospace',
                        fontSize: '0.88rem',
                    }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(0,229,255,0.45)'; e.target.style.boxShadow = '0 0 10px rgba(0,229,255,0.07)'; }}
                    onBlur={e  => { e.target.style.borderColor = 'rgba(0,229,255,0.15)'; e.target.style.boxShadow = 'none'; }}
                />
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{
                        padding: '10px 15px',
                        background: 'rgba(0,0,0,0.4)',
                        border: '1px solid rgba(0,229,255,0.15)',
                        color: '#fff',
                        borderRadius: '3px',
                        outline: 'none',
                        cursor: 'pointer',
                        fontFamily: 'Orbitron, sans-serif',
                        fontSize: '0.68rem',
                        letterSpacing: '1px',
                    }}
                >
                    <option value="all">ALL STATUS</option>
                    <option value="active">Active</option>
                    <option value="finished">Finished</option>
                    <option value="disqualified">Disqualified</option>
                </select>

                {selectedIds.length > 0 && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={handleBulkDelete}
                        disabled={isBulkDeleting}
                        style={{
                            padding: '10px 18px',
                            background: 'rgba(255,0,60,0.12)',
                            color: '#ff003c',
                            border: '1px solid rgba(255,0,60,0.4)',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontFamily: 'Orbitron, sans-serif',
                            fontSize: '0.68rem',
                            fontWeight: 'bold',
                            letterSpacing: '1px',
                            boxShadow: '0 0 12px rgba(255,0,60,0.15)'
                        }}
                    >
                        {isBulkDeleting ? 'TERMINATING...' : `DELETE (${selectedIds.length})`}
                    </motion.button>
                )}
            </div>

            <div className="table-container">
                <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
                    <thead>
                        <tr style={{ background: 'rgba(0,229,255,0.03)', borderBottom: '1px solid rgba(0,229,255,0.2)' }}>
                            <th style={{ padding: '13px 15px', textAlign: 'center' }}>
                                <input type="checkbox" onChange={toggleSelectAll}
                                    checked={selectedIds.length === filteredParticipants.length && filteredParticipants.length > 0}
                                    style={{ cursor: 'pointer', transform: 'scale(1.1)', accentColor: '#00e5ff' }}
                                />
                            </th>
                            <th style={{ padding: '13px 15px', textAlign: 'left'   }}>ROLL NO</th>
                            <th style={{ padding: '13px 15px', textAlign: 'center' }}>SCORE</th>
                            <th style={{ padding: '13px 15px', textAlign: 'center' }}>LOOP COUNT</th>
                            <th style={{ padding: '13px 15px', textAlign: 'center' }}>TIME</th>
                            <th style={{ padding: '13px 15px', textAlign: 'center' }}>LOC</th>
                            <th style={{ padding: '13px 15px', textAlign: 'center' }}>WARNING</th>
                            <th style={{ padding: '13px 15px', textAlign: 'center' }}>STATUS</th>
                            <th style={{ padding: '13px 15px', textAlign: 'center' }}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredParticipants.map(user => (
                            <tr key={user.lot_number} style={{ borderBottom: '1px solid rgba(0,229,255,0.06)', background: selectedIds.includes(user.lot_number) ? 'rgba(0,229,255,0.04)' : 'transparent', transition: 'background 0.2s' }}>
                                <td style={{ padding: '13px 15px', textAlign: 'center' }}>
                                    <input type="checkbox"
                                        checked={selectedIds.includes(user.lot_number)}
                                        onChange={() => toggleSelect(user.lot_number)}
                                        style={{ cursor: 'pointer', transform: 'scale(1.1)', accentColor: '#00e5ff' }}
                                    />
                                </td>
                                <td style={{ padding: '13px 15px' }}>
                                    <div style={{ fontFamily: 'Share Tech Mono, monospace', fontWeight: 'bold', color: '#fff', letterSpacing: '1px' }}>{user.lot_number}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'rgba(0,229,255,0.4)', marginTop: '2px' }}>{user.lot_name || '—'}</div>
                                </td>
                                <td style={{ padding: '13px 15px', textAlign: 'center' }}>
                                    <span style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 'bold', color: '#00e5ff', fontSize: '0.9rem' }}>
                                        {(user.patterns_completed || 0) * 25}<span style={{ fontSize: '0.6rem', opacity: 0.4 }}>/100</span>
                                    </span>
                                </td>
                                <td style={{ padding: '13px 15px', textAlign: 'center', fontWeight: 'bold', color: '#ffc107', fontFamily: 'Share Tech Mono, monospace' }}>{user.no_of_loops || 0}</td>
                                <td style={{ padding: '13px 15px', textAlign: 'center', fontFamily: 'Share Tech Mono, monospace', color: '#00e5ff', fontSize: '0.9rem' }}>{formatTime(user.total_time)}</td>
                                <td style={{ padding: '13px 15px', textAlign: 'center', color: 'rgba(255,255,255,0.55)', fontFamily: 'monospace' }}>{user.lines_of_code || 0}</td>
                                <td style={{ padding: '13px 15px', textAlign: 'center' }}>
                                    {user.warnings > 0
                                        ? <span style={{ color: '#ff003c', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '0.88rem' }}>⚠️ {user.warnings}</span>
                                        : <span style={{ opacity: 0.2 }}>—</span>
                                    }
                                </td>
                                <td style={{ padding: '13px 15px', textAlign: 'center' }}>
                                    <span style={{
                                        color: user.status === 'finished' ? '#00e5ff' : user.status === 'active' ? '#00a2ff' : '#ff003c',
                                        fontWeight: 'bold', border: '1px solid currentColor',
                                        padding: '2px 8px', borderRadius: '3px',
                                        fontSize: '0.62rem', fontFamily: 'Orbitron, sans-serif',
                                        letterSpacing: '1px',
                                    }}>
                                        {user.status.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '13px 15px', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                    <button onClick={() => setSelectedUser(user)}
                                        style={{ background: 'rgba(0,162,255,0.1)', border: '1px solid rgba(0,162,255,0.35)', color: '#00a2ff', padding: '5px 10px', cursor: 'pointer', borderRadius: '3px', transition: 'all 0.2s' }}
                                        title="View Code"
                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,162,255,0.22)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,162,255,0.1)'; }}
                                    ><FaCode /></button>
                                    <button onClick={() => setDeleteConfirm(user)}
                                        style={{ background: 'rgba(255,0,60,0.08)', border: '1px solid rgba(255,0,60,0.3)', color: '#ff003c', padding: '5px 10px', cursor: 'pointer', borderRadius: '3px', transition: 'all 0.2s' }}
                                        title="Delete User"
                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,0,60,0.2)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,0,60,0.08)'; }}
                                    ><FaTrash /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* DELETE CONFIRMATION MODAL */}
            <AnimatePresence>
                {deleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.92)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}
                    >
                        <div style={{ background: '#050a14', border: '1px solid rgba(255,0,60,0.4)', padding: '30px', textAlign: 'center', boxShadow: '0 0 30px rgba(255,0,60,0.12)', maxWidth: '420px', borderRadius: '4px', overflow: 'hidden' }}>
                            <h2 style={{ color: '#ff003c', marginTop: 0, fontFamily: 'Orbitron, sans-serif', fontSize: '0.9rem', letterSpacing: '2px' }}>TERMINATE_USER</h2>
                            <p style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace' }}>Delete participant <span style={{ color: '#00e5ff' }}>{deleteConfirm.lot_number}</span>?</p>
                            <p style={{ fontSize: '0.8rem', color: 'rgba(255,0,60,0.6)', fontFamily: 'monospace' }}>This action cannot be undone.</p>
                            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', marginTop: '20px' }}>
                                <button onClick={() => setDeleteConfirm(null)}
                                    style={{ padding: '9px 22px', background: 'transparent', border: '1px solid rgba(0,229,255,0.2)', color: 'rgba(0,229,255,0.6)', cursor: 'pointer', borderRadius: '2px', fontFamily: 'Orbitron, sans-serif', fontSize: '0.68rem' }}>CANCEL</button>
                                <button onClick={handleDelete}
                                    style={{ padding: '9px 22px', background: 'rgba(255,0,60,0.12)', border: '1px solid #ff003c', color: '#ff003c', fontWeight: 'bold', cursor: 'pointer', borderRadius: '2px', fontFamily: 'Orbitron, sans-serif', fontSize: '0.68rem' }}>CONFIRM_DELETE</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CODE VIEWER MODAL */}
            <AnimatePresence>
                {selectedUser && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}
                    >
                        <div style={{ width: '80%', height: '80%', background: '#050a14', border: '1px solid rgba(0,229,255,0.3)', display: 'flex', flexDirection: 'column', boxShadow: '0 0 50px rgba(0,229,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(0,229,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,229,255,0.03)' }}>
                                <h3 style={{ margin: 0, color: '#00e5ff', fontFamily: 'Orbitron, sans-serif', fontSize: '0.82rem', letterSpacing: '2px' }}>SOURCE_CODE_VIEWER: {selectedUser.lot_number}</h3>
                                <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '1.3rem', cursor: 'pointer' }}><FaTimes /></button>
                            </div>
                            <div style={{ flex: 1, overflow: 'auto', display: 'flex' }}>
                                <CodeViewer codeData={parseCodeData(selectedUser.code_data)} />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// Sub-component for Tabs inside Code Viewer
const CodeViewer = ({ codeData }) => {
    const keys = Object.keys(codeData);
    const [activeTab, setActiveTab] = useState(keys[0] || 'Main');

    if (keys.length === 0) return <div style={{ padding: '20px', color: '#666' }}>No code data available.</div>;

    return (
        <div style={{ display: 'flex', width: '100%', height: '100%' }}>
            <div style={{ width: '200px', borderRight: '1px solid rgba(0,229,255,0.1)', background: '#030710', overflowY: 'auto' }}>
                {keys.map(key => (
                    <div key={key} onClick={() => setActiveTab(key)}
                        style={{
                            padding: '14px 16px', cursor: 'pointer',
                            background: activeTab === key ? 'rgba(0,229,255,0.08)' : 'transparent',
                            color: activeTab === key ? '#00e5ff' : 'rgba(255,255,255,0.35)',
                            borderLeft: activeTab === key ? '3px solid #00e5ff' : '3px solid transparent',
                            fontFamily: 'Share Tech Mono, monospace', fontSize: '0.82rem',
                            transition: 'all 0.2s',
                        }}
                    >
                        {key === 'Main' ? 'Last Snapshot' : `Pattern ${key}`}
                    </div>
                ))}
            </div>

            {/* Editor Area */}
            <div style={{ flex: 1, background: '#1e1e1e', padding: '20px', overflow: 'auto' }}>
                <pre style={{
                    margin: 0,
                    fontFamily: 'Consolas, "Courier New", monospace',
                    fontSize: '14px',
                    color: '#d4d4d4',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    lineHeight: '1.5'
                }}>
                    {codeData[activeTab]}
                </pre>
            </div>
        </div>
    );
};

export default Participants;
