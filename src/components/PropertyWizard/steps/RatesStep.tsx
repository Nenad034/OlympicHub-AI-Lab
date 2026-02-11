import React, { useState } from 'react';
import { DollarSign, Plus, Trash2, AlertCircle } from 'lucide-react';
import type { StepProps } from '../types';
import type { RatePlan, Tax } from '../../../types/property.types';
import { MOCK_SUPPLIERS } from '../constants';

const RatesStep: React.FC<StepProps> = ({ data, onChange }) => {
    const [editingRate, setEditingRate] = useState<number | null>(null);

    const addRatePlan = () => {
        if (!data.roomTypes || data.roomTypes.length === 0) {
            alert('Prvo morate dodati sobe pre kreiranja cenovnih planova!');
            return;
        }

        const newRate: RatePlan = {
            ratePlanId: Math.random().toString(36).substr(2, 9),
            roomTypeId: data.roomTypes[0].roomTypeId,
            name: '',
            mealPlanCode: 'RO',
            cancellationPolicy: {
                policyType: 'FreeCancellation',
                rules: []
            },
            paymentMode: 'HOTEL_COLLECT',
            basePrice: 0,
            currency: 'EUR'
        };

        onChange({ ratePlans: [...(data.ratePlans || []), newRate] });
        setEditingRate((data.ratePlans?.length || 0));
    };

    const updateRate = (index: number, updates: Partial<RatePlan>) => {
        const newRates = [...(data.ratePlans || [])];
        newRates[index] = { ...newRates[index], ...updates };
        onChange({ ratePlans: newRates });
    };

    const deleteRate = (index: number) => {
        const newRates = data.ratePlans?.filter((_, i) => i !== index) || [];
        onChange({ ratePlans: newRates });
        setEditingRate(null);
    };

    const addCancellationRule = (rateIndex: number) => {
        const rate = data.ratePlans?.[rateIndex];
        if (!rate) return;

        const newRule = {
            offsetUnit: 'Day' as const,
            offsetValue: 1,
            penaltyType: 'Percent' as const,
            penaltyValue: 100
        };

        updateRate(rateIndex, {
            cancellationPolicy: {
                ...rate.cancellationPolicy,
                rules: [...rate.cancellationPolicy.rules, newRule]
            }
        });
    };

    const updateCancellationRule = (rateIndex: number, ruleIndex: number, updates: any) => {
        const rate = data.ratePlans?.[rateIndex];
        if (!rate) return;

        const newRules = [...rate.cancellationPolicy.rules];
        newRules[ruleIndex] = { ...newRules[ruleIndex], ...updates };

        updateRate(rateIndex, {
            cancellationPolicy: {
                ...rate.cancellationPolicy,
                rules: newRules
            }
        });
    };

    const deleteCancellationRule = (rateIndex: number, ruleIndex: number) => {
        const rate = data.ratePlans?.[rateIndex];
        if (!rate) return;

        const newRules = rate.cancellationPolicy.rules.filter((_, i) => i !== ruleIndex);
        updateRate(rateIndex, {
            cancellationPolicy: {
                ...rate.cancellationPolicy,
                rules: newRules
            }
        });
    };

    const addTax = () => {
        const newTax: Tax = {
            taxType: 'VAT',
            calculationType: 'Percent',
            value: 0,
            currency: 'EUR'
        };
        onChange({ taxes: [...(data.taxes || []), newTax] });
    };

    const updateTax = (index: number, updates: Partial<Tax>) => {
        const newTaxes = [...(data.taxes || [])];
        newTaxes[index] = { ...newTaxes[index], ...updates };
        onChange({ taxes: newTaxes });
    };

    const deleteTax = (index: number) => {
        const newTaxes = data.taxes?.filter((_, i) => i !== index) || [];
        onChange({ taxes: newTaxes });
    };

    return (
        <div>
            <div className="form-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 className="form-section-title" style={{ margin: 0 }}>Cenovni Planovi (Rate Plans)</h3>
                    <button className="btn-primary" onClick={addRatePlan} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={18} /> Dodaj Rate Plan
                    </button>
                </div>

                {(!data.ratePlans || data.ratePlans.length === 0) && (
                    <div style={{
                        padding: '60px',
                        textAlign: 'center',
                        background: 'var(--bg-card)',
                        border: '2px dashed var(--border)',
                        borderRadius: '16px',
                        color: 'var(--text-secondary)'
                    }}>
                        <DollarSign size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                        <p>Nema definisanih cenovnih planova. Kliknite "Dodaj Rate Plan".</p>
                    </div>
                )}

                {data.ratePlans?.map((rate, rateIndex) => (
                    <div key={rate.ratePlanId} style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: '16px',
                        padding: '24px',
                        marginBottom: '20px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h4 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>
                                {rate.name || `Rate Plan ${rateIndex + 1}`}
                            </h4>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    className="btn-secondary"
                                    onClick={() => setEditingRate(editingRate === rateIndex ? null : rateIndex)}
                                    style={{ padding: '8px 16px' }}
                                >
                                    {editingRate === rateIndex ? 'Zatvori' : 'Uredi'}
                                </button>
                                <button
                                    onClick={() => deleteRate(rateIndex)}
                                    style={{
                                        padding: '8px',
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        borderRadius: '8px',
                                        color: '#ef4444',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        {editingRate === rateIndex && (
                            <div>
                                <div className="form-grid">
                                    <div className="form-group span-2">
                                        <label className="form-label required">Naziv Rate Plana</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="npr. Standard Rate, Early Bird, Last Minute"
                                            value={rate.name}
                                            onChange={(e) => updateRate(rateIndex, { name: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-group span-2">
                                        <label className="form-label">Dobavljač (Partner)</label>
                                        <select
                                            className="form-select"
                                            value={rate.supplierId || ''}
                                            onChange={(e) => updateRate(rateIndex, { supplierId: e.target.value })}
                                        >
                                            <option value="">Direktno / Nema Dobavljača</option>
                                            {MOCK_SUPPLIERS.map(s => (
                                                <option key={s.id} value={s.id}>{s.name} ({s.type})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label required">Tip Sobe</label>
                                        <select
                                            className="form-select"
                                            value={rate.roomTypeId}
                                            onChange={(e) => updateRate(rateIndex, { roomTypeId: e.target.value })}
                                        >
                                            {data.roomTypes?.map(room => (
                                                <option key={room.roomTypeId} value={room.roomTypeId}>
                                                    {room.nameInternal || room.code}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label required">Meal Plan (Obrok)</label>
                                        <select
                                            className="form-select"
                                            value={rate.mealPlanCode}
                                            onChange={(e) => updateRate(rateIndex, { mealPlanCode: e.target.value as any })}
                                        >
                                            <option value="RO">RO - Room Only (Samo Soba)</option>
                                            <option value="BB">BB - Bed & Breakfast (Noćenje sa Doručkom)</option>
                                            <option value="HB">HB - Half Board (Polupansion)</option>
                                            <option value="FB">FB - Full Board (Pansion)</option>
                                            <option value="AI">AI - All Inclusive (Sve Uključeno)</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Bazna Cena</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="0.00"
                                            value={rate.basePrice || ''}
                                            onChange={(e) => updateRate(rateIndex, { basePrice: Number(e.target.value) })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Valuta</label>
                                        <select
                                            className="form-select"
                                            value={rate.currency || 'EUR'}
                                            onChange={(e) => updateRate(rateIndex, { currency: e.target.value })}
                                        >
                                            <option value="EUR">EUR</option>
                                            <option value="USD">USD</option>
                                            <option value="RSD">RSD</option>
                                            <option value="GBP">GBP</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Način Plaćanja</label>
                                        <select
                                            className="form-select"
                                            value={rate.paymentMode}
                                            onChange={(e) => updateRate(rateIndex, { paymentMode: e.target.value as any })}
                                        >
                                            <option value="HOTEL_COLLECT">Hotel Collect (Plaćanje u hotelu)</option>
                                            <option value="PREPAY">Prepay (Predplaćeno)</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Min Length of Stay</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="1"
                                            value={rate.minLOS || ''}
                                            onChange={(e) => updateRate(rateIndex, { minLOS: e.target.value ? Number(e.target.value) : undefined })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Max Length of Stay</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="Neograničeno"
                                            value={rate.maxLOS || ''}
                                            onChange={(e) => updateRate(rateIndex, { maxLOS: e.target.value ? Number(e.target.value) : undefined })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Cut-Off Days</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="0"
                                            value={rate.cutOffDays || ''}
                                            onChange={(e) => updateRate(rateIndex, { cutOffDays: e.target.value ? Number(e.target.value) : undefined })}
                                        />
                                        <small style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                            Broj dana pre dolaska kada se zatvara rezervacija
                                        </small>
                                    </div>
                                </div>

                                {/* Cancellation Policy */}
                                <div style={{ marginTop: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <h5 style={{ fontSize: '14px', fontWeight: '700', margin: 0 }}>Cancellation Policy</h5>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <select
                                                className="form-select"
                                                style={{ padding: '6px 12px', fontSize: '12px' }}
                                                value={rate.cancellationPolicy.policyType}
                                                onChange={(e) => updateRate(rateIndex, {
                                                    cancellationPolicy: {
                                                        ...rate.cancellationPolicy,
                                                        policyType: e.target.value as any
                                                    }
                                                })}
                                            >
                                                <option value="FreeCancellation">Free Cancellation</option>
                                                <option value="PartiallyRefundable">Partially Refundable</option>
                                                <option value="NonRefundable">Non-Refundable</option>
                                            </select>
                                            <button
                                                className="btn-secondary"
                                                onClick={() => addCancellationRule(rateIndex)}
                                                style={{ padding: '6px 12px', fontSize: '12px' }}
                                            >
                                                <Plus size={14} /> Dodaj Pravilo
                                            </button>
                                        </div>
                                    </div>

                                    {rate.cancellationPolicy.rules.map((rule, ruleIndex) => (
                                        <div key={ruleIndex} style={{
                                            background: 'var(--bg-dark)',
                                            padding: '16px',
                                            borderRadius: '12px',
                                            marginBottom: '12px',
                                            border: '1px solid var(--border)',
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1fr 1fr 1fr auto',
                                            gap: '12px',
                                            alignItems: 'end'
                                        }}>
                                            <div className="form-group" style={{ margin: 0 }}>
                                                <label className="form-label">Jedinica</label>
                                                <select
                                                    className="form-select"
                                                    value={rule.offsetUnit}
                                                    onChange={(e) => updateCancellationRule(rateIndex, ruleIndex, { offsetUnit: e.target.value })}
                                                >
                                                    <option value="Day">Dana</option>
                                                    <option value="Hour">Sati</option>
                                                </select>
                                            </div>

                                            <div className="form-group" style={{ margin: 0 }}>
                                                <label className="form-label">Vrednost</label>
                                                <input
                                                    type="number"
                                                    className="form-input"
                                                    value={rule.offsetValue}
                                                    onChange={(e) => updateCancellationRule(rateIndex, ruleIndex, { offsetValue: Number(e.target.value) })}
                                                />
                                            </div>

                                            <div className="form-group" style={{ margin: 0 }}>
                                                <label className="form-label">Tip Penala</label>
                                                <select
                                                    className="form-select"
                                                    value={rule.penaltyType}
                                                    onChange={(e) => updateCancellationRule(rateIndex, ruleIndex, { penaltyType: e.target.value })}
                                                >
                                                    <option value="Percent">Procenat</option>
                                                    <option value="FixedAmount">Fiksni Iznos</option>
                                                </select>
                                            </div>

                                            <div className="form-group" style={{ margin: 0 }}>
                                                <label className="form-label">Penal</label>
                                                <input
                                                    type="number"
                                                    className="form-input"
                                                    value={rule.penaltyValue}
                                                    onChange={(e) => updateCancellationRule(rateIndex, ruleIndex, { penaltyValue: Number(e.target.value) })}
                                                />
                                            </div>

                                            <button
                                                onClick={() => deleteCancellationRule(rateIndex, ruleIndex)}
                                                style={{
                                                    padding: '8px',
                                                    background: 'rgba(239, 68, 68, 0.1)',
                                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                                    borderRadius: '8px',
                                                    color: '#ef4444',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}

                                    {rate.cancellationPolicy.rules.length === 0 && (
                                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                            Nema definisanih pravila. Kliknite "Dodaj Pravilo".
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {editingRate !== rateIndex && (
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>
                                <div className="badge" style={{ background: 'var(--accent-glow)', color: 'var(--accent)', position: 'static' }}>
                                    {rate.mealPlanCode}
                                </div>
                                <div className="badge" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', position: 'static' }}>
                                    {rate.basePrice} {rate.currency}
                                </div>
                                <div className="badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', position: 'static' }}>
                                    {rate.cancellationPolicy.policyType}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Taxes Section */}
            <div className="form-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 className="form-section-title" style={{ margin: 0 }}>Porezi i Takse</h3>
                    <button className="btn-secondary" onClick={addTax} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={18} /> Dodaj Porez
                    </button>
                </div>

                {data.taxes && data.taxes.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {data.taxes.map((tax, index) => (
                            <div key={index} style={{
                                background: 'var(--bg-card)',
                                padding: '16px',
                                borderRadius: '12px',
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr 1fr 1fr auto',
                                gap: '12px',
                                alignItems: 'end'
                            }}>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label">Tip Poreza</label>
                                    <select
                                        className="form-select"
                                        value={tax.taxType}
                                        onChange={(e) => updateTax(index, { taxType: e.target.value as any })}
                                    >
                                        <option value="VAT">VAT (PDV)</option>
                                        <option value="CityTax">City Tax (Boravišna Taksa)</option>
                                        <option value="CleaningFee">Cleaning Fee</option>
                                        <option value="ResortFee">Resort Fee</option>
                                    </select>
                                </div>

                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label">Način Obračuna</label>
                                    <select
                                        className="form-select"
                                        value={tax.calculationType}
                                        onChange={(e) => updateTax(index, { calculationType: e.target.value as any })}
                                    >
                                        <option value="Percent">Procenat</option>
                                        <option value="PerPerson">Po Osobi</option>
                                        <option value="PerNight">Po Noćenju</option>
                                        <option value="PerStay">Po Boravku</option>
                                    </select>
                                </div>

                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label">Vrednost</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={tax.value}
                                        onChange={(e) => updateTax(index, { value: Number(e.target.value) })}
                                    />
                                </div>

                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label">Valuta</label>
                                    <select
                                        className="form-select"
                                        value={tax.currency || 'EUR'}
                                        onChange={(e) => updateTax(index, { currency: e.target.value })}
                                    >
                                        <option value="EUR">EUR</option>
                                        <option value="USD">USD</option>
                                        <option value="RSD">RSD</option>
                                    </select>
                                </div>

                                <button
                                    onClick={() => deleteTax(index)}
                                    style={{
                                        padding: '8px',
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        borderRadius: '8px',
                                        color: '#ef4444',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                        Nema definisanih poreza. Kliknite "Dodaj Porez".
                    </p>
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
                        <strong>Rate Plans & Pricing:</strong>
                        <p style={{ margin: '8px 0 0 0', lineHeight: '1.5' }}>
                            Rate Plans definišu kako se cene primenjuju na različite sobe i uslove. Cancellation Policy mora biti jasno definisana prema OTA standardima.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RatesStep;
