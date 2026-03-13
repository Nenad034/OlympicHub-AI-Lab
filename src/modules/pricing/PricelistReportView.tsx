import React, { useState } from 'react';
import { 
    Printer, 
    Mail, 
    FileText, 
    Download,
    Info,
    CheckCircle2,
    Calendar,
    Clock,
    Tag,
    AlertCircle,
    Users,
    Link2,
    Copy,
    Check,
    ArrowLeft,
    Plus,
    Minus
} from 'lucide-react';

interface PricelistReportItem {
    id: string;
    date: string;
    hotelName: string;
    roomType: string;
    supplier: string;
    netPrice: number;
    margin: number;
    marginPercent: number;
    grossPrice: number;
    status: 'Aktivna' | 'Draft' | 'Arhivirana';
    specificSupplements?: Supplement[];
    hotelId?: string;
    logs?: { timestamp: string; user: string; action: string }[];
}

interface Supplement {
    name: string;
    price: string;
    type: 'Doplata' | 'Popust';
}

interface PricelistReportViewProps {
    items: PricelistReportItem[];
    priceDisplay?: 'neto' | 'bruto' | 'all';
    onClose?: () => void;
    hotelDetails?: {
        name: string;
        location: string;
        bookingWindow?: string;
        minStay?: string;
    };
    supplements?: Supplement[];
    notes?: string[];
    kidsInfo?: string;
}

