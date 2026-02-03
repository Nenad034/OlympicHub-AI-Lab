import React, { useEffect, useState } from 'react';
import {
    Map as MapIcon, Check, Plane, Hotel, Car, Ticket,
    FileText, Code, Mail, Sparkles, ShieldCheck,
    Star, Clock, Utensils
} from 'lucide-react';
import { generatePackagePDF, generatePackageHTML } from '../../../utils/packageExport';
import './SmartSearchV2.css';
import '../../../pages/SmartSearchFerrariFix.css';
import type {
    BasicInfoData,
    FlightSelectionData,
    HotelSelectionData,
    TransferSelectionData,
    ExtraSelectionData
} from '../../../types/packageSearch.types';
import type { Language } from '../../../utils/translations';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Leaflet Icon Fix
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface Step6Props {
    basicInfo: BasicInfoData | null;
    flights: FlightSelectionData | null;
    hotels: HotelSelectionData[];
    transfers: TransferSelectionData[];
    extras: ExtraSelectionData[];
    totalPrice: number;
    onBack: () => void;
    onConfirm: () => void;
    onEditStep?: (step: number) => void;
}

const MapAutoBounds: React.FC<{ positions: [number, number][] }> = ({ positions }) => {
    const map = useMap();
    useEffect(() => {
        if (positions.length > 0) {
            const bounds = L.latLngBounds(positions);
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [positions, map]);
    return null;
};

const Step6_ReviewConfirm: React.FC<Step6Props> = ({
    basicInfo,
    flights,
    hotels,
    transfers,
    extras,
    totalPrice,
    onConfirm,
}) => {
    const [exportLang, setExportLang] = useState<Language>('Srpski');

    // Map setup
    const begPos: [number, number] = [44.8181, 20.3091];
    const hotelMarkers = hotels.map(h => ({
        id: h.hotel.id,
        name: h.hotel.name,
        city: h.hotel.city,
        position: [h.hotel.latitude || 44.8, h.hotel.longitude || 20.3] as [number, number]
    }));
    const routeCoordinates = [begPos, ...hotelMarkers.map(m => m.position), begPos];

    const flightPrice = flights?.totalPrice || 0;
    const hotelPrice = hotels.reduce((sum, h) => sum + h.totalPrice, 0);
    const transferPrice = transfers.reduce((sum, t) => sum + t.totalPrice, 0);
    const extraPrice = extras.reduce((sum, e) => sum + e.totalPrice, 0);

    return (
        <div className="ss-review-container animate-fade-in" style={{ paddingBottom: '140px' }}>
            {/* 1. INTERACTIVE MAP ITINERARY */}
            <div className="search-card-frame overflow-hidden mb-12">
                <div className="px-8 py-5 ss-review-flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <MapIcon size={20} className="text-indigo-400" />
                    <div>
                        <h4 className="text-white font-black text-sm uppercase tracking-widest leading-tight">Vizuelni Itinerer Putovanja</h4>
                        <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 opacity-60">Automatski generisana ruta na mapi</p>
                    </div>
                </div>
                <div className="h-[350px] w-full relative">
                    <MapContainer center={begPos} zoom={5} style={{ height: '100%', width: '100%' }}>
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                        <MapAutoBounds positions={routeCoordinates} />
                        <Polyline positions={routeCoordinates} color="#6366f1" weight={3} dashArray="10, 10" opacity={0.6} />
                        {allMarkers(begPos, hotelMarkers).map((m, i) => (
                            <Marker key={i} position={m.position}>
                                <Popup><strong>{m.name}</strong></Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>
            </div>

            <div className="ss-review-grid">
                {/* 2. MAIN CONTENT (CARDS) */}
                <div className="ss-review-main">
                    <div className="ss-review-flex mb-4">
                        <Sparkles size={20} className="text-yellow-400" />
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter">Rezime Vašeg Izbora</h3>
                    </div>

                    {/* Flight Card */}
                    {flights && (
                        <div className="flight-offer-card-ss">
                            <div className="card-main-layout">
                                <div className="flight-main-section-ss">
                                    <div className="ss-review-flex mb-8">
                                        <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-lg">
                                            <Plane size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-base font-black text-white uppercase tracking-widest leading-none mb-1">Avio Prevoz</h4>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Multi-destination ruta</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        {flights.multiCityFlights.map((f: any, i: number) => (
                                            <div key={i} className="ss-price-row" style={{ background: 'rgba(255,255,255,0.02)', padding: '20px 25px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <div className="ss-review-flex" style={{ gap: '30px' }}>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black text-indigo-400 uppercase mb-2">Let {i + 1}</span>
                                                        <div className="ss-review-flex" style={{ gap: '15px' }}>
                                                            <div className="flex flex-col">
                                                                <span className="text-lg font-black text-white">{f.slices[0].origin.city}</span>
                                                                <span className="text-[10px] font-bold text-slate-500 uppercase">{f.slices[0].origin.iataCode}</span>
                                                            </div>
                                                            <div className="flex flex-col items-center opacity-30">
                                                                <span style={{ fontSize: '10px' }}>--</span>
                                                                <Plane size={14} />
                                                                <span style={{ fontSize: '10px' }}>--</span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-lg font-black text-white">{f.slices[0].destination.city}</span>
                                                                <span className="text-[10px] font-bold text-slate-500 uppercase">{f.slices[0].destination.iataCode}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '14px', fontWeight: '900', color: '#cbd5e1', marginBottom: '4px' }}>{new Date(f.slices[0].departure).toLocaleDateString('sr-RS', { day: '2-digit', month: 'long' })}</div>
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{f.slices[0].segments[0].carrierName}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flight-price-sidebar-ss">
                                    <div className="price-label-ss" style={{ fontSize: '10px', color: '#64748b' }}>CENA AVIOPREVOZA</div>
                                    <div className="price-value-ss text-indigo-400">{flightPrice.toFixed(2)}€</div>
                                    <div className="text-[10px] font-bold text-slate-600 uppercase mt-3 tracking-widest">Sve takse uključene</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Hotel Cards */}
                    {hotels.length > 0 && (
                        <div className="ss-review-flex mt-12 mb-4">
                            <Hotel size={20} className="text-emerald-400" />
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Smeštaj</h3>
                        </div>
                    )}
                    {hotels.map((h, i) => (
                        <div key={i} className="flight-offer-card-ss">
                            <div className="card-main-layout">
                                <div className="flight-main-section-ss">
                                    <div className="ss-review-flex mb-8">
                                        <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-lg">
                                            <Hotel size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-base font-black text-white uppercase tracking-widest leading-none mb-1">Smeštaj: {h.hotel.city}</h4>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Premium odabrana ponuda</span>
                                        </div>
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '25px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div className="ss-price-row" style={{ border: 'none', marginBottom: '20px' }}>
                                            <div>
                                                <h5 style={{ fontSize: '1.25rem', fontWeight: '900', color: 'white', textTransform: 'uppercase', marginBottom: '10px' }}>{h.hotel.name}</h5>
                                                <div className="ss-review-flex" style={{ background: 'rgba(0,0,0,0.2)', padding: '6px 12px', borderRadius: '8px', width: 'fit-content' }}>
                                                    {[...Array(h.hotel.stars || 4)].map((_, i) => (
                                                        <Star key={i} size={12} className="fill-yellow-500 text-yellow-500" />
                                                    ))}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <span style={{ fontSize: '10px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Boravak</span>
                                                <div className="ss-review-flex" style={{ justifyContent: 'flex-end', gap: '5px' }}>
                                                    <span style={{ fontSize: '1.5rem', fontWeight: '900', color: '#10b981' }}>{h.nights || 7}</span>
                                                    <span style={{ fontSize: '10px', fontWeight: '900', color: '#475569' }}>NOĆI</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div className="ss-review-flex">
                                                <Clock size={16} className="text-emerald-500/50" />
                                                <div className="flex flex-col">
                                                    <span style={{ fontSize: '9px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase' }}>Period</span>
                                                    <span style={{ fontSize: '12px', fontWeight: '900', color: '#e2e8f0' }}>{h.checkIn} — {h.checkOut}</span>
                                                </div>
                                            </div>
                                            <div className="ss-review-flex">
                                                <Utensils size={16} className="text-emerald-500/50" />
                                                <div className="flex flex-col">
                                                    <span style={{ fontSize: '9px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase' }}>Usluga</span>
                                                    <span style={{ fontSize: '12px', fontWeight: '900', color: '#e2e8f0' }}>{h.mealPlan.name}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flight-price-sidebar-ss">
                                    <div className="price-label-ss" style={{ fontSize: '10px', color: '#64748b' }}>CENA SMEŠTAJA</div>
                                    <div className="price-value-ss text-emerald-400">{h.totalPrice.toFixed(2)}€</div>
                                    <div className="text-[10px] font-bold text-slate-600 uppercase mt-3 tracking-widest">PO SOBI</div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Transfer Cards */}
                    {transfers.length > 0 && (
                        <div className="ss-review-flex mt-12 mb-4">
                            <Car size={20} className="text-pink-400" />
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Transferi</h3>
                        </div>
                    )}
                    {transfers.map((t, i) => (
                        <div key={i} className="flight-offer-card-ss">
                            <div className="card-main-layout">
                                <div className="flight-main-section-ss">
                                    <div className="ss-review-flex mb-8">
                                        <div className="w-12 h-12 bg-pink-500/10 rounded-2xl flex items-center justify-center text-pink-400 border border-pink-500/20 shadow-lg">
                                            <Car size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-base font-black text-white uppercase tracking-widest leading-none mb-1">Transfer: {t.transfer.from} &rarr; {t.transfer.to}</h4>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.vehicle.name}</span>
                                        </div>
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div className="ss-review-flex" style={{ justifyContent: 'space-between' }}>
                                            <div className="flex flex-col">
                                                <span style={{ fontSize: '9px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase' }}>Datum i Vreme</span>
                                                <span style={{ fontSize: '12px', fontWeight: '900', color: '#e2e8f0' }}>{t.date} u {t.time}h</span>
                                            </div>
                                            <div className="flex flex-col" style={{ textAlign: 'right' }}>
                                                <span style={{ fontSize: '9px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase' }}>Vozilo</span>
                                                <span style={{ fontSize: '12px', fontWeight: '900', color: '#e2e8f0' }}>{t.vehicle.type.toUpperCase()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flight-price-sidebar-ss">
                                    <div className="price-label-ss" style={{ fontSize: '10px', color: '#64748b' }}>CENA TRANSFERA</div>
                                    <div className="price-value-ss text-pink-400">{t.totalPrice.toFixed(2)}€</div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Extra Cards */}
                    {extras.length > 0 && (
                        <div className="ss-review-flex mt-12 mb-4">
                            <Ticket size={20} className="text-orange-400" />
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Dodatne Aktivnosti</h3>
                        </div>
                    )}
                    {extras.map((e, i) => (
                        <div key={i} className="flight-offer-card-ss">
                            <div className="card-main-layout">
                                <div className="flight-main-section-ss">
                                    <div className="ss-review-flex mb-8">
                                        <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-400 border border-orange-500/20 shadow-lg">
                                            <Ticket size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-base font-black text-white uppercase tracking-widest leading-none mb-1">{e.extra.name}</h4>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{e.extra.destination} • {e.quantity} putnika</span>
                                        </div>
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <p className="text-[11px] text-slate-400 leading-relaxed mb-4">{e.extra.description}</p>
                                        <div className="ss-review-flex" style={{ gap: '20px' }}>
                                            <div className="flex items-center gap-2">
                                                <Clock size={12} className="text-orange-400/50" />
                                                <span style={{ fontSize: '10px', fontWeight: '900', color: '#cbd5e1' }}>{e.extra.duration}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock size={12} className="text-orange-400/50" />
                                                <span style={{ fontSize: '10px', fontWeight: '900', color: '#cbd5e1' }}>{e.date}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flight-price-sidebar-ss">
                                    <div className="price-label-ss" style={{ fontSize: '10px', color: '#64748b' }}>CENA AKTIVNOSTI</div>
                                    <div className="price-value-ss text-orange-400">{e.totalPrice.toFixed(2)}€</div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Placeholder if empty */}
                    {hotels.length === 0 && !flights && transfers.length === 0 && extras.length === 0 && (
                        <div className="search-card-frame" style={{ textAlign: 'center', padding: '60px' }}>
                            <Sparkles size={40} className="text-slate-700 mx-auto mb-4" />
                            <p className="text-slate-500 font-bold uppercase tracking-widest">Odaberite usluge kako biste videli rezime</p>
                        </div>
                    )}
                </div>

                {/* 3. SIDE SUMMARY PANEL */}
                <div className="ss-review-side">
                    <div className="ss-summary-card">
                        <div className="ss-review-flex mb-8" style={{ paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <ShieldCheck size={20} className="text-indigo-400" />
                            <h4 style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px' }}>Obračun Paketa</h4>
                        </div>

                        <div className="ss-price-row">
                            <span style={{ fontSize: '10px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase' }}>Avio Karte</span>
                            <span style={{ fontSize: '14px', fontWeight: '900', color: '#818cf8' }}>{flightPrice.toFixed(2)}€</span>
                        </div>
                        <div className="ss-price-row">
                            <span style={{ fontSize: '10px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase' }}>Smeštaj</span>
                            <span style={{ fontSize: '14px', fontWeight: '900', color: '#10b981' }}>{hotelPrice.toFixed(2)}€</span>
                        </div>
                        <div className="ss-price-row">
                            <span style={{ fontSize: '10px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase' }}>Dodaci</span>
                            <span style={{ fontSize: '14px', fontWeight: '900', color: '#f59e0b' }}>{(transferPrice + extraPrice).toFixed(2)}€</span>
                        </div>

                        <div className="ss-total-section">
                            <div className="ss-total-label-box">
                                <span style={{ fontSize: '10px', fontWeight: '900', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '2px' }}>UKUPAN IZNOS</span>
                                <span style={{ fontSize: '9px', fontWeight: '900', color: '#475569' }}>Obračunato u EUR</span>
                            </div>
                            <div className="ss-total-amount">{totalPrice.toFixed(2)}€</div>
                        </div>

                        <div style={{ marginTop: '30px' }}>
                            <div className="ss-lang-group">
                                <button className={`ss-lang-btn ${exportLang === 'Srpski' ? 'active' : ''}`} onClick={() => setExportLang('Srpski')}>SRPSKI</button>
                                <button className={`ss-lang-btn ${exportLang === 'Engleski' ? 'active' : ''}`} onClick={() => setExportLang('Engleski')}>ENGLISH</button>
                            </div>

                            <button className="ss-confirm-btn" onClick={onConfirm}>
                                <Check size={20} /> KREIRAJ PAKET
                            </button>

                            <div className="ss-export-row">
                                <button className="ss-export-btn" onClick={() => generatePackagePDF({ basicInfo, flights, hotels, transfers, extras, totalPrice } as any, exportLang)}>
                                    <FileText size={18} className="text-slate-400" />
                                    <span>PDF</span>
                                </button>
                                <button className="ss-export-btn" onClick={() => generatePackageHTML({ basicInfo, flights, hotels, transfers, extras, totalPrice } as any, exportLang)}>
                                    <Code size={18} className="text-slate-400" />
                                    <span>HTML</span>
                                </button>
                                <button className="ss-export-btn" onClick={() => alert('Mejl poslat!')}>
                                    <Mail size={18} className="text-slate-400" />
                                    <span>EMAIL</span>
                                </button>
                            </div>
                        </div>

                        <p style={{ marginTop: '20px', fontSize: '10px', color: '#475569', textAlign: 'center', fontStyle: 'italic', lineHeight: '1.5' }}>
                            Ponuda je informativnog karaktera i podložna je promeni do finalne potvrde rezervacije.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const allMarkers = (beg: [number, number], hotels: any[]) => [
    { name: 'Beograd (BEG)', position: beg },
    ...hotels.map(h => ({ name: h.name, position: h.position })),
    { name: 'Beograd (BEG)', position: beg }
];

export default Step6_ReviewConfirm;
