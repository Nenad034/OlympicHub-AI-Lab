import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ShieldCheck, AlertTriangle, Info, Loader2 } from 'lucide-react';
import type { SmartSearchResult } from '../../../services/smartSearchService';
import { getDetailedCancellationPolicy } from '../../../services/smartSearchService';
import { getRoomCancelStatus } from '../helpers';

interface CancellationModalProps {
    room: any;
    hotel: SmartSearchResult | null;
    onClose: () => void;
}

export const CancellationModal: React.FC<CancellationModalProps> = ({ room, hotel, onClose }) => {
    const [detailedPolicy, setDetailedPolicy] = useState<any[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (room && hotel?.provider) {
            setLoading(true);
            setError(null);
            getDetailedCancellationPolicy(hotel.provider, room)
                .then(data => {
                    setDetailedPolicy(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error('Failed to fetch detailed cancellation policy', err);
                    setError('Neuspešno učitavanje detaljnih uslova.');
                    setLoading(false);
                });
        }
    }, [room, hotel]);

    if (!room) return null;

    const status = getRoomCancelStatus(room);
    const params = room.cancellationPolicyRequestParams;
    const cancelDate = params?.CancellationDate ? new Date(params.CancellationDate) : null;
    const today = new Date();
    const daysBefore = params?.DaysBeforeCheckIn || 0;

    const renderTimeline = () => {
        if (status === 'non-refundable') {
            return (
                <div style={{ textAlign: 'center', padding: '30px 20px', background: 'rgba(239, 68, 68, 0.03)', borderRadius: '16px', border: '1px dashed rgba(239, 68, 68, 0.2)' }}>
                    <AlertTriangle size={56} color="#ef4444" style={{ marginBottom: '20px', opacity: 0.8 }} />
                    <h3 style={{ color: '#ef4444', marginBottom: '12px', fontSize: '1.2rem', fontWeight: 800 }}>MOGUĆNOST OTKAZIVANJA: 0%</h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6', maxWidth: '400px', margin: '0 auto' }}>
                        Ova soba podleže <strong>100% penalima</strong> odmah nakon potvrde.
                        Otkazivanje nije moguće bez potpunog gubitka uplaćenih sredstava.
                    </p>
                </div>
            );
        }

        if (loading) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0' }}>
                    <Loader2 className="animate-spin" size={40} color="var(--accent)" />
                    <p style={{ marginTop: '15px', color: '#94a3b8', fontSize: '0.9rem' }}>Učitavanje podataka sa sistema...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div style={{ textAlign: 'center', padding: '30px 20px', background: 'rgba(239, 68, 68, 0.03)', borderRadius: '16px', border: '1px dashed rgba(239, 68, 68, 0.2)' }}>
                    <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: '15px', opacity: 0.8 }} />
                    <p style={{ color: '#ef4444', fontSize: '0.9rem', marginBottom: 0 }}>{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{ marginTop: '15px', background: 'none', border: 'none', color: '#94a3b8', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                        Pokušaj ponovo
                    </button>
                </div>
            );
        }

        if (detailedPolicy && detailedPolicy.length > 0) {
            return (
                <div className="detailed-cancellation-timeline">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {detailedPolicy.map((policy, idx) => {
                            const isPenalty = policy.penaltyValue > 0;
                            const isFullPenalty = policy.penaltyValue >= 100 && policy.isPercent;
                            const policyDate = policy.dateFrom ? new Date(policy.dateFrom) : null;

                            return (
                                <div key={idx} style={{
                                    display: 'flex',
                                    alignItems: 'stretch',
                                    background: isPenalty ? (isFullPenalty ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.05)') : 'rgba(76, 217, 100, 0.05)',
                                    borderRadius: '12px',
                                    border: `1px solid ${isPenalty ? (isFullPenalty ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)') : 'rgba(76, 217, 100, 0.2)'}`,
                                    overflow: 'hidden',
                                    transition: 'transform 0.2s'
                                }} className="hover-scale-subtle">
                                    <div style={{
                                        width: '85px',
                                        background: isPenalty ? (isFullPenalty ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.1)') : 'rgba(76, 217, 100, 0.1)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '10px',
                                        textAlign: 'center'
                                    }}>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8' }}>OD</span>
                                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>
                                            {policyDate ? policyDate.toLocaleDateString('sr-RS').split('.').slice(0, 2).join('.') : 'DANAS'}
                                        </div>
                                        {policyDate && <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>{policyDate.getFullYear()}</div>}
                                    </div>
                                    <div style={{ flex: 1, padding: '15px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontWeight: 800, fontSize: '0.85rem', color: isPenalty ? (isFullPenalty ? '#ef4444' : '#f59e0b') : '#4cd964', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {isPenalty ? (isFullPenalty ? <AlertTriangle size={14} /> : <Info size={14} />) : <ShieldCheck size={14} />}
                                                {isPenalty ? (isFullPenalty ? 'POTPUNI PENALI' : 'DELIMIČNI PENALI') : 'BESPLATAN OTKAZ'}
                                            </span>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff' }}>
                                                    {policy.penaltyValue}{policy.isPercent ? '%' : ' Noći'}
                                                </div>
                                            </div>
                                        </div>
                                        <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                                            {policy.description}
                                            {policy.totalPenalty > 0 && <span style={{ display: 'block', marginTop: '4px', color: '#ef4444', fontWeight: 700 }}>Iznos troška: {policy.totalPenalty.toFixed(2)} {policy.currency || 'EUR'}</span>}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.1)', borderRadius: '12px', fontSize: '0.8rem', color: '#7dd3fc', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <Info size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div style={{ lineHeight: '1.5' }}>
                            <strong>Napomena:</strong> Sve cene su informativne i obračunavaju se po prodajnom kursu operatera na dan uplate. Datumi se obračunavaju prema vremenskoj zoni hotela.
                        </div>
                    </div>
                </div>
            );
        }

        if (params && (cancelDate || daysBefore)) {
            const isFreeNow = cancelDate && cancelDate > today;
            return (
                <div className="cancellation-timeline-graphic" style={{ marginTop: '10px' }}>
                    {/* Visual Timeline Bar */}
                    <div style={{ display: 'flex', alignItems: 'center', position: 'relative', height: '10px', background: 'rgba(255,255,255,0.08)', borderRadius: '5px', margin: '50px 10px 40px' }}>
                        {/* TODAY */}
                        <div style={{ position: 'absolute', left: '0%', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#4cd964', border: '4px solid #0f172a', zIndex: 2, boxShadow: '0 0 10px rgba(76,217,100,0.4)' }} />
                            <span style={{ position: 'absolute', top: '-28px', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', whiteSpace: 'nowrap' }}>DANAS</span>
                        </div>

                        {/* Free zone bar */}
                        <div style={{ position: 'absolute', left: '0%', top: '0', bottom: '0', width: isFreeNow ? '60%' : '20%', background: isFreeNow ? 'linear-gradient(90deg, #4cd964, #f59e0b)' : '#ef4444', borderRadius: '5px' }} />

                        {/* Deadline */}
                        <div style={{ position: 'absolute', left: isFreeNow ? '60%' : '20%', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#f59e0b', border: '4px solid #0f172a', zIndex: 2, boxShadow: '0 0 10px rgba(245,158,11,0.4)' }} />
                            <span style={{ position: 'absolute', top: '-28px', fontSize: '0.75rem', fontWeight: 800, color: '#f59e0b', whiteSpace: 'nowrap' }}>ISTEK BESPLATNOG</span>
                            {cancelDate && <span style={{ position: 'absolute', bottom: '-28px', fontSize: '0.7rem', color: '#94a3b8', whiteSpace: 'nowrap', fontWeight: 700 }}>{cancelDate.toLocaleDateString('sr-RS')} ({daysBefore} dana pred put)</span>}
                        </div>

                        {/* Penalty zone */}
                        <div style={{ position: 'absolute', left: isFreeNow ? '60%' : '20%', top: '0', bottom: '0', width: isFreeNow ? '40%' : '80%', background: 'linear-gradient(90deg, #f59e0b, #ef4444)', borderRadius: '0 5px 5px 0' }} />

                        {/* CHECK-IN */}
                        <div style={{ position: 'absolute', right: '0%', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#ff3b30', border: '4px solid #0f172a', zIndex: 2 }} />
                            <span style={{ position: 'absolute', top: '-28px', fontSize: '0.75rem', fontWeight: 800, color: '#ff3b30', whiteSpace: 'nowrap' }}>CHECK-IN</span>
                        </div>
                    </div>

                    {/* Summary Box */}
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '16px', marginTop: '50px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.95rem', alignItems: 'center' }}>
                            <span style={{ color: '#94a3b8', fontWeight: 500 }}>Trenutni status:</span>
                            <span style={{
                                padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800,
                                background: isFreeNow ? 'rgba(76,217,100,0.1)' : 'rgba(245,158,11,0.1)',
                                color: isFreeNow ? '#4cd964' : '#f59e0b',
                                border: `1px solid ${isFreeNow ? 'rgba(76,217,100,0.2)' : 'rgba(245,158,11,0.2)'}`
                            }}>
                                {isFreeNow ? 'BESPLATNO OTKAZIVANJE MOGUĆE' : 'PENALI SE OBRAČUNAVAJU'}
                            </span>
                        </div>
                        {params.DlPrice > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                <span style={{ color: '#94a3b8', fontWeight: 500 }}>Iznos penala u slučaju otkaza danas:</span>
                                <strong style={{ color: '#ef4444', fontSize: '1.2rem' }}>{params.DlPrice} EUR</strong>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        // Default (no params)
        return (
            <div style={{ textAlign: 'center', padding: '30px 20px', background: 'rgba(56,189,248,0.03)', borderRadius: '16px', border: '1px dashed rgba(56,189,248,0.2)' }}>
                <Info size={56} color="#38bdf8" style={{ marginBottom: '20px', opacity: 0.8 }} />
                <h3 style={{ color: '#38bdf8', marginBottom: '12px', fontSize: '1.2rem', fontWeight: 800 }}>STANDARDNI USLOVI</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6', maxWidth: '400px', margin: '0 auto' }}>
                    Detaljni uslovi otkazivanja biće Vam prikazani u sledećem koraku pre finalne potvrde.
                </p>
            </div>
        );
    };

    return createPortal(
        <div
            className="booking-modal-overlay animate-fade-in"
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2147483647 }}
        >
            <div
                className="booking-modal-content premium-glass-v2 animate-fade-in-up"
                onClick={e => e.stopPropagation()}
                style={{ maxWidth: '700px', width: '94%', padding: '0', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 50px 100px rgba(0,0,0,0.9)', background: '#0f172a' }}
            >
                <div className="modal-header" style={{ padding: '25px 30px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.4rem', margin: 0, color: '#f8fafc', fontWeight: 800 }}>
                        <ShieldCheck size={26} style={{ color: '#4cd964' }} />
                        Uslovi otkazivanja (Timeline)
                    </h2>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }} className="hover-scale">
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body" style={{ padding: '30px' }}>
                    {/* Room Info */}
                    <div style={{ marginBottom: '25px', padding: '15px', background: 'rgba(99,102,241,0.08)', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.15)' }}>
                        <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Smeštajna jedinica</div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: '#fff' }}>{room.name}</p>
                        <div style={{ marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <span className="meal-tag-v4">{room.mealPlan || hotel?.mealPlan}</span>
                            <span className="meal-tag-v4" style={{ background: 'rgba(56,189,248,0.1)', borderColor: 'rgba(56,189,248,0.2)', color: '#38bdf8' }}>{hotel?.provider}</span>
                        </div>
                    </div>

                    <div className="timeline-body">{renderTimeline()}</div>
                </div>

                <div className="modal-footer" style={{ padding: '20px 30px', textAlign: 'right', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <button className="search-launch-btn-v4 unified" onClick={onClose} style={{ height: '48px', width: 'auto', padding: '0 40px', fontSize: '0.9rem', borderRadius: '24px', background: 'var(--accent)' }}>
                        ZATVORI
                    </button>
                </div>
            </div>
        </div>,
        document.getElementById('portal-root') || document.body
    );
};


export default CancellationModal;
