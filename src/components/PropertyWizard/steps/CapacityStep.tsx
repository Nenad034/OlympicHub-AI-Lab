import React, { useState } from 'react';
import { Sparkles, Send, MessageSquare, TrendingUp, Calendar as CalendarIcon, FileText, Bed, X, Save, Plus, ChevronLeft, ChevronRight, Grid, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { StepProps, AIPromptHistory } from '../types';

const CapacityStep: React.FC<StepProps> = ({ data, onChange }) => {
    const [aiPrompt, setAiPrompt] = useState('');
    const [editingRoom, setEditingRoom] = useState<number | null>(null);
    const [capacityRange, setCapacityRange] = useState({ start: '2026-06-15', end: '2026-09-01' });
    const [currentMonth, setCurrentMonth] = useState(new Date(2026, 4, 1)); // May 2026
    const [newCapacity, setNewCapacity] = useState({ assigned: 15, releasePeriod: 0 });
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const updateRoomCapacity = (roomIndex: number, date: string, assigned: number, sold: number = 0) => {
        const room = data.roomTypes?.[roomIndex];
        if (!room) return;

        const updatedRoom = {
            ...room,
            capacity: {
                ...room.capacity,
                type: room.capacity?.type || 'Allotment',
                releasePeriod: room.capacity?.releasePeriod || 0,
                calendar: {
                    ...(room.capacity?.calendar || {}),
                    [date]: {
                        assigned,
                        sold,
                        remaining: assigned - sold
                    }
                }
            }
        };

        const newRooms = [...(data.roomTypes || [])];
        newRooms[roomIndex] = updatedRoom;
        onChange({ roomTypes: newRooms });
    };

    const handleAISubmit = () => {
        if (!aiPrompt.trim() || editingRoom === null) return;

        const newPrompt: AIPromptHistory = {
            id: Math.random().toString(36).substr(2, 9),
            userId: 'user_1',
            userName: 'Nenad',
            role: 'user',
            content: aiPrompt,
            timestamp: new Date().toLocaleTimeString()
        };

        const updatedHistory = [...(data.aiPromptHistory || []), newPrompt];

        // AI Prompt Parsing
        setTimeout(() => {
            let responseContent = '';
            const prompt = aiPrompt.toLowerCase();

            // Parse "Postavi kapacitet X soba od DD.MM do DD.MM"
            const setCapacityMatch = prompt.match(/postavi kapacitet (\d+) soba od (\d{2}\.\d{2}) do (\d{2}\.\d{2})/);
            if (setCapacityMatch) {
                const capacity = parseInt(setCapacityMatch[1]);
                const startDate = `2026-${setCapacityMatch[2].split('.').reverse().join('-')}`;
                const endDate = `2026-${setCapacityMatch[3].split('.').reverse().join('-')}`;

                // Set capacity for date range
                const start = new Date(startDate);
                const end = new Date(endDate);
                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    const dateStr = d.toISOString().split('T')[0];
                    updateRoomCapacity(editingRoom, dateStr, capacity, 0);
                }

                responseContent = `✅ Postavio sam kapacitet od ${capacity} soba za period ${setCapacityMatch[2]} - ${setCapacityMatch[3]}.`;
            }
            // Parse "Koliko slobodnih soba ima od DD.MM do DD.MM"
            else if (prompt.includes('koliko slobodnih')) {
                const dateMatch = prompt.match(/od (\d{2}\.\d{2}) do (\d{2}\.\d{2})/);
                if (dateMatch) {
                    const room = data.roomTypes?.[editingRoom];
                    const calendar = room?.capacity?.calendar || {};
                    let totalAvailable = 0;
                    let days = 0;

                    const startDate = `2026-${dateMatch[1].split('.').reverse().join('-')}`;
                    const endDate = `2026-${dateMatch[2].split('.').reverse().join('-')}`;
                    const start = new Date(startDate);
                    const end = new Date(endDate);

                    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                        const dateStr = d.toISOString().split('T')[0];
                        const dayData = calendar[dateStr];
                        if (dayData) {
                            totalAvailable += dayData.remaining;
                            days++;
                        }
                    }

                    const avgAvailable = days > 0 ? (totalAvailable / days).toFixed(1) : 0;
                    responseContent = `📊 Za period ${dateMatch[1]} - ${dateMatch[2]}:\n- Prosečno dostupno: ${avgAvailable} soba po danu\n- Ukupno soba-noći: ${totalAvailable}`;
                }
            }
            // Parse "Promeni kapacitet na X soba za DD.MM"
            else if (prompt.includes('promeni kapacitet')) {
                const changeMatch = prompt.match(/na (\d+) soba za (\d{2}\.\d{2})/);
                if (changeMatch) {
                    const capacity = parseInt(changeMatch[1]);
                    const date = `2026-${changeMatch[2].split('.').reverse().join('-')}`;
                    updateRoomCapacity(editingRoom, date, capacity, 0);
                    responseContent = `✅ Promenio sam kapacitet na ${capacity} soba za datum ${changeMatch[2]}.`;
                }
            }
            else {
                responseContent = `Razumem. Analiziram vaš zahtev: "${aiPrompt}". Kapaciteti su prilagođeni za traženi period.`;
            }

            const assistantResponse: AIPromptHistory = {
                id: Math.random().toString(36).substr(2, 9),
                userId: 'ai_copilot',
                userName: 'AI Co-Pilot',
                role: 'assistant',
                content: responseContent,
                timestamp: new Date().toLocaleTimeString()
            };
            onChange({ aiPromptHistory: [...updatedHistory, assistantResponse] });
        }, 1000);

        onChange({ aiPromptHistory: updatedHistory });
        setAiPrompt('');
    };

    const addCapacityForRange = () => {
        if (editingRoom === null) return;

        const start = new Date(capacityRange.start);
        const end = new Date(capacityRange.end);

        console.log('Adding capacity:', { start: capacityRange.start, end: capacityRange.end, assigned: newCapacity.assigned });

        const currentDate = new Date(start);
        while (currentDate <= end) {
            const dateStr = currentDate.toISOString().split('T')[0];
            updateRoomCapacity(editingRoom, dateStr, newCapacity.assigned, 0);
            currentDate.setDate(currentDate.getDate() + 1);
        }

        console.log('Capacity added successfully');
    };

    const renderCalendar = () => {
        const room = editingRoom !== null ? data.roomTypes?.[editingRoom] : null;
        if (!room) return null;

        const calendar = room.capacity?.calendar || {};
        const months = [currentMonth, new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)];

        return (
            <div style={{ display: 'flex', gap: '16px' }}>
                {months.map((month, monthIdx) => {
                    const year = month.getFullYear();
                    const monthNum = month.getMonth();
                    const firstDay = new Date(year, monthNum, 1).getDay();
                    const daysInMonth = new Date(year, monthNum + 1, 0).getDate();
                    const monthName = month.toLocaleDateString('sr-RS', { month: 'long', year: 'numeric' });

                    const days = [];
                    for (let i = 0; i < firstDay; i++) {
                        days.push(<div key={`empty-${i}`} style={{ aspectRatio: '1', padding: '4px' }}></div>);
                    }

                    for (let day = 1; day <= daysInMonth; day++) {
                        const dateStr = `${year}-${String(monthNum + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const dayData = calendar[dateStr];
                        const remaining = dayData?.remaining || 0;
                        const assigned = dayData?.assigned || 0;

                        let bgColor = 'rgba(255,255,255,0.02)';
                        if (assigned > 0) {
                            const availability = remaining / assigned;
                            if (availability >= 1) bgColor = 'rgba(16, 185, 129, 0.3)';
                            else if (availability >= 0.5) bgColor = 'rgba(251, 191, 36, 0.3)';
                            else bgColor = 'rgba(239, 68, 68, 0.3)';
                        }

                        days.push(
                            <div key={day} style={{
                                aspectRatio: '1',
                                padding: '4px',
                                background: bgColor,
                                border: '1px solid rgba(255,255,255,0.05)',
                                borderRadius: '6px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '10px',
                                color: '#fff'
                            }}>
                                <div style={{ fontWeight: 700 }}>{day}</div>
                                {assigned > 0 && <div style={{ fontSize: '9px', color: '#3b82f6', fontWeight: 900 }}>{remaining}</div>}
                            </div>
                        );
                    }

                    return (
                        <div key={monthIdx} style={{ flex: 1 }}>
                            <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff', marginBottom: '12px', textAlign: 'center', textTransform: 'capitalize' }}>{monthName}</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                                {['N', 'P', 'U', 'S', 'Č', 'P', 'S'].map((d, i) => (
                                    <div key={i} style={{ fontSize: '9px', color: 'var(--text-secondary)', textAlign: 'center', fontWeight: 700, padding: '4px' }}>{d}</div>
                                ))}
                                {days}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const room = editingRoom !== null ? data.roomTypes?.[editingRoom] : null;

    // Generate capacity table data
    const getCapacityTableData = () => {
        if (!room) return [];
        const calendar = room.capacity?.calendar || {};
        const start = new Date(capacityRange.start);
        const end = new Date(capacityRange.end);
        const data = [];

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const dayData = calendar[dateStr] || { assigned: 0, sold: 0, remaining: 0 };
            data.push({ date: dateStr, ...dayData });
        }

        return data;
    };

    return (
        <div style={{ minHeight: '850px', position: 'relative' }}>
            {/* Room List */}
            <AnimatePresence>
                {editingRoom === null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ overflowY: 'auto', height: '100%', paddingRight: '12px', maxWidth: '1400px', margin: '0 auto' }}
                        className="glass-scroll"
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', padding: '0 8px' }}>
                            <div>
                                <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <CalendarIcon style={{ color: 'var(--accent)' }} />
                                    Upravljanje Kapacitetima
                                </h2>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Kliknite na sobu da upravljate kapacitetima kroz AI-vođeni sistem.</p>
                            </div>
                            <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '4px' }}>
                                <button onClick={() => setViewMode('grid')} style={{ padding: '8px 16px', background: viewMode === 'grid' ? 'var(--accent)' : 'transparent', color: viewMode === 'grid' ? '#fff' : '#94a3b8', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                                    <Grid size={16} /> Grid
                                </button>
                                <button onClick={() => setViewMode('list')} style={{ padding: '8px 16px', background: viewMode === 'list' ? 'var(--accent)' : 'transparent', color: viewMode === 'list' ? '#fff' : '#94a3b8', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                                    <List size={16} /> Lista
                                </button>
                            </div>
                        </div>

                        <div style={{
                            display: viewMode === 'grid' ? 'grid' : 'flex',
                            gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(300px, 1fr))' : 'none',
                            flexDirection: viewMode === 'list' ? 'column' : 'row',
                            gap: '20px',
                            marginBottom: '20px'
                        }}>
                            {data.roomTypes?.map((r, roomIndex) => (
                                <motion.div
                                    key={r.roomTypeId}
                                    whileHover={{ scale: 1.01 }}
                                    onClick={() => setEditingRoom(roomIndex)}
                                    className="glass-card"
                                    style={{
                                        padding: viewMode === 'grid' ? '24px' : '16px 24px',
                                        cursor: 'pointer',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        position: 'relative',
                                        display: 'flex',
                                        flexDirection: viewMode === 'grid' ? 'column' : 'row',
                                        alignItems: viewMode === 'grid' ? 'flex-start' : 'center',
                                        gap: '16px'
                                    }}
                                >
                                    <div style={{
                                        width: '44px',
                                        height: '44px',
                                        borderRadius: '12px',
                                        background: 'rgba(59, 130, 246, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#3b82f6'
                                    }}>
                                        <Bed size={24} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{r.nameInternal || 'Soba bez naziva'}</h4>
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>#{r.code} • {r.capacity?.type || 'Allotment'}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '6px', fontWeight: 700 }}>
                                            {r.osnovniKreveti} Osnovna
                                        </span>
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={(e) => { e.stopPropagation(); setEditingRoom(roomIndex); }}
                                            style={{ width: '32px', height: '32px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', color: '#3b82f6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 900 }}
                                        >
                                            +
                                        </motion.button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Full-Screen Capacity Editor */}
            <AnimatePresence>
                {editingRoom !== null && room && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        style={{
                            position: 'absolute',
                            inset: '-20px',
                            background: 'var(--bg-dark)',
                            zIndex: 100,
                            display: 'flex',
                            flexDirection: 'column',
                            borderRadius: '16px',
                            border: '1px solid var(--border)'
                        }}
                    >
                        {/* Header */}
                        <div style={{ padding: '20px 32px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-sidebar)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                    <CalendarIcon size={24} />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                                        {room.nameInternal} - Kapaciteti
                                    </h2>
                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>#{room.code} • {room.capacity?.type || 'Allotment'}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setEditingRoom(null)}
                                    style={{
                                        padding: '10px 24px',
                                        background: 'var(--gradient-blue)',
                                        borderRadius: '10px',
                                        color: '#fff',
                                        fontSize: '14px',
                                        fontWeight: 800,
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
                                    }}
                                >
                                    <Save size={18} /> Sačuvaj i Zatvori
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setEditingRoom(null)}
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        background: 'rgba(255,255,255,0.05)',
                                        borderRadius: '10px',
                                        color: '#fff',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <X size={20} />
                                </motion.button>
                            </div>
                        </div>

                        {/* Content - 3 Section Layout */}
                        <div style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px', overflowY: 'auto' }} className="glass-scroll">

                            {/* TOP SECTION: Capacity Table & Input */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>

                                {/* LEFT: Capacity Table */}
                                <div className="glass-card" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-primary)', margin: 0, letterSpacing: '0.05em' }}>Pregled Kapaciteta</h3>
                                        <div style={{ padding: '6px 14px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.05)', color: 'var(--accent)', fontSize: '12px', fontWeight: 900 }}>
                                            Period: {capacityRange.start} - {capacityRange.end}
                                        </div>
                                    </div>

                                    <div style={{ overflow: 'auto', maxHeight: '400px' }} className="glass-scroll">
                                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                                            <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-sidebar)', zIndex: 10 }}>
                                                <tr>
                                                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>Datum</th>
                                                    <th style={{ padding: '16px 12px', textAlign: 'center', fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>Tip</th>
                                                    <th style={{ padding: '16px 12px', textAlign: 'center', fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>Dodato</th>
                                                    <th style={{ padding: '16px 12px', textAlign: 'center', fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>Prodato</th>
                                                    <th style={{ padding: '16px 12px', textAlign: 'center', fontSize: '11px', fontWeight: 800, color: '#10b981', borderBottom: '1px solid var(--border)' }}>Preostalo</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {getCapacityTableData().map((dayData) => (
                                                    <tr key={dayData.date} style={{ borderBottom: '1px solid var(--border)' }}>
                                                        <td style={{ padding: '12px 24px', fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>{dayData.date}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                                            <span style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.08)', color: 'var(--accent)', fontSize: '10px', fontWeight: 800 }}>
                                                                {room.capacity?.type || 'ALOTMAN'}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '12px', textAlign: 'center', color: 'var(--text-primary)', fontWeight: 700 }}>{dayData.assigned}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)' }}>{dayData.sold}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center', color: '#10b981', fontWeight: 900 }}>{dayData.remaining}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* RIGHT: Capacity Input & Calendar */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    {/* Capacity Input */}
                                    <div className="glass-card" style={{ padding: '24px' }}>
                                        <h3 style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '16px', letterSpacing: '0.05em' }}>Dodaj Kapacitet</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                                <div>
                                                    <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '8px', fontWeight: 700 }}>OD</label>
                                                    <input type="date" className="glass-input" value={capacityRange.start} onChange={(e) => setCapacityRange({ ...capacityRange, start: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '8px', fontWeight: 700 }}>DO</label>
                                                    <input type="date" className="glass-input" value={capacityRange.end} onChange={(e) => setCapacityRange({ ...capacityRange, end: e.target.value })} />
                                                </div>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                                <div>
                                                    <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '8px', fontWeight: 700 }}>KAPACITET SOBA</label>
                                                    <input type="number" className="glass-input" value={newCapacity.assigned} onChange={(e) => setNewCapacity({ ...newCapacity, assigned: parseInt(e.target.value) || 0 })} />
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '8px', fontWeight: 700 }}>RELEASE PERIOD (DANA)</label>
                                                    <input type="number" className="glass-input" value={newCapacity.releasePeriod} onChange={(e) => setNewCapacity({ ...newCapacity, releasePeriod: parseInt(e.target.value) || 0 })} />
                                                </div>
                                            </div>
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={addCapacityForRange}
                                                style={{
                                                    padding: '14px 20px',
                                                    background: 'var(--gradient-blue)',
                                                    borderRadius: '12px',
                                                    color: '#fff',
                                                    fontSize: '13px',
                                                    fontWeight: 800,
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '10px',
                                                    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
                                                }}
                                            >
                                                <Plus size={16} /> Dodaj Kapacitet
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                style={{
                                                    padding: '14px 20px',
                                                    background: 'rgba(59, 130, 246, 0.1)',
                                                    borderRadius: '12px',
                                                    color: '#3b82f6',
                                                    fontSize: '13px',
                                                    fontWeight: 800,
                                                    border: '1px solid rgba(59, 130, 246, 0.2)',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '10px'
                                                }}
                                            >
                                                <FileText size={16} /> Generiši Izveštaj
                                            </motion.button>
                                        </div>
                                    </div>

                                    {/* Calendar Navigation */}
                                    <div className="glass-card" style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                                                style={{ width: '32px', height: '32px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', color: '#3b82f6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            >
                                                <ChevronLeft size={18} />
                                            </motion.button>
                                            <span style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>Kalendar Prikaz</span>
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                                                style={{ width: '32px', height: '32px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', color: '#3b82f6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            >
                                                <ChevronRight size={18} />
                                            </motion.button>
                                        </div>
                                        {renderCalendar()}
                                    </div>
                                </div>
                            </div>

                            {/* BOTTOM SECTION: AI Co-Pilot & Yield Analytics */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>

                                {/* LEFT: AI Co-Pilot */}
                                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: '0', border: '1px solid var(--border)', background: 'var(--bg-card)', minHeight: '400px' }}>
                                    <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(59, 130, 246, 0.04)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <Sparkles style={{ color: 'var(--accent)' }} size={20} />
                                            <span style={{ fontSize: '15px', fontWeight: 900, color: 'var(--text-primary)' }}>AI Co-Pilot</span>
                                        </div>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px rgba(16, 185, 129, 0.3)' }}></div>
                                    </div>

                                    <div className="glass-scroll" style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {(!data.aiPromptHistory || data.aiPromptHistory.length === 0) ? (
                                            <div style={{ textAlign: 'center', marginTop: '60px', color: 'var(--text-secondary)' }}>
                                                <MessageSquare size={48} style={{ margin: '0 auto 16px', opacity: 0.1 }} />
                                                <p style={{ fontSize: '13px' }}>Nema istorije promptova.<br />Započnite razgovor za automatizaciju.</p>
                                            </div>
                                        ) : (
                                            data.aiPromptHistory.map((item) => (
                                                <div key={item.id} style={{ alignSelf: item.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                                                    <div style={{ display: 'flex', justifyContent: item.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: '4px' }}>
                                                        <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                                                            {item.userName} • {item.timestamp}
                                                        </span>
                                                    </div>
                                                    <div style={{
                                                        padding: '12px 16px',
                                                        borderRadius: '16px',
                                                        borderTopRightRadius: item.role === 'user' ? '4px' : '16px',
                                                        borderTopLeftRadius: item.role === 'assistant' ? '4px' : '16px',
                                                        background: item.role === 'user' ? 'var(--accent)' : 'var(--bg-sidebar)',
                                                        border: '1px solid var(--border)',
                                                        color: item.role === 'user' ? '#fff' : 'var(--text-primary)',
                                                        fontSize: '13px',
                                                        lineHeight: 1.5,
                                                        whiteSpace: 'pre-line',
                                                        boxShadow: item.role === 'user' ? '0 4px 12px rgba(59, 130, 246, 0.1)' : 'none'
                                                    }}>
                                                        {item.content}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <div style={{ padding: '20px', borderTop: '1px solid var(--border)', background: 'var(--bg-sidebar)' }}>
                                        <div style={{ position: 'relative' }}>
                                            <textarea
                                                className="glass-input"
                                                rows={2}
                                                value={aiPrompt}
                                                onChange={(e) => setAiPrompt(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAISubmit())}
                                                placeholder="Pitaj AI (npr: Postavi kapacitet 15 soba od 15.06 do 01.09)..."
                                                style={{ width: '100%', paddingLeft: '16px', paddingRight: '50px', paddingTop: '16px', fontSize: '13px', minHeight: '80px', resize: 'none', background: 'var(--bg-dark)' }}
                                            />
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={handleAISubmit}
                                                style={{
                                                    position: 'absolute',
                                                    right: '12px',
                                                    bottom: '12px',
                                                    width: '36px',
                                                    height: '36px',
                                                    borderRadius: '10px',
                                                    background: 'var(--gradient-blue)',
                                                    border: 'none',
                                                    color: '#fff',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                <Send size={16} />
                                            </motion.button>
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT: Yield Analytics */}
                                <div className="glass-card" style={{ padding: '24px', border: '1px solid rgba(16, 185, 129, 0.2)', background: 'rgba(16, 185, 129, 0.02)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                        <TrendingUp className="text-emerald-500" size={18} />
                                        <span style={{ fontSize: '13px', fontWeight: 900, color: '#fff', textTransform: 'uppercase' }}>Yield Analytics</span>
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '20px', lineHeight: 1.6 }}>
                                        Analiza popunjenosti i cena u realnom vremenu.
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Preporuka ADR</div>
                                            <div style={{ fontSize: '24px', fontWeight: 900, color: '#10b981' }}>€124</div>
                                        </div>
                                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Očekivani Occ.</div>
                                            <div style={{ fontSize: '24px', fontWeight: 900, color: '#3b82f6' }}>82%</div>
                                        </div>
                                    </div>
                                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>Trend Popunjenosti</div>
                                        <div style={{ height: '120px', display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
                                            {Array.from({ length: 14 }).map((_, i) => {
                                                const height = 30 + Math.random() * 70;
                                                return (
                                                    <div key={i} style={{ flex: 1, background: 'linear-gradient(to top, #10b981, #3b82f6)', borderRadius: '4px 4px 0 0', height: `${height}%`, opacity: 0.7 }}></div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CapacityStep;
