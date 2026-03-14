import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaPlus, FaTrash, FaCode, FaLayerGroup, FaAlignLeft,
    FaUpload, FaExclamationTriangle, FaEdit, FaTimes, FaSave,
    FaFilter, FaLightbulb, FaTag
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ── Shared style helpers ───────────────────────────────────────────────────
const CYAN    = '#00e5ff';
const BLUE    = '#00a2ff';
const RED     = '#ff003c';
const PURPLE  = '#7c3aed';

const fieldStyle = (color = CYAN) => ({
    width: '100%', padding: '10px 13px',
    background: 'rgba(0,0,0,0.4)',
    border: `1px solid rgba(${color === PURPLE ? '124,58,237' : color === BLUE ? '0,162,255' : '0,229,255'}, 0.18)`,
    color: '#fff', fontFamily: "'Share Tech Mono', monospace",
    fontSize: '0.88rem', outline: 'none', borderRadius: '2px',
    boxSizing: 'border-box', transition: 'border-color 0.3s, box-shadow 0.3s',
});

const labelStyle = {
    display: 'flex', alignItems: 'center', gap: '7px',
    fontSize: '0.62rem', color: `rgba(0,229,255,0.5)`,
    letterSpacing: '2px', marginBottom: '7px',
    fontFamily: "'Orbitron', sans-serif",
};

const onFocus = (e) => {
    e.target.style.borderColor = 'rgba(0,229,255,0.55)';
    e.target.style.boxShadow   = '0 0 12px rgba(0,229,255,0.08)';
};
const onBlur  = (e) => {
    e.target.style.borderColor = 'rgba(0,229,255,0.18)';
    e.target.style.boxShadow   = 'none';
};

// ── Category badge ─────────────────────────────────────────────────────────
const CatBadge = ({ cat }) => {
    const isPG = cat === 'PG';
    return (
        <span style={{
            padding: '2px 8px', borderRadius: '2px', fontSize: '0.6rem',
            fontFamily: "'Orbitron', sans-serif", fontWeight: 'bold', letterSpacing: '2px',
            background: isPG ? 'rgba(124,58,237,0.15)' : 'rgba(0,162,255,0.12)',
            color:      isPG ? PURPLE : BLUE,
            border:     `1px solid ${isPG ? 'rgba(124,58,237,0.3)' : 'rgba(0,162,255,0.25)'}`,
        }}>{cat}</span>
    );
};

// ── Empty form state ───────────────────────────────────────────────────────
const EMPTY = { name: '', level: '', description: '', output: '', category: 'UG' };

