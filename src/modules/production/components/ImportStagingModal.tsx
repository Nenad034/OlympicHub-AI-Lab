import React, { useState, useMemo } from 'react';
import { X, Check, AlertCircle, Building2, MapPin, Star, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface StagingItem {
    id: number | string;
    originalId: number; // Solvex ID
    name: string;
    city: string;
    country: string;
    stars: number;
    description: string;
    imagesCount: number;
    isUpdate: boolean; // True if hotel already exists in DB
    isBlacklisted: boolean; // If it matches KidsCamp or similar patterns
    rawData?: any;
}

export interface SyncProgress {
    current: number;
    total: number;
    status: string;
}

interface ImportStagingModalProps {
    isOpen: boolean;
    onClose: () => void;
    items: StagingItem[];
    onConfirm: (selectedItems: StagingItem[]) => void;
    isSyncing: boolean;
    syncProgress?: SyncProgress | null;
}

export const ImportStagingModal: React.FC<ImportStagingModalProps> = ({
    isOpen,
    onClose,
    items,
    onConfirm,
    isSyncing,
    syncProgress
}) => {
    const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
    const [filter, setFilter] = useState<'all' | 'new' | 'update'>('all');

    // Initialize selection - auto-select valid updates, unselect new ones by default
    React.useEffect(() => {
        if (isOpen) {
            const initial = new Set<string | number>();
            items.forEach(item => {
                // Auto-select updates that are NOT blacklisted
                if (item.isUpdate && !item.isBlacklisted) {
                    initial.add(item.id);
                }
            });
            setSelectedIds(initial);
        }
    }, [isOpen, items]);

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            if (item.isBlacklisted) return false; // Hide blacklisted from view entirely? Or show as disabled?
            // User requested to approve "which hotel will enter".
            // We'll hide blacklisted (KidsCamp) entirely as per previous rigid instructions to never show them.

            if (filter === 'new') return !item.isUpdate;
            if (filter === 'update') return item.isUpdate;
            return true;
        });
    }, [items, filter]);

    const toggleSelection = (id: string | number) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const toggleAll = () => {
        if (selectedIds.size === filteredItems.length) {
            setSelectedIds(new Set());
        } else {
            const next = new Set<string | number>();
            filteredItems.forEach(i => next.add(i.id));
            setSelectedIds(next);
        }
    };

    const handleConfirm = () => {
        const selected = items.filter(i => selectedIds.has(i.id));
        onConfirm(selected);
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(12px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                style={{
                    background: '#13151b',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '24px',
                    width: '95vw',
                    maxWidth: '1600px',
                    height: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.7)',
                    position: 'relative'
                }}
            >
                {/* Header */}
                <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: 'white' }}>
                            Pregled i Odobravanje Podataka
                        </h2>
                        <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
                            Pronađeno {items.length} hotela iz Solvex izvora. Odaberite koje želite da uvezete ili ažurirate.
                        </p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Filters */}
                <div style={{ padding: '16px 32px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '12px', background: 'rgba(255,255,255,0.02)' }}>
                    <button
                        onClick={() => setFilter('all')}
                        style={{
                            padding: '8px 16px', borderRadius: '8px', border: 'none',
                            background: filter === 'all' ? '#3b82f6' : 'rgba(255,255,255,0.05)',
                            color: 'white', fontWeight: 600, cursor: 'pointer'
                        }}
                    >
                        Svi ({items.length})
                    </button>
                    <button
                        onClick={() => setFilter('update')}
                        style={{
                            padding: '8px 16px', borderRadius: '8px', border: 'none',
                            background: filter === 'update' ? '#10b981' : 'rgba(255,255,255,0.05)',
                            color: 'white', fontWeight: 600, cursor: 'pointer'
                        }}
                    >
                        Ažuriranja ({items.filter(i => i.isUpdate).length})
                    </button>
                    <button
                        onClick={() => setFilter('new')}
                        style={{
                            padding: '8px 16px', borderRadius: '8px', border: 'none',
                            background: filter === 'new' ? '#8b5cf6' : 'rgba(255,255,255,0.05)',
                            color: 'white', fontWeight: 600, cursor: 'pointer'
                        }}
                    >
                        Novi ({items.filter(i => !i.isUpdate).length})
                    </button>

                    {syncProgress && (
                        <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', minWidth: '300px' }}>
                            <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 700, textTransform: 'uppercase' }}>
                                {syncProgress.status}
                            </div>
                            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
                                    style={{ height: '100%', background: '#10b981' }}
                                />
                            </div>
                            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
                                {syncProgress.current} / {syncProgress.total} hotela obrađeno
                            </div>
                        </div>
                    )}
                </div>

                {/* List */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
                        <thead style={{ position: 'sticky', top: 0, background: '#1e1e2e', zIndex: 10 }}>
                            <tr>
                                <th style={{ padding: '16px 32px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.size === filteredItems.length && filteredItems.length > 0}
                                            onChange={toggleAll}
                                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                        />
                                    </div>
                                </th>
                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: '12px', textTransform: 'uppercase' }}>Status</th>
                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: '12px', textTransform: 'uppercase' }}>Hotel</th>
                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: '12px', textTransform: 'uppercase' }}>Lokacija</th>
                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: '12px', textTransform: 'uppercase' }}>Podaci</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map(item => (
                                <tr
                                    key={item.id}
                                    style={{
                                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                                        background: selectedIds.has(item.id) ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                                    }}
                                >
                                    <td style={{ padding: '16px 32px' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(item.id)}
                                            onChange={() => toggleSelection(item.id)}
                                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                        />
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        {item.isUpdate ? (
                                            <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 8px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                <Check size={12} /> AŽURIRANJE
                                            </span>
                                        ) : (
                                            <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 8px', borderRadius: '6px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                <Building2 size={12} /> NOVI
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ fontWeight: 600, fontSize: '15px' }}>{item.name}</div>
                                        <div style={{ display: 'flex', gap: '2px', color: '#fbbf24', fontSize: '12px', marginTop: '4px' }}>
                                            {Array.from({ length: item.stars }).map((_, i) => <Star key={i} size={12} fill="#fbbf24" />)}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px', color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <MapPin size={14} /> {item.city}, {item.country}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px', color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
                                        <div>📝 Opis: {item.description ? <span style={{ color: '#10b981' }}>Da</span> : <span style={{ color: '#ef4444' }}>Ne</span>}</div>
                                        <div>🖼️ Slike: {item.imagesCount > 0 ? <span style={{ color: '#10b981' }}>{item.imagesCount}</span> : <span style={{ color: '#ef4444' }}>0</span>}</div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div style={{ padding: '24px 32px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#181825' }}>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
                        Odabrano: <strong style={{ color: 'white' }}>{selectedIds.size}</strong> od {filteredItems.length}
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <button
                            onClick={onClose}
                            style={{
                                padding: '12px 24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
                                background: 'transparent', color: 'white', fontWeight: 600, cursor: 'pointer'
                            }}
                        >
                            Odustani
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={isSyncing || selectedIds.size === 0}
                            style={{
                                padding: '12px 32px', borderRadius: '12px', border: 'none',
                                background: selectedIds.size > 0 ? 'white' : 'rgba(255,255,255,0.1)',
                                color: selectedIds.size > 0 ? 'black' : 'rgba(255,255,255,0.3)',
                                fontWeight: 800, cursor: selectedIds.size > 0 ? 'pointer' : 'not-allowed',
                                display: 'flex', alignItems: 'center', gap: '8px'
                            }}
                        >
                            {isSyncing ? 'Učitavanje...' : 'UVEZI ODABRANO'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
