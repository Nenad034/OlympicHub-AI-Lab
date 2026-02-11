import React, { useState } from 'react';
import { Calendar, Plus, Trash2, Zap, ArrowRight, Save, Clock, RefreshCcw, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SmartDateInput from './SmartDateInput';

interface ShiftPattern {
    id: string;
    checkInDay: number; // 0-6 (Sun-Sat)
    nights: number | '';
}

interface GeneratedShift {
    id: string;
    from: string;
    to: string;
    nights: number;
}

const ShiftsGenerator: React.FC = () => {
    // 1. Fixed Patterns State
    const [patterns, setPatterns] = useState<ShiftPattern[]>([
        { id: '1', checkInDay: 6, nights: 7 } // Default: Saturday, 7 nights
    ]);

    // 2. Batch Generator State
    const [batchStart, setBatchStart] = useState('2026-06-01');
    const [batchEnd, setBatchEnd] = useState('2026-09-01');
    const [batchNights, setBatchNights] = useState<number | ''>(10);
    const [generatedShifts, setGeneratedShifts] = useState<GeneratedShift[]>([]);

    const daysOfWeek = ['Nedelja', 'Ponedeljak', 'Utorak', 'Sreda', 'Četvrtak', 'Petak', 'Subota'];

    const addPattern = () => {
        setPatterns([...patterns, { id: Date.now().toString(), checkInDay: 0, nights: 7 }]);
    };

    const removePattern = (id: string) => {
        setPatterns(patterns.filter(p => p.id !== id));
    };

    const updatePattern = (id: string, field: keyof ShiftPattern, value: number | '') => {
        setPatterns(patterns.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const generateBatch = () => {
        let current = new Date(batchStart);
        const end = new Date(batchEnd);
        const result: GeneratedShift[] = [];

        while (current < end) {
            const from = current.toISOString().split('T')[0];
            const next = new Date(current);
            const nights = batchNights === '' ? 0 : batchNights;
            next.setDate(next.getDate() + nights);
            const to = next.toISOString().split('T')[0];

            result.push({
                id: Math.random().toString(36).substr(2, 9),
                from,
                to,
                nights: batchNights === '' ? 0 : batchNights
            });

            // In shifts, the check-out of one group is the check-in of the next
            current = next;
        }
        setGeneratedShifts(result);
    };

    const cardStyle: React.CSSProperties = {
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid var(--glass-border)',
        borderRadius: '24px',
        padding: '32px',
        height: '100%'
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '12px 16px',
        borderRadius: '12px',
        background: 'var(--bg-input)',
        border: '1.5px solid var(--border)',
        color: 'var(--text-primary)',
        fontSize: '14px',
        outline: 'none',
        transition: 'all 0.2s'
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px', width: '100%' }}>

            {/* LEFT: FIXED PATTERNS */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                style={cardStyle}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ width: '44px', height: '44px', background: 'var(--gradient-blue)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <RefreshCcw size={24} color="#fff" />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Fiksni Reciklusi</h3>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>Definišite dane ulaska i dužinu boravka</p>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {patterns.map((pattern) => (
                        <div key={pattern.id} style={{
                            background: 'rgba(0,0,0,0.2)',
                            borderRadius: '16px',
                            padding: '16px',
                            border: '1px solid var(--border)',
                            display: 'grid',
                            gridTemplateColumns: '1fr 80px 40px',
                            gap: '12px',
                            alignItems: 'end'
                        }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 700 }}>DAN ULASKA</label>
                                <select
                                    value={pattern.checkInDay}
                                    onChange={(e) => updatePattern(pattern.id, 'checkInDay', Number(e.target.value))}
                                    style={{ ...inputStyle, padding: '10px' }}
                                >
                                    {daysOfWeek.map((day, i) => (
                                        <option key={i} value={i} style={{ background: 'var(--bg-card)' }}>{day}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 700 }}>NOĆI</label>
                                <input
                                    type="number"
                                    value={pattern.nights}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        updatePattern(pattern.id, 'nights', val === '' ? '' : Number(val));
                                    }}
                                    style={{ ...inputStyle, padding: '10px', textAlign: 'center' }}
                                />
                            </div>
                            <button
                                onClick={() => removePattern(pattern.id)}
                                style={{
                                    height: '40px',
                                    width: '40px',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                    background: 'rgba(239, 68, 68, 0.05)',
                                    color: '#ef4444',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}

                    <button
                        onClick={addPattern}
                        style={{
                            marginTop: '12px',
                            padding: '14px',
                            borderRadius: '16px',
                            border: '2px dashed var(--border)',
                            background: 'transparent',
                            color: 'var(--text-secondary)',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Plus size={18} /> Dodaj novu varijantu
                    </button>
                </div>

                <div style={{
                    marginTop: '32px',
                    padding: '16px',
                    background: 'rgba(59, 130, 246, 0.05)',
                    borderRadius: '16px',
                    border: '1px solid rgba(59, 130, 246, 0.1)',
                    fontSize: '13px',
                    color: 'var(--accent)',
                    lineHeight: '1.5'
                }}>
                    <Zap size={16} style={{ marginBottom: '4px' }} />
                    <br />
                    Ove definicije će primorati pretraživač da nudi samo odabrane dane ulaska i fiksira broj noćenja za odabrani hotel.
                </div>
            </motion.div>

            {/* RIGHT: BATCH GENERATOR */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                style={cardStyle}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ width: '44px', height: '44px', background: 'var(--gradient-green)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Layers size={24} color="#fff" />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Robot za smene</h3>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>Masovno generisanje rotacionih termina</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: '16px', marginBottom: '24px', background: 'rgba(0,0,0,0.1)', padding: '20px', borderRadius: '20px', border: '1px solid var(--border)' }}>
                    <div>
                        <SmartDateInput
                            label="POČETNI DATUM"
                            value={batchStart}
                            onChange={setBatchStart}
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <SmartDateInput
                            label="KRAJNJI DATUM"
                            value={batchEnd}
                            onChange={setBatchEnd}
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 700 }}>NOĆENJA</label>
                        <input
                            type="number"
                            value={batchNights}
                            onChange={(e) => {
                                const val = e.target.value;
                                setBatchNights(val === '' ? '' : Number(val));
                            }}
                            style={{ ...inputStyle, textAlign: 'center' }}
                        />
                    </div>
                    <div style={{ gridColumn: 'span 3' }}>
                        <button
                            onClick={generateBatch}
                            style={{
                                width: '100%',
                                padding: '14px',
                                background: 'var(--accent)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px'
                            }}
                        >
                            <RefreshCcw size={18} /> Generiši listu polazaka
                        </button>
                    </div>
                </div>

                {/* Generated List */}
                <div style={{
                    maxHeight: '400px',
                    overflowY: 'auto',
                    paddingRight: '8px'
                }}>
                    <AnimatePresence>
                        {generatedShifts.map((shift, idx) => (
                            <motion.div
                                key={shift.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '12px 20px',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '12px',
                                    marginBottom: '8px'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ background: 'var(--accent)', color: '#fff', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 900 }}>
                                        #{idx + 1}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ fontWeight: 700, fontSize: '15px' }}>{new Date(shift.from).toLocaleDateString('sr-RS')}</span>
                                        <ArrowRight size={14} color="var(--text-secondary)" />
                                        <span style={{ fontWeight: 700, fontSize: '15px' }}>{new Date(shift.to).toLocaleDateString('sr-RS')}</span>
                                    </div>
                                </div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600 }}>
                                    {shift.nights} noći
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {generatedShifts.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '60px 0', opacity: 0.3 }}>
                            <Clock size={48} style={{ marginBottom: '16px' }} />
                            <p>Lista generisanih polazaka će se pojaviti ovde.</p>
                        </div>
                    )}
                </div>

                {generatedShifts.length > 0 && (
                    <button
                        style={{
                            marginTop: '24px',
                            width: '100%',
                            padding: '16px',
                            background: 'var(--gradient-green)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '16px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.2)'
                        }}
                    >
                        <Save size={20} /> Sačuvaj sve polaske
                    </button>
                )}
            </motion.div>
        </div>
    );
};

export default ShiftsGenerator;
