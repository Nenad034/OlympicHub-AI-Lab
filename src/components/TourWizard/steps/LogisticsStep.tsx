import { useState, useEffect } from 'react';
import type { FC } from 'react';
import type { StepProps } from '../types';
import { Plane, Bus, Ship, Train, Plus, Trash2, ArrowRight, MapPin } from 'lucide-react';
import { loadFromCloud } from '../../../utils/storageUtils';

const LogisticsStep: FC<StepProps> = ({ data, onChange }) => {
    const itinerary = data.itinerary || [];
    const [properties, setProperties] = useState<any[]>([]);

    useEffect(() => {
        const loadProperties = async () => {
            const { success, data: pData } = await loadFromCloud('properties');
            if (success && pData) {
                setProperties(pData);
            }
        };
        loadProperties();
    }, []);

    const addSegment = () => {
        const newSegment = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'Flight',
            fromCity: '',
            toCity: ''
        };

        if (itinerary.length > 0) {
            const next = [...itinerary];
            next[0].transportSegments = [...(next[0].transportSegments || []), newSegment as any];
            onChange({ itinerary: next });
        }
    };

    const removeSegment = (dayIdx: number, segIdx: number) => {
        const next = [...itinerary];
        next[dayIdx].transportSegments = next[dayIdx].transportSegments?.filter((_, i) => i !== segIdx);
        onChange({ itinerary: next });
    };

    const updateHotel = (dayIdx: number, hotelId: string) => {
        const next = [...itinerary];
        const selectedHotel = properties.find(p => p.id === hotelId);
        next[dayIdx].accommodation = selectedHotel ? {
            hotelId: selectedHotel.id,
            hotelName: selectedHotel.name,
            roomTypeId: '' // Could be expanded to select room type
        } : undefined;
        onChange({ itinerary: next });
    };

    return (
        <div>
            <div className="form-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                        <h3 className="form-section-title" style={{ marginBottom: '4px' }}>Transport Mixer</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>Kombinujte različite vidove prevoza u okviru aranžmana</p>
                    </div>
                    <button className="btn-primary" onClick={addSegment} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={16} /> Dodaj Segment
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                    {itinerary.map((day, dIdx) => (
                        day.transportSegments?.map((seg, sIdx) => (
                            <div key={seg.id} style={{
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border)',
                                borderRadius: '12px',
                                padding: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '8px',
                                        background: 'var(--accent-glow)',
                                        color: 'var(--accent)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {seg.type === 'Flight' && <Plane size={20} />}
                                        {seg.type === 'Bus' && <Bus size={20} />}
                                        {seg.type === 'Ship' && <Ship size={20} />}
                                        {seg.type === 'Train' && <Train size={20} />}
                                    </div>
                                    <button
                                        className="btn-secondary"
                                        onClick={() => removeSegment(dIdx, sIdx)}
                                        style={{ padding: '8px', minWidth: 'auto' }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <select
                                    className="form-select"
                                    value={seg.type}
                                    onChange={e => {
                                        const next = [...itinerary];
                                        next[dIdx].transportSegments![sIdx].type = e.target.value as any;
                                        onChange({ itinerary: next });
                                    }}
                                >
                                    <option value="Flight">Avion</option>
                                    <option value="Bus">Autobus</option>
                                    <option value="Ship">Brod</option>
                                    <option value="Train">Voz</option>
                                </select>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Odakle"
                                        value={seg.fromCity}
                                        onChange={e => {
                                            const next = [...itinerary];
                                            next[dIdx].transportSegments![sIdx].fromCity = e.target.value;
                                            onChange({ itinerary: next });
                                        }}
                                    />
                                    <ArrowRight size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Dokle"
                                        value={seg.toCity}
                                        onChange={e => {
                                            const next = [...itinerary];
                                            next[dIdx].transportSegments![sIdx].toCity = e.target.value;
                                            onChange({ itinerary: next });
                                        }}
                                    />
                                </div>
                            </div>
                        ))
                    ))}
                </div>

                {itinerary.every(day => !day.transportSegments || day.transportSegments.length === 0) && (
                    <div style={{
                        padding: '40px 20px',
                        textAlign: 'center',
                        background: 'var(--bg-card)',
                        border: '2px dashed var(--border)',
                        borderRadius: '12px'
                    }}>
                        <p style={{ color: 'var(--text-secondary)' }}>Nema definisanih transportnih segmenata</p>
                    </div>
                )}
            </div>

            <div className="form-section">
                <h3 className="form-section-title" style={{ marginBottom: '4px' }}>Smeštaj & Objekti</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>Povežite hotele iz baze sa danima u itinereru</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {itinerary.map((day, idx) => (
                        <div key={idx} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            background: 'var(--bg-card)',
                            padding: '16px',
                            borderRadius: '12px',
                            border: '1px solid var(--border)'
                        }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: 'var(--accent)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: 'bold'
                            }}>
                                {idx + 1}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>Dan {idx + 1}: {day.title || 'Itinerer'}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                                    <MapPin size={12} /> {day.location || 'Nije definisana lokacija'}
                                </div>
                            </div>
                            <div style={{ width: '300px' }}>
                                <select
                                    className="form-select"
                                    value={day.accommodation?.hotelId || ''}
                                    onChange={(e) => updateHotel(idx, e.target.value)}
                                    style={{ width: '100%' }}
                                >
                                    <option value="">Izaberi hotel...</option>
                                    {properties.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    ))}
                    {itinerary.length === 0 && (
                        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--bg-card)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
                            Inicijalizujte itinerer u prvom koraku da biste dodelili smeštaj.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LogisticsStep;