// ═══════════════════════════════════════════════════════════════════════════
const PatternManager = () => {
    const [patterns,    setPatterns]    = useState([]);
    const [filterCat,   setFilterCat]   = useState('ALL');
    const [form,        setForm]        = useState(EMPTY);
    const [editId,      setEditId]      = useState(null);   // null = create mode
    const [deleteId,    setDeleteId]    = useState(null);
    const [isSubmit,    setIsSubmit]    = useState(false);
    const [toast,       setToast]       = useState('');     // success message

    const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

    // ── Fetch ──────────────────────────────────────────────────────────────
    const fetchPatterns = async () => {
        try {
            const url = filterCat === 'ALL'
                ? `${API_URL}/api/admin/patterns`
                : `${API_URL}/api/admin/patterns?category=${filterCat}`;
            const res = await axios.get(url);
            setPatterns(res.data);
        } catch (e) { console.error(e); }
    };

    useEffect(() => { fetchPatterns(); }, [filterCat]);

    // Derived: filtered by category, then numbered within their category group
    const displayPatterns = useMemo(() => {
        // Apply client-side category filter
        const filtered = filterCat === 'ALL'
            ? patterns
            : patterns.filter(p => (p.category || 'UG').toUpperCase() === filterCat);

        // Add sequential index per category group
        const counts = {};
        return filtered.map(p => {
            const cat = (p.category || 'UG').toUpperCase();
            counts[cat] = (counts[cat] || 0) + 1;
            return { ...p, _idx: counts[cat] };
        });
    }, [patterns, filterCat]);

    // ── Edit: pre-fill form ───────────────────────────────────────────────
    const startEdit = (p) => {
        setEditId(p.id);
        setForm({
            name:        p.name        || '',
            level:       p.level_order || '',
            description: p.description || '',
            output:      p.target_output || '',
            category:    p.category    || 'UG',
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => { setEditId(null); setForm(EMPTY); };

    // ── Submit (create or update) ─────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmit(true);
        try {
            const payload = {
                name:        form.name,
                levelOrder:  form.level || undefined,
                description: form.description,
                targetOutput:form.output,
                category:    form.category,
            };
            if (editId) {
                await axios.put(`${API_URL}/api/admin/patterns/${editId}`, payload);
                showToast('PATTERN_UPDATED_SUCCESSFULLY');
                setEditId(null);
            } else {
                await axios.post(`${API_URL}/api/admin/patterns`, payload);
                showToast('PATTERN_DEPLOYED_SUCCESSFULLY');
            }
            setForm(EMPTY);
            fetchPatterns();
        } catch { alert('Operation failed'); }
        finally { setIsSubmit(false); }
    };

    // ── Delete ────────────────────────────────────────────────────────────
    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await axios.delete(`${API_URL}/api/admin/patterns/${deleteId}`);
            setDeleteId(null);
            showToast('PATTERN_REMOVED');
            fetchPatterns();
        } catch { alert('Delete Failed'); }
    };

    const isEditMode = editId !== null;

    // ───────────────────────────────────────────────────────────────────────
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pattern-container">

            {/* ── Delete Modal ──────────────────────────────────────────── */}
            <AnimatePresence>
                {deleteId && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <motion.div
                            initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
                            style={{ background: '#050a14', border: `1px solid rgba(255,0,60,0.4)`, minWidth: '420px', boxShadow: '0 0 40px rgba(255,0,60,0.12)', borderRadius: '4px', overflow: 'hidden' }}
                        >
                            <div style={{ background: 'rgba(255,0,60,0.1)', borderBottom: '1px solid rgba(255,0,60,0.25)', padding: '13px 20px', display: 'flex', alignItems: 'center', gap: '10px', color: RED, fontFamily: "'Orbitron', sans-serif", fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '2px' }}>
                                <FaExclamationTriangle /> CONFIRM_DELETION
                            </div>
                            <div style={{ padding: '28px', textAlign: 'center' }}>
                                <p style={{ color: '#fff', fontFamily: "'Orbitron', sans-serif", letterSpacing: '1px', marginBottom: '8px' }}>Remove this pattern from DB?</p>
                                <p style={{ color: 'rgba(255,0,60,0.6)', fontFamily: 'monospace', fontSize: '0.82rem', marginBottom: '26px' }}>This action is irreversible.</p>
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                    <button onClick={() => setDeleteId(null)} style={{ padding: '9px 26px', background: 'transparent', border: '1px solid rgba(0,229,255,0.2)', color: 'rgba(0,229,255,0.6)', cursor: 'pointer', borderRadius: '2px', fontFamily: "'Orbitron', sans-serif", fontSize: '0.68rem' }}>CANCEL</button>
                                    <button onClick={confirmDelete} style={{ padding: '9px 26px', background: 'rgba(255,0,60,0.12)', border: `1px solid ${RED}`, color: RED, fontWeight: 'bold', cursor: 'pointer', borderRadius: '2px', fontFamily: "'Orbitron', sans-serif", fontSize: '0.68rem', boxShadow: '0 0 12px rgba(255,0,60,0.15)' }}>CONFIRM_DELETE</button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Toast ─────────────────────────────────────────────────── */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(5,10,20,0.95)', border: '1px solid rgba(0,229,255,0.4)', borderLeft: `3px solid ${CYAN}`, padding: '11px 22px', color: CYAN, fontFamily: "'Share Tech Mono', monospace", fontSize: '0.8rem', letterSpacing: '1px', boxShadow: '0 0 20px rgba(0,229,255,0.15)', zIndex: 2000, borderRadius: '2px' }}
                    >
                        ✓ {toast}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Page Header ───────────────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(0,229,255,0.1)', paddingBottom: '16px', marginBottom: '24px' }}>
                <FaLayerGroup style={{ color: CYAN, fontSize: '1.05rem' }} />
                <h2 style={{ margin: 0, fontFamily: "'Orbitron', sans-serif", fontSize: '0.95rem', letterSpacing: '3px', color: '#fff' }}>
                    PATTERN_MANAGER
                </h2>
                <span style={{ fontSize: '0.6rem', color: 'rgba(0,229,255,0.3)', fontFamily: 'Share Tech Mono, monospace', marginLeft: 'auto' }}>
                    {patterns.length} PATTERN{patterns.length !== 1 ? 'S' : ''} IN DB
                </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: '22px' }}>

                {/* ╔═════════════════════════════════════╗
                    ║         CREATE / EDIT PANEL         ║
                    ╚═════════════════════════════════════╝ */}
                <div style={{ background: 'rgba(5,10,20,0.9)', border: `1px solid ${isEditMode ? 'rgba(0,162,255,0.3)' : 'rgba(0,229,255,0.12)'}`, padding: '22px', borderRadius: '4px', position: 'relative', overflow: 'hidden', transition: 'border-color 0.3s' }}>
                    {/* Top bar */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${isEditMode ? BLUE : CYAN}, transparent)`, opacity: 0.6 }} />

                    {/* Panel title */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        {isEditMode
                            ? <FaEdit style={{ color: BLUE, fontSize: '0.85rem' }} />
                            : <FaPlus style={{ color: CYAN, fontSize: '0.85rem' }} />
                        }
                        <h3 style={{ margin: 0, fontFamily: "'Orbitron', sans-serif", fontSize: '0.72rem', color: isEditMode ? BLUE : CYAN, letterSpacing: '2px' }}>
                            {isEditMode ? 'EDIT_PATTERN_PROTOCOL' : 'NEW_PATTERN_PROTOCOL'}
                        </h3>
                        {isEditMode && (
                            <button onClick={cancelEdit} style={{ marginLeft: 'auto', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#666', padding: '3px 10px', cursor: 'pointer', borderRadius: '2px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.65rem' }}>
                                <FaTimes /> CANCEL
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Row: Category + Level */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '15px' }}>
                            {/* Category */}
                            <div>
                                <label style={labelStyle}>
                                    <FaTag style={{ fontSize: '0.65rem' }} /> CATEGORY
                                </label>
                                <select
                                    value={form.category}
                                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                    style={{ ...fieldStyle(), padding: '10px 13px', cursor: 'pointer' }}
                                    onFocus={onFocus} onBlur={onBlur}
                                >
                                    <option value="UG">UG &mdash; Under Graduate</option>
                                    <option value="PG">PG &mdash; Post Graduate</option>
                                </select>
                            </div>
                            {/* Level */}
                            <div>
                                <label style={labelStyle}>
                                    <FaLayerGroup style={{ fontSize: '0.65rem' }} /> LEVEL ORDER
                                    <span style={{ opacity: 0.45, fontSize: '0.55rem' }}>(auto if blank)</span>
                                </label>
                                <input
                                    type="number" min="1"
                                    value={form.level}
                                    onChange={e => setForm(f => ({ ...f, level: e.target.value }))}
                                    placeholder="e.g. 1"
                                    style={fieldStyle()}
                                    onFocus={onFocus} onBlur={onBlur}
                                />
                            </div>
                        </div>

                        {/* Pattern Name */}
                        <div style={{ marginBottom: '15px' }}>
                            <label style={labelStyle}>
                                <FaCode style={{ fontSize: '0.65rem' }} /> PATTERN_NAME
                            </label>
                            <input
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="e.g. Right Triangle Pattern"
                                required
                                style={fieldStyle()}
                                onFocus={onFocus} onBlur={onBlur}
                            />
                        </div>

                        {/* Objective / Description */}
                        <div style={{ marginBottom: '15px' }}>
                            <label style={labelStyle}>
                                <FaLightbulb style={{ fontSize: '0.65rem' }} /> OBJECTIVE
                                <span style={{ opacity: 0.45, fontSize: '0.55rem' }}>(shown above expected output)</span>
                            </label>
                            <textarea
                                rows={3}
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                placeholder="Describe what students must write & what the output should be..."
                                style={{ ...fieldStyle(), resize: 'vertical', lineHeight: '1.5' }}
                                onFocus={onFocus} onBlur={onBlur}
                            />
                        </div>

                        {/* Expected Output */}
                        <div style={{ marginBottom: '18px' }}>
                            <label style={labelStyle}>
                                <FaAlignLeft style={{ fontSize: '0.65rem' }} /> EXPECTED_OUTPUT (PRESERVES SPACING)
                            </label>
                            <textarea
                                rows={7}
                                value={form.output}
                                onChange={e => setForm(f => ({ ...f, output: e.target.value }))}
                                placeholder="Type the exact expected output here..."
                                required
                                style={{ ...fieldStyle(), color: CYAN, whiteSpace: 'pre', fontFamily: 'Share Tech Mono, monospace', resize: 'vertical', lineHeight: '1.6' }}
                                onFocus={onFocus} onBlur={onBlur}
                            />
                        </div>

                        {/* Submit */}
                        <button
                            type="submit" disabled={isSubmit}
                            style={{
                                width: '100%', padding: '12px',
                                background: isSubmit ? 'rgba(0,229,255,0.05)' : 'transparent',
                                border: `1px solid ${isEditMode ? 'rgba(0,162,255,0.5)' : 'rgba(0,229,255,0.5)'}`,
                                color: isSubmit ? 'rgba(0,229,255,0.35)' : isEditMode ? BLUE : CYAN,
                                fontFamily: "'Orbitron', sans-serif", fontSize: '0.72rem', fontWeight: 'bold', letterSpacing: '2px',
                                cursor: isSubmit ? 'not-allowed' : 'pointer', borderRadius: '2px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.3s',
                            }}
                            onMouseEnter={e => { if (!isSubmit) { const c = isEditMode ? BLUE : CYAN; e.currentTarget.style.background = c; e.currentTarget.style.color = '#000'; e.currentTarget.style.boxShadow = `0 0 18px rgba(0,229,255,0.25)`; }}}
                            onMouseLeave={e => { if (!isSubmit) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = isEditMode ? BLUE : CYAN; e.currentTarget.style.boxShadow = 'none'; }}}
                        >
                            {isSubmit
                                ? <><span style={{ width: '12px', height: '12px', border: '2px solid rgba(0,229,255,0.2)', borderTop: `2px solid ${CYAN}`, borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> PROCESSING...</>
                                : isEditMode
                                    ? <><FaSave style={{ fontSize: '0.75rem' }} /> SAVE_CHANGES</>
                                    : <><FaUpload style={{ fontSize: '0.75rem' }} /> DEPLOY_PATTERN</>
                            }
                        </button>
                    </form>
                </div>

                {/* ╔═════════════════════════════════════╗
                    ║         DEPLOYED PATTERNS LIST      ║
                    ╚═════════════════════════════════════╝ */}
                <div style={{ background: 'rgba(5,10,20,0.9)', border: '1px solid rgba(0,229,255,0.12)', borderRadius: '4px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '680px' }}>

                    {/* List header + filter */}
                    <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(0,229,255,0.08)', background: 'rgba(0,229,255,0.02)', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                        <FaCode style={{ color: CYAN, fontSize: '0.8rem' }} />
                        <h3 style={{ margin: 0, fontFamily: "'Orbitron', sans-serif", fontSize: '0.72rem', color: CYAN, letterSpacing: '2px' }}>
                            DEPLOYED_PATTERNS
                        </h3>
                        {/* Filter pill group */}
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <FaFilter style={{ color: 'rgba(0,229,255,0.35)', fontSize: '0.65rem' }} />
                            {['ALL', 'UG', 'PG'].map(cat => (
                                <button key={cat}
                                    onClick={() => setFilterCat(cat)}
                                    style={{
                                        padding: '3px 10px',
                                        background: filterCat === cat ? (cat === 'PG' ? PURPLE : cat === 'UG' ? BLUE : CYAN) : 'transparent',
                                        color:      filterCat === cat ? '#000' : 'rgba(0,229,255,0.45)',
                                        border:     `1px solid ${filterCat === cat ? (cat === 'PG' ? PURPLE : cat === 'UG' ? BLUE : CYAN) : 'rgba(0,229,255,0.18)'}`,
                                        borderRadius: '2px', cursor: 'pointer',
                                        fontFamily: "'Orbitron', sans-serif", fontSize: '0.58rem', fontWeight: 'bold', letterSpacing: '1px',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                        <span style={{ fontSize: '0.58rem', color: 'rgba(0,229,255,0.25)', fontFamily: 'monospace', flexShrink: 0 }}>
                            {patterns.length}
                        </span>
                    </div>

                    {/* Scrollable list */}
                    <div style={{ overflowY: 'auto', flex: 1, padding: '14px' }}>
                        <AnimatePresence>
                            {displayPatterns.map((p) => (
                                <motion.div
                                    key={p.id}
                                    layout
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.96 }}
                                    style={{
                                        marginBottom: '12px',
                                        border: editId === p.id
                                            ? '1px solid rgba(0,162,255,0.4)'
                                            : '1px solid rgba(0,229,255,0.08)',
                                        borderRadius: '3px',
                                        background: editId === p.id ? 'rgba(0,162,255,0.05)' : 'rgba(0,0,0,0.3)',
                                        overflow: 'hidden', transition: 'border-color 0.2s, background 0.2s',
                                    }}
                                    onMouseEnter={e => { if (editId !== p.id) e.currentTarget.style.borderColor = 'rgba(0,229,255,0.22)'; }}
                                    onMouseLeave={e => { if (editId !== p.id) e.currentTarget.style.borderColor = 'rgba(0,229,255,0.08)'; }}
                                >
                                    {/* Card header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', background: 'rgba(0,229,255,0.025)', borderBottom: '1px solid rgba(0,229,255,0.06)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                            {/* index badge */}
                                            <span style={{ background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.15)', color: 'rgba(0,229,255,0.55)', padding: '1px 7px', fontSize: '0.58rem', fontFamily: "'Orbitron', sans-serif", borderRadius: '2px', flexShrink: 0 }}>
                                                #{p._idx}
                                            </span>
                                            {/* UG/PG badge */}
                                            <CatBadge cat={p.category || 'UG'} />
                                            {/* level badge */}
                                            <span style={{ background: 'rgba(0,162,255,0.12)', border: '1px solid rgba(0,162,255,0.25)', color: BLUE, padding: '1px 7px', fontSize: '0.58rem', fontFamily: "'Orbitron', sans-serif", borderRadius: '2px', flexShrink: 0 }}>
                                                LVL {p.level_order}
                                            </span>
                                            <span style={{ fontWeight: 'bold', color: '#fff', fontFamily: 'Share Tech Mono, monospace', fontSize: '0.83rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {p.name}
                                            </span>
                                        </div>
                                        {/* Actions */}
                                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0, marginLeft: '8px' }}>
                                            <button
                                                onClick={() => startEdit(p)}
                                                title="Edit pattern"
                                                style={{ background: 'rgba(0,162,255,0.1)', border: '1px solid rgba(0,162,255,0.3)', color: BLUE, padding: '3px 9px', cursor: 'pointer', fontSize: '0.6rem', fontFamily: "'Orbitron', sans-serif", borderRadius: '2px', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s' }}
                                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,162,255,0.22)'; e.currentTarget.style.boxShadow = '0 0 8px rgba(0,162,255,0.2)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,162,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
                                            >
                                                <FaEdit style={{ fontSize: '0.6rem' }} /> EDIT
                                            </button>
                                            <button
                                                onClick={() => setDeleteId(p.id)}
                                                title="Delete pattern"
                                                style={{ background: 'rgba(255,0,60,0.08)', border: '1px solid rgba(255,0,60,0.3)', color: RED, padding: '3px 9px', cursor: 'pointer', fontSize: '0.6rem', fontFamily: "'Orbitron', sans-serif", borderRadius: '2px', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s' }}
                                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,0,60,0.18)'; e.currentTarget.style.boxShadow = '0 0 8px rgba(255,0,60,0.15)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,0,60,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                                            >
                                                <FaTrash style={{ fontSize: '0.6rem' }} /> DEL
                                            </button>
                                        </div>
                                    </div>

                                    {/* Objective */}
                                    {p.description && (
                                        <div style={{ padding: '7px 12px', fontSize: '0.78rem', color: 'rgba(255,255,255,0.82)', fontFamily: 'monospace', background: 'rgba(0,229,255,0.018)', borderBottom: '1px solid rgba(0,229,255,0.05)', lineHeight: '1.55' }}>
                                            <FaLightbulb style={{ marginRight: '6px', fontSize: '0.65rem', color: 'rgba(0,229,255,0.5)', verticalAlign: 'middle' }} />
                                            {p.description}
                                        </div>
                                    )}

                                    {/* Expected output */}
                                    <pre style={{ margin: 0, padding: '10px 12px', background: 'rgba(0,0,0,0.35)', color: CYAN, fontFamily: 'Share Tech Mono, monospace', fontSize: '0.8rem', whiteSpace: 'pre-wrap', maxHeight: '110px', overflowY: 'auto', textShadow: '0 0 4px rgba(0,229,255,0.15)', lineHeight: '1.55' }}>
                                        {p.target_output}
                                    </pre>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {patterns.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '50px 20px', color: 'rgba(0,229,255,0.18)', fontFamily: "'Orbitron', sans-serif", fontSize: '0.72rem', letterSpacing: '2px' }}>
                                /// NO PATTERNS DEPLOYED
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                select option { background: #050a14; }
            `}</style>
        </motion.div>
    );
};

export default PatternManager;
