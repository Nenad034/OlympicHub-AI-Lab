import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMap
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ⚠️ CRITICAL FIX: Vite breaks Leaflet's default icon paths at build time.
// We must override them to point to CDN before any markers are created.
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});
import {
    X,
    Star,
    MapPin,
    Zap,
    Navigation2
} from 'lucide-react';
import './SmartMapExplorer.css';
import { useThemeStore } from '../../../stores';

const formatPrice = (price: number) =>
    price.toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

interface Hotel {
    id: string;
    name: string;
    location: string;
    stars?: number;
    price: number;
    images?: string[];
    provider: string;
    latitude?: number;
    longitude?: number;
    originalData?: any;
}

interface SmartMapExplorerProps {
    hotels: Hotel[];
    onClose: () => void;
    onOpenDetails: (hotel: any) => void;
    // Extra props passed by parent SmartSearch.tsx
    checkIn?: string;
    checkOut?: string;
    nights?: number;
    roomAllocations?: any[];
    isSubagent?: boolean;
}

const CITY_COORDS: Record<string, [number, number]> = {
    'bansko': [41.83, 23.48],
    'borovec': [42.26, 23.60],
    'borovets': [42.26, 23.60],
    'pamporovo': [41.65, 24.70],
    'sofia': [42.69, 23.32],
    'burgas': [42.50, 27.46],
    'varna': [43.21, 27.91],
    'golden sands': [43.28, 28.04],
    'sunny beach': [42.69, 27.71]
};

const createPriceIcon = (price: number, isActive: boolean, isHovered: boolean = false) => L.divIcon({
    className: `custom-price-marker ${isActive ? 'active' : ''} ${isHovered ? 'hovered' : ''}`,
    html: `
        <div class="villsy-pin-wrapper">
            <div class="villsy-pin-bubble">
                €${Math.round(price)}
            </div>
        </div>
    `,
    iconSize: [50, 30],
    iconAnchor: [25, 30],
    popupAnchor: [0, -30]
});

const PremiumStars: React.FC<{ count: number; size?: number }> = ({ count, size = 11 }) => (
    <div className="card-stars">
        {[...Array(5)].map((_, i) => (
            <Star key={i} size={size} fill={i < count ? '#ffb300' : 'transparent'} color={i < count ? '#ffb300' : '#cbd5e1'} />
        ))}
    </div>
);

// Companion component to access map instance
// IMPORTANT: Uses refs internally so it never causes parent re-renders
const MapController: React.FC<{
    hotelPoints: any[],
    mapRef: React.MutableRefObject<L.Map | null>
}> = ({ hotelPoints, mapRef }) => {
    const map = useMap();
    const fitDoneRef = useRef(false);

    useEffect(() => {
        // Store map reference to parent once
        mapRef.current = map;

        // Fit bounds ONCE on mount - never again
        if (!fitDoneRef.current && hotelPoints.length > 0) {
            fitDoneRef.current = true;
            const bounds = L.latLngBounds(hotelPoints.map(h => h.coords));
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }

        // Ensure map has correct size after mounting
        const timer = setTimeout(() => map.invalidateSize(), 400);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map]); // Only runs when map instance changes (once)

    return null;
};

