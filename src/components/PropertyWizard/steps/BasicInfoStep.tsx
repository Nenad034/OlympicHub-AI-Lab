import React from 'react';
import { MOCK_SUPPLIERS } from '../constants';
import type { StepProps } from '../types';

const BasicInfoStep: React.FC<StepProps> = ({ data, onChange }) => {
    return (
        <div>
            <div className="form-section">
                <h3 className="form-section-title">Identitet Objekta</h3>
                <div className="form-group">
                    <label className="form-label required">Naziv Objekta</label>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="npr. Hotel Grand"
                        value={(data as any).name || ''}
                        onChange={(e) => onChange({ name: e.target.value } as any)}
                        style={{ fontSize: '16px', padding: '12px' }}
                    />
                </div>
                <div className="form-group" style={{ marginTop: '12px' }}>
                    <label className="form-label">Izvorni Link (Sajt)</label>
                    <input
                        type="url"
                        className="form-input"
                        placeholder="https://www.hotel-website.com"
                        value={(data as any).website || ''}
                        onChange={(e) => onChange({ website: e.target.value } as any)}
                        style={{ fontFamily: 'monospace', color: 'var(--accent)' }}
                    />
                    <small style={{ color: 'var(--text-secondary)' }}>Interni link. Koristi se za generisanje sadržaja i preuzimanje slika.</small>
                </div>
            </div>
            <div className="form-section">
                <h3 className="form-section-title">Tip i Klasifikacija Objekta</h3>
                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label required">Tip Smeštaja</label>
                        <select
                            className="form-select"
                            value={data.propertyType || 'Hotel'}
                            onChange={(e) => onChange({ propertyType: e.target.value as any })}
                        >
                            <option value="Hotel">Hotel</option>
                            <option value="Apartment">Apartman</option>
                            <option value="Villa">Vila</option>
                            <option value="Resort">Resort</option>
                            <option value="Hostel">Hostel</option>
                            <option value="GuestHouse">Pansion</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Broj Zvezdica</label>
                        <select
                            className="form-select"
                            value={data.starRating || ''}
                            onChange={(e) => onChange({ starRating: e.target.value ? Number(e.target.value) : undefined })}
                        >
                            <option value="">Nije kategorisano</option>
                            <option value="1">1 Zvezidica</option>
                            <option value="2">2 Zvezdice</option>
                            <option value="3">3 Zvezdice</option>
                            <option value="4">4 Zvezdice</option>
                            <option value="5">5 Zvezdica</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Lanac Hotela (Partner)</label>
                        <select
                            className="form-select"
                            value={data.chainId || ''}
                            onChange={(e) => onChange({ chainId: e.target.value })}
                        >
                            <option value="">Odaberite Lanac...</option>
                            {MOCK_SUPPLIERS.filter(s => s.type === 'Lanac Hotela').map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Brand Hotela (Partner)</label>
                        <select
                            className="form-select"
                            value={data.brandId || ''}
                            onChange={(e) => onChange({ brandId: e.target.value })}
                        >
                            <option value="">Odaberite Brand...</option>
                            {MOCK_SUPPLIERS.filter(s => s.type === 'Brand Hotela').map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Dobavljač</label>
                        <select
                            className="form-select"
                            value={data.supplierId || ''}
                            onChange={(e) => onChange({ supplierId: e.target.value })}
                        >
                            <option value="">Odaberite Dobavljača...</option>
                            {MOCK_SUPPLIERS.filter(s => s.type === 'Dobavljač').map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="form-section">
                <h3 className="form-section-title">Identifikatori</h3>
                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label">Legal Entity ID</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="PIB ili matični broj"
                            value={data.identifiers?.legalEntityId || ''}
                            onChange={(e) => onChange({
                                identifiers: { ...data.identifiers, legalEntityId: e.target.value } as any
                            })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">PMS ID</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="ID iz Property Management System-a"
                            value={data.identifiers?.pmsId || ''}
                            onChange={(e) => onChange({
                                identifiers: { ...data.identifiers, pmsId: e.target.value } as any
                            })}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BasicInfoStep;
