import React, { useState } from 'react';
import type { CruiseResult } from '../../types';
import { useSearchStore } from '../../stores/useSearchStore';

const formatPrice = (n: number, currency = 'EUR') =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency, minimumFractionDigits: 0 }).format(n);

interface CruiseCardProps {
    cruise: CruiseResult;
    pax: number;
    index?: number;
}

export const CruiseCard: React.FC<CruiseCardProps> = ({ cruise, pax, index = 0 }) => {
    const { addToBasket } = useSearchStore();
    
    const [selectedCabin, setSelectedCabin] = useState(cruise.cabins.length > 0 ? cruise.cabins[0].type : '');
    const [booked, setBooked] = useState(false);
    
    // Toggle Itinerary View
    const [showSubDetails, setShowSubDetails] = useState(false);

    const activeCabinObj = cruise.cabins.find(c => c.type === selectedCabin);

    const getCabinIcon = (t: string) => {
        switch(t) {
            case 'inside': return '🚪';
            case 'oceanview': return '🪟';
            case 'balcony': return '🌅';
            case 'suite': return '👑';
            default: return '🛏️';
        }
    };

    const handleAdd = () => {
        if (!activeCabinObj) return;
        addToBasket({
            id: `cruise-${cruise.id}-${activeCabinObj.type}`,
            type: 'cruise',
            label: `🚢 ${cruise.cruiseLine} - ${cruise.shipName}`,
            details: `${cruise.durationDays} dana · Kabina: ${activeCabinObj.label} · ${pax} putnika`,
            pricePerUnit: activeCabinObj.pricePerPerson,
            totalPrice: activeCabinObj.pricePerPerson * pax,
            currency: 'EUR',
            status: cruise.status,
            icon: '🚢',
            isRemovable: true,
        });
        setBooked(true);
        setTimeout(() => setBooked(false), 3000);
    };

    return (
        <div style={{
            background: 'var(--v6-bg-card)',
            border: `1.5px solid ${cruise.isPrime ? 'var(--v6-color-prime)' : 'var(--v6-border)'}`,
            borderRadius: 'var(--v6-radius-lg)',
            overflow: 'hidden',
            boxShadow: cruise.isPrime ? '0 4px 16px rgba(180,83,9,0.1)' : 'var(--v6-shadow-sm)',
            animation: 'v6-fade-in 0.3s ease forwards',
            animationDelay: `${index * 0.05}s`, opacity: 0,
            display: 'flex', flexDirection: 'column'
        }}>
            {/* ── TOP SECTION: SLIKA + INFO + CENA ── */}
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                
                {/* ── IMAGE ── */}
                <div style={{ width: '280px', minHeight: '200px', position: 'relative', flexShrink: 0 }}>
                    <img src={cruise.image} alt={cruise.shipName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(4px)', color: '#fff', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 800 }}>
                        {cruise.cruiseLineLogo} {cruise.cruiseLine}
                    </div>
                </div>

                {/* ── INFO SREDINA ── */}
                <div style={{ flex: 1, padding: '16px', minWidth: '300px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                        <div>
                            <div style={{ fontSize: '11px', color: 'var(--v6-text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                                {cruise.regionName} · {cruise.durationDays} dana / {cruise.durationNights} noći
                            </div>
                            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--v6-text-primary)', lineHeight: 1.2, marginTop: '2px' }}>
                                Brod: {cruise.shipName}
                            </div>
                        </div>
                        {cruise.isPrime && (
                            <div style={{ background: 'linear-gradient(135deg, var(--v6-color-prime), #f59e0b)', color: '#fff', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>
                                🏆 PRIME DEAL
                            </div>
                        )}
                    </div>
                    
                    <div style={{ fontSize: '13px', color: 'var(--v6-text-secondary)', marginBottom: '12px', fontWeight: 600 }}>
                        📅 Polazak: {new Date(cruise.departureDate).toLocaleDateString('sr-RS')}  iz luke {cruise.portOfDeparture}
                    </div>

                    {/* Ruta / Itinerary Summary */}
                    <div style={{ background: 'var(--v6-bg-section)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--v6-border)', marginBottom: '12px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--v6-text-muted)', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>Ruta putovanja:</div>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                            {cruise.itinerarySummary.map((port, idx) => (
                                <React.Fragment key={idx}>
                                    <span style={{ fontSize: '13px', fontWeight: port === 'Na moru' ? 400 : 700, color: port === 'Na moru' ? '#86bda1' : 'var(--v6-text-primary)' }}>
                                        {port}
                                    </span>
                                    {idx < cruise.itinerarySummary.length - 1 && <span style={{ color: 'var(--v6-text-muted)', fontSize: '10px' }}>→</span>}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', marginTop: 'auto', alignItems: 'center' }}>
                        <button onClick={() => setShowSubDetails(!showSubDetails)}
                            style={{ background: 'none', border: 'none', color: 'var(--v6-accent)', fontWeight: 700, fontSize: '13px', cursor: 'pointer', padding: 0 }}>
                            {showSubDetails ? 'Zatvori detalje broda ↑' : 'Vidi detaljniji plan puta po danima ↓'}
                        </button>
                        <span style={{ fontSize: '12px', color: 'var(--v6-text-muted)' }}>
                            {cruise.rating && `★ ${cruise.rating} (${cruise.reviewCount} utisaka)`}
                        </span>
                    </div>
                </div>

                {/* ── CENA I DUGME ── */}
                <div style={{ width: '240px', padding: '16px', borderLeft: '1px dashed var(--v6-border)', display: 'flex', flexDirection: 'column', flexShrink: 0, background: 'var(--v6-bg-section)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--v6-text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>Izbor Kabine</div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', flex: 1 }}>
                        {cruise.cabins.map(cabin => (
                            <button key={cabin.type} onClick={() => setSelectedCabin(cabin.type)}
                                style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '8px 10px', borderRadius: '6px', cursor: 'pointer',
                                    border: `1.5px solid ${selectedCabin === cabin.type ? 'var(--v6-accent)' : 'var(--v6-border)'}`,
                                    background: selectedCabin === cabin.type ? 'rgba(99,102,241,0.08)' : 'var(--v6-bg-main)',
                                    textAlign: 'left'
                                }}>
                                <div style={{ fontSize: '12px', fontWeight: selectedCabin === cabin.type ? 700 : 600, color: 'var(--v6-text-primary)' }}>
                                    {getCabinIcon(cabin.type)} {cabin.label.split(' ')[0]}
                                </div>
                                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--v6-text-primary)' }}>
                                    {formatPrice(cabin.pricePerPerson, 'EUR')}
                                </div>
                            </button>
                        ))}
                    </div>

                    {activeCabinObj && (
                        <div style={{ textAlign: 'right', marginTop: 'auto' }}>
                            <div style={{ fontSize: '12px', color: 'var(--v6-text-muted)' }}>Total za {pax} pax</div>
                            <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--v6-text-primary)', lineHeight: 1.1 }}>
                                {formatPrice(activeCabinObj.pricePerPerson * pax, 'EUR')}
                            </div>
                            <button onClick={handleAdd}
                                style={{
                                    width: '100%', padding: '12px 0', marginTop: '12px', borderRadius: 'var(--v6-radius-md)',
                                    background: booked ? 'var(--v6-color-instant)' : 'var(--v6-accent)',
                                    color: booked ? '#fff' : 'var(--v6-accent-text)', border: 'none',
                                    fontSize: '14px', fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--v6-font)', transition: 'all 0.2s',
                                }}>
                                {booked ? '✓ SPREMNO ZA PUT' : 'DODAJ KRSTARENJE'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── EXPANDED DETALJI (ITINERARY + INCLUDED/CABIN DETAILS) ── */}
            {showSubDetails && (
                 <div style={{ background: 'var(--v6-bg-section)', borderTop: '1px solid var(--v6-border)', padding: '20px', display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) minmax(250px, 1fr)', gap: '24px' }}>
                    
                    {/* LEVO: Itinerary Details Dnevni Plan */}
                    <div>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 800, color: 'var(--v6-text-primary)' }}>Plan plovidbe po danima</h4>
                        {cruise.itineraryDetails && cruise.itineraryDetails.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {cruise.itineraryDetails.map((day, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', fontSize: '13px' }}>
                                        <div style={{ width: '40px', flexShrink: 0, fontWeight: 800, color: 'var(--v6-text-muted)' }}>Dan {day.dayNumber}</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 700, color: day.isSeaDay ? '#4f46e5' : 'var(--v6-text-primary)' }}>{day.port}</div>
                                            {!day.isSeaDay && (day.arrivalTime || day.departureTime) && (
                                                <div style={{ color: 'var(--v6-text-secondary)', fontSize: '12px' }}>
                                                    {day.arrivalTime && `Dolazak: ${day.arrivalTime} `} 
                                                    {day.departureTime && `| Polazak: ${day.departureTime}`}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ fontSize: '13px', color: 'var(--v6-text-muted)' }}>Detaljan plan po danima i vremena uplovljavanja trenutno nisu objavljeni od strane organizatora. Pravac kretanja prikazan je iznad.</div>
                        )}
                    </div>

                    {/* DESNO: Izabrana Kabina Detalji */}
                    {activeCabinObj && (
                        <div>
                             <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 800, color: 'var(--v6-text-primary)' }}>Vaša kabina: {activeCabinObj.label}</h4>
                             <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--v6-text-secondary)', fontSize: '13px' }}>
                                 {activeCabinObj.included.map((inc, i) => (
                                     <li key={i}>{inc}</li>
                                 ))}
                             </ul>
                             
                             <div style={{ marginTop: '20px', padding: '10px 14px', background: 'rgba(99,102,241,0.05)', borderRadius: '6px', border: '1px solid rgba(99,102,241,0.2)' }}>
                                 <strong style={{ fontSize: '12px', color: 'var(--v6-accent)', display: 'block', marginBottom: '4px' }}>Brodska pravila:</strong>
                                 <div style={{ fontSize: '11px', color: 'var(--v6-text-secondary)' }}>
                                     Gratuiteti (napojnice) se obračunavaju dnevno na brodu i nisu uračunate odmah. {cruise.cancellationPolicy}
                                 </div>
                             </div>
                        </div>
                    )}
                 </div>
            )}
            
        </div>
    );
};
