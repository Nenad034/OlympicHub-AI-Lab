import type { FC } from 'react';
import type { StepProps } from '../types';
import { Plus, Trash2, Info } from 'lucide-react';

const CommercialStep: FC<StepProps> = ({ data, onChange }) => {
    const supplements = data.supplements || [];

    const addSupplement = () => {
        const newSupp = {
            id: Math.random().toString(36).substr(2, 9),
            name: '',
            price: 0,
            currency: data.currency || 'EUR',
            type: 'Optional' as const
        };
        onChange({ supplements: [...supplements, newSupp] });
    };

    const removeSupplement = (idx: number) => {
        const next = supplements.filter((_, i) => i !== idx);
        onChange({ supplements: next });
    };

    return (
        <div>
            <div className="form-section">
                <h3 className="form-section-title">Osnovna Cena</h3>
                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label required">Cena po Osobi</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="number"
                                className="form-input"
                                style={{ paddingRight: '60px' }}
                                value={data.basePrice || 0}
                                onChange={e => onChange({ basePrice: parseFloat(e.target.value) })}
                            />
                            <span style={{
                                position: 'absolute',
                                right: '16px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--text-secondary)',
                                fontWeight: '600',
                                fontSize: '14px'
                            }}>
                                {data.currency || 'EUR'}
                            </span>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label required">Ukupno Mesta</label>
                        <input
                            type="number"
                            className="form-input"
                            value={data.totalSeats || 0}
                            onChange={e => onChange({
                                totalSeats: parseInt(e.target.value),
                                availableSeats: parseInt(e.target.value)
                            })}
                        />
                    </div>
                </div>
            </div>

            <div className="form-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                        <h3 className="form-section-title" style={{ marginBottom: '4px' }}>Doplate i Fakultativa</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>Dodajte opcione ili obavezne doplate na osnovnu cenu</p>
                    </div>
                    <button className="btn-primary" onClick={addSupplement} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={16} /> Dodaj Doplatu
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {supplements.map((supp, idx) => (
                        <div key={supp.id} style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: '12px',
                            padding: '16px',
                            display: 'grid',
                            gridTemplateColumns: '1fr 150px 150px auto',
                            gap: '12px',
                            alignItems: 'center'
                        }}>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Naziv doplate (npr. Doplata za 1/1 sobu)"
                                value={supp.name}
                                onChange={e => {
                                    const next = [...supplements];
                                    next[idx].name = e.target.value;
                                    onChange({ supplements: next });
                                }}
                            />
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="number"
                                    className="form-input"
                                    style={{ paddingRight: '50px' }}
                                    value={supp.price}
                                    onChange={e => {
                                        const next = [...supplements];
                                        next[idx].price = parseFloat(e.target.value);
                                        onChange({ supplements: next });
                                    }}
                                />
                                <span style={{
                                    position: 'absolute',
                                    right: '16px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: 'var(--text-secondary)',
                                    fontWeight: '600',
                                    fontSize: '13px'
                                }}>
                                    {supp.currency}
                                </span>
                            </div>
                            <select
                                className="form-select"
                                value={supp.type}
                                onChange={e => {
                                    const next = [...supplements];
                                    next[idx].type = e.target.value as any;
                                    onChange({ supplements: next });
                                }}
                            >
                                <option value="Required">Obavezna</option>
                                <option value="Optional">Opciona</option>
                            </select>
                            <button
                                className="btn-secondary"
                                onClick={() => removeSupplement(idx)}
                                style={{ padding: '10px', minWidth: 'auto' }}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}

                    {supplements.length === 0 && (
                        <div style={{
                            padding: '40px 20px',
                            textAlign: 'center',
                            background: 'var(--bg-card)',
                            border: '2px dashed var(--border)',
                            borderRadius: '12px'
                        }}>
                            <p style={{ color: 'var(--text-secondary)' }}>Nema definisanih doplata</p>
                        </div>
                    )}
                </div>
            </div>

            <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                marginTop: '24px'
            }}>
                <Info size={20} style={{ color: '#3b82f6', flexShrink: 0, marginTop: '2px' }} />
                <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '14px' }}>
                    Ove cene će biti vidljive na javnom portalu i služe kao osnova za kalkulaciju ugovora.
                </p>
            </div>
        </div>
    );
};

export default CommercialStep;
