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
        <div className="v6-live-stack" style={{ width: '100%' }}>
            {/* Header Badge */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
                <div style={{
                    padding: '8px 16px',
                    background: 'var(--v6-color-prime)',
                    borderRadius: 'var(--v6-radius-md)',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <Package size={14} /> Vaš Dinamički Paket
                </div>
            </div>

            {/* Stack of cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {items.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{
                            padding: '24px',
                            background: 'var(--v6-bg-card)',
                            border: '1.5px dashed var(--v6-border)',
                            borderRadius: 'var(--v6-radius-lg)',
                            textAlign: 'center',
                            color: 'var(--v6-text-muted)',
                            fontSize: '13px'
                        }}>
                            Odaberite segmente da započnete gradnju paketa
                        </div>
                        
                        <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--v6-text-muted)', textTransform: 'uppercase', marginTop: '10px', textAlign: 'center' }}>Inspiracija za Vas</div>
                        {mockPackages.map(pkg => (
                            <div key={pkg.id} style={{
                                padding: '12px', background: 'var(--v6-bg-card)', border: '1.5px solid var(--v6-border)',
                                borderRadius: '14px', cursor: 'pointer', transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', gap: '12px',
                                boxShadow: 'var(--v6-shadow-sm)'
                            }}>
                                <div style={{ 
                                    width: '42px', height: '42px', borderRadius: '10px', 
                                    background: 'var(--v6-bg-section)', display: 'flex', 
                                    alignItems: 'center', justifyContent: 'center', color: 'var(--v6-color-prime)' 
                                }}>
                                    {pkg.icon}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--v6-text-primary)' }}>{pkg.title}</div>
                                    <div style={{ fontSize: '10px', color: 'var(--v6-text-muted)' }}>{pkg.route}</div>
                                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                                        {pkg.tags.map(t => <span key={t} style={{ fontSize: '8px', padding: '2px 4px', background: '#fff', borderRadius: '4px', border: '1px solid var(--v6-border)' }}>{t}</span>)}
                                    </div>
                                </div>
                                <div style={{ fontSize: '13px', fontWeight: 900, color: 'var(--v6-navy)' }}>{formatPrice(pkg.price)}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    items.map((item, idx) => (
                        <div key={idx} className={`v6-stack-card v6-type-${item.type}`} style={{ animationDelay: `${idx * 0.1}s` }}>
                            {/* Glass effect top */}
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }} />
                            
                             <div className="v6-stack-card-header">
                                 <div className="v6-stack-card-icon">
                                     {React.cloneElement(item.icon as React.ReactElement<any>, { size: 22 })}
                                 </div>
                                 <div className="v6-stack-card-body">
                                     <div className="v6-stack-card-label">{item.label}</div>
                                     <div className="v6-stack-card-details">{item.details}</div>
                                 </div>
                                 <div style={{ textAlign: 'right' }}>
                                    <div className="v6-stack-card-price">
                                        {formatPrice(item.price)}
                                    </div>
                                    <div className="v6-stack-card-pax-info">za {paxTotal} putnika</div>
                                 </div>

                                 {item.segmentNum && (
                                     <div className="v6-segment-badge">
                                         Segment {item.segmentNum}
                                     </div>
                                 )}
                             </div>
                            
                            <div className="v6-stack-card-footer">
                                <button 
                                    onClick={() => setPackageWizardStep(item.step)}
                                    className="v6-edit-btn-mini"
                                >
                                    <RotateCcw size={14} /> Izmeni
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Total Block */}
            {total > 0 && (
                <div style={{
                    background: 'var(--v6-bg-card)',
                    border: '2px solid var(--v6-color-instant)',
                    borderRadius: 'var(--v6-radius-lg)',
                    padding: '16px',
                    boxShadow: '0 8px 24px rgba(5,150,105,0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--v6-text-muted)', textTransform: 'uppercase' }}>Ukupno za paket</div>
                            <div style={{ fontSize: '24px', fontWeight: 950, color: 'var(--v6-text-primary)', letterSpacing: '-0.02em' }}>{formatPrice(total)}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '11px', color: 'var(--v6-text-muted)' }}>{paxTotal} putnika</div>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--v6-color-instant-text)' }}>{formatPrice(Math.round(total/paxTotal))}/os</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button 
                            onClick={() => setPackageWizardStep(6)}
                            style={{
                                width: '100%',
                                padding: '14px',
                                background: 'var(--v6-navy)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '14px',
                                fontWeight: 900,
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(30,41,59,0.3)',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <Send size={16} /> Kreiraj Paket
                        </button>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                                onClick={handleSave}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    background: 'var(--v6-bg-section)',
                                    border: '1.5px solid var(--v6-border)',
                                    borderRadius: 'var(--v6-radius-md)',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    color: 'var(--v6-text-primary)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px'
                                }}
                            >
                                <Save size={12} /> Sačuvaj
                            </button>
                            <button 
                                onClick={() => alert('Share options...')}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    background: 'var(--v6-bg-section)',
                                    border: '1.5px solid var(--v6-border)',
                                    borderRadius: 'var(--v6-radius-md)',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    color: 'var(--v6-text-primary)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px'
                                }}
                            >
                                <Share2 size={12} /> Šeruj
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
