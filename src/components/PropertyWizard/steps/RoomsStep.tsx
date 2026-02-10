import React, { useState } from 'react';
import { Plus, Bed, Trash2, Grid, List, X, Save, Copy, Maximize, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { StepProps } from '../types';
import type { RoomType, BeddingConfiguration } from '../../../types/property.types';

const RoomsStep: React.FC<StepProps> = ({ data, onChange }) => {
    const [editingRoom, setEditingRoom] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const addRoom = () => {
        const newRoom: RoomType = {
            roomTypeId: Math.random().toString(36).substr(2, 9),
            code: `ROOM_${(data.roomTypes?.length || 0) + 1}`,
            nameInternal: '',
            category: 'Room',
            standardOccupancy: 2,
            maxAdults: 2,
            maxChildren: 0,
            maxOccupancy: 2,
            minOccupancy: 1,
            osnovniKreveti: 2,
            pomocniKreveti: 0,
            allowChildSharingBed: false,
            childSharingVariants: [],
            allowAdultsOnExtraBeds: true,
            allowInfantSharingBed: false,
            babyCotAvailable: false,
            isNonSmoking: true,
            isAccessible: false,
            petsAllowed: false,
            bathroomCount: 1,
            bathroomType: 'Private',
            beddingConfigurations: [],
            bedSetupVariants: [{ id: Math.random().toString(36).substr(2, 5), basic: 2, extra: 0 }],
            amenities: [],
            images: [],
            allowedOccupancyVariants: []
        };
        onChange({ roomTypes: [...(data.roomTypes || []), newRoom] });
        setEditingRoom((data.roomTypes?.length || 0));
    };

    const updateRoom = (index: number, updates: Partial<RoomType>) => {
        const newRooms = [...(data.roomTypes || [])];
        newRooms[index] = { ...newRooms[index], ...updates };
        onChange({ roomTypes: newRooms });
    };

    const deleteRoom = (index: number) => {
        const newRooms = data.roomTypes?.filter((_, i) => i !== index) || [];
        onChange({ roomTypes: newRooms });
        setEditingRoom(null);
    };

    const addBedding = (roomIndex: number) => {
        const room = data.roomTypes?.[roomIndex];
        if (!room) return;

        const newBedding: BeddingConfiguration = {
            bedTypeCode: 'DOUBLE',
            quantity: 1,
            isExtraBed: false
        };

        updateRoom(roomIndex, {
            beddingConfigurations: [...room.beddingConfigurations, newBedding]
        });
    };

    const updateBedding = (roomIndex: number, beddingIndex: number, updates: Partial<BeddingConfiguration>) => {
        const room = data.roomTypes?.[roomIndex];
        if (!room) return;

        const newBedding = [...room.beddingConfigurations];
        newBedding[beddingIndex] = { ...newBedding[beddingIndex], ...updates };
        updateRoom(roomIndex, { beddingConfigurations: newBedding });
    };

    const deleteBedding = (roomIndex: number, beddingIndex: number) => {
        const room = data.roomTypes?.[roomIndex];
        if (!room) return;

        const newBedding = room.beddingConfigurations.filter((_, i) => i !== beddingIndex);
        updateRoom(roomIndex, { beddingConfigurations: newBedding });
    };

    const renderOccupancyTable = (room: RoomType, roomIndex: number) => {
        if (!room.bedSetupVariants || room.bedSetupVariants.length === 0) {
            return (
                <div style={{ padding: '40px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <Bed size={32} style={{ opacity: 0.2, marginBottom: '12px' }} />
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Definišite barem jednu varijantu kreveta iznad <br /> kako biste videli tabelu zauzetosti.</p>
                </div>
            );
        }

        return (
            <div style={{ display: 'grid', gap: '24px' }}>
                {room.bedSetupVariants.map((setup) => {
                    const basic = setup.basic || 0;
                    const extra = setup.extra || 0;
                    const total = basic + extra;

                    // Generate variants for THIS specific setup (e.g., 2+1 -> 1ADL+2CHD, 2ADL+1CHD, 3ADL+0CHD)
                    const variantsForThisSetup: { vKey: string, adults: number, children: number, total: number }[] = [];
                    for (let a = 1; a <= total; a++) {
                        const c = total - a;
                        variantsForThisSetup.push({
                            vKey: `${setup.id}_${a}ADL_${c}CHD`,
                            adults: a,
                            children: c,
                            total: total
                        });
                    }

                    return (
                        <div key={setup.id} className="glass-card" style={{ padding: '0', overflow: 'hidden', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                            <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '12px 24px', borderBottom: '1px solid rgba(139, 92, 246, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ background: 'var(--accent)', color: '#fff', padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 900 }}>
                                    {setup.basic} OSNOVNA + {setup.extra} POMOĆNA
                                </div>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.01)' }}>
                                        <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', width: '80px' }}>STATUS</th>
                                        <th style={{ padding: '12px 12px', textAlign: 'center', fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', width: '80px' }}>TOTAL</th>
                                        <th style={{ padding: '12px 12px', textAlign: 'left' }}>
                                            <div style={{ display: 'flex', gap: '12px' }}>
                                                {Array.from({ length: basic }).map((_, i) => <span key={`h-b-${i}`} style={{ color: '#3b82f6', fontSize: '11px', fontWeight: 800 }}>OSN</span>)}
                                                {Array.from({ length: extra }).map((_, i) => <span key={`h-e-${i}`} style={{ color: '#a78bfa', fontSize: '11px', fontWeight: 800 }}>POM</span>)}
                                            </div>
                                        </th>
                                        <th style={{ padding: '12px 24px', textAlign: 'center', fontSize: '11px', fontWeight: 800, color: '#ef4444', width: '120px' }}>DETE DELI</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {variantsForThisSetup.map((v) => {
                                        const isActive = room.allowedOccupancyVariants?.includes(v.vKey);
                                        const isSharing = room.childSharingVariants?.includes(v.vKey);

                                        const bedPlan = [];
                                        let adlLeft = v.adults;
                                        let chdLeft = v.children;

                                        for (let i = 0; i < basic; i++) {
                                            if (adlLeft > 0) { adlLeft--; bedPlan.push('ADL'); }
                                            else if (chdLeft > 0) { chdLeft--; bedPlan.push('CHD'); }
                                            else bedPlan.push('-');
                                        }
                                        for (let i = 0; i < extra; i++) {
                                            if (adlLeft > 0) { adlLeft--; bedPlan.push('ADL'); }
                                            else if (chdLeft > 0) { chdLeft--; bedPlan.push('CHD'); }
                                            else bedPlan.push('-');
                                        }

                                        return (
                                            <tr key={v.vKey} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: isActive ? 'rgba(59, 130, 246, 0.03)' : 'transparent' }}>
                                                <td style={{ padding: '10px 24px' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isActive}
                                                        onChange={e => {
                                                            const variants = room.allowedOccupancyVariants || [];
                                                            const updated = e.target.checked ? [...variants, v.vKey] : variants.filter(x => x !== v.vKey);
                                                            updateRoom(roomIndex, { allowedOccupancyVariants: updated });
                                                        }}
                                                    />
                                                </td>
                                                <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 900, color: '#fff' }}>
                                                    {isSharing ? v.total + 1 : v.total}
                                                </td>
                                                <td style={{ padding: '10px 12px' }}>
                                                    <div style={{ display: 'flex', gap: '12px' }}>
                                                        {bedPlan.map((occupant, idx) => (
                                                            <div key={idx} style={{
                                                                minWidth: '36px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                fontSize: '10px', fontWeight: 900, borderRadius: '4px',
                                                                background: occupant === 'ADL' ? 'rgba(59, 130, 246, 0.2)' : (occupant === 'CHD' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)'),
                                                                color: occupant === 'ADL' ? '#3b82f6' : (occupant === 'CHD' ? '#10b981' : 'rgba(255,255,255,0.2)'),
                                                                border: `1px solid ${occupant === 'ADL' ? 'rgba(59, 130, 246, 0.3)' : (occupant === 'CHD' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.1)')}`
                                                            }}>
                                                                {occupant}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '10px 24px', textAlign: 'center' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSharing}
                                                        onChange={e => {
                                                            const variants = room.childSharingVariants || [];
                                                            const updated = e.target.checked ? [...variants, v.vKey] : variants.filter(x => x !== v.vKey);
                                                            updateRoom(roomIndex, { childSharingVariants: updated });
                                                        }}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderEditor = () => {
        if (editingRoom === null) return null;
        const room = data.roomTypes?.[editingRoom];
        if (!room) return null;

        return (
            <div className="wizard-overlay" style={{ backdropFilter: 'blur(10px)', background: 'rgba(11, 15, 26, 0.8)' }}>
                <div className="wizard-container" style={{ maxWidth: '1400px', margin: 'auto', background: 'transparent', height: '90vh', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                    <div className="wizard-main-area" style={{ background: '#0f172a' }}>
                        <div className="wizard-topbar" style={{ background: 'rgba(30, 41, 59, 0.5)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <div className="topbar-title">
                                <span className="topbar-subtitle">MODAL: UREĐIVANJE JEDINICE</span>
                                <h3>{room.nameInternal || 'Nova Jedinica'}</h3>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button className="btn-secondary" onClick={() => setEditingRoom(null)}><X size={18} style={{ marginRight: '8px' }} /> Zatvori</button>
                                <button className="btn-primary" onClick={() => setEditingRoom(null)}><Save size={18} style={{ marginRight: '8px' }} /> Sačuvaj</button>
                            </div>
                        </div>

                        <div className="wizard-content-wrapper glass-scroll">
                            <div className="content-center-limit">
                                <div className="form-grid" style={{ gap: '24px', marginBottom: '32px' }}>
                                    {/* Section 1: Basic Info & Bedding */}
                                    <div className="glass-card" style={{ padding: '24px' }}>
                                        <h4 className="form-section-title">Osnovne Informacije</h4>
                                        <div className="form-group" style={{ marginBottom: '16px' }}>
                                            <label className="form-label">Naziv Sobe</label>
                                            <input className="glass-input" value={room.nameInternal} onChange={(e) => updateRoom(editingRoom, { nameInternal: e.target.value })} placeholder="Standard Dvokrevetna Soba" />
                                        </div>
                                        <div className="form-grid" style={{ marginBottom: '16px' }}>
                                            <div className="form-group">
                                                <label className="form-label">Interni Kod</label>
                                                <input className="glass-input" value={room.code} onChange={(e) => updateRoom(editingRoom, { code: e.target.value })} placeholder="STD" />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Kategorija</label>
                                                <select className="glass-select" value={room.category} onChange={(e) => updateRoom(editingRoom, { category: e.target.value as any })}>
                                                    <option value="Room">Room (Standardna soba)</option>
                                                    <option value="Suite">Suite (Apartman sa dnevnim boravkom)</option>
                                                    <option value="Apartment">Apartment (Sa kuhinjom)</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="form-grid" style={{ marginBottom: '16px' }}>
                                            <div className="form-group">
                                                <label className="form-label">Kvadratura (m²)</label>
                                                <input type="number" className="glass-input" value={room.sizeSqm ?? ''} onChange={(e) => updateRoom(editingRoom, { sizeSqm: e.target.value === '' ? undefined : Number(e.target.value) })} />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Pogled</label>
                                                <select className="glass-select" value={room.viewType || ''} onChange={(e) => updateRoom(editingRoom, { viewType: e.target.value as any })}>
                                                    <option value="">Bez pogleda</option>
                                                    <option value="SeaView">Pogled na More</option>
                                                    <option value="GardenView">Bašta</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                <h4 className="form-section-title" style={{ margin: 0 }}>Struktura Kreveta (Varijante)</h4>
                                                <button
                                                    className="btn-primary"
                                                    style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '8px' }}
                                                    onClick={() => {
                                                        const variants = room.bedSetupVariants || [];
                                                        updateRoom(editingRoom, {
                                                            bedSetupVariants: [...variants, { id: Math.random().toString(36).substr(2, 5), basic: 2, extra: 0 }]
                                                        });
                                                    }}
                                                >
                                                    <Plus size={14} style={{ marginRight: '4px' }} /> DODAJ NOVI RED
                                                </button>
                                            </div>

                                            <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
                                                {(room.bedSetupVariants || []).map((setup, idx) => (
                                                    <div key={setup.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <div style={{ flex: 1 }}>
                                                            <label style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 800, marginBottom: '4px', display: 'block' }}>OSNOVNI</label>
                                                            <input
                                                                type="number"
                                                                className="glass-input"
                                                                style={{ padding: '8px' }}
                                                                value={setup.basic}
                                                                onChange={e => {
                                                                    const newVariants = [...(room.bedSetupVariants || [])];
                                                                    newVariants[idx] = { ...newVariants[idx], basic: parseInt(e.target.value) || 0 };
                                                                    updateRoom(editingRoom, { bedSetupVariants: newVariants, osnovniKreveti: Math.max(...newVariants.map(v => v.basic)) });
                                                                }}
                                                            />
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <label style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 800, marginBottom: '4px', display: 'block' }}>POMOĆNI</label>
                                                            <input
                                                                type="number"
                                                                className="glass-input"
                                                                style={{ padding: '8px' }}
                                                                value={setup.extra}
                                                                onChange={e => {
                                                                    const newVariants = [...(room.bedSetupVariants || [])];
                                                                    newVariants[idx] = { ...newVariants[idx], extra: parseInt(e.target.value) || 0 };
                                                                    updateRoom(editingRoom, { bedSetupVariants: newVariants, pomocniKreveti: Math.max(...newVariants.map(v => v.extra)) });
                                                                }}
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                const newVariants = room.bedSetupVariants.filter((_, i) => i !== idx);
                                                                updateRoom(editingRoom, { bedSetupVariants: newVariants });
                                                            }}
                                                            style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', height: '36px', width: '36px', borderRadius: '8px', cursor: 'pointer' }}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 2: Rules & Options */}
                                    <div className="glass-card" style={{ padding: '24px' }}>
                                        <h4 className="form-section-title">Pravila i Opcije</h4>
                                        <div className="form-grid">
                                            <div className="form-group">
                                                <label className="form-checkbox">
                                                    <input type="checkbox" checked={room.allowAdultsOnExtraBeds} onChange={(e) => updateRoom(editingRoom, { allowAdultsOnExtraBeds: e.target.checked })} />
                                                    <span>Dozvoli ADL na pomoćnom</span>
                                                </label>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-checkbox">
                                                    <input type="checkbox" checked={room.allowInfantSharingBed} onChange={(e) => updateRoom(editingRoom, { allowInfantSharingBed: e.target.checked })} />
                                                    <span>Beba deli ležaj (Free)</span>
                                                </label>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-checkbox">
                                                    <input type="checkbox" checked={room.babyCotAvailable} onChange={(e) => updateRoom(editingRoom, { babyCotAvailable: e.target.checked })} />
                                                    <span>Kreveac dostupan</span>
                                                </label>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-checkbox">
                                                    <input type="checkbox" checked={room.petsAllowed} onChange={(e) => updateRoom(editingRoom, { petsAllowed: e.target.checked })} />
                                                    <span>Ljubimci dozvoljeni</span>
                                                </label>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-checkbox">
                                                    <input type="checkbox" checked={room.isNonSmoking} onChange={(e) => updateRoom(editingRoom, { isNonSmoking: e.target.checked })} />
                                                    <span>Nepušačka soba</span>
                                                </label>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-checkbox">
                                                    <input type="checkbox" checked={room.isAccessible} onChange={(e) => updateRoom(editingRoom, { isAccessible: e.target.checked })} />
                                                    <span>Zasebno kupatilo</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-section">
                                    <h4 className="form-section-title">Konfiguracije Zauzetosti</h4>
                                    {renderOccupancyTable(room, editingRoom)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="form-section" style={{ flex: 1, overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Bed className="text-blue-500" /> Smeštajne Jedinice
                    </h2>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '4px' }}>
                            <button onClick={() => setViewMode('grid')} style={{ padding: '8px 16px', background: viewMode === 'grid' ? 'var(--accent)' : 'transparent', color: viewMode === 'grid' ? '#fff' : '#94a3b8', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                                <Grid size={16} /> Grid
                            </button>
                            <button onClick={() => setViewMode('list')} style={{ padding: '8px 16px', background: viewMode === 'list' ? 'var(--accent)' : 'transparent', color: viewMode === 'list' ? '#fff' : '#94a3b8', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                                <List size={16} /> Lista
                            </button>
                        </div>
                        <button className="btn-primary" onClick={addRoom} style={{ borderRadius: '12px' }}><Plus size={20} style={{ marginRight: '8px' }} /> Nova Soba</button>
                    </div>
                </div>

                {(!data.roomTypes || data.roomTypes.length === 0) && (
                    <div style={{
                        padding: '60px',
                        textAlign: 'center',
                        background: 'var(--bg-card)',
                        border: '2px dashed var(--border)',
                        borderRadius: '16px',
                        color: 'var(--text-secondary)'
                    }}>
                        <Bed size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                        <p>Nema definisanih soba. Kliknite "Dodaj Sobu" da započnete.</p>
                    </div>
                )}

                <div style={{
                    display: viewMode === 'grid' ? 'grid' : 'flex',
                    flexDirection: viewMode === 'list' ? 'column' : undefined,
                    gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(350px, 1fr))' : undefined,
                    gap: '20px'
                }}>
                    {data.roomTypes?.map((room, roomIndex) => (
                        <motion.div
                            key={room.roomTypeId}
                            whileHover={{ scale: 1.02 }}
                            className="glass-card"
                            style={{
                                padding: '24px',
                                cursor: 'pointer',
                                display: viewMode === 'list' ? 'flex' : 'block',
                                alignItems: viewMode === 'list' ? 'center' : undefined,
                                gap: viewMode === 'list' ? '20px' : undefined,
                                background: 'rgba(15, 23, 42, 0.4)',
                                border: '1px solid rgba(255,255,255,0.05)'
                            }}
                            onClick={() => setEditingRoom(roomIndex)}
                        >
                            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0, marginBottom: viewMode === 'grid' ? '16px' : 0 }}>
                                <Bed size={28} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>{room.nameInternal || 'Soba bez naziva'}</h4>
                                <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>#{room.code} • {room.category}</div>

                                {/* Bed, Size & View Badge Grid */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)', padding: '4px 10px', borderRadius: '8px' }}>
                                        <Bed size={12} /> {room.osnovniKreveti || 0} OSN.
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: '#a78bfa', background: 'rgba(167, 139, 250, 0.1)', padding: '4px 10px', borderRadius: '8px' }}>
                                        <Plus size={12} /> {room.pomocniKreveti || 0} POM.
                                    </div>

                                    {room.sizeSqm && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '8px' }}>
                                            <Maximize size={12} /> {room.sizeSqm} m²
                                        </div>
                                    )}

                                    {room.viewType && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: '#fbbf24', background: 'rgba(251, 191, 36, 0.1)', padding: '4px 10px', borderRadius: '8px' }}>
                                            <Eye size={12} /> {room.viewType === 'SeaView' ? 'Pogled na More' : room.viewType === 'GardenView' ? 'Bašta' : room.viewType}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', marginTop: viewMode === 'grid' ? '12px' : 0, alignItems: 'center' }}>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => { e.stopPropagation(); setEditingRoom(roomIndex); }}
                                    style={{ width: '32px', height: '32px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', color: '#3b82f6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 900 }}
                                >
                                    +
                                </motion.button>
                                <motion.button whileTap={{ scale: 0.95 }} className="btn-secondary" style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)' }} onClick={(e) => {
                                    e.stopPropagation();
                                    const copy = { ...room, roomTypeId: Math.random().toString(36).substr(2, 9), code: `${room.code}_COPY` };
                                    onChange({ roomTypes: [...(data.roomTypes || []), copy] });
                                }}>
                                    <Copy size={16} />
                                </motion.button>
                                <motion.button whileTap={{ scale: 0.95 }} className="btn-secondary" style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)' }} onClick={(e) => { e.stopPropagation(); setEditingRoom(roomIndex); }}>
                                    Uredi
                                </motion.button>
                                <motion.button whileTap={{ scale: 0.95 }} style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', borderRadius: '10px' }} onClick={(e) => { e.stopPropagation(); deleteRoom(roomIndex); }}>
                                    <Trash2 size={16} />
                                </motion.button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <AnimatePresence>
                {editingRoom !== null && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {renderEditor()}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RoomsStep;
