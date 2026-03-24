import React from 'react';
import { useSearchStore } from '../../stores/useSearchStore';
import { Calendar, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

export const HorizontalPriceCalendar: React.FC = () => {
    const { dateRangeResults, setCheckIn, setCheckOut, searchMode } = useSearchStore();

    // Only show if user specifically requested a flexible period (range mode)
    if (searchMode !== 'range' || dateRangeResults.length === 0) return null;

    const handleDateSelect = (checkIn: string, checkOut: string) => {
        setCheckIn(checkIn);
        setCheckOut(checkOut);
    };

    return (
        <div className="v6-price-calendar-container v6-fade-in" style={{
            margin: '16px 0 24px',
            padding: '16px',
            background: 'var(--v6-bg-section)',
            borderRadius: '24px',
            border: '2px solid rgba(157, 78, 221, 0.12)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ 
                        padding: '8px', 
                        background: 'linear-gradient(135deg, var(--v6-accent), #7B2CBF)', 
                        borderRadius: '10px', 
                        color: 'white',
                        boxShadow: '0 4px 10px rgba(157, 78, 221, 0.25)'
                    }}>
                        <Calendar size={16} />
                    </div>
                    <div>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 900, color: 'var(--v6-text-primary)' }}>
                            Fleksibilni termini
                        </h4>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="v6-icon-btn-small" style={{ opacity: 0.4, cursor: 'not-allowed', width: '28px', height: '28px' }} disabled>
                        <ChevronLeft size={14} />
                    </button>
                    <button className="v6-icon-btn-small" style={{ opacity: 0.4, cursor: 'not-allowed', width: '28px', height: '28px' }} disabled>
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>
            
            <style>
                {`
                .v6-price-cards-scroll::-webkit-scrollbar { display: none; }
                .v6-price-card { transition: all 0.25s ease; }
                .v6-price-card:hover:not(.v6-range-recommended) { transform: translateY(-4px); border-color: var(--v6-accent) !important; }
                `}
            </style>

            <div 
                className="v6-price-cards-scroll"
                style={{ 
                    display: 'flex', 
                    gap: '10px', 
                    overflowX: 'auto', 
                    padding: '12px 2px 4px',
                    scrollbarWidth: 'none',
                    justifyContent: 'center',
                    flexWrap: 'nowrap'
                }}
            >
                {dateRangeResults.map((range, idx) => {
                    const checkInDate = new Date(range.checkIn);
                    const checkOutDate = new Date(range.checkOut);
                    const nights = Math.round((checkOutDate.getTime() - checkInDate.getTime()) / 86400000);
                    
                    return (
                        <div 
                            key={idx}
                            onClick={() => handleDateSelect(range.checkIn, range.checkOut)}
                            style={{
                                minWidth: '125px',
                                padding: '16px 12px',
                                background: range.isRecommended 
                                    ? 'linear-gradient(135deg, var(--v6-bg-card), rgba(157, 78, 221, 0.03))' 
                                    : 'var(--v6-bg-card)',
                                border: range.isRecommended 
                                    ? '2px solid var(--v6-accent)' 
                                    : '1px solid var(--v6-border)',
                                borderRadius: '16px',
                                cursor: 'pointer',
                                position: 'relative',
                                textAlign: 'center',
                                boxShadow: range.isRecommended 
                                    ? '0 8px 20px rgba(157, 78, 221, 0.12)' 
                                    : '0 2px 6px rgba(0,0,0,0.01)',
                                flexShrink: 0
                            }}
                            className={`v6-price-card ${range.isRecommended ? 'v6-range-recommended' : ''}`}
                        >
                            {range.isRecommended && (
                                <div style={{
                                    position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
                                    background: 'var(--v6-accent)', color: 'white', padding: '2px 10px',
                                    borderRadius: '100px', fontSize: '8px', fontWeight: 900, whiteSpace: 'nowrap',
                                    boxShadow: '0 2px 8px rgba(157, 78, 221, 0.3)',
                                    display: 'flex', alignItems: 'center', gap: '3px'
                                }}>
                                    <Sparkles size={8} fill="white" /> TOP
                                </div>
                            )}
                            
                            <div style={{ marginBottom: '8px' }}>
                                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--v6-text-primary)' }}>
                                    {checkInDate.toLocaleDateString('sr-RS', { day: '2-digit', month: 'short' })}
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--v6-text-muted)', fontWeight: 600, opacity: 0.7 }}>
                                   {checkOutDate.toLocaleDateString('sr-RS', { day: '2-digit', month: 'short' })}
                                </div>
                            </div>

                            <div style={{ 
                                display: 'inline-flex',
                                padding: '2px 8px',
                                background: range.isRecommended ? 'rgba(157, 78, 221, 0.1)' : 'rgba(0,0,0,0.03)',
                                borderRadius: '6px',
                                fontSize: '9px', 
                                fontWeight: 800, 
                                color: range.isRecommended ? 'var(--v6-accent)' : 'var(--v6-text-muted)', 
                                marginBottom: '12px'
                            }}>
                                {nights} NOĆI
                            </div>

                            <div style={{ 
                                fontSize: '16px', 
                                fontWeight: 900, 
                                color: range.isRecommended ? 'var(--v6-accent)' : 'var(--v6-text-primary)',
                                display: 'flex',
                                alignItems: 'baseline',
                                justifyContent: 'center',
                                gap: '2px'
                            }}>
                                {range.price > 0 ? (
                                    <>
                                        <span>{range.price.toLocaleString()}</span>
                                        <span style={{ fontSize: '10px', opacity: 0.6 }}>{range.currency}</span>
                                    </>
                                ) : (
                                    <span style={{ fontSize: '11px', color: 'var(--v6-text-muted)' }}>—</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
