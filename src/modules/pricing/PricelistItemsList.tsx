import React from 'react';
import {
    Calendar,
    Users,
    MoreHorizontal,
    Trash2,
    Edit3,
    Copy,
    ChevronRight,
    Tag,
    Clock,
    DollarSign,
    Filter,
    Layers,
    Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PricelistItem {
    id: string;
    roomType: string;
    dateFrom: string;
    dateTo: string;
    netPrice: number;
    brutoPrice: number;
    occupancy: {
        adults: number;
        children: number;
    };
    status: 'active' | 'draft' | 'warning';
    pricelistTitle?: string;
}

const PricelistItemsList: React.FC<{ items: PricelistItem[], isLoading?: boolean }> = ({ items, isLoading }) => {
    const [roomFilter, setRoomFilter] = React.useState('all');
    const [serviceFilter, setServiceFilter] = React.useState('all');
    const [dateFilter, setDateFilter] = React.useState('');

    const filteredItems = items.filter(item => {
        const matchesRoom = roomFilter === 'all' || item.roomType === roomFilter;
        const matchesService = serviceFilter === 'all';
        const matchesDate = !dateFilter || (item.dateFrom <= dateFilter && item.dateTo >= dateFilter);
        return matchesRoom && matchesService && matchesDate;
    });

    const filterStyle: React.CSSProperties = {
        padding: '12px 16px',
        borderRadius: '12px',
        background: 'rgba(15, 23, 42, 0.4)',
        border: '1px solid var(--border)',
        color: 'var(--text-primary)',
        fontSize: '13px',
        outline: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s',
        appearance: 'none',
        minWidth: '160px'
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header & Filters */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0 8px',
                flexWrap: 'wrap',
                gap: '24px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        background: 'var(--accent-glow)',
                        borderRadius: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--accent)',
                        border: '1px solid var(--accent)'
                    }}>
                        <Layers size={24} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '22px', fontWeight: 800 }}>Pregled Stavki</h3>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                            Ukupno {items.length} stavki | Filterovano {filteredItems.length}
                        </p>
                    </div>
                </div>

                <div style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                    background: 'rgba(255,255,255,0.02)',
                    padding: '12px',
                    borderRadius: '20px',
                    border: '1px solid var(--glass-border)',
                    backdropFilter: 'blur(8px)'
                }}>
                    <Filter size={18} color="var(--text-secondary)" style={{ marginLeft: '8px' }} />

                    <div style={{ position: 'relative' }}>
                        <select
                            value={roomFilter}
                            onChange={(e) => setRoomFilter(e.target.value)}
                            style={filterStyle}
                        >
                            <option value="all">Svi Tipovi Soba</option>
                            {Array.from(new Set(items.map(i => i.roomType))).map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ position: 'relative' }}>
                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            style={{ ...filterStyle, minWidth: '180px' }}
                        />
                    </div>
                </div>
            </div>

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <AnimatePresence>
                    {filteredItems.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: index * 0.05 }}
                            style={{
                                background: 'rgba(255, 255, 255, 0.03)',
                                borderRadius: '20px',
                                border: '1px solid var(--glass-border)',
                                padding: '16px 24px',
                                display: 'grid',
                                gridTemplateColumns: '60px 1fr 180px 140px',
                                alignItems: 'center',
                                gap: '24px',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                cursor: 'pointer',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                            whileHover={{
                                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                                borderColor: 'var(--accent)',
                                scale: 1.01,
                                boxShadow: '0 12px 24px rgba(0,0,0,0.2)'
                            }}
                        >
                            {/* Icon */}
                            <div style={{
                                width: '50px',
                                height: '50px',
                                background: 'var(--bg-sidebar)',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: item.status === 'active' ? '#10b981' : 'var(--accent)',
                                border: '1px solid var(--border)'
                            }}>
                                <Tag size={22} />
                            </div>

                            {/* Info */}
                            <div>
                                {item.pricelistTitle && (
                                    <div style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 800, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        #{item.pricelistTitle}
                                    </div>
                                )}
                                <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>{item.roomType}</h4>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Calendar size={14} color="var(--accent)" />
                                        {item.dateFrom} — {item.dateTo}
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Users size={14} color="var(--accent)" />
                                        {item.occupancy.adults}+{item.occupancy.children}
                                    </span>
                                </div>
                            </div>

                            {/* Price */}
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '2px', fontWeight: 600 }}>Cena po danu</div>
                                <div style={{ fontSize: '22px', fontWeight: 900, color: '#10b981' }}>
                                    {item.brutoPrice.toFixed(2)} €
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px', opacity: 0.7 }}>
                                    Neto: {item.netPrice.toFixed(2)} €
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    title="Izmeni"
                                    style={{
                                        width: '38px',
                                        height: '38px',
                                        borderRadius: '10px',
                                        border: '1px solid var(--border)',
                                        background: 'rgba(255,255,255,0.03)',
                                        color: 'var(--text-secondary)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <Edit3 size={18} />
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.1, color: '#ef4444', borderColor: '#ef4444' }}
                                    whileTap={{ scale: 0.9 }}
                                    title="Obriši"
                                    style={{
                                        width: '38px',
                                        height: '38px',
                                        borderRadius: '10px',
                                        border: '1px solid var(--border)',
                                        background: 'rgba(239, 68, 68, 0.05)',
                                        color: 'var(--text-secondary)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <Trash2 size={18} />
                                </motion.button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {items.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                            padding: '60px',
                            textAlign: 'center',
                            background: 'rgba(255,255,255,0.02)',
                            borderRadius: '24px',
                            border: '2px dashed var(--border)',
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '16px'
                        }}
                    >
                        <Clock size={48} style={{ opacity: 0.2 }} />
                        <div>
                            {isLoading ? 'Učitavanje podataka iz baze...' : 'Još uvek nema unetih stavki. Iskoristite formu iznad da dodate prve cene.'}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default PricelistItemsList;
