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
        const osnovni = room.osnovniKreveti || 0;
        const pomocni = room.pomocniKreveti || 0;
        const totalBeds = osnovni + pomocni;
        if (totalBeds === 0) {
            return (
                <div style={{ padding: '40px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <Bed size={32} style={{ opacity: 0.2, marginBottom: '12px' }} />
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Definišite broj osnovnih i pomoćnih ležajeva iznad <br /> kako biste videli tabelu zauzetosti.</p>
                </div>
            );
        }

        return (
            <div className="glass-card" style={{ padding: '0', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>ACTIVE</th>
                            <th style={{ padding: '16px 12px', textAlign: 'center', fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Max osoba</th>
                            <th style={{ padding: '16px 12px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', gap: '20px' }}>
                                    {Array.from({ length: osnovni }).map((_, i) => <span key={`h-o-${i}`} style={{ color: '#3b82f6', fontSize: '14px', fontWeight: 800 }}>Osnovni</span>)}
                                    {Array.from({ length: pomocni }).map((_, i) => <span key={`h-p-${i}`} style={{ color: '#a78bfa', fontSize: '14px', fontWeight: 800 }}>Pomoćni</span>)}
                                </div>
                            </th>
                            <th style={{ padding: '16px 24px', textAlign: 'center', fontSize: '14px', fontWeight: 800, color: '#ef4444', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Dete Deli Ležaj</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: totalBeds || 1 }).map((_, variantIdx) => {
                            // For N beds, generate N variants with different ADL/CHD combinations
                            // All variants have the same total occupancy (totalBeds)
                            const adults = variantIdx + 1; // 1 to totalBeds adults
                            const children = totalBeds - adults; // Remaining are children

                            // Build bed assignment array
                            const bedAssignment = [];
                            let adultsPlaced = 0;
                            let childrenPlaced = 0;

                            // First fill basic beds
                            for (let i = 0; i < osnovni; i++) {
                                if (adultsPlaced < adults) {
                                    bedAssignment.push({ type: 'osnovni', occupant: 'ADL' });
                                    adultsPlaced++;
                                } else if (childrenPlaced < children) {
                                    bedAssignment.push({ type: 'osnovni', occupant: 'CHD' });
                                    childrenPlaced++;
                                } else {
                                    bedAssignment.push({ type: 'osnovni', occupant: 'EMPTY' }); // Should not happen if logic is correct
                                }
                            }

                            // Then fill extra beds
                            for (let i = 0; i < pomocni; i++) {
                                if (adultsPlaced < adults) {
                                    bedAssignment.push({ type: 'pomocni', occupant: 'ADL' });
                                    adultsPlaced++;
                                } else if (childrenPlaced < children) {
                                    bedAssignment.push({ type: 'pomocni', occupant: 'CHD' });
                                    childrenPlaced++;
                                } else {
                                    bedAssignment.push({ type: 'pomocni', occupant: 'EMPTY' }); // Should not happen if logic is correct
                                }
                            }

                            const vKey = `${adults}ADL_${children}CHD`;
                            const isActive = room.allowedOccupancyVariants?.includes(vKey);
                            const childSharing = room.childSharingVariants?.includes(vKey);
                            const displayTotal = childSharing ? totalBeds + 1 : totalBeds;

                            return (
                                <tr key={vKey} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: isActive ? 'rgba(59, 130, 246, 0.02)' : 'transparent' }}>
                                    <td style={{ padding: '12px 24px', textAlign: 'left' }}>
                                        <input
                                            type="checkbox"
                                            checked={isActive}
                                            onChange={(e) => {
                                                const variants = room.allowedOccupancyVariants || [];
                                                const newVariants = e.target.checked ? [...variants, vKey] : variants.filter((v: string) => v !== vKey);
                                                updateRoom(roomIndex, { allowedOccupancyVariants: newVariants });
                                            }}
                                        />
                                    </td>
                                    <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                                        <span style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>{displayTotal}</span>
                                    </td>
                                    <td style={{ padding: '12px 12px' }}>
                                        <div style={{ display: 'flex', gap: '20px' }}>
                                            {bedAssignment.map((bed, idx) => (
                                                <div key={idx} style={{
                                                    padding: '6px 12px',
                                                    borderRadius: '6px',
                                                    fontSize: '12px',
                                                    fontWeight: 800,
                                                    background: bed.occupant === 'ADL' ? 'rgba(59, 130, 246, 0.15)' : (bed.occupant === 'CHD' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)'),
                                                    color: bed.occupant === 'ADL' ? '#3b82f6' : (bed.occupant === 'CHD' ? '#10b981' : 'rgba(255,255,255,0.2)'),
                                                    border: `1px solid ${bed.occupant === 'ADL' ? 'rgba(59, 130, 246, 0.3)' : (bed.occupant === 'CHD' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.1)')}`,
                                                    minWidth: '50px',
                                                    textAlign: 'center'
                                                }}>
                                                    {bed.occupant === 'EMPTY' ? '-' : bed.occupant}
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px 24px', textAlign: 'center' }}>
                                        <div
                                            style={{
                                                cursor: 'pointer',
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center'
                                            }}
                                            onClick={() => {
                                                const sharing = room.childSharingVariants || [];
                                                const newSharing = sharing.includes(vKey)
                                                    ? sharing.filter((v: string) => v !== vKey)
                                                    : [...sharing, vKey];
                                                updateRoom(roomIndex, { childSharingVariants: newSharing });
                                            }}
                                        >
                                            <div style={{
                                                width: '24px',
                                                height: '24px',
                                                borderRadius: '6px',
                                                border: '2px solid rgba(255,255,255,0.1)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'all 0.2s',
                                                background: childSharing ? 'rgba(236, 72, 153, 0.15)' : 'transparent',
                                                borderColor: childSharing ? '#ec4899' : 'rgba(255,255,255,0.1)'
                                            }}>
                                                {childSharing && (
                                                    <span style={{ color: '#ec4899', fontSize: '16px', fontWeight: 900 }}>✓</span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
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
                                        <div className="form-grid" style={{ marginBottom: '16px' }}>
                                            <div className="form-group">
                                                <label className="form-label">Osnovni Kreveti</label>
                                                <input type="number" className="glass-input" value={room.osnovniKreveti ?? ''} onChange={(e) => updateRoom(editingRoom, { osnovniKreveti: e.target.value === '' ? undefined : parseInt(e.target.value, 10) || 0 })} />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Pomoćni Kreveti</label>
                                                <input type="number" className="glass-input" value={room.pomocniKreveti ?? ''} onChange={(e) => updateRoom(editingRoom, { pomocniKreveti: e.target.value === '' ? undefined : parseInt(e.target.value, 10) || 0 })} />
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