const PricelistReportView: React.FC<PricelistReportViewProps> = ({ 
    items, 
    onClose, 
    hotelDetails,
    supplements = [
        { name: 'Polupansion (HB)', price: 'Uračunato', type: 'Doplata' },
        { name: 'Boravišna taksa', price: '1.50 € / dan', type: 'Doplata' },
        { name: 'Early Booking (do 15.11)', price: '10%', type: 'Popust' },
        { name: 'Svečana večera (NG)', price: '150.00 €', type: 'Doplata' }
    ],
    notes = [
        'Cene su izražene po osobi po noćenju.',
        'Osiguranje je uključeno u osnovnu scenu.',
        'Prijava (Check-in) od 14:00h, Odjava (Check-out) do 10:00h.'
    ],
    kidsInfo = 'Deca do 12 god: 50%',
    priceDisplay = 'all'
}) => {
    const [selectedLinkType, setSelectedLinkType] = useState<'bruto' | 'neto' | 'all'>('bruto');
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [copied, setCopied] = useState(false);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const toggleRow = (id: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) newExpanded.delete(id);
        else newExpanded.add(id);
        setExpandedRows(newExpanded);
    };

    const expandAll = () => {
        setExpandedRows(new Set(items.map(item => item.id)));
    };

    const collapseAll = () => {
        setExpandedRows(new Set());
    };

    const handlePrint = () => {
        window.print();
    };

    const handleCopyLink = () => {
        const url = `${window.location.origin}/public-pricing?view=${selectedLinkType}&token=PR-${Math.random().toString(36).substring(7).toUpperCase()}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const currentHotel = hotelDetails?.name || (items.length > 0 ? items[0].hotelName : 'Vespera');
    const totalNet = items.reduce((acc, item) => acc + item.netPrice, 0);
    const totalMargin = items.reduce((acc, item) => acc + item.margin, 0);
    const totalGross = items.reduce((acc, item) => acc + item.grossPrice, 0);

    const uniqueHotels = Array.from(new Set(items.map(item => item.hotelName)));
    const isMultiHotel = uniqueHotels.length > 1;
    
    // Determine the title hotel
    const reportHotelName = hotelDetails?.name || (uniqueHotels.length === 1 ? uniqueHotels[0] : 'Više Hotela (Kombinovani Izveštaj)');
    const reportLocation = hotelDetails?.location || (uniqueHotels.length === 1 ? 'Lokacija prema ugovoru' : 'Različite lokacije');

    return (
        <div className="pricelist-report-view" style={{ 
            background: 'transparent', 
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%'
        }}>
            <div style={{ 
                background: '#fff', 
                padding: '40px',
                borderRadius: '8px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                width: '100%',
                minHeight: '29.7cm',
                position: 'relative',
                fontFamily: "'Inter', sans-serif",
                color: '#1e293b'
            }}>
                {/* Header section (Printable) */}
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    borderBottom: '4px solid #0f172a',
                    paddingBottom: '24px',
                    marginBottom: '32px'
                }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 900, color: '#0f172a', letterSpacing: '-1px' }}>
                            Zvanični Cenovnik - PrimeClick
                        </h1>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '2px' }}>
                                PRICING INTELLIGENCE SYSTEM
                            </span>
                            <span style={{ fontSize: '10px', color: '#94a3b8' }}>•</span>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>v2.4 Final</span>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '8px' }}>
                            GENERISANO: {new Date().toLocaleString('sr-RS')}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '8px 24px', textAlign: 'left', fontSize: '11px' }}>
                            <span style={{ color: '#94a3b8', fontWeight: 600 }}>Hotel:</span>
                            <span style={{ color: '#0f172a', fontWeight: 900 }}>{reportHotelName}</span>
                            <span style={{ color: '#94a3b8', fontWeight: 600 }}>Lokacija:</span>
                            <span style={{ color: '#0f172a', fontWeight: 700 }}>{reportLocation}</span>
                        </div>
                    </div>
                </div>

                {/* Specifics Grid */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(4, 1fr)', 
                    gap: '20px', 
                    marginBottom: '32px',
                    padding: '20px',
                    background: '#f8fafc',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0'
                }}>
                    <div>
                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>Booking Window</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '13px' }}>
                            <Clock size={16} color="#3b82f6" /> {hotelDetails?.bookingWindow || 'Nije definisano'}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>Min. Stay</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '13px' }}>
                            <Calendar size={16} color="#3b82f6" /> {hotelDetails?.minStay || 'Prema upitu'}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>Sezona</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '13px' }}>
                            <CheckCircle2 size={16} color="#10b981" /> Leto 2026
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>Starost Dece</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '13px' }}>
                            <Users size={16} color="#3b82f6" /> {kidsInfo}
                        </div>
                    </div>
                </div>

                {/* Main Pricing Table */}
                <div style={{ marginBottom: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <div style={{ width: '12px', height: '12px', background: '#3b82f6', borderRadius: '3px' }} />
                        <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>TABELA OSNOVNIH CENA</h2>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
                        <thead>
                            <tr style={{ background: '#0f172a', color: '#fff' }}>
                                <th style={{ ...thStyle, width: '40px', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                                        <Plus 
                                            size={12} 
                                            style={{ cursor: 'pointer', color: '#3b82f6' }} 
                                            onClick={(e) => { e.stopPropagation(); expandAll(); }} 
                                        />
                                        <Minus 
                                            size={12} 
                                            style={{ cursor: 'pointer', color: '#3b82f6' }} 
                                            onClick={(e) => { e.stopPropagation(); collapseAll(); }} 
                                        />
                                    </div>
                                </th>
                                <th style={thStyle}>TERMIN BORAVKA</th>
                                {isMultiHotel && <th style={thStyle}>HOTEL</th>}
                                <th style={thStyle}>TIP SMEŠTAJA / JEDINICA</th>
                                <th style={thStyle}>STRUKTURA</th>
                                {priceDisplay !== 'bruto' && <th style={{ ...thStyle, textAlign: 'right' }}>NETO</th>}
                                {priceDisplay === 'all' && <th style={{ ...thStyle, textAlign: 'right' }}>PROFIT</th>}
                                {priceDisplay !== 'neto' && <th style={{ ...thStyle, textAlign: 'right', background: '#3b82f6' }}>PRODAJNA CENA</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, idx) => (
                                <React.Fragment key={item.id}>
                                    <tr style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#fff' : '#fcfdfe', cursor: 'pointer' }} onClick={() => toggleRow(item.id)}>
                                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                                            {expandedRows.has(item.id) ? <Minus size={16} color="#3b82f6" /> : <Plus size={16} color="#3b82f6" />}
                                        </td>
                                        <td style={tdStyle}>
                                            <div style={{ fontWeight: 800, color: '#3b82f6' }}>{item.date}</div>
                                        </td>
                                        {isMultiHotel && (
                                            <td style={tdStyle}>
                                                <div style={{ fontWeight: 700, color: '#64748b', fontSize: '12px' }}>{item.hotelName}</div>
                                                <div style={{ fontSize: '10px', color: '#94a3b8' }}>{item.supplier}</div>
                                            </td>
                                        )}
                                        <td style={tdStyle}>
                                            <div style={{ fontWeight: 800, fontSize: '14px' }}>{item.roomType}</div>
                                            <div style={{ fontSize: '11px', color: '#64748b' }}>Status: {item.status}</div>
                                        </td>
                                        <td style={tdStyle}>
                                            <div style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, color: '#475569', display: 'inline-block' }}>
                                                2 Odrasle + 1 Dete
                                            </div>
                                        </td>
                                        {priceDisplay !== 'bruto' && <td style={{ ...tdStyle, textAlign: 'right', color: '#94a3b8' }}>{item.netPrice.toFixed(2)} €</td>}
                                        {priceDisplay === 'all' && <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#3b82f6' }}>+{item.margin.toFixed(2)} €</td>}
                                        {priceDisplay !== 'neto' && (
                                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 900, color: '#0f172a', fontSize: '16px' }}>
                                                {item.grossPrice.toFixed(2)} €
                                            </td>
                                        )}
                                    </tr>
                                    {expandedRows.has(item.id) && (
                                        <tr>
                                            <td 
                                                colSpan={(isMultiHotel ? 5 : 4) + (priceDisplay === 'all' ? 3 : 1)} 
                                                style={{ background: '#f8fafc', padding: '15px 40px', borderBottom: '1px solid #e2e8f0' }}
                                            >
                                                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1FR 0.8fr', gap: '40px' }}>
                                                    <div>
                                                        <h4 style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '1px' }}>Specifične stavke (Ova soba)</h4>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                            {item.specificSupplements && item.specificSupplements.map((s, i) => (
                                                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', fontSize: '12px' }}>
                                                                    <span style={{ fontWeight: 600 }}>{s.name}</span>
                                                                    <span style={{ fontWeight: 800, color: s.type === 'Popust' ? '#10b981' : '#3b82f6' }}>{s.price}</span>
                                                                </div>
                                                            ))}
                                                            {(!item.specificSupplements || item.specificSupplements.length === 0) && (
                                                                <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>Nema specifičnih stavki.</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                                            <Clock size={14} color="#3b82f6" />
                                                            <h4 style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Audit Log (Hronologija)</h4>
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                            {item.logs?.map((log, lidx) => (
                                                                <div key={lidx} style={{ fontSize: '11px', padding: '8px 12px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                                        <span style={{ fontWeight: 800, color: '#3b82f6' }}>{log.timestamp}</span>
                                                                        <span style={{ fontSize: '10px', opacity: 0.5 }}>{log.user}</span>
                                                                    </div>
                                                                    <div style={{ fontWeight: 600, fontSize: '11px', color: '#1e293b' }}>{log.action}</div>
                                                                </div>
                                                            ))}
                                                            {(!item.logs || item.logs.length === 0) && (
                                                                <div style={{ fontSize: '11px', opacity: 0.5, fontStyle: 'italic', padding: '10px', background: '#fff', borderRadius: '8px', border: '1px dashed #e2e8f0' }}>
                                                                    Nema zabeleženih promena
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                                            <Tag size={14} color="#f59e0b" />
                                                            <h4 style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Identifikacija</h4>
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                <span style={{ opacity: 0.6 }}>Hotel ID:</span>
                                                                <span style={{ fontWeight: 800 }}>{item.hotelId || 'N/A'}</span>
                                                            </div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                <span style={{ opacity: 0.6 }}>Izvor:</span>
                                                                <span style={{ fontWeight: 800 }}>{item.supplier || 'Direktno'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Supplements & Notes Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <div style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '3px' }} />
                            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>DOPLATE I POPUSTI</h2>
                        </div>
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
                            {supplements.map((s, i) => (
                                <div key={i} style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    padding: '12px 20px', 
                                    borderBottom: i === supplements.length - 1 ? 'none' : '1px solid #f1f5f9',
                                    background: s.type === 'Popust' ? '#f0fdf4' : '#fff'
                                }}>
                                    <span style={{ fontWeight: 600, fontSize: '13px' }}>{s.name}</span>
                                    <span style={{ fontWeight: 800, color: s.type === 'Popust' ? '#059669' : '#3b82f6', fontSize: '13px' }}>{s.price}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <div style={{ width: '12px', height: '12px', background: '#f59e0b', borderRadius: '3px' }} />
                            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>NAPOMENE (SPECIFIČNOSTI)</h2>
                        </div>
                        <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '20px', borderRadius: '16px' }}>
                            <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {notes.map((n, i) => (
                                    <li key={i} style={{ fontSize: '13px', color: '#92400e', fontWeight: 600, lineHeight: 1.5 }}>
                                        {n}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* PDF Footer Disclaimer */}
                <div style={{ marginTop: '60px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <p style={{ fontSize: '10px', color: '#94a3b8', margin: 0 }}>
                        Napomena: PrimeClick Pricing Intelligence automatski vrši optimizaciju marži. Sve promene su evidentirane u sistemu.
                        Dokument je validan bez pečata i potpisa ukoliko je poslat iz autorizovanog PrimeClick naloga.
                    </p>
                </div>
            </div>

            {/* Actions (Not Printable) */}
            <div className="no-print" style={{ 
                marginTop: '40px', 
                display: 'flex', 
                gap: '15px',
                borderTop: '2px solid #f1f5f9',
                paddingTop: '30px'
            }}>
                <button onClick={handlePrint} style={btnStyle('#0f172a')}>
                    <Printer size={18} /> ŠTAMPAJ FINALNI DOKUMENT
                </button>
                <button style={btnStyle('#3b82f6')}>
                    <Mail size={18} /> POŠALJI AGENTIMA
                </button>
                <button 
                    onClick={() => setShowLinkModal(true)}
                    style={{ ...btnStyle('#8b5cf6'), color: '#fff' }}
                >
                    <Link2 size={18} /> JAVNI LINK
                </button>
                <button style={{ ...btnStyle('#f8fafc'), color: '#64748b', border: '1px solid #e2e8f0' }}>
                    <Download size={18} /> EXCEL EXPORT
                </button>
                {onClose && (
                    <button onClick={onClose} style={{ ...btnStyle('transparent'), color: '#64748b', marginLeft: 'auto' }}>
                        ZATVORI
                    </button>
                )}
            </div>

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { margin: 0; padding: 0; background: #fff !important; }
                    .pricelist-report-view { padding: 0 !important; width: 100% !important; }
                    @page { size: landscape; margin: 10mm; }
                }
                @font-face {
                    font-family: 'Inter';
                    src: url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
                }
            `}</style>

            {/* Public Link Modal Overlay */}
            {showLinkModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(5px)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}>
                    <div style={{
                        background: '#1e293b',
                        border: '1px solid #00e5ff',
                        borderRadius: '20px',
                        padding: '30px',
                        maxWidth: '500px',
                        width: '100%',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                    }}>
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <div style={{ background: 'rgba(0, 229, 255, 0.1)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
                                <Link2 size={30} color="#00e5ff" />
                            </div>
                            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#fff' }}>Generisan Javni Link</h3>
                            <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '8px' }}>
                                Izaberite koji set podataka želite da podelite.
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '5px', marginBottom: '20px', background: 'rgba(0,0,0,0.2)', padding: '5px', borderRadius: '12px' }}>
                            <button 
                                onClick={() => setSelectedLinkType('bruto')}
                                style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: selectedLinkType === 'bruto' ? '#00e5ff' : 'transparent', color: selectedLinkType === 'bruto' ? '#000' : '#94a3b8', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                            >Bruto</button>
                            <button 
                                onClick={() => setSelectedLinkType('neto')}
                                style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: selectedLinkType === 'neto' ? '#00e5ff' : 'transparent', color: selectedLinkType === 'neto' ? '#000' : '#94a3b8', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                            >Neto</button>
                            <button 
                                onClick={() => setSelectedLinkType('all')}
                                style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: selectedLinkType === 'all' ? '#00e5ff' : 'transparent', color: selectedLinkType === 'all' ? '#000' : '#94a3b8', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                            >Sve</button>
                        </div>

                        <div style={{ 
                            background: 'rgba(0,0,0,0.3)', 
                            padding: '15px', 
                            borderRadius: '12px', 
                            border: '1px solid rgba(255,255,255,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            marginBottom: '20px'
                        }}>
                            <div style={{ flex: 1, fontSize: '13px', color: '#00e5ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
                                {`${window.location.origin}/public-pricing?view=${selectedLinkType}&token=PR-${Math.random().toString(36).substring(7).toUpperCase()}`}
                            </div>
                            <button 
                                onClick={handleCopyLink}
                                style={{
                                    background: copied ? '#22c55e' : 'rgba(255,255,255,0.05)',
                                    border: 'none',
                                    padding: '8px 15px',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    transition: 'all 0.2s'
                                }}
                            >
                                {copied ? <Check size={14} /> : <Copy size={14} />}
                                {copied ? 'KOPIRANO' : 'KOPIRAJ'}
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                                onClick={() => setShowLinkModal(false)}
                                style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontWeight: 700, cursor: 'pointer' }}
                            >
                                Zatvori
                            </button>
                            <button 
                                onClick={() => {}}
                                style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#00e5ff', border: 'none', color: '#000', fontWeight: 800, cursor: 'pointer' }}
                            >
                                <Mail size={16} style={{ marginBottom: '-3px', marginRight: '5px' }} /> Pošalji Link
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Styles
const thStyle: React.CSSProperties = {
    padding: '16px 20px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: 900,
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: '1px'
};

const tdStyle: React.CSSProperties = {
    padding: '16px 20px',
    fontSize: '13px',
    verticalAlign: 'middle'
};

const btnStyle = (bg: string) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 28px',
    background: bg,
    color: bg === 'transparent' || bg === '#f8fafc' ? 'inherit' : '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: 800,
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: bg !== 'transparent' ? '0 10px 15px -3px rgb(0 0 0 / 0.1)' : 'none'
});

export default PricelistReportView;