const SmartMapExplorer: React.FC<SmartMapExplorerProps> = ({ hotels, onClose, onOpenDetails }) => {
    const [activeHotelUid, setActiveHotelUid] = useState<string | null>(null);
    const [hoveredHotelUid, setHoveredHotelUid] = useState<string | null>(null);
    const { theme } = useThemeStore();
    const markerRefs = useRef<Record<string, any>>({});
    const mapInstanceRef = useRef<L.Map | null>(null);

    const isDark = theme !== 'light';
    const tileUrl = isDark
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    const hotelPoints = useMemo(() => {
        return hotels.map((h, idx) => {
            let lat: number | undefined = h.latitude || h.originalData?.hotel?.latitude;
            let lng: number | undefined = h.longitude || h.originalData?.hotel?.longitude;

            if (!lat || !lng) {
                const loc = h.location.toLowerCase();
                for (const [city, coords] of Object.entries(CITY_COORDS)) {
                    if (loc.includes(city)) {
                        const goldenAngle = 137.508 * (Math.PI / 180);
                        const radiusStep = 0.0006;
                        const radius = Math.sqrt(idx + 1) * radiusStep;
                        const theta = (idx + 1) * goldenAngle;
                        lat = coords[0] + radius * Math.cos(theta);
                        lng = coords[1] + radius * Math.sin(theta);
                        break;
                    }
                }
            }
            return {
                ...h,
                uid: `${h.id}-${idx}`,
                coords: (lat && lng) ? [lat, lng] as [number, number] : null
            };
        }).filter(h => h.coords !== null) as (Hotel & { uid: string, coords: [number, number] })[];
    }, [hotels]);

    const initialCenter = useMemo(() =>
        hotelPoints[0]?.coords ?? [42.69, 23.32],
        [hotelPoints]);

    const handleSelectHotel = useCallback((hotel: any) => {
        setActiveHotelUid(hotel.uid);
        if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo(hotel.coords, 16, { animate: true, duration: 0.8 });
            setTimeout(() => {
                markerRefs.current[hotel.uid]?.openPopup();
            }, 850);
        }
        const el = document.getElementById(`hotel-card-${hotel.uid}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, []);

    const handleCardMouseEnter = useCallback((uid: string) => {
        setHoveredHotelUid(uid);
        const marker = markerRefs.current[uid];
        if (marker) marker.openPopup();
    }, []);

    if (hotelPoints.length === 0) return null;

    return (
        <div className="smart-map-explorer-overlay villsy-mode">
            <header className="map-explorer-header">
                <div className="header-info">
                    <Navigation2 size={22} color="#8E24AC" />
                    <div>
                        <h2>Smart Map Explorer</h2>
                        <p>{hotelPoints.length} rezultata na mapi</p>
                    </div>
                </div>
                <button className="close-map-btn" onClick={onClose}><X size={18} /> ZATVORI</button>
            </header>

            <div className="map-container-wrapper">
                <aside className="map-sidebar">
                    <div className="sidebar-header">
                        <h3>Vrhunski Smeštaj</h3>
                    </div>
                    <div className="hotel-list">
                        {hotelPoints.map(hotel => (
                            <div
                                id={`hotel-card-${hotel.uid}`}
                                key={hotel.uid}
                                className={`villsy-hotel-card ${activeHotelUid === hotel.uid ? 'active' : ''} ${hoveredHotelUid === hotel.uid ? 'hovered' : ''}`}
                                onMouseEnter={() => handleCardMouseEnter(hotel.uid)}
                                onMouseLeave={() => setHoveredHotelUid(null)}
                                onClick={() => handleSelectHotel(hotel)}
                            >
                                <div className="card-image-wrap">
                                    <img
                                        src={hotel.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=300'}
                                        alt={hotel.name}
                                    />
                                    <div className="card-badge">{hotel.provider}</div>
                                </div>
                                <div className="card-content">
                                    <div className="card-top">
                                        <h4>{hotel.name}</h4>
                                        <PremiumStars count={hotel.stars ?? 0} />
                                    </div>
                                    <p className="card-loc"><MapPin size={12} /> {hotel.location}</p>
                                    <div className="card-footer">
                                        <div className="price-tag">{formatPrice(hotel.price)}</div>
                                        <button className="view-btn">Pregled</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>

                <div className="map-main-area">
                    <MapContainer
                        center={initialCenter as [number, number]}
                        zoom={13}
                        style={{ height: '100%', width: '100%', background: '#f8fafc' }}
                        zoomControl={false}
                    >
                        <TileLayer url={tileUrl} />
                        <MapController
                            hotelPoints={hotelPoints}
                            mapRef={mapInstanceRef}
                        />
                        {hotelPoints.map(hotel => (
                            <Marker
                                key={hotel.uid}
                                position={hotel.coords}
                                icon={createPriceIcon(hotel.price, activeHotelUid === hotel.uid, hoveredHotelUid === hotel.uid)}
                                ref={(el: any) => { if (el) markerRefs.current[hotel.uid] = el; }}
                                eventHandlers={{
                                    click: () => setActiveHotelUid(hotel.uid)
                                }}
                            >
                                <Popup className="villsy-popup">
                                    <div className="v-popup-card">
                                        <div className="v-popup-img">
                                            <img src={hotel.images?.[0] || ''} alt="" />
                                            <div className="v-popup-price">{formatPrice(hotel.price)}</div>
                                        </div>
                                        <div className="v-popup-info">
                                            <PremiumStars count={hotel.stars ?? 0} size={12} />
                                            <h3>{hotel.name}</h3>
                                            <p><MapPin size={12} /> {hotel.location}</p>
                                            <button className="v-popup-btn" onClick={() => onOpenDetails(hotel)}>
                                                Pogledaj Detalje
                                            </button>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>

                    <div className="villsy-ai-tag">
                        <Zap size={14} fill="#FFD700" color="#FFD700" />
                        <span>AI preporuka na osnovu vaših preferencija</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SmartMapExplorer;
