import React, { useEffect, useState } from 'react';
import {
    Map as MapIcon, Check, Plane, Hotel, Car, Ticket,
    FileText, Code, Mail, Sparkles, ShieldCheck
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
        <div className="step-content animate-fade-in">

            {/* 1. INTERACTIVE MAP ITINERARY */}
            <div className="search-card-frame !p-0 overflow-hidden mb-12 border-indigo-500/30">
                <div className="p-6 bg-slate-900/50 border-b border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <MapIcon size={20} className="text-indigo-400" />
                        <h4 className="text-white font-black text-sm uppercase tracking-widest">Vizuelni Itinerer Putovanja</h4>
                    </div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Automatski generisana ruta</div>
                </div>
                <div className="h-[400px] w-full relative">
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
                {/* 2. DETAILED BREAKDOWN (2/3 Width) */}
                <div className="lg:col-span-2 space-y-8">
                    <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                        <Sparkles size={20} className="text-yellow-400" /> Detalji Paketa
                    </h3>

                    {/* Flights Section */}
                    {flights && (
                        <div className="info-summary-card !p-8 border-l-4 border-indigo-500">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400"><Plane size={24} /></div>
                                    <h4 className="text-lg font-black text-white uppercase tracking-tight">Avio Karte</h4>
                                </div>
                                <span className="text-xl font-black text-indigo-400">{flightPrice.toFixed(2)}€</span>
                            </div>
                            <div className="space-y-4">
                                {flights.multiCityFlights.map((f: any, i: number) => (
                                    <div key={i} className="flex items-center gap-4 text-sm font-bold text-slate-300 bg-white/5 p-3 rounded-lg">
                                        <div className="text-[10px] bg-indigo-500/20 px-2 py-0.5 rounded text-indigo-400">DEONICA {i + 1}</div>
                                        <span>{f.slices[0].origin.city} &rarr; {f.slices[0].destination.city}</span>
                                        <span className="ml-auto text-slate-500">{new Date(f.slices[0].departure).toLocaleDateString('sr-RS')}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Hotels Section */}
                    {hotels.length > 0 && (
                        <div className="info-summary-card !p-8 border-l-4 border-emerald-500">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400"><Hotel size={24} /></div>
                                    <h4 className="text-lg font-black text-white uppercase tracking-tight">Smeštaj</h4>
                                </div>
                                <span className="text-xl font-black text-emerald-400">{hotelPrice.toFixed(2)}€</span>
                            </div>
                            <div className="space-y-4">
                                {hotels.map((h, i) => (
                                    <div key={i} className="bg-white/5 p-4 rounded-xl">
                                        <div className="flex justify-between mb-2">
                                            <span className="font-black text-white uppercase text-sm">{h.hotel.name}</span>
                                            <span className="text-xs font-bold text-slate-500 uppercase">{h.hotel.city}</span>
                                        </div>
                                        <div className="flex gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            <span>{h.checkIn} DO {h.checkOut}</span>
                                            <span>•</span>
                                            <span>{h.mealPlan.name}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Transfers & Extras */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="info-summary-card !p-6 border-l-4 border-orange-500">
                            <h4 className="text-white font-black text-sm uppercase mb-4 flex items-center gap-2"><Car size={18} /> Transferi</h4>
                            <div className="space-y-2">
                                {transfers.map((t, i) => (
                                    <div key={i} className="text-xs font-bold text-slate-400">• {t.transfer.from.split(' ')[0]} &rarr; {t.transfer.to.split(' ')[0]}</div>
                                ))}
                                {transfers.length === 0 && <div className="text-xs text-slate-600">Nema transfera</div>}
                            </div>
                        </div>
                        <div className="info-summary-card !p-6 border-l-4 border-purple-500">
                            <h4 className="text-white font-black text-sm uppercase mb-4 flex items-center gap-2"><Ticket size={18} /> Dodaci</h4>
                            <div className="space-y-2">
                                {extras.map((e, i) => (
                                    <div key={i} className="text-xs font-bold text-slate-400">• {e.extra.name}</div>
                                ))}
                                {extras.length === 0 && <div className="text-xs text-slate-600">Nema dodataka</div>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. TOTAL PANEL & ACTIONS (1/3 Width) */}
                <div className="space-y-6">
                    <div className="search-card-frame !p-8 bg-indigo-600/10 border-indigo-500/40 sticky top-10">
                        <h4 className="text-white font-black text-lg uppercase tracking-widest mb-8 border-b border-white/5 pb-4">Obračun Paketa</h4>

                        <div className="space-y-4 mb-10">
                            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
                                <span>Letovi</span>
                                <span className="text-white">{flightPrice.toFixed(2)}€</span>
                            </div>
                            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
                                <span>Smeštaj</span>
                                <span className="text-white">{hotelPrice.toFixed(2)}€</span>
                            </div>
                            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
                                <span>Transferi + Dodaci</span>
                                <span className="text-white">{(transferPrice + extraPrice).toFixed(2)}€</span>
                            </div>
                            <div className="h-px bg-white/5 my-4"></div>
                            <div className="flex justify-between items-end">
                                <span className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em]">UKUPAN TOTAL</span>
                                <span className="text-4xl font-black text-white tracking-tighter">{totalPrice.toFixed(2)}€</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {/* Language Switcher */}
                            <div className="flex gap-2 mb-2 p-1 bg-black/20 rounded-xl border border-white/5">
                                <button
                                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all ${exportLang === 'Srpski' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                    onClick={() => setExportLang('Srpski')}
                                >
                                    SRPSKI
                                </button>
                                <button
                                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all ${exportLang === 'Engleski' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                    onClick={() => setExportLang('Engleski')}
                                >
                                    ENGLISH
                                </button>
                            </div>

                            <button className="btn-search-ss !h-16 !mt-0 !text-lg" onClick={onConfirm}>
                                <ShieldCheck size={20} /> KREIRAJ PAKET
                            </button>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    className="ss-input-box !h-12 !px-0 justify-center hover:bg-slate-800"
                                    onClick={() => generatePackagePDF({ basicInfo, flights, hotels, transfers, extras, totalPrice } as any, exportLang)}
                                    title="Download PDF"
                                >
                                    <FileText size={16} />
                                </button>
                                <button
                                    className="ss-input-box !h-12 !px-0 justify-center hover:bg-slate-800"
                                    onClick={() => generatePackageHTML({ basicInfo, flights, hotels, transfers, extras, totalPrice } as any, exportLang)}
                                    title="Download HTML"
                                >
                                    <Code size={16} />
                                </button>
                                <button
                                    className="ss-input-box !h-12 !px-0 justify-center hover:bg-slate-800"
                                    onClick={() => alert(`Mejl poslat na ${exportLang === 'Srpski' ? 'srpskom' : 'engleskom'}!`)}
                                    title="Send Email"
                                >
                                    <Mail size={16} />
                                </button>
                            </div>
                        </div>

                        <p className="text-[10px] text-slate-500 font-bold uppercase text-center mt-6 leading-relaxed">
                            Cene su informativne i podložne promeni do trenutka rezervacije.
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
