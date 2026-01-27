import type { FC } from 'react';
import type { StepProps } from '../types';
import type { TourDay } from '../../../types/tour.types';
import { Plus, Trash2, MapPin, Coffee, Car, Sun } from 'lucide-react';

const ItineraryStep: FC<StepProps> = ({ data, onChange }) => {
    const itinerary = data.itinerary || [];

    const addDay = () => {
        const nextDay = itinerary.length + 1;
        const newDay: TourDay = {
            dayNumber: nextDay,
            title: `Dan ${nextDay}`,
            description: '',
            activities: [],
            transportSegments: []
        };
        onChange({ itinerary: [...itinerary, newDay] });
    };

    const removeDay = (idx: number) => {
        const next = itinerary.filter((_, i) => i !== idx);
        onChange({ itinerary: next });
    };

    const addActivity = (dayIdx: number) => {
        const newItinerary = [...itinerary];
        newItinerary[dayIdx].activities.push({
            id: Math.random().toString(36).substr(2, 9),
            title: '',
            description: '',
            type: 'Sightseeing',
            includedInPrice: true
        });
        onChange({ itinerary: newItinerary });
    };

    return (
        <div>
            <div className="form-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                        <h3 className="form-section-title" style={{ marginBottom: '4px' }}>Vremenska Linija</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>Definišite dnevne aktivnosti i program putovanja</p>
                    </div>
                    <button className="btn-primary" onClick={addDay} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={16} /> Dodaj Dan
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {itinerary.map((day, dIdx) => (
                        <div key={day.dayNumber} style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: '12px',
                            padding: '20px',
                            position: 'relative'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: 'var(--accent)',
                                    color: '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: '700',
                                    fontSize: '16px',
                                    flexShrink: 0
                                }}>
                                    {day.dayNumber}
                                </div>
                                <input
                                    type="text"
                                    className="form-input"
                                    style={{ flex: 1 }}
                                    placeholder="Naslov dana..."
                                    value={day.title}
                                    onChange={e => {
                                        const next = [...itinerary];
                                        next[dIdx].title = e.target.value;
                                        onChange({ itinerary: next });
                                    }}
                                />
                                <button
                                    className="btn-secondary"
                                    onClick={() => removeDay(dIdx)}
                                    style={{ padding: '10px', minWidth: 'auto' }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <textarea
                                className="form-textarea"
                                placeholder="Opis dana..."
                                rows={2}
                                value={day.description}
                                onChange={e => {
                                    const next = [...itinerary];
                                    next[dIdx].description = e.target.value;
                                    onChange({ itinerary: next });
                                }}
                                style={{ marginBottom: '16px', minHeight: '60px' }}
                            />

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label className="form-label">Aktivnosti</label>
                                {day.activities.map((act, aIdx) => (
                                    <div key={act.id} style={{
                                        display: 'grid',
                                        gridTemplateColumns: '40px 1fr 150px',
                                        gap: '12px',
                                        alignItems: 'center'
                                    }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '8px',
                                            background: 'var(--glass-bg)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'var(--accent)'
                                        }}>
                                            {act.type === 'Sightseeing' && <MapPin size={18} />}
                                            {act.type === 'Meal' && <Coffee size={18} />}
                                            {act.type === 'Transit' && <Car size={18} />}
                                            {act.type === 'FreeTime' && <Sun size={18} />}
                                        </div>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Naziv aktivnosti..."
                                            value={act.title}
                                            onChange={e => {
                                                const next = [...itinerary];
                                                next[dIdx].activities[aIdx].title = e.target.value;
                                                onChange({ itinerary: next });
                                            }}
                                        />
                                        <select
                                            className="form-select"
                                            value={act.type}
                                            onChange={e => {
                                                const next = [...itinerary];
                                                next[dIdx].activities[aIdx].type = e.target.value as any;
                                                onChange({ itinerary: next });
                                            }}
                                        >
                                            <option value="Sightseeing">Razgledanje</option>
                                            <option value="Meal">Obrok</option>
                                            <option value="Transit">Transfer</option>
                                            <option value="FreeTime">Slobodno vreme</option>
                                        </select>
                                    </div>
                                ))}
                                <button
                                    className="btn-secondary"
                                    onClick={() => addActivity(dIdx)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginTop: '8px' }}
                                >
                                    <Plus size={14} /> Dodaj Aktivnost
                                </button>
                            </div>
                        </div>
                    ))}

                    {itinerary.length === 0 && (
                        <div style={{
                            padding: '60px 20px',
                            textAlign: 'center',
                            background: 'var(--bg-card)',
                            border: '2px dashed var(--border)',
                            borderRadius: '12px'
                        }}>
                            <MapPin size={48} style={{ color: 'var(--text-secondary)', marginBottom: '16px' }} />
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Vaš itinerer je prazan. Počnite tako što ćete dodati prvi dan.</p>
                            <button onClick={addDay} className="btn-primary">Dodaj Dan 1</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ItineraryStep;
