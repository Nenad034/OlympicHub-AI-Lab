import React, { useState } from 'react';
import { Shield, Check, AlertCircle } from 'lucide-react';
import type { StepProps } from '../types';
import type { PropertyAmenity } from '../../../types/property.types';

const AmenitiesStep: React.FC<StepProps> = ({ data, onChange }) => {
    const [selectedCategory, setSelectedCategory] = useState('General');

    // OTA Standard Amenity Codes
    const amenityCategories = {
        'General': [
            { code: 'WiFi_Free', name: 'WiFi Besplatan', icon: '📶' },
            { code: 'WiFi_Paid', name: 'WiFi Plaćen', icon: '📶' },
            { code: 'Parking_Free', name: 'Parking Besplatan', icon: '🅿️' },
            { code: 'Parking_Paid', name: 'Parking Plaćen', icon: '🅿️' },
            { code: 'Restaurant', name: 'Restoran', icon: '🍽️' },
            { code: 'Bar', name: 'Bar', icon: '🍸' },
            { code: 'RoomService', name: 'Sobna Usluga', icon: '🛎️' },
            { code: 'Reception24h', name: 'Recepcija 24h', icon: '🏨' },
            { code: 'Elevator', name: 'Lift', icon: '🛗' },
            { code: 'AirportShuttle', name: 'Transfer do Aerodroma', icon: '🚐' }
        ],
        'Wellness': [
            { code: 'Pool_Indoor', name: 'Bazen Unutrašnji', icon: '🏊' },
            { code: 'Pool_Outdoor', name: 'Bazen Spoljašnji', icon: '🏊' },
            { code: 'Pool_Heated', name: 'Bazen Grejan', icon: '🏊' },
            { code: 'Spa', name: 'Spa', icon: '💆' },
            { code: 'Sauna', name: 'Sauna', icon: '🧖' },
            { code: 'Gym', name: 'Teretana', icon: '💪' },
            { code: 'Massage', name: 'Masaža', icon: '💆' },
            { code: 'HotTub', name: 'Đakuzi', icon: '🛁' }
        ],
        'Family': [
            { code: 'KidsClub', name: 'Dečiji Klub', icon: '👶' },
            { code: 'Playground', name: 'Igralište', icon: '🎪' },
            { code: 'Babysitting', name: 'Čuvanje Dece', icon: '👶' },
            { code: 'FamilyRooms', name: 'Porodične Sobe', icon: '👨‍👩‍👧‍👦' }
        ],
        'Business': [
            { code: 'BusinessCenter', name: 'Poslovni Centar', icon: '💼' },
            { code: 'MeetingRooms', name: 'Sale za Sastanke', icon: '🏢' },
            { code: 'ConferenceRoom', name: 'Konferencijska Sala', icon: '🎤' }
        ],
        'Sports': [
            { code: 'Tennis', name: 'Tenis', icon: '🎾' },
            { code: 'Golf', name: 'Golf', icon: '⛳' },
            { code: 'Skiing', name: 'Skijanje', icon: '⛷️' },
            { code: 'WaterSports', name: 'Vodeni Sportovi', icon: '🏄' },
            { code: 'Bicycle', name: 'Bicikli', icon: '🚴' }
        ]
    };

    const toggleAmenity = (code: string, name: string) => {
        const currentAmenities = data.propertyAmenities || [];
        const exists = currentAmenities.find(a => a.otaCode === code);

        if (exists) {
            // Remove
            onChange({
                propertyAmenities: currentAmenities.filter(a => a.otaCode !== code)
            });
        } else {
            // Add
            const newAmenity: PropertyAmenity = {
                amenityId: Math.random().toString(36).substr(2, 9),
                otaCode: code,
                name: name,
                category: selectedCategory,
                isFree: true,
                onSite: true,
                reservationRequired: false,
                propertyId: data.identifiers?.internalId || ''
            };
            onChange({
                propertyAmenities: [...currentAmenities, newAmenity]
            });
        }
    };

    const isSelected = (code: string) => {
        return data.propertyAmenities?.some(a => a.otaCode === code) || false;
    };

    const updateAmenityDetails = (code: string, updates: Partial<PropertyAmenity>) => {
        const currentAmenities = data.propertyAmenities || [];
        const updatedAmenities = currentAmenities.map(a =>
            a.otaCode === code ? { ...a, ...updates } : a
        );
        onChange({ propertyAmenities: updatedAmenities });
    };

    return (
        <div>
            <div className="form-section">
                <h3 className="form-section-title">Sadržaji Objekta (OTA Standard)</h3>

                {/* Category Tabs */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
                    {Object.keys(amenityCategories).map(category => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '12px',
                                border: '1px solid var(--border)',
                                background: selectedCategory === category ? 'var(--accent)' : 'var(--bg-card)',
                                color: selectedCategory === category ? '#fff' : 'var(--text-primary)',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                fontWeight: '600',
                                transition: 'all 0.2s'
                            }}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* Amenities Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                    gap: '12px',
                    marginBottom: '24px'
                }}>
                    {amenityCategories[selectedCategory as keyof typeof amenityCategories].map(amenity => {
                        const selected = isSelected(amenity.code);
                        return (
                            <div
                                key={amenity.code}
                                onClick={() => toggleAmenity(amenity.code, amenity.name)}
                                style={{
                                    padding: '16px',
                                    background: selected ? 'var(--accent-glow)' : 'var(--bg-card)',
                                    border: `2px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    transition: '0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px'
                                }}
                            >
                                <span style={{ fontSize: '24px' }}>{amenity.icon}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '600', fontSize: '14px' }}>{amenity.name}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{amenity.code}</div>
                                </div>
                                {selected && (
                                    <div style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        background: 'var(--accent)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#fff'
                                    }}>
                                        <Check size={16} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Selected Amenities Summary */}
                {data.propertyAmenities && data.propertyAmenities.length > 0 && (
                    <div style={{
                        background: 'var(--bg-dark)',
                        border: '1px solid var(--border)',
                        borderRadius: '16px',
                        padding: '24px',
                        marginTop: '32px'
                    }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '16px' }}>
                            Izabrani Sadržaji ({data.propertyAmenities.length})
                        </h4>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {data.propertyAmenities.map(amenity => (
                                <div key={amenity.amenityId} style={{
                                    background: 'var(--bg-card)',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    display: 'grid',
                                    gridTemplateColumns: '1fr auto auto auto',
                                    gap: '12px',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: '600', fontSize: '13px' }}>{amenity.name}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{amenity.otaCode}</div>
                                    </div>

                                    <label className="form-checkbox" style={{ margin: 0 }}>
                                        <input
                                            type="checkbox"
                                            checked={amenity.isFree}
                                            onChange={(e) => updateAmenityDetails(amenity.otaCode, { isFree: e.target.checked })}
                                        />
                                        <span style={{ fontSize: '12px' }}>Besplatno</span>
                                    </label>

                                    <label className="form-checkbox" style={{ margin: 0 }}>
                                        <input
                                            type="checkbox"
                                            checked={amenity.onSite}
                                            onChange={(e) => updateAmenityDetails(amenity.otaCode, { onSite: e.target.checked })}
                                        />
                                        <span style={{ fontSize: '12px' }}>Na Licu Mesta</span>
                                    </label>

                                    <label className="form-checkbox" style={{ margin: 0 }}>
                                        <input
                                            type="checkbox"
                                            checked={amenity.reservationRequired}
                                            onChange={(e) => updateAmenityDetails(amenity.otaCode, { reservationRequired: e.target.checked })}
                                        />
                                        <span style={{ fontSize: '12px' }}>Rezervacija</span>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {(!data.propertyAmenities || data.propertyAmenities.length === 0) && (
                    <div style={{
                        padding: '40px',
                        textAlign: 'center',
                        background: 'var(--bg-card)',
                        border: '2px dashed var(--border)',
                        borderRadius: '16px',
                        color: 'var(--text-secondary)'
                    }}>
                        <Shield size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                        <p>Nema izabranih sadržaja. Kliknite na stavke iznad da ih dodate.</p>
                    </div>
                )}
            </div>

            <div style={{
                background: 'var(--bg-sidebar)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '16px',
                marginTop: '24px'
            }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <AlertCircle size={20} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                        <strong>OTA Amenity Codes:</strong>
                        <p style={{ margin: '8px 0 0 0', lineHeight: '1.5' }}>
                            Ovi kodovi su standardizovani prema OpenTravel Alliance specifikaciji i koriste se za integraciju sa Booking.com, Expedia i drugim OTA platformama.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AmenitiesStep;
