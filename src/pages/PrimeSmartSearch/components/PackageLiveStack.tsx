import React from 'react';
import { useSearchStore, calcPaxSummary } from '../stores/useSearchStore';
import { Plane, Hotel, Bus, Ticket, MapPin, Search, Star, Share2, Save, ExternalLink, Package, RotateCcw, Send } from 'lucide-react';
import type { FlightSearchResult, ActivityOption, TransferOption } from '../types';

const formatPrice = (n: number, currency = 'EUR') =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency, minimumFractionDigits: 0 }).format(n);

export const PackageLiveStack: React.FC = () => {
    const { 
        packageWizardSelections, 
        setPackageWizardStep, 
        roomAllocations, 
        checkIn, 
        checkOut,
        saveOffer
    } = useSearchStore();

    // Calculate total pax and nights
    const totalAdults = roomAllocations.reduce((sum, r) => sum + r.adults, 0);
    const totalChildren = roomAllocations.reduce((sum, r) => sum + r.children, 0);
    const paxTotal = totalAdults + totalChildren;
    
    const nights = checkIn && checkOut
        ? Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    const { outboundFlight, returnFlight, hotelId, roomId, mealPlanCode, transferId, extraIds } = packageWizardSelections;
    
    const items: { step: number; label: string; price: number; icon: React.ReactNode; details: string; type: string; segmentNum?: number }[] = [];

    if (outboundFlight) {
        items.push({
            step: 2,
            type: 'flight',
            segmentNum: 1,
            icon: <Plane size={18} />,
            label: `Let (Odlazak)`,
            details: `${outboundFlight.segments[0].origin} → ${outboundFlight.segments[outboundFlight.segments.length - 1].destination}`,
            price: outboundFlight.price
        });
    }

    if (returnFlight) {
        items.push({
            step: 2,
            type: 'flight',
            segmentNum: 2,
            icon: <Plane size={18} style={{ transform: 'rotate(180deg)' }} />,
            label: `Let (Povratak)`,
            details: `${returnFlight.segments[0].origin} → ${returnFlight.segments[returnFlight.segments.length - 1].destination}`,
            price: returnFlight.price
        });
    }

    if (hotelId) {
        items.push({
            step: 3,
            type: 'hotel',
            segmentNum: 1,
            icon: <Hotel size={18} />,
            label: `Smeštaj`,
            details: `Izabrana soba i pansion za ${nights} noći`,
            price: 450
        });
    }

    if (transferId) {
        items.push({
            step: 4,
            type: 'transfer',
            segmentNum: 1, // Možemo dodati logiku za više segmenata kasnije
            icon: <Bus size={18} />,
            label: `Transfer (Povratni)`,
            details: `Aerodrom ↔ Hotel (Dolazak + Odlazak)`,
            price: 65
        });
    }

    extraIds.forEach((id, idx) => {
        items.push({
            step: 5,
            type: 'extra',
            segmentNum: 1,
            icon: <Ticket size={18} />,
            label: `Izabrana Aktivnost`,
            details: `Aktivnost/Osiguranje u okviru paketa`,
            price: 35
        });
    });

    // MOCK DATA FOR FORCED VISUAL (Remove for production or when building)
    const isBuilding = !!(outboundFlight || hotelId || transferId || extraIds.length > 0);
    
    if (items.length === 0 && !isBuilding) {
        // Only show mock items if not building anything
        items.push(
            { step: 2, type: 'flight',   segmentNum: 1, icon: <Plane size={18} />, label: 'Primer: Air Serbia', details: 'Beograd → Pariz (BEG-CDG)', price: 280 },
            { step: 3, type: 'hotel',    segmentNum: 1, icon: <Hotel size={18} />, label: 'Hotel Ritz Paris', details: 'Superior Double (7 noćenja)', price: 1450 }
        );
    }

    const total = items.reduce((s, i) => s + i.price, 0);

    const handleSave = () => {
        saveOffer({
            id: `pkg-${Date.now()}`,
            type: 'package',
            label: `Paket Aranžman (${nights} noći)`,
            description: `${items.map(i => i.label).join(', ')}`,
            totalPrice: total,
            currency: 'EUR',
            timestamp: Date.now(),
            data: { packageWizardSelections, roomAllocations, checkIn, checkOut },
            hasPriceDropAlert: false
        });
        alert('Ponuda sačuvana!');
    };

    const mockPackages = [
        { id: 'm1', title: 'Dubai Extreme', price: 2450, icon: <Plane size={24} />, route: 'BEG → DXB', tags: ['Emirates', 'Atlantis', 'VIP'] },
        { id: 'm2', title: 'Maldives Zen', price: 5890, icon: <Plane size={24} />, route: 'BEG → MLE', tags: ['Overwater', 'All Incl', 'Seaplane'] },
        { id: 'm3', title: 'Paris Romance', price: 1250, icon: <Plane size={24} />, route: 'BEG → CDG', tags: ['Ritz', 'Cruise', 'Gourmet'] },
        { id: 'm4', title: 'New York Vibes', price: 3100, icon: <Plane size={24} />, route: 'BEG → JFK', tags: ['Times Sq', 'Broadway', 'Helicopter'] },
        { id: 'm5', title: 'Tokyo Tech', price: 2100, icon: <Plane size={24} />, route: 'BEG → HND', tags: ['Robot Cafe', 'Guided', 'Bullet Train'] },
    ];

    return (
        <div className="v6-live-stack-floating-sidebar" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '16px', 
            width: '100%' 
        }}>
            {/* Header / Context Badge */}
            <div style={{
                padding: '12px 24px',
                background: 'var(--brand-primary)',
                borderRadius: '16px',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: 'var(--shadow-md)'
            }}>
                <Package size={18} /> 
                <span>VAŠ DINAMIČKI PAKET</span>
            </div>

            {/* List of Floating Individual Segment Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {items.length === 0 ? (
                    <div style={{
                        padding: '32px 24px',
                        background: 'var(--bg-surface)',
                        border: '2px dashed var(--border-color)',
                        borderRadius: '20px',
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        fontSize: '14px',
                        fontWeight: 600,
                        boxShadow: 'var(--shadow-sm)'
                    }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>✨</div>
                        Odaberite segmente da započnete gradnju paketa
                    </div>
                ) : (
                    items.map((item, idx) => (
                        <div 
                            key={idx} 
                            className={`v6-stack-card v6-type-${item.type}`} 
                            style={{ 
                                animationDelay: `${idx * 0.1}s`,
                                background: 'var(--bg-surface)',
                                border: '1px solid var(--border-color)',
                                minHeight: '140px',
                                padding: '24px 20px',
                                boxShadow: 'var(--shadow-md)',
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px'
                            }}
                        >
                             <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                 <div style={{ 
                                     width: '44px', 
                                     height: '44px', 
                                     borderRadius: '12px', 
                                     background: 'var(--brand-accent-light)', 
                                     color: 'var(--brand-accent)', 
                                     display: 'flex', 
                                     alignItems: 'center', 
                                     justifyContent: 'center' 
                                 }}>
                                     {React.cloneElement(item.icon as React.ReactElement<any>, { size: 24 })}
                                 </div>
                                 <div style={{ flex: 1 }}>
                                     <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)' }}>{item.label}</div>
                                     <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.details}</div>
                                 </div>
                                 <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--brand-primary)' }}>
                                        {formatPrice(item.price)}
                                    </div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>za {paxTotal} putnika</div>
                                 </div>
                             </div>
                            
                             {item.segmentNum && (
                                 <div style={{ position: 'absolute', top: '12px', right: '16px', background: 'var(--brand-accent)', color: '#fff', fontSize: '9px', fontWeight: 900, padding: '2px 8px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                                     SEGMENT {item.segmentNum}
                                 </div>
                             )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                                <button 
                                    onClick={() => setPackageWizardStep(item.step)}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'var(--brand-accent)',
                                        fontSize: '11px',
                                        fontWeight: 800,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <RotateCcw size={13} /> IZMENI
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Total Block (Separate Floating Card) */}
            {total > 0 && (
                <div style={{
                    background: 'var(--bg-surface)',
                    border: '2px solid var(--brand-accent)',
                    borderRadius: '24px',
                    padding: '24px',
                    boxShadow: '0 12px 32px rgba(157, 78, 221, 0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Ukupno za paket</div>
                            <div style={{ fontSize: '28px', fontWeight: 950, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>{formatPrice(total)}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{paxTotal} odraslih</div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--brand-accent)' }}>{formatPrice(Math.round(total/paxTotal))}/os</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button 
                            onClick={() => setPackageWizardStep(6)}
                            style={{
                                width: '100%',
                                padding: '16px',
                                background: 'var(--brand-primary)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '16px',
                                fontSize: '15px',
                                fontWeight: 900,
                                cursor: 'pointer',
                                boxShadow: '0 8px 20px rgba(26,35,78,0.3)',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px'
                            }}
                        >
                            <Send size={18} /> KREIRAJ PAKET
                        </button>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                                onClick={handleSave}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: 'var(--bg-app)',
                                    border: '1.5px solid var(--border-color)',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    color: 'var(--text-main)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px'
                                }}
                            >
                                <Save size={14} /> SAČUVAJ
                            </button>
                            <button 
                                onClick={() => alert('Share options...')}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: 'var(--bg-app)',
                                    border: '1.5px solid var(--border-color)',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    color: 'var(--text-main)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px'
                                }}
                            >
                                <Share2 size={14} /> ŠERUJ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
