import React from 'react';
import { AlertCircle } from 'lucide-react';
import type { StepProps } from '../types';
import type { HouseRules, KeyCollection, HostProfile } from '../../../types/property.types';

const PoliciesStep: React.FC<StepProps> = ({ data, onChange }) => {
    const updateHouseRules = (updates: Partial<HouseRules>) => {
        onChange({ houseRules: { ...data.houseRules, ...updates } as any });
    };

    const updateKeyCollection = (updates: Partial<KeyCollection>) => {
        onChange({ keyCollection: { ...data.keyCollection, ...updates } as any });
    };

    const updateHostProfile = (updates: Partial<HostProfile>) => {
        onChange({ hostProfile: { ...data.hostProfile, ...updates } as any });
    };

    const needsKeyCollection = data.propertyType === 'Apartment' || data.propertyType === 'Villa';

    return (
        <div>
            <div className="form-section">
                <h3 className="form-section-title">Pravila Kuće (House Rules)</h3>
                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label required">Check-in Početak</label>
                        <input
                            type="time"
                            className="form-input"
                            value={data.houseRules?.checkInStart || '14:00'}
                            onChange={(e) => updateHouseRules({ checkInStart: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label required">Check-in Kraj</label>
                        <input
                            type="time"
                            className="form-input"
                            value={data.houseRules?.checkInEnd || '22:00'}
                            onChange={(e) => updateHouseRules({ checkInEnd: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label required">Check-out Vreme</label>
                        <input
                            type="time"
                            className="form-input"
                            value={data.houseRules?.checkOutTime || '10:00'}
                            onChange={(e) => updateHouseRules({ checkOutTime: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Minimalna Starost za Check-in</label>
                        <input
                            type="number"
                            className="form-input"
                            placeholder="npr. 18 ili 21"
                            value={data.houseRules?.ageRestriction || ''}
                            onChange={(e) => updateHouseRules({ ageRestriction: e.target.value ? Number(e.target.value) : undefined })}
                        />
                    </div>
                </div>

                <div style={{ marginTop: '24px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '16px' }}>Restrikcije</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <label className="form-checkbox">
                            <input
                                type="checkbox"
                                checked={data.houseRules?.smokingAllowed || false}
                                onChange={(e) => updateHouseRules({ smokingAllowed: e.target.checked })}
                            />
                            <span>Pušenje dozvoljeno</span>
                        </label>

                        <label className="form-checkbox">
                            <input
                                type="checkbox"
                                checked={data.houseRules?.partiesAllowed || false}
                                onChange={(e) => updateHouseRules({ partiesAllowed: e.target.checked })}
                            />
                            <span>Žurke/Događaji dozvoljeni</span>
                        </label>

                        <label className="form-checkbox">
                            <input
                                type="checkbox"
                                checked={data.houseRules?.petsAllowed || false}
                                onChange={(e) => updateHouseRules({ petsAllowed: e.target.checked })}
                            />
                            <span>Kućni ljubimci dozvoljeni</span>
                        </label>
                    </div>

                    {data.houseRules?.petsAllowed && (
                        <div style={{
                            marginTop: '16px',
                            padding: '16px',
                            background: 'rgba(0,0,0,0.2)',
                            borderRadius: '12px',
                            border: '1px solid var(--border)'
                        }}>
                            <h5 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '12px' }}>Detalji o Kućnim Ljubimcima</h5>
                            <div className="form-grid">
                                <label className="form-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={data.houseRules?.petDetails?.dogsOnly || false}
                                        onChange={(e) => updateHouseRules({
                                            petDetails: {
                                                ...data.houseRules?.petDetails,
                                                dogsOnly: e.target.checked
                                            } as any
                                        })}
                                    />
                                    <span>Samo psi</span>
                                </label>

                                <div className="form-group">
                                    <label className="form-label">Maksimalna Težina (kg)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="npr. 10"
                                        value={data.houseRules?.petDetails?.maxWeight || ''}
                                        onChange={(e) => updateHouseRules({
                                            petDetails: {
                                                ...data.houseRules?.petDetails,
                                                maxWeight: e.target.value ? Number(e.target.value) : undefined
                                            } as any
                                        })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Naknada za Ljubimca (EUR)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="npr. 15"
                                        value={data.houseRules?.petDetails?.petFee || ''}
                                        onChange={(e) => updateHouseRules({
                                            petDetails: {
                                                ...data.houseRules?.petDetails,
                                                petFee: e.target.value ? Number(e.target.value) : undefined
                                            } as any
                                        })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {needsKeyCollection && (
                <div className="form-section">
                    <h3 className="form-section-title">
                        Preuzimanje Ključeva
                        <span style={{ fontSize: '12px', color: 'var(--accent)', marginLeft: '8px' }}>
                            (Obavezno za Apartmane/Vile)
                        </span>
                    </h3>
                    <div className="form-grid">
                        <div className="form-group span-2">
                            <label className="form-label required">Metod Preuzimanja</label>
                            <select
                                className="form-select"
                                value={data.keyCollection?.method || 'Reception'}
                                onChange={(e) => updateKeyCollection({ method: e.target.value as any })}
                            >
                                <option value="Reception">Recepcija</option>
                                <option value="Keybox">Keybox (Sef sa šifrom)</option>
                                <option value="MeetGreeter">Susret sa Domaćinom</option>
                                <option value="DigitalLock">Digitalna Brava</option>
                            </select>
                        </div>

                        <div className="form-group span-2">
                            <label className="form-label">Instrukcije za Preuzimanje</label>
                            <textarea
                                className="form-textarea"
                                placeholder="Detaljne instrukcije (šalje se nakon potvrde rezervacije)..."
                                value={data.keyCollection?.instructions || ''}
                                onChange={(e) => updateKeyCollection({ instructions: e.target.value })}
                                style={{ minHeight: '100px' }}
                            />
                            <small style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                Npr: "Keybox se nalazi pored glavnog ulaza. Šifra će vam biti poslata 24h pre dolaska."
                            </small>
                        </div>
                    </div>
                </div>
            )}

            {(data.propertyType === 'Apartment' || data.propertyType === 'Villa' || data.propertyType === 'GuestHouse') && (
                <div className="form-section">
                    <h3 className="form-section-title">Profil Domaćina (Host Profile)</h3>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Ime Domaćina</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Marko Petrović"
                                value={data.hostProfile?.hostName || ''}
                                onChange={(e) => updateHostProfile({ hostName: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Prosečno Vreme Odgovora</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="npr. 'Unutar 1 sata'"
                                value={data.hostProfile?.responseTime || ''}
                                onChange={(e) => updateHostProfile({ responseTime: e.target.value })}
                            />
                        </div>

                        <div className="form-group span-2">
                            <label className="form-label">Jezici koje Domaćin Govori (ISO kodovi, odvojeni zarezom)</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="sr, en, de"
                                value={data.hostProfile?.languagesSpoken?.join(', ') || ''}
                                onChange={(e) => updateHostProfile({
                                    languagesSpoken: e.target.value.split(',').map(l => l.trim()).filter(Boolean)
                                })}
                            />
                        </div>

                        <div className="form-group span-2">
                            <label className="form-label">URL Profilne Slike</label>
                            <input
                                type="url"
                                className="form-input"
                                placeholder="https://..."
                                value={data.hostProfile?.profileImageUrl || ''}
                                onChange={(e) => updateHostProfile({ profileImageUrl: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            )}

            <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '12px',
                padding: '16px',
                marginTop: '24px'
            }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <AlertCircle size={20} style={{ color: '#3b82f6', flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ fontSize: '13px', color: '#3b82f6' }}>
                        <strong>OTA Compliance Napomena:</strong>
                        <p style={{ margin: '8px 0 0 0', lineHeight: '1.5' }}>
                            Pravila kuće i politike su kritični za Booking.com i Airbnb integraciju.
                            Jasno definisite check-in/out vremena i sve restrikcije kako bi se izbegli problemi sa gostima.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PoliciesStep;
