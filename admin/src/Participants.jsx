import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTrash, FaEye, FaCode, FaTimes } from 'react-icons/fa';

const Participants = () => {
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null); 
    const [deleteConfirm, setDeleteConfirm] = useState(null); 
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [patternCounts, setPatternCounts] = useState({ UG: 4, PG: 4 });

    const [selectedIds, setSelectedIds] = useState([]);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        fetchParticipants();
        const interval = setInterval(fetchParticipants, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchParticipants = async () => {
        try {
            const [usersRes, statsRes] = await Promise.all([
                axios.get(`${API_URL}/api/admin/participants`),
                axios.get(`${API_URL}/api/admin/pattern-stats`)
            ]);
            setParticipants(usersRes.data);
            if (statsRes.data) setPatternCounts(statsRes.data);
            setLoading(false);
        } catch (err) { console.error("Failed to fetch participants"); }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await axios.delete(`${API_URL}/api/admin/participants/${deleteConfirm.lot_number}`);
            setParticipants(participants.filter(p => p.lot_number !== deleteConfirm.lot_number));
            setDeleteConfirm(null);
        } catch (err) { console.error("Failed to delete user"); }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} users?`)) return;
        setIsBulkDeleting(true);
        try {
            await Promise.all(selectedIds.map(id => axios.delete(`${API_URL}/api/admin/participants/${id}`)));
            setParticipants(participants.filter(p => !selectedIds.includes(p.lot_number)));
            setSelectedIds([]);
        } catch (err) { console.error("Bulk delete failed"); } finally { setIsBulkDeleting(false); }
    };

    const formatTime = (ms) => {
        if (!ms || ms < 0) return "00:00:00";
        const h = Math.floor(ms / 3600000).toString().padStart(2, '0');
        const m = Math.floor((ms % 3600000) / 60000).toString().padStart(2, '0');
        const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    const parseCodeData = (data) => {
        if (!data) return { "Main": "No code submitted." };
        try {
            const parsed = JSON.parse(data);
            if (typeof parsed === 'object') return parsed.map || parsed;
            return { "Main": data };
        } catch (e) { return { "Main": data }; }
    };

    const filteredParticipants = participants.filter(user => {
        const term = searchTerm.toLowerCase();
        const matchesSearch = (user.lot_name?.toLowerCase() || '').includes(term) ||
            (user.lot_number?.toString().toLowerCase() || '').includes(term) ||
            (user.college_name?.toLowerCase() || '').includes(term);
        const matchesFilter = filterStatus === 'all' || user.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    const toggleSelectAll = () => {
        if (selectedIds.length === filteredParticipants.length) setSelectedIds([]);
        else setSelectedIds(filteredParticipants.map(p => p.lot_number));
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="participants-page">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(0,229,255,0.12)', paddingBottom: '16px' }}>
                <h2 style={{ margin: 0, fontFamily: "'Orbitron', sans-serif", fontSize: '0.95rem', letterSpacing: '3px', color: '#fff' }}>PARTICIPANT_DATABASE</h2>
                <span style={{ marginLeft: 'auto', fontSize: '0.62rem', color: 'rgba(0,229,255,0.3)', fontFamily: 'Share Tech Mono, monospace' }}>{filteredParticipants.length} RECORDS</span>
            </div>

            <div style={{ display: 'flex', gap: '12px', margin: '20px 0', alignItems: 'center' }}>
                <input type="text" placeholder="Search by Name, Roll #..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ padding: '10px 15px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,229,255,0.15)', color: '#fff', borderRadius: '3px', flex: 1, fontFamily: 'Share Tech Mono, monospace' }} />
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                    style={{ padding: '10px 15px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,229,255,0.15)', color: '#fff', borderRadius: '3px', fontFamily: 'Orbitron, sans-serif' }}>
                    <option value="all">ALL STATUS</option>
                    <option value="active">Active</option>
                    <option value="finished">Finished</option>
                    <option value="disqualified">Disqualified</option>
                </select>
                {selectedIds.length > 0 && (
                    <button onClick={handleBulkDelete} disabled={isBulkDeleting} style={{ padding: '10px 18px', background: 'rgba(255,0,60,0.12)', color: '#ff003c', border: '1px solid rgba(255,0,60,0.4)', borderRadius: '3px', cursor: 'pointer', fontFamily: 'Orbitron, sans-serif' }}>
                        {isBulkDeleting ? 'TERMINATING...' : `DELETE (${selectedIds.length})`}
                    </button>
                )}
            </div>

            <div className="table-container">
                <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
                    <thead>
                        <tr style={{ background: 'rgba(0,229,255,0.03)', borderBottom: '1px solid rgba(0,229,255,0.2)' }}>
                            <th style={{ padding: '13px 15px' }}>
                                <input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.length === filteredParticipants.length && filteredParticipants.length > 0} style={{ accentColor: '#00e5ff' }} />
                            </th>
                            <th style={{ padding: '13px 15px', textAlign: 'left' }}>ROLL NO</th>
                            <th style={{ padding: '13px 15px' }}>SCORE</th>
                            <th style={{ padding: '13px 15px' }}>TIME</th>
                            <th style={{ padding: '13px 15px' }}>LOC</th>
                            <th style={{ padding: '13px 15px' }}>STATUS</th>
                            <th style={{ padding: '13px 15px' }}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredParticipants.map(user => (
                            <ParticipantRow 
                                key={user.lot_number} 
                                user={user} 
                                isSelected={selectedIds.includes(user.lot_number)}
                                onSelect={() => toggleSelect(user.lot_number)}
                                onShowCode={() => setSelectedUser(user)}
                                onDelete={() => setDeleteConfirm(user)}
                                formatTime={formatTime}
                                patternCounts={patternCounts}
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODALS */}
            <AnimatePresence>
                {deleteConfirm && (
                    <Modal onClose={() => setDeleteConfirm(null)}>
                        <h2 style={{ color: '#ff003c', fontFamily: 'Orbitron, sans-serif', fontSize: '0.9rem' }}>TERMINATE_USER</h2>
                        <p style={{ color: 'rgba(255,255,255,0.7)' }}>Delete participant <span style={{ color: '#00e5ff' }}>{deleteConfirm.lot_number}</span>?</p>
                        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', marginTop: '20px' }}>
                            <button onClick={() => setDeleteConfirm(null)} style={{ padding: '9px 22px', background: 'transparent', border: '1px solid rgba(0,229,255,0.2)', color: 'rgba(0,229,255,0.6)', cursor: 'pointer' }}>CANCEL</button>
                            <button onClick={handleDelete} style={{ padding: '9px 22px', background: 'rgba(255,0,60,0.12)', border: '1px solid #ff003c', color: '#ff003c', cursor: 'pointer' }}>DELETE</button>
                        </div>
                    </Modal>
                )}
                {selectedUser && (
                    <Modal onClose={() => setSelectedUser(null)} large>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid rgba(0,229,255,0.1)' }}>
                            <h3 style={{ margin: 0, color: '#00e5ff', fontFamily: 'Orbitron, sans-serif', fontSize: '0.82rem' }}>SOURCE_CODE_VIEWER: {selectedUser.lot_number}</h3>
                            <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}><FaTimes /></button>
                        </div>
                        <CodeViewer codeData={parseCodeData(selectedUser.code_data)} />
                    </Modal>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const ParticipantRow = ({ user, isSelected, onSelect, onShowCode, onDelete, formatTime, patternCounts }) => {
    const [isHovered, setIsHovered] = useState(false);
    const catTotal = patternCounts[user.category?.toUpperCase()] || 4;
    const score = Math.round(((user.patterns_completed || 0) / catTotal) * 100);

    return (
        <tr onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}
            style={{ borderBottom: '1px solid rgba(0,229,255,0.06)', background: isSelected ? 'rgba(0,229,255,0.04)' : isHovered ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
            <td style={{ padding: '13px 15px', textAlign: 'center' }}>
                <input type="checkbox" checked={isSelected} onChange={onSelect} style={{ accentColor: '#00e5ff' }} />
            </td>
            <td style={{ padding: '13px 15px', verticalAlign: 'top' }}>
                <div style={{ fontFamily: 'Share Tech Mono, monospace', fontWeight: 'bold', color: isHovered ? '#00e5ff' : '#fff' }}>{user.lot_number}</div>
                <motion.div initial={false} animate={{ height: isHovered ? 'auto' : 0, opacity: isHovered ? 1 : 0 }} style={{ overflow: 'hidden' }}>
                    <div style={{ marginTop: '5px', paddingLeft: '8px', borderLeft: '1px solid #00e5ff', fontSize: '0.72rem' }}>
                        <div style={{ color: '#fff', fontWeight: 'bold' }}>{user.lot_name || '—'}</div>
                        <div style={{ color: 'rgba(0,229,255,0.5)', marginTop: '2px' }}>{user.department || 'GENERAL'}</div>
                        {user.year && <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.62rem', marginTop: '1px' }}>YEAR_{user.year}</div>}
                    </div>
                </motion.div>
            </td>
            <td style={{ padding: '13px 15px', textAlign: 'center', verticalAlign: 'top', paddingTop: '15px' }}>
                <span style={{ fontFamily: 'Orbitron, sans-serif', color: '#00e5ff' }}>{score}<span style={{fontSize:'0.6rem', opacity: 0.5}}>/100</span></span>
            </td>
            <td style={{ padding: '13px 15px', textAlign: 'center', verticalAlign: 'top', paddingTop: '15px', fontFamily: 'Share Tech Mono, monospace' }}>{formatTime(user.total_time)}</td>
            <td style={{ padding: '13px 15px', textAlign: 'center', verticalAlign: 'top', paddingTop: '15px', color: 'rgba(255,255,255,0.5)' }}>{user.lines_of_code || 0}</td>
            <td style={{ padding: '13px 15px', textAlign: 'center', verticalAlign: 'top', paddingTop: '15px' }}>
                <span style={{ color: user.status === 'finished' ? '#00e5ff' : user.status === 'active' ? '#00a2ff' : '#ff003c', fontSize: '0.62rem', border: '1px solid currentColor', padding: '2px 8px', borderRadius: '3px' }}>{user.status.toUpperCase()}</span>
            </td>
            <td style={{ padding: '13px 15px', textAlign: 'center', verticalAlign: 'top', paddingTop: '15px' }}>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button onClick={onShowCode} style={{ background: 'rgba(0,162,255,0.1)', border: 'none', color: '#00a2ff', padding: '5px 8px', borderRadius: '3px', cursor: 'pointer' }}><FaCode /></button>
                    <button onClick={onDelete} style={{ background: 'rgba(255,0,60,0.1)', border: 'none', color: '#ff003c', padding: '5px 8px', borderRadius: '3px', cursor: 'pointer' }}><FaTrash /></button>
                </div>
            </td>
        </tr>
    );
};

const Modal = ({ children, onClose, large }) => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.92)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
        <div style={{ background: '#050a14', border: '1px solid rgba(0,229,255,0.2)', padding: large ? 0 : '30px', borderRadius: '4px', width: large ? '80%' : 'auto', height: large ? '80%' : 'auto', display: 'flex', flexDirection: 'column' }}>
            {children}
        </div>
    </motion.div>
);

const CodeViewer = ({ codeData }) => {
    const keys = Object.keys(codeData);
    const [activeTab, setActiveTab] = useState(keys[0] || 'Main');
    if (keys.length === 0) return <div style={{ padding: '20px', color: '#666' }}>No code data available.</div>;
    return (
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            <div style={{ width: '180px', borderRight: '1px solid rgba(0,229,255,0.1)', background: '#030710', overflowY: 'auto' }}>
                {keys.map(key => (
                    <div key={key} onClick={() => setActiveTab(key)}
                        style={{ padding: '12px 15px', cursor: 'pointer', background: activeTab === key ? 'rgba(0,229,255,0.08)' : 'transparent', color: activeTab === key ? '#00e5ff' : 'rgba(255,255,255,0.3)', borderLeft: activeTab === key ? '3px solid #00e5ff' : '3px solid transparent', fontSize: '0.8rem' }}>
                        {key === 'Main' ? 'Last Snapshot' : `Pattern ${key}`}
                    </div>
                ))}
            </div>
            <div style={{ flex: 1, background: '#1e1e1e', padding: '20px', overflow: 'auto' }}>
                <pre style={{ margin: 0, color: '#d4d4d4', fontSize: '13px', whiteSpace: 'pre-wrap' }}>{codeData[activeTab]}</pre>
            </div>
        </div>
    );
};

export default Participants;
