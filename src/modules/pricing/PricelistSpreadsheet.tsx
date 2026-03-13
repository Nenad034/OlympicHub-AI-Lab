import React, { useState } from 'react';
import { 
    Info, 
    Calendar, 
    Clock, 
    Search,
    ChevronRight,
    Tag,
    ArrowUpRight,
    ArrowDownRight,
    MousePointer2,
    DollarSign,
    Zap,
    Plus,
    Minus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PricelistItem {
    id: string;
    hotelName: string;
    location?: string;
    roomType: string;
    service: string;
    calcMode: 'per_person_day' | 'per_person_period' | 'per_room_day' | 'per_room_period';
    dateFrom: string;
    dateTo: string;
    bookingFrom?: string;
    bookingTo?: string;
    minStay: number;
    arrivalDays: number[]; // 0-6
    netPrice: number;
    margin: number;
    marginPercent: number;
    grossPrice: number;
    supplier?: string;
    breakdown?: {
        base: number;
        supplements: { name: string; value: number }[];
        discounts: { name: string; value: number }[];
        taxes: { name: string; value: number }[];
    };
    specificSupplements?: { name: string; price: string; type: 'Doplata' | 'Popust' }[];
    hotelId?: string;
    logs?: { timestamp: string; user: string; action: string }[];
}

interface SpreadsheetProps {
    items: PricelistItem[];
    activeCalcMode: string;
    priceDisplay?: 'neto' | 'bruto' | 'all';
    onItemClick: (item: PricelistItem) => void;
}

const PricelistSpreadsheet: React.FC<SpreadsheetProps> = ({ items, activeCalcMode, priceDisplay = 'all', onItemClick }) => {
    const days = ['P', 'U', 'S', 'Č', 'P', 'S', 'N'];
    
    const [hoveredRow, setHoveredRow] = useState<string | null>(null);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const toggleRow = (id: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) newExpanded.delete(id);
        else newExpanded.add(id);
        setExpandedRows(newExpanded);
    };

    const expandAll = () => {
        setExpandedRows(new Set(items.map(item => item.id)));
    };

    const collapseAll = () => {
        setExpandedRows(new Set());
    };

    const getCalcModeLabel = (mode: string) => {
        switch(mode) {
            case 'per_person_day': return 'PP / Dan';
            case 'per_person_period': return 'PP / Period';
            case 'per_room_day': return 'Soba / Dan';
            case 'per_room_period': return 'Soba / Period';
            default: return mode;
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr || dateStr === 'Bez limita') return dateStr;
        const [y, m, d] = dateStr.split('-');
        if (!y || !m || !d) return dateStr;
        return `${d}/${m}/${y}`;
    };

    return (
        <div style={{ 
            width: '100%', 
            overflowX: 'auto', 
            background: 'var(--bg-card)', 
            borderRadius: '16px', 
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--shadow-premium)'
        }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--glass-border)' }}>
                        <th style={{ ...thStyle, width: '40px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                                <Plus 
                                    size={12} 
                                    style={{ cursor: 'pointer', color: 'var(--accent-cyan)' }} 
                                    onClick={(e) => { e.stopPropagation(); expandAll(); }} 
                                />
                                <Minus 
                                    size={12} 
                                    style={{ cursor: 'pointer', color: 'var(--accent-cyan)' }} 
                                    onClick={(e) => { e.stopPropagation(); collapseAll(); }} 
                                />
                            </div>
                        </th>
                        <th style={thStyle}>HOTEI / OBJEKAT</th>
                        <th style={thStyle}>TIP SMEŠTAJA</th>
                        <th style={thStyle}>USLUGA</th>
                        <th style={thStyle}>OBRAČUN</th>
                        <th style={thStyle}>REZERVACIJA</th>
                        <th style={thStyle}>BORAVAK</th>
                        <th style={thStyle}>MIN/ULAZI</th>
                        {priceDisplay !== 'bruto' && <th style={{ ...thStyle, textAlign: 'right' }}>NETO</th>}
                        {priceDisplay === 'all' && <th style={{ ...thStyle, textAlign: 'right' }}>MARŽA</th>}
                        {priceDisplay !== 'neto' && <th style={{ ...thStyle, textAlign: 'right' }}>BRUTO</th>}
                        <th style={{ ...thStyle, width: '40px' }}></th>
                    </tr>
                </thead>
                <tbody>
                    <AnimatePresence>
                        {items.map((item) => (
                            <React.Fragment key={item.id}>
                                <motion.tr 
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    onMouseEnter={() => setHoveredRow(item.id)}
                                    onMouseLeave={() => setHoveredRow(null)}
                                    onClick={() => toggleRow(item.id)}
                                    style={{ 
                                        borderBottom: '1px solid var(--border-subtle, rgba(0,0,0,0.08))',
                                        cursor: 'pointer',
                                        background: hoveredRow === item.id || expandedRows.has(item.id) ? 'var(--bg-hover, rgba(0,229,255,0.03))' : 'transparent',
                                        transition: 'background 0.2s'
                                    }}
                                >
                                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                                        {expandedRows.has(item.id) ? <Minus size={14} color="var(--accent-cyan)" /> : <Plus size={14} color="var(--accent-cyan)" />}
                                    </td>
                                    <td style={tdStyle}>
                                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.hotelName}</div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', opacity: 0.7 }}>{item.location || 'N/A'}</div>
                                    </td>
                                    <td style={tdStyle}>
                                        <div style={{ fontWeight: 600 }}>{item.roomType}</div>
                                    </td>
                                    <td style={tdStyle}>
                                        <span style={{ 
                                            padding: '2px 8px', 
                                            borderRadius: '4px', 
                                            background: 'rgba(0, 229, 255, 0.05)', 
                                            color: 'var(--accent-cyan)',
                                            fontWeight: 800,
                                            fontSize: '10px'
                                        }}>{item.service}</span>
                                    </td>
                                    <td style={tdStyle}>
                                        <div style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{getCalcModeLabel(item.calcMode)}</div>
                                    </td>
                                    <td style={tdStyle}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', color: 'var(--text-secondary)', fontSize: '11px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Clock size={10} />
                                                <span>{item.bookingFrom ? formatDate(item.bookingFrom) : 'Bez limita'}</span>
                                            </div>
                                            {item.bookingTo && (
                                                <div style={{ paddingLeft: '14px', opacity: 0.6 }}>{formatDate(item.bookingTo)}</div>
                                            )}
                                        </div>
                                    </td>
                                    <td style={tdStyle}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontWeight: 600 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Calendar size={10} color="var(--accent-cyan)" />
                                                <span>{formatDate(item.dateFrom)}</span>
                                            </div>
                                            <div style={{ paddingLeft: '14px', color: 'var(--text-secondary)', fontSize: '11px' }}>
                                                {formatDate(item.dateTo)}
                                            </div>
                                        </div>
                                    </td>
                                    <td style={tdStyle}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <div style={{ fontWeight: 800, color: 'var(--accent-gold)' }}>{item.minStay}n</div>
                                            <div style={{ display: 'flex', gap: '2px' }}>
                                                {days.map((day, idx) => (
                                                    <div key={idx} style={{ 
                                                        width: '18px', 
                                                        height: '18px', 
                                                        borderRadius: '4px', 
                                                        fontSize: '10px', 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'center',
                                                        background: item.arrivalDays.includes(idx) ? 'var(--accent-cyan)' : 'var(--bg-input, rgba(0,0,0,0.1))',
                                                        color: item.arrivalDays.includes(idx) ? '#000' : 'var(--text-dim, rgba(255,255,255,0.2))',
                                                        fontWeight: 900,
                                                        border: item.arrivalDays.includes(idx) ? 'none' : '1px solid var(--glass-border)'
                                                    }}>
                                                        {day}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </td>
                                    {priceDisplay !== 'bruto' && (
                                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>
                                            {item.netPrice.toFixed(2)} €
                                        </td>
                                    )}
                                    {priceDisplay === 'all' && (
                                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                                            <div style={{ fontWeight: 800, color: 'var(--accent-cyan)' }}>+{item.margin.toFixed(2)} €</div>
                                            <div style={{ fontSize: '9px', color: 'var(--text-secondary)', opacity: 0.6 }}>{item.marginPercent}%</div>
                                        </td>
                                    )}
                                    {priceDisplay !== 'neto' && (
                                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                                            <div style={{ fontWeight: 900, fontSize: '14px', color: '#10b981' }}>{item.grossPrice.toFixed(2)} €</div>
                                        </td>
                                    )}
                                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                                        <Info size={14} color="var(--text-secondary)" style={{ opacity: hoveredRow === item.id ? 1 : 0.3 }} />
                                    </td>
                                </motion.tr>
                                {expandedRows.has(item.id) && (
                                    <motion.tr
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        style={{ background: 'rgba(0, 229, 255, 0.02)' }}
                                    >
                                        <td colSpan={priceDisplay === 'all' ? 12 : 10} style={{ padding: '20px 60px' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px' }}>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                                        <Zap size={14} color="var(--accent-cyan)" />
                                                        <h4 style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Doplate i Popusti za ovu sobu</h4>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        {(item.specificSupplements || []).length > 0 ? (
                                                            item.specificSupplements?.map((s, i) => (
                                                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                                                                    <div style={{ fontSize: '12px', fontWeight: 600 }}>{s.name}</div>
                                                                    <div style={{ fontSize: '12px', fontWeight: 800, color: s.type === 'Popust' ? '#10b981' : 'var(--accent-cyan)' }}>
                                                                        {s.type === 'Popust' ? '-' : '+'}{s.price}
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontStyle: 'italic' }}>Nema specifičnih doplate/popusta.</div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                                        <Clock size={14} color="var(--accent-cyan)" />
                                                        <h4 style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Audit Log (Hronologija)</h4>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                        {item.logs?.map((log, lidx) => (
                                                            <div key={lidx} style={{ fontSize: '11px', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                                    <span style={{ fontWeight: 800, color: 'var(--accent-cyan)' }}>{log.timestamp}</span>
                                                                    <span style={{ fontSize: '10px', opacity: 0.5 }}>{log.user}</span>
                                                                </div>
                                                                <div style={{ fontWeight: 600, fontSize: '12px' }}>{log.action}</div>
                                                            </div>
                                                        ))}
                                                        {(!item.logs || item.logs.length === 0) && (
                                                            <div style={{ fontSize: '11px', opacity: 0.5, fontStyle: 'italic', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed var(--glass-border)' }}>
                                                                Nema zabeleženih promena
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                                        <Tag size={14} color="var(--accent-gold)" />
                                                        <h4 style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>ID i Izvorni Podaci</h4>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <span style={{ opacity: 0.6 }}>Hotel ID:</span>
                                                            <span style={{ fontWeight: 800 }}>{item.hotelId || 'N/A'}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <span style={{ opacity: 0.6 }}>Status:</span>
                                                            <span style={{ fontWeight: 800, color: '#10b981' }}>AKTIVAN</span>
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <span style={{ opacity: 0.6 }}>Dobavljač:</span>
                                                            <span style={{ fontWeight: 800 }}>{item.supplier || 'Direktno'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </motion.tr>
                                )}
                            </React.Fragment>
                        ))}
                    </AnimatePresence>
                </tbody>
            </table>
        </div>
    );
};

const thStyle: React.CSSProperties = {
    padding: '10px 16px',
    color: 'var(--text-secondary)',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    fontSize: '10px'
};

const tdStyle: React.CSSProperties = {
    padding: '4px 16px',
    verticalAlign: 'middle'
};

export default PricelistSpreadsheet;
