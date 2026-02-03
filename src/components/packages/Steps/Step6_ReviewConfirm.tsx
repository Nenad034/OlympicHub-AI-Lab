import React, { useEffect, useState } from 'react';
import {
    Map as MapIcon, Check, Plane, Hotel, Car, Ticket,
    FileText, Code, Mail, Sparkles, ShieldCheck,
    Star, Clock, Utensils
} from 'lucide-react';
import { generatePackagePDF, generatePackageHTML } from '../../../utils/packageExport';
import './SmartSearchV2.css';
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
        <div className="step-content animate-fade-in" style={{ paddingBottom: '140px' }}>

            {/* 1. INTERACTIVE MAP ITINERARY */}
            <div className="search-card-frame !p-0 overflow-hidden mb-12" style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
                <div className="px-8 py-5 flex justify-between items-center" style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="flex items-center gap-4">
                        <MapIcon size={20} className="text-indigo-400" />
                        <div>
                            <h4 className="text-white font-black text-sm uppercase tracking-widest leading-tight">Vizuelni Itinerer Putovanja</h4>
                            <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 opacity-60">Automatski generisana ruta na mapi</p>
                        </div>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* 2. PREMIUM HORIZONTAL CARDS (2/3 Width) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                            <Sparkles size={20} className="text-yellow-400" /> Rezime Vašeg Izbora
                        </h3>
                    </div>

                    {/* Flight Card */}
                    {flights && (
                        <div className="flight-offer-card-ss !border-indigo-500/20" style={{ minHeight: 'auto', background: 'rgba(15, 23, 42, 0.6)' }}>
                            <div className="card-main-layout">
                                <div className="flight-main-section-ss" style={{ padding: '1.75rem' }}>
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-500/10"><Plane size={20} /></div>
                                        <div>
                                            <h4 className="text-sm font-black text-white uppercase tracking-widest leading-none">Avio Prevoz</h4>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Multi-city rute</span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        {flights.multiCityFlights.map((f: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between bg-white/[0.03] px-5 py-4 rounded-xl border border-white/[0.05] hover:bg-white/[0.05] transition-colors">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Deonica {i + 1}</span>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm font-black text-white uppercase">{f.slices[0].origin.city}</span>
                                                        <span className="text-slate-600 text-xs">&rarr;</span>
                                                        <span className="text-sm font-black text-white uppercase">{f.slices[0].destination.city}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[11px] font-black text-slate-300 uppercase block mb-1">{new Date(f.slices[0].departure).toLocaleDateString('sr-RS')}</span>
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{f.slices[0].segments[0].marketing_carrier.name}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flight-price-sidebar-ss" style={{ width: '220px', background: 'linear-gradient(to bottom, rgba(99, 102, 241, 0.05), rgba(99, 102, 241, 0.02))' }}>
                                    <div className="price-label-ss" style={{ letterSpacing: '2px' }}>UKUPNO LETOVI</div>
                                    <div className="price-value-ss" style={{ color: '#818cf8', fontSize: '2rem', fontWeight: 900 }}>{flightPrice.toFixed(2)}€</div>
                                    <div className="text-[9px] font-black text-slate-600 uppercase mt-2">Sa uračunatim taksama</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Hotel Cards */}
                    {hotels.map((h, i) => (
                        <div key={i} className="flight-offer-card-ss !border-emerald-500/20" style={{ minHeight: 'auto', background: 'rgba(15, 23, 42, 0.6)' }}>
                            <div className="card-main-layout">
                                <div className="flight-main-section-ss" style={{ padding: '1.75rem' }}>
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/10"><Hotel size={20} /></div>
                                        <div>
                                            <h4 className="text-sm font-black text-white uppercase tracking-widest leading-none">Smeštaj: {h.hotel.city}</h4>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Premium odabrana soba</span>
                                        </div>
                                    </div>
                                    <div className="bg-white/[0.03] p-5 rounded-xl border border-white/[0.05]">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h5 className="font-black text-white uppercase text-lg leading-tight mb-2">{h.hotel.name}</h5>
                                                <div className="flex gap-1.5">
                                                    {[...Array(h.hotel.stars || 4)].map((_, i) => <Star key={i} size={11} className="fill-yellow-500 text-yellow-500" />)}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">Noćenja</span>
                                                <div className="flex items-center gap-2 justify-end">
                                                    <span className="text-lg font-black text-emerald-400">{h.nights || 7}</span>
                                                    <span className="text-[10px] font-black text-slate-600 uppercase">NOĆI</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-8 pt-4 border-t border-white/5">
                                            <div className="flex items-center gap-2.5">
                                                <Clock size={14} className="text-emerald-500/50" />
                                                <span className="text-[11px] font-black text-slate-300 uppercase letter-spacing-wide">{h.checkIn} &mdash; {h.checkOut}</span>
                                            </div>
                                            <div className="flex items-center gap-2.5">
                                                <Utensils size={14} className="text-emerald-500/50" />
                                                <span className="text-[11px] font-black text-slate-300 uppercase letter-spacing-wide">{h.mealPlan.name}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flight-price-sidebar-ss" style={{ width: '220px', background: 'linear-gradient(to bottom, rgba(16, 185, 129, 0.05), rgba(16, 185, 129, 0.02))' }}>
                                    <div className="price-label-ss" style={{ letterSpacing: '2px' }}>UKUPNO SMEŠTAJ</div>
                                    <div className="price-value-ss" style={{ color: '#10b981', fontSize: '2rem', fontWeight: 900 }}>{h.totalPrice.toFixed(2)}€</div>
                                    <div className="text-[9px] font-black text-slate-600 uppercase mt-2">Cena po sobi</div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Transfers & Extras Combined Card */}
                    {(transfers.length > 0 || extras.length > 0) && (
                        <div className="flight-offer-card-ss !border-orange-500/20" style={{ minHeight: 'auto', background: 'rgba(15, 23, 42, 0.6)' }}>
                            <div className="card-main-layout">
                                <div className="flight-main-section-ss" style={{ padding: '1.75rem' }}>
                                    <div className="grid grid-cols-2 gap-10">
                                        <div>
                                            <div className="flex items-center gap-4 mb-6">
                                                <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-400 border border-orange-500/20 shadow-lg shadow-orange-500/10"><Car size={20} /></div>
                                                <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">Transferi</h4>
                                            </div>
                                            <div className="space-y-2.5">
                                                {transfers.map((t, i) => (
                                                    <div key={i} className="text-[11px] font-bold text-slate-300 flex items-center gap-2 bg-white/[0.03] px-4 py-3 rounded-xl border border-white/[0.05] hover:bg-white/[0.05] transition-colors">
                                                        <span className="text-orange-500/60">•</span>
                                                        <span className="uppercase">{t.transfer.from.split(' ')[0]}</span>
                                                        <span className="text-slate-600">&rarr;</span>
                                                        <span className="uppercase">{t.transfer.to.split(' ')[0]}</span>
                                                    </div>
                                                ))}
                                                {transfers.length === 0 && <span className="text-[10px] text-slate-600 uppercase font-black italic ml-2">Nema odabranih transfera</span>}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-4 mb-6">
                                                <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 border border-purple-500/20 shadow-lg shadow-purple-500/10"><Ticket size={20} /></div>
                                                <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">Dodaci</h4>
                                            </div>
                                            <div className="space-y-2.5">
                                                {extras.map((e, i) => (
                                                    <div key={i} className="text-[11px] font-bold text-slate-300 flex items-center gap-3 bg-white/[0.03] px-4 py-3 rounded-xl border border-white/[0.05] hover:bg-white/[0.05] transition-colors">
                                                        <span className="text-purple-500/60">•</span>
                                                        <span className="uppercase">{e.extra.name}</span>
                                                    </div>
                                                ))}
                                                {extras.length === 0 && <span className="text-[10px] text-slate-600 uppercase font-black italic ml-2">Nema dodatnih usluga</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flight-price-sidebar-ss" style={{ width: '220px', background: 'linear-gradient(to bottom, rgba(249, 115, 22, 0.05), rgba(249, 115, 22, 0.02))' }}>
                                    <div className="price-label-ss" style={{ letterSpacing: '2px' }}>MOBILNOST i USLUGE</div>
                                    <div className="price-value-ss" style={{ color: '#f97316', fontSize: '2rem', fontWeight: 900 }}>{(transferPrice + extraPrice).toFixed(2)}€</div>
                                    <div className="text-[9px] font-black text-slate-600 uppercase mt-2">UKUPNO DODATNO</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. TOTAL PANEL & ACTIONS (1/3 Width) */}
                <div className="space-y-6">
                    <div className="search-card-frame !p-8 sticky top-10" style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.12)', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}>
                        <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                <ShieldCheck size={18} className="text-indigo-400" />
                            </div>
                            <h4 className="text-white font-black text-xs uppercase tracking-[0.25em]">Obračun Paketa</h4>
                        </div>

                        <div className="space-y-3 mb-10">
                            {[
                                { label: 'Osnovni Letovi', val: flightPrice, color: 'text-indigo-400' },
                                { label: 'Smeštajni Kapaciteti', val: hotelPrice, color: 'text-emerald-400' },
                                { label: 'Transferi i Dodaci', val: transferPrice + extraPrice, color: 'text-orange-400' }
                            ].map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center group">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-400 transition-colors">{item.label}</span>
                                    <span className={`text-xs font-black ${item.color} tabular-nums`}>{item.val.toFixed(2)}€</span>
                                </div>
                            ))}

                            <div className="mt-8 pt-6 border-t border-white/[0.08] border-dashed">
                                <div className="flex justify-between items-end">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-1">UKUPNA VREDNOST</span>
                                        <span className="text-[9px] font-bold text-slate-600 uppercase">Obračunato u EUR</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-bold text-slate-500 line-through opacity-40 mb-1">{(totalPrice * 1.1).toFixed(2)}€</span>
                                        <span className="text-4xl font-black text-white tracking-tighter tabular-nums">{(totalPrice).toFixed(2)}€</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-5">
                            {/* Language Switcher */}
                            <div className="flex gap-2 p-1.5 bg-black/30 rounded-2xl border border-white/5">
                                <button
                                    className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all duration-300 ${exportLang === 'Srpski' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                                    onClick={() => setExportLang('Srpski')}
                                >
                                    SRPSKI
                                </button>
                                <button
                                    className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all duration-300 ${exportLang === 'Engleski' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                                    onClick={() => setExportLang('Engleski')}
                                >
                                    ENGLISH
                                </button>
                            </div>

                            {/* MAIN KREIRAJ PAKET BUTTON */}
                            <button
                                className="w-full h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-white flex items-center justify-center gap-4 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-500/40 active:scale-[0.98] group"
                                onClick={onConfirm}
                                style={{
                                    fontSize: '15px',
                                    fontWeight: '900',
                                    fontStyle: 'italic',
                                    textTransform: 'uppercase',
                                    letterSpacing: '2px',
                                    border: '1px solid rgba(255,255,255,0.15)'
                                }}
                            >
                                <Check size={20} className="text-white group-hover:scale-125 transition-transform" /> KREIRAJ PAKET
                            </button>

                            {/* PREMIUM EXPORT ROW */}
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { icon: <FileText size={18} />, label: 'PDF', action: () => generatePackagePDF({ basicInfo, flights, hotels, transfers, extras, totalPrice } as any, exportLang) },
                                    { icon: <Code size={18} />, label: 'HTML', action: () => generatePackageHTML({ basicInfo, flights, hotels, transfers, extras, totalPrice } as any, exportLang) },
                                    { icon: <Mail size={18} />, label: 'EMAIL', action: () => alert(`Mejl poslat na ${exportLang === 'Srpski' ? 'srpskom' : 'engleskom'}!`) }
                                ].map((opt, i) => (
                                    <button
                                        key={i}
                                        className="flex flex-col items-center justify-center py-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.08] hover:border-white/[0.12] transition-all duration-300 group relative overflow-hidden"
                                        onClick={opt.action}
                                    >
                                        <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/5 transition-colors" />
                                        <div className="text-slate-400 group-hover:text-indigo-400 group-hover:scale-110 transition-all mb-2.5 relative z-10">
                                            {opt.icon}
                                        </div>
                                        <span className="text-[9px] font-black text-slate-500 group-hover:text-slate-200 uppercase tracking-widest relative z-10 transition-colors">
                                            {opt.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-10 pt-6 border-t border-white/5">
                            <p className="text-[9px] text-slate-600 font-bold uppercase text-center leading-relaxed opacity-60 italic tracking-wider">
                                Ponuda je informativnog karaktera i podložna je promeni do finalne potvrde rezervacije od strane organizatora.
                            </p>
                        </div>
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
