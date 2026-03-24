import React from 'react';
import { useSearchStore } from '../../stores/useSearchStore';
import { Calendar, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

export const HorizontalPriceCalendar: React.FC = () => {
    const { dateRangeResults, setCheckIn, setCheckOut, isSearching } = useSearchStore();

    if (dateRangeResults.length === 0) return null;

    const handleDateSelect = (checkIn: string, checkOut: string) => {
        setCheckIn(checkIn);
        setCheckOut(checkOut);
        // This could trigger a re-search or just highlights if results are already prefetched
    };

    return (
        <div className="v6-price-calendar-container v6-fade-in" style={{
            margin: '24px 0',
            padding: '20px',
            background: 'var(--v6-bg-section)',
            borderRadius: '24px',
            border: '1px solid var(--v6-border)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ padding: '8px', background: 'var(--v6-accent-faint)', borderRadius: '10px', color: 'var(--v6-accent)' }}>
                        <Calendar size={18} />
                    </div>
                    <div>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--v6-text-primary)' }}>Uporedni prikaz cena</h4>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--v6-text-muted)' }}>Pronašli smo cene za alternativne datume u tvom periodu.</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="v6-icon-btn-small" style={{ opacity: 0.5 }} disabled><ChevronLeft size={16} /></button>
                    <button className="v6-icon-btn-small" style={{ opacity: 0.5 }} disabled><ChevronRight size={16} /></button>
                </div>
            </div>

            <div style={{ 
                display: 'flex', 
                gap: '12px', 
                overflowX: 'auto', 
                paddingBottom: '8px',
                scrollbarWidth: 'none',
            }}>
                {dateRangeResults.map((range, idx) => (
                    <div 
                        key={idx}
                        onClick={() => handleDateSelect(range.checkIn, range.checkOut)}
                        style={{
                            minWidth: '160px',
                            padding: '16px',
                            background: range.isRecommended ? 'var(--v6-bg-card)' : 'transparent',
                            border: range.isRecommended ? '2px solid var(--v6-accent)' : '1px solid var(--v6-border)',
                            borderRadius: '16px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            position: 'relative',
                            textAlign: 'center'
                        }}
                        className={range.isRecommended ? 'v6-range-recommended' : ''}
                    >
                        {range.isRecommended && (
                            <div style={{
                                position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
                                background: 'var(--v6-accent)', color: 'white', padding: '2px 10px',
                                borderRadius: '10px', fontSize: '10px', fontWeight: 700, whiteSpace: 'nowrap'
                            }}>
                                <Sparkles size={10} style={{ display: 'inline', marginRight: '4px' }} />
                                PREPORUČENO
                            </div>
                        )}
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--v6-text-primary)' }}>
                            {new Date(range.checkIn).toLocaleDateString('sr-RS', { day: '2-digit', month: 'short' })}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--v6-text-muted)', marginBottom: '4px' }}>
                           - {new Date(range.checkOut).toLocaleDateString('sr-RS', { day: '2-digit', month: 'short' })}
                        </div>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--v6-accent)', marginBottom: '8px', opacity: 0.8 }}>
                            {Math.round((new Date(range.checkOut).getTime() - new Date(range.checkIn).getTime()) / 86400000)} NOĆI
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--v6-accent)' }}>
                            {range.price > 0 ? `${range.price.toLocaleString()} ${range.currency}` : 'N/A'}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
