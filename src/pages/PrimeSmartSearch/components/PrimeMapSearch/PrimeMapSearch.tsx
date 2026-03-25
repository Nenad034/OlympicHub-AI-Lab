import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { 
    X, 
    Star, 
    Navigation, 
    TrendingDown, 
    Heart, 
    ShoppingBasket,
    MapPin,
    ArrowRight,
    Send,
    Layers,
    Globe,
    Moon,
    GripHorizontal
} from 'lucide-react';
import { useSearchStore } from '../../stores/useSearchStore';
import { useThemeStore } from '../../../../stores';
import { useAppStore } from '../../../../stores';
import type { HotelSearchResult } from '../../types';

// Milica avatar (inline SVG fallback if image not found)
const MILICA_AVATAR = '/src/pages/PrimeSmartSearch/assets/milica-avatar.png';


// Mapbox configuration
// @ts-ignore
const MAPBOX_TOKEN = import.meta.env?.VITE_MAPBOX_TOKEN;
if (MAPBOX_TOKEN) {
    mapboxgl.accessToken = MAPBOX_TOKEN;
}

interface PrimeMapSearchProps {
    results: HotelSearchResult[];
    onClose?: () => void;
}

export const PrimeMapSearch: React.FC<PrimeMapSearchProps> = ({ results, onClose }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
    
    const [selectedHotel, setSelectedHotel] = useState<HotelSearchResult | null>(null);
    const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(null);
    const [hoveredHotelId, setHoveredHotelId] = useState<string | null>(null);
    const [favorites, setFavorites] = useState<string[]>([]);
    const [milicaOpen, setMilicaOpen] = useState(false);
    const [milicaQuery, setMilicaQuery] = useState('');
    const [show360, setShow360] = useState(false);
    
    // Geometry state for Milica Floating Window
    const [milicaGeom, setMilicaGeom] = useState({ 
        width: 320, 
        height: 420,
        x: 0,
        y: 0
    });
    
    const dragControls = useDragControls();
    const panelRef = useRef<HTMLDivElement>(null);

    // Resizing logic (8-direction)
    const [isResizing, setIsResizing] = useState<string | null>(null);
    const startPos = useRef({ x: 0, y: 0, w: 0, h: 0 });

    const startResize = (e: React.MouseEvent, type: string) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(type);
        startPos.current = { 
            x: e.clientX, 
            y: e.clientY, 
            w: milicaGeom.width, 
            h: milicaGeom.height 
        };
    };

    useEffect(() => {
        if (!isResizing) return;

        const handleMove = (e: MouseEvent) => {
            const dx = e.clientX - startPos.current.x;
            const dy = e.clientY - startPos.current.y;
            
            setMilicaGeom(prev => {
                let nw = prev.width;
                let nh = prev.height;
                
                if (isResizing.includes('e')) nw = Math.max(280, startPos.current.w + dx);
                if (isResizing.includes('w')) nw = Math.max(280, startPos.current.w - dx);
                if (isResizing.includes('s')) nh = Math.max(300, startPos.current.h + dy);
                if (isResizing.includes('n')) nh = Math.max(300, startPos.current.h - dy);
                
                return { ...prev, width: nw, height: nh };
            });
        };

        const handleUp = () => setIsResizing(null);
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
        };
    }, [isResizing]);
    const [mapStyle, setMapStyle] = useState<'streets' | 'satellite' | 'dark'>('streets');
    const [mapMoved, setMapMoved] = useState(false);
    const [activeFilter, setActiveFilter] = useState<'price' | 'avail' | 'free-cancel' | null>(null);
    const { theme } = useThemeStore();

    const [mapError, setMapError] = useState<string | null>(null);
    const [isMapLoading, setIsMapLoading] = useState(true);


    // 1. Inicijalizacija Mape (Sa Safe-Checks & Error Boundary)
    useEffect(() => {
        if (!mapContainerRef.current) return;
        if (mapRef.current) return;

        setIsMapLoading(true);
        setMapError(null);

        try {
            const mapStyle = theme === 'navy' 
                ? 'mapbox://styles/mapbox/dark-v11' 
                : 'mapbox://styles/mapbox/light-v11';

            mapRef.current = new mapboxgl.Map({
                container: mapContainerRef.current,
                style: mapStyle,
                center: [27.7126, 42.6951], // Centrirano na Sunčev Breg
                zoom: 12.5,
                projection: 'mercator', // Force 2D flat view
                pitch: 45,
                bearing: -5,
                antialias: true
            });

            mapRef.current.on('load', () => {
                setIsMapLoading(false);
                // Force resize to ensure it fills the container
                setTimeout(() => {
                    mapRef.current?.resize();
                }, 100);
            });

            mapRef.current.on('error', (e) => {
                console.error("Mapbox Error Event:", e);
                setMapError("Problem sa povezivanjem na Mapbox server.");
                setIsMapLoading(false);
            });

            mapRef.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

        } catch (err) {
            console.error("Critical Mapbox Init Error:", err);
            setMapError("Sistem nije mogao da inicijalizuje mapu. Proverite internet vezu.");
            setIsMapLoading(false);
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [theme]);

    // Geocoding cache to avoid repeated API calls
    const geocodeCache = useRef<Record<string, [number, number]>>({});

    const geocodeHotel = async (hotel: HotelSearchResult): Promise<[number, number] | null> => {
        const cacheKey = hotel.id;
        if (geocodeCache.current[cacheKey]) return geocodeCache.current[cacheKey];
        
        const city = hotel.location.city || 'Sunny Beach';
        const country = hotel.location.country || 'Bulgaria';
        const query = `${hotel.name}, ${city}, ${country}`;

        try {
            // Added proximity and country filter (bg = Bulgaria) to prevent global scattering
            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&limit=1&types=poi,place&proximity=27.7,42.6&country=bg`;
            const resp = await fetch(url);
            const data = await resp.json();

            if (data.features && data.features.length > 0) {
                const [lng, lat] = data.features[0].center;
                
                // FINAL SAFETY CHECK: Only allow coords within the Balkans region [22-30 E, 40-45 N]
                // This stops hotels with same names in USA or China appearing on map
                if (lng > 20 && lng < 31 && lat > 39 && lat < 46) {
                    geocodeCache.current[cacheKey] = [lng, lat];
                    return [lng, lat];
                } else {
                    console.warn(`[Geocode] Discarding out-of-bounds result for ${hotel.name}: [${lng}, ${lat}]`);
                }
            }
        } catch (e) {
            console.warn(`[Geocode] Failed for ${hotel.name}:`, e);
        }
        return null;
    };

    const getMarkerColor = (price: number) => {
        const prices = results.map(h => h.lowestTotalPrice).sort((a,b) => a-b);
        const min = prices[0];
        const max = prices[prices.length - 1];
        const range = max - min;
        
        if (range === 0) return '#6366f1';
        const percent = (price - min) / range;
        
        if (percent < 0.25) return '#10b981'; // Cheap - Green
        if (percent < 0.6) return '#6366f1';  // Mid - Indigo
        return '#f43f5e'; // High - Rose/Red
    };

    function addMarker(hotel: HotelSearchResult, lng: number, lat: number) {
        const safeId = String(hotel.id).startsWith('solvex_') ? hotel.id : `solvex_${hotel.id}`;
        if (!mapRef.current || markersRef.current[safeId]) return;
        
        const color = getMarkerColor(hotel.lowestTotalPrice);
        const el = document.createElement('div');
        el.className = `marker-bubble ${hotel.isPrime ? 'is-prime' : ''}`;
        
        // Dynamic CSS Var for marker color
        el.style.setProperty('--marker-color', color);

        el.innerHTML = `
            <div class="bubble-content" style="border-color: ${color}">
                <span class="bubble-currency" style="color: ${color}">${hotel.currency}</span>
                <span class="bubble-price">${Math.round(hotel.lowestTotalPrice)}</span>
            </div>
            ${hotel.isPrime ? '<div class="ai-glow"></div>' : ''}
        `;

        el.addEventListener('click', () => {
            setSelectedHotel(hotel);
            mapRef.current?.flyTo({ center: [lng, lat], zoom: 15, essential: true });
            
            // Calculate pixel position after flyTo starts/settles
            setTimeout(() => {
                if (mapRef.current) {
                    const point = mapRef.current.project([lng, lat]);
                    const container = mapContainerRef.current;
                    if (container) {
                        const cardW = 320;
                        const cardH = 420;
                        const margin = 18;
                        let x = point.x - cardW / 2;
                        let y = point.y - cardH - 8;
                        
                        // Safety clamp
                        if (x < margin) x = margin;
                        if (x + cardW > container.clientWidth - margin) x = container.clientWidth - cardW - margin;
                        if (y < margin) y = point.y + 30;
                        setPopupPos({ x, y });
                    }
                }
            }, 350);
        });
        el.addEventListener('mouseenter', () => setHoveredHotelId(safeId));
        el.addEventListener('mouseleave', () => setHoveredHotelId(null));

        const marker = new mapboxgl.Marker(el)
            .setLngLat([lng, lat])
            .addTo(mapRef.current!);
        markersRef.current[safeId] = marker;
    }

    useEffect(() => {
        if (!mapRef.current) return;

        // Force a tiny delay to ensure container is ready
        const timer = setTimeout(() => {
            if (!mapRef.current) return;
            mapRef.current.resize();

            // Normalize sidebar selection comparison by ensuring both have solvex_ prefix if needed
            const currentSelectedId = selectedHotel ? (String(selectedHotel.id).startsWith('solvex_') ? selectedHotel.id : `solvex_${selectedHotel.id}`) : null;

            // Update existing markers style
            results.forEach(hotel => {
                const hId = String(hotel.id).startsWith('solvex_') ? hotel.id : `solvex_${hotel.id}`;
                if (markersRef.current[hId]) {
                    const el = markersRef.current[hId].getElement();
                    const isSelected = currentSelectedId === hId;
                    
                    el.className = `marker-bubble ${hotel.isPrime ? 'is-prime' : ''} ${hoveredHotelId === hId ? 'is-hovered' : ''} ${isSelected ? 'is-selected-marker' : ''}`;
                }
            });

            // Add new markers
            results.forEach(async hotel => {
                const hId = String(hotel.id).startsWith('solvex_') ? hotel.id : `solvex_${hotel.id}`;
                if (markersRef.current[hId]) return;

                if (hotel.location.lat && hotel.location.lng && !isNaN(hotel.location.lat) && !isNaN(hotel.location.lng)) {
                    addMarker(hotel, hotel.location.lng, hotel.location.lat);
                } else {
                    const coords = await geocodeHotel(hotel);
                    if (coords && mapRef.current) {
                        addMarker(hotel, coords[0], coords[1]);
                    }
                }
            });
        }, 50);

        return () => clearTimeout(timer);
    }, [results, hoveredHotelId, selectedHotel]);

    const toggleFavorite = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setFavorites(prev => 
            prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
        );
    };

    const handleHotelSelect = (hotel: HotelSearchResult) => {
        const hId = String(hotel.id).startsWith('solvex_') ? hotel.id : `solvex_${hotel.id}`;
        setSelectedHotel(hotel);
        setHoveredHotelId(hId);
        setShow360(false);
        
        let coords: [number, number] | null = null;
        if (hotel.location.lng && hotel.location.lat) {
            coords = [hotel.location.lng, hotel.location.lat];
        } else if (markersRef.current[hId]) {
            const ll = markersRef.current[hId].getLngLat();
            coords = [ll.lng, ll.lat];
        }

        if (coords && mapRef.current) {
            mapRef.current.flyTo({ 
                center: coords, 
                zoom: 15, 
                essential: true,
                duration: 1000
            });
            
            // Wait for map to stabilize then show popup
            setTimeout(() => {
                if (!mapRef.current || !mapContainerRef.current || !coords) return;
                const point = mapRef.current.project(coords);
                const container = mapContainerRef.current;
                
                const cardW = 320;
                const cardH = 420;
                const margin = 18;
                let x = point.x - cardW / 2;
                let y = point.y - cardH - 8;
                
                if (x < margin) x = margin;
                if (x + cardW > container.clientWidth - margin) x = container.clientWidth - cardW - margin;
                if (y < margin) y = point.y + 30;
                
                setPopupPos({ x, y });
            }, 500);
        }
    };

    return (
        <div className={`prime-map-wrapper ${selectedHotel ? 'has-selection' : ''}`}>
            <style>{`
                .prime-map-wrapper.has-selection .marker-bubble:not(.is-selected-marker) {
                    opacity: 0 !important;
                    visibility: hidden !important;
                    pointer-events: none !important;
                    transition: opacity 0.3s ease;
                }
            `}</style>

            {/* LEFT RESULTS SIDEBAR */}
            <div className="map-results-sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-search-info">
                        <Navigation size={15} />
                        <span>Prikazano <strong>{results.length}</strong> hotela</span>
                    </div>
                    
                    {/* QUICK FILTER TAGS */}
                    <div className="sidebar-filters">
                        <button 
                            className={`filter-chip ${activeFilter === 'price' ? 'active' : ''}`}
                            onClick={() => setActiveFilter(activeFilter === 'price' ? null : 'price')}
                        >
                            Najniža cena
                        </button>
                        <button 
                            className={`filter-chip ${activeFilter === 'avail' ? 'active' : ''}`}
                            onClick={() => setActiveFilter(activeFilter === 'avail' ? null : 'avail')}
                        >
                            Raspoloživo
                        </button>
                        <button 
                            className={`filter-chip ${activeFilter === 'free-cancel' ? 'active' : ''}`}
                            onClick={() => setActiveFilter(activeFilter === 'free-cancel' ? null : 'free-cancel')}
                        >
                            Besplatno otkazivanje
                        </button>
                    </div>
                </div>

                <div className="sidebar-content">
                    {(() => {
                        let filtered = [...results];
                        if (activeFilter === 'price') filtered.sort((a, b) => a.lowestTotalPrice - b.lowestTotalPrice);
                        if (activeFilter === 'avail') filtered = filtered.filter(h => h.status === 'instant');
                        if (activeFilter === 'free-cancel') filtered = filtered.filter(h => h.isPrime);

                        return filtered.map((hotel) => (
                            <motion.div 
                                key={hotel.id}
                                className={`sidebar-hotel-card ${selectedHotel?.id === hotel.id ? 'active' : ''}`}
                                whileHover={{ x: 6 }}
                                onClick={() => handleHotelSelect(hotel)}
                            >
                                <div className="card-thumb">
                                    <img src={hotel.images[0]} alt={hotel.name} />
                                    {hotel.isPrime && <div className="prime-mini-tag">AI CHOICE</div>}
                                </div>
                                <div className="card-info">
                                    <div className="card-top">
                                        <h3>{hotel.name}</h3>
                                        <div className="card-stars">
                                            <Star size={11} fill="#fbbf24" color="#fbbf24" />
                                            <span>{hotel.stars}</span>
                                        </div>
                                    </div>
                                    <div className="card-city">{hotel.location.city}</div>
                                    <div className="card-price-row">
                                        <div className="card-price">
                                            <span className="cur">{hotel.currency}</span>
                                            <span className="amt">{Math.round(hotel.lowestTotalPrice)}</span>
                                        </div>
                                        <button className="card-btn">
                                            <ArrowRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ));
                    })()}
                    {results.length === 0 && (
                        <div className="sidebar-empty">
                            Nema rezultata za ovu zonu
                        </div>
                    )}
                </div>
            </div>

            {/* MAP CANVAS */}
            <div ref={mapContainerRef} className="prime-map-canvas" />

            {/* LOADING OVERLAY */}
            <AnimatePresence>
                {isMapLoading && !mapError && (
                    <motion.div 
                        className="map-loading-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="cube-loader">
                            <div className="cube"><div></div><div></div><div></div><div></div></div>
                        </div>
                        <p>Inicijalizacija mape...</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ERROR OVERLAY */}
            <AnimatePresence>
                {mapError && (
                    <motion.div 
                        className="map-error-overlay"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <X size={48} color="#ef4444" />
                        <h3>Ups! Nešto nije u redu</h3>
                        <p>{mapError}</p>
                        <button onClick={() => window.location.reload()} className="error-reload-btn">
                            Re-inicijalizuj Sistem
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* FLOATING TOP CONTROLS (Right side since Sidebar is on left) */}
            <div className="map-top-bar" style={{ display: isMapLoading || mapError ? 'none' : 'flex', left: 'auto', right: '80px' }}>
                {favorites.length > 0 && (
                    <div className="map-basket-pill">
                        <ShoppingBasket size={16} />
                        <span>Korpa: {favorites.length} hotela</span>
                    </div>
                )}
                
                {/* Layer switcher */}
                <div className="map-layer-switcher">
                    {(['streets', 'satellite', 'dark'] as const).map(style => (
                        <button
                            key={style}
                            className={`layer-btn ${mapStyle === style ? 'active' : ''}`}
                            onClick={() => {
                                setMapStyle(style);
                                if (mapRef.current) {
                                    const styleUrl = style === 'streets'
                                        ? 'mapbox://styles/mapbox/light-v11'
                                        : style === 'satellite'
                                        ? 'mapbox://styles/mapbox/satellite-streets-v12'
                                        : 'mapbox://styles/mapbox/dark-v11';
                                    mapRef.current.setStyle(styleUrl);
                                }
                            }}
                            title={style === 'streets' ? 'Ulice' : style === 'satellite' ? 'Satelit' : 'Tamni'}
                        >
                            {style === 'streets' ? <Globe size={14} /> : style === 'satellite' ? <Layers size={14} /> : <Moon size={14} />}
                        </button>
                    ))}
                </div>

                {/* Milica FAB */}
                <motion.button
                    className="milica-map-fab"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => setMilicaOpen(o => !o)}
                    title="Pitajte Milicu"
                >
                    <div className="milica-avatar-ring">
                        <img 
                            src="/avatars/milica.png" 
                            alt="Milica"
                            onError={e => { (e.target as HTMLImageElement).style.display='none'; (e.target as HTMLImageElement).parentElement!.innerHTML = '🤖'; }}
                            style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                    </div>
                    <div className="milica-online-dot" />
                    <span className="milica-fab-label">Pitaj Milicu</span>
                </motion.button>
            </div>

            {/* Search this area pill (shows when map is panned) */}
            <AnimatePresence>
                {mapMoved && !isMapLoading && (
                    <motion.button
                        className="search-this-area-pill"
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        onClick={() => {
                            setMapMoved(false);
                            // Get current map center and trigger new search
                            if (mapRef.current) {
                                const center = mapRef.current.getCenter();
                                const query = `hoteli blizu ${center.lat.toFixed(3)},${center.lng.toFixed(3)}`;
                                try { useAppStore.getState().setMilicaChatOpen(true); } catch(_){}
                            }
                        }}
                    >
                        <Navigation size={14} />
                        Pretraži ovu zonu
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Milica Chat Panel */}
            <AnimatePresence>
                {milicaOpen && (
                    <motion.div
                        ref={panelRef}
                        className="milica-map-panel"
                        initial={{ x: 340, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 340, opacity: 0 }}
                        style={{ 
                            width: milicaGeom.width, 
                            height: milicaGeom.height,
                            position: 'absolute',
                            zIndex: 100 
                        }}
                        drag
                        dragControls={dragControls}
                        dragListener={false}
                        dragMomentum={false}
                    >
                        {/* 8-Directional Resizers */}
                        <div className="resizer-h n" onMouseDown={e => startResize(e, 'n')} />
                        <div className="resizer-h s" onMouseDown={e => startResize(e, 's')} />
                        <div className="resizer-v e" onMouseDown={e => startResize(e, 'e')} />
                        <div className="resizer-v w" onMouseDown={e => startResize(e, 'w')} />
                        <div className="resizer-c nw" onMouseDown={e => startResize(e, 'nw')} />
                        <div className="resizer-c ne" onMouseDown={e => startResize(e, 'ne')} />
                        <div className="resizer-c sw" onMouseDown={e => startResize(e, 'sw')} />
                        <div className="resizer-c se" onMouseDown={e => startResize(e, 'se')} />

                        {/* Panel header (Drag Handle) */}
                        <div 
                            className="milica-panel-header" 
                            style={{ cursor: 'move', userSelect: 'none' }}
                            onPointerDown={e => dragControls.start(e)}
                        >
                            <div className="milica-panel-avatar">
                                <img 
                                    src="/avatars/milica.png" 
                                    alt="Milica"
                                    onError={e => { (e.target as HTMLImageElement).style.display='none'; }}
                                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                                />
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: '15px', color: 'white' }}>Milica</div>
                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>● Online · AI Asistentkinja</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <div style={{ opacity: 0.3 }}><GripHorizontal size={16} /></div>
                                <button className="milica-panel-close" onClick={() => setMilicaOpen(false)}><X size={18} /></button>
                            </div>
                        </div>

                        {/* Milica greeting */}
                        <div className="milica-greeting-bubble">
                            👋 Zdravo! Mogu da vam pomognem da pronađete savršen hotel.
                            Pitajte me bilo šta ili odaberite predlog:
                        </div>

                        {/* Quick suggestions */}
                        <div className="milica-suggestions">
                            {[
                                '🏖️ 5* hoteli na Sunčevom Bregu',
                                '🌊 All Inclusive Krit za 2 odrasle',
                                '🏔️ Obrovac sa doručkom',
                                '💼 Hoteli u Beogradu',
                            ].map(suggestion => (
                                <motion.button
                                    key={suggestion}
                                    className="milica-suggestion-chip"
                                    whileHover={{ x: 4 }}
                                    onClick={() => {
                                        try {
                                            useAppStore.getState().setMilicaChatOpen(true);
                                        } catch(_){}
                                        setMilicaOpen(false);
                                    }}
                                >
                                    {suggestion}
                                </motion.button>
                            ))}
                        </div>

                        {/* Free text input */}
                        <div className="milica-input-row">
                            <input
                                type="text"
                                className="milica-input"
                                placeholder="Pitaj me za hotel..."
                                value={milicaQuery}
                                onChange={e => setMilicaQuery(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && milicaQuery.trim()) {
                                        try { useAppStore.getState().setMilicaChatOpen(true); } catch(_){}
                                        setMilicaOpen(false);
                                        setMilicaQuery('');
                                    }
                                }}
                            />
                            <motion.button
                                min-width="42px"
                                className="milica-send-btn"
                                whileTap={{ scale: 0.9 }}
                                onClick={() => {
                                    if (milicaQuery.trim()) {
                                        try { useAppStore.getState().setMilicaChatOpen(true); } catch(_){}
                                        setMilicaOpen(false);
                                        setMilicaQuery('');
                                    }
                                }}
                            >
                                <Send size={16} />
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>


            {/* EMPTY STATE OVERLAY */}
            {!isMapLoading && !mapError && results.length === 0 && (
                <div className="map-empty-state">
                    <div className="empty-icon-pulse">
                        <MapPin size={40} />
                    </div>
                    <h3>Nismo pronašli hotele u ovoj zoni</h3>
                    <p>Promenite filtere ili pomerite mapu za nove rezultate.</p>
                </div>
            )}

            {/* FLOATING MINI BASKET (FAVORITES) */}
            <AnimatePresence>
                {favorites.length > 0 && (
                    <motion.div 
                        className="floating-mini-basket"
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                    >
                        <div className="basket-icon-wrapper">
                            <Heart size={20} fill="#f43f5e" color="#f43f5e" />
                            <span className="basket-badge">{favorites.length}</span>
                        </div>
                        <div className="basket-content">
                            <span className="basket-title">Uporedi hotele</span>
                            <span className="basket-subtitle">Spremni za analizu</span>
                        </div>
                        <button className="basket-btn">
                            <ArrowRight size={16} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* HOTEL PREVIEW CARD - positioned near the clicked marker */}
            <AnimatePresence>
                {selectedHotel && popupPos && (
                    <motion.div 
                        className="hotel-map-preview-card"
                        style={{ left: popupPos.x, top: popupPos.y, bottom: 'auto' }}
                        initial={{ scale: 0.85, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.85, opacity: 0, y: 10 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                    >
                        <button className="preview-close" onClick={() => { setSelectedHotel(null); setPopupPos(null); }}>
                            <X size={20} />
                        </button>
                        
                        <div className="preview-image-section">
                            <AnimatePresence mode="wait">
                                {show360 ? (
                                    (() => {
                                        const lat = (selectedHotel as any).latitude || selectedHotel.location?.lat || (geocodeCache.current[selectedHotel.id] && geocodeCache.current[selectedHotel.id][1]) || 42.6951;
                                        const lng = (selectedHotel as any).longitude || selectedHotel.location?.lng || (geocodeCache.current[selectedHotel.id] && geocodeCache.current[selectedHotel.id][0]) || 27.7126;
                                        
                                        return (
                                            <motion.iframe
                                                key="360"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                style={{ width: '100%', height: '100%', border: 0, position: 'absolute', top: 0, left: 0 }}
                                                loading="lazy"
                                                src={`https://maps.google.com/maps?q=${lat},${lng}&layer=c&cbll=${lat},${lng}&cbp=11,0,0,0,0&output=svembed`} 
                                                allowFullScreen 
                                            />
                                        );
                                    })()
                                ) : (
                                    <motion.img 
                                        key="img"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        src={selectedHotel.images[0]} 
                                        alt={selectedHotel.name} 
                                    />
                                )}
                            </AnimatePresence>

                            {selectedHotel.isPrime && !show360 && <div className="prime-badge">PRIME CHOICE</div>}
                            
                            <button 
                                className="preview-360-btn"
                                onClick={(e) => { e.stopPropagation(); setShow360(!show360); }}
                                title="360° Pogled ulice"
                            >
                                {show360 ? <X size={16} /> : '👁️ 360°'}
                            </button>

                            {!show360 && (
                                <button 
                                    className={`preview-fav ${favorites.includes(selectedHotel.id) ? 'active' : ''}`}
                                    onClick={(e) => toggleFavorite(selectedHotel.id, e)}
                                >
                                    <Heart size={18} fill={favorites.includes(selectedHotel.id) ? '#f43f5e' : 'transparent'} />
                                </button>
                            )}
                        </div>

                        <div className="preview-details">
                            <div className="preview-header">
                                <h3>{selectedHotel.name}</h3>
                                <div className="preview-rating">
                                    <Star size={14} fill="#fbbf24" color="#fbbf24" />
                                    <span>{selectedHotel.rating || selectedHotel.stars}</span>
                                </div>
                            </div>
                            
                            <p className="preview-city"><MapPin size={12} /> {selectedHotel.location.city}, {selectedHotel.location.country}</p>

                            <div className="smart-route-row">
                                <div className="route-item">
                                    <span className="route-icon">🚶‍♂️</span>
                                    <span>{(selectedHotel.name.length % 8) + 2} min do plaže</span>
                                </div>
                                <div className="route-item">
                                    <span className="route-icon">✈️</span>
                                    <span>{(selectedHotel.name.length % 20) + 15} min (aerodrom)</span>
                                </div>
                            </div>

                            <div className="preview-amenities">
                                {selectedHotel.amenities?.slice(0, 3).map((a, i) => (
                                    <span key={i} className="amenity-tag">{a}</span>
                                ))}
                                {selectedHotel.isPrime && <span className="amenity-tag" style={{ background: 'rgba(251,191,36,0.15)', color: '#b45309' }}>✨ Top Rated</span>}
                            </div>

                            <div className="preview-price-row">
                                <div className="price-box">
                                    <span className="price-label">Ukupno od</span>
                                    <div className="price-value">
                                        <span className="price-currency">{selectedHotel.currency}</span>
                                        <span className="price-amount">{Math.round(selectedHotel.lowestTotalPrice)}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <span className="price-meal">{selectedHotel.lowestMealPlanLabel}</span>
                                        {selectedHotel.isPrime && <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 700 }}>· Best Value</span>}
                                    </div>
                                </div>
                                <button 
                                    className="preview-cta" 
                                    onClick={() => {
                                        // 1. Get current search state or set defaults
                                        const { checkIn, checkOut, roomAllocations, nationality } = useSearchStore.getState();
                                        
                                        // 2. Default Dates Fallback (Crucial for AI/Map direct entry)
                                        let finalCheckIn = checkIn;
                                        let finalCheckOut = checkOut;
                                        
                                        if (!finalCheckIn || finalCheckIn === '') {
                                            const nextSat = new Date();
                                            nextSat.setDate(nextSat.getDate() + ((7 - nextSat.getDay()) % 7 || 7)); // Next Saturday
                                            finalCheckIn = nextSat.toISOString().split('T')[0];
                                            
                                            const nextSatPlus7 = new Date(nextSat);
                                            nextSatPlus7.setDate(nextSatPlus7.getDate() + 7);
                                            finalCheckOut = nextSatPlus7.toISOString().split('T')[0];
                                        }

                                        // 3. Format Rooms Param (e.g. "2-0;2-1-5")
                                        const roomsParam = roomAllocations.map(r => 
                                            `${r.adults}-${r.children}${r.childrenAges.length > 0 ? '-' + r.childrenAges.join('-') : ''}`
                                        ).join(';');

                                        // 4. Construct URL with parameters
                                        const queryParams = new URLSearchParams({
                                            checkIn: finalCheckIn,
                                            checkOut: finalCheckOut,
                                            rooms: roomsParam,
                                            nat: nationality || 'RS',
                                            hName: selectedHotel.name,
                                            hCity: selectedHotel.location.city
                                        });

                                        // Ensure ID is prefixed with solvex_ for details page to work
                                        const solvexId = String(selectedHotel.id).startsWith('solvex_') 
                                            ? selectedHotel.id 
                                            : `solvex_${selectedHotel.id}`;

                                        const detailUrl = `/prime-smart-search/hotel/${solvexId}?${queryParams.toString()}`;
                                        window.open(detailUrl, '_blank');
                                    }}
                                >
                                    VIDI PONUDU
                                    <ArrowRight size={16} />
                                </button>
                            </div>

                            {selectedHotel.isPrime && (
                                <div className="ai-insight-box new-luka-badge">
                                    <div className="luka-icon"><TrendingDown size={14} color="white" /></div>
                                    <span>Luka Insight: <strong>📉 {selectedHotel.rating ? Math.floor(selectedHotel.rating * 1.5) : 15}% ispod proseka</strong> ove lokacije!</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .prime-map-wrapper {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 4px 30px rgba(0,0,0,0.1);
                }
                .map-results-sidebar {
                    position: absolute;
                    top: 20px;
                    left: 20px;
                    bottom: 20px;
                    width: 360px;
                    background: transparent;
                    pointer-events: none; /* Let clicks pass through gaps */
                    display: flex;
                    flex-direction: column;
                    z-index: 20;
                }
                .sidebar-header {
                    padding: 16px;
                    background: rgba(var(--v6-bg-card-rgb, 255, 255, 255), 0.9);
                    backdrop-filter: blur(12px);
                    border-radius: 20px;
                    margin-bottom: 20px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.1);
                    border: 1px solid rgba(255,255,255,0.4);
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    pointer-events: auto;
                }
                .sidebar-filters {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                .filter-chip {
                    padding: 6px 12px;
                    background: #f3f4f6;
                    border: 1px solid #e5e7eb;
                    border-radius: 100px;
                    font-size: 11px;
                    font-weight: 600;
                    color: #4b5563;
                    cursor: pointer;
                    transition: all 0.2s;
                    white-space: nowrap;
                }
                .filter-chip:hover {
                    background: #e5e7eb;
                    border-color: #d1d5db;
                }
                .filter-chip.active {
                    background: #6366f1;
                    color: white;
                    border-color: #6366f1;
                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
                }
                .sidebar-search-info {
                    background: rgba(99, 102, 241, 0.08);
                    color: #4338ca;
                    padding: 10px 18px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 14px;
                    font-weight: 500;
                }
                .sidebar-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 4px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px; /* Spacing between floating cards */
                    scrollbar-width: none;
                }
                .sidebar-content::-webkit-scrollbar { display: none; }
                
                .sidebar-hotel-card {
                    pointer-events: auto;
                    display: flex;
                    gap: 14px;
                    padding: 12px;
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(8px);
                    border-radius: 20px;
                    border: 1px solid rgba(255,255,255,0.6);
                    box-shadow: 0 6px 20px rgba(0,0,0,0.12);
                    cursor: pointer;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .sidebar-hotel-card:hover {
                    box-shadow: 0 8px 20px rgba(0,0,0,0.08);
                    background: #fdfdff;
                    border-color: rgba(99,102,241,0.2);
                }
                .sidebar-hotel-card.active {
                    background: #f5f3ff;
                    border-color: #6366f1;
                    box-shadow: 0 10px 25px rgba(99,102,241,0.15);
                }
                .card-thumb {
                    width: 100px;
                    height: 100px;
                    border-radius: 12px;
                    overflow: hidden;
                    flex-shrink: 0;
                    position: relative;
                }
                .card-thumb img { width: 100%; height: 100%; object-fit: cover; }
                .prime-mini-tag {
                    position: absolute;
                    top: 6px;
                    left: 6px;
                    background: #fbbf24;
                    color: #92400e;
                    font-size: 8px;
                    font-weight: 900;
                    padding: 2px 5px;
                    border-radius: 4px;
                    letter-spacing: 0.05em;
                }
                .card-info {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }
                .card-top h3 {
                    margin: 0;
                    font-size: 15px;
                    color: #1f2937;
                    line-height: 1.2;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    font-weight: 800;
                }
                .card-stars { display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; color: #fbbf24; margin-top: 2px; }
                .card-city { font-size: 12px; color: #6b7280; font-weight: 500; }
                .card-price-row { display: flex; justify-content: space-between; align-items: center; }
                .card-price { display: flex; align-items: baseline; gap: 2px; }
                .card-price .cur { font-size: 10px; font-weight: 700; color: #6366f1; }
                .card-price .amt { font-size: 18px; font-weight: 900; color: #1e1b4b; }
                .card-btn {
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    border: none;
                    background: #6366f1;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                }

                .prime-map-canvas {
                    flex: 1; /* Take rest of space */
                    height: 100%;
                }

                /* LOADING & ERROR OVERLAYS */
                .map-loading-overlay, .map-error-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(var(--v6-bg-card-rgb, 255, 255, 255), 0.9);
                    backdrop-filter: blur(10px);
                    z-index: 100;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 20px;
                    color: var(--v6-text-secondary, #4b5563);
                }
                .map-error-overlay h3 { margin: 0; color: #ef4444; }
                .error-reload-btn {
                    padding: 10px 24px;
                    background: #6366f1;
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-weight: 700;
                    cursor: pointer;
                }

                .cube-loader { width: 44px; height: 44px; position: relative; }
                .cube { width: 100%; height: 100%; position: absolute; transform-style: preserve-3d; animation: cube-spin 2s infinite linear; }
                .cube div { position: absolute; width:100%; height:100%; background: #6366f1; opacity: 0.8; border: 1px solid white; }
                @keyframes cube-spin { from { transform: rotateX(0) rotateY(0); } to { transform: rotateX(360deg) rotateY(360deg); } }

                /* EMPTY STATE */
                .map-empty-state {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    text-align: center;
                    background: rgba(255, 255, 255, 0.85);
                    backdrop-filter: blur(8px);
                    padding: 40px;
                    border-radius: 30px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.1);
                    width: 320px;
                    z-index: 5;
                    border: 1px solid rgba(0,0,0,0.05);
                }
                .map-empty-state h3 { margin: 0 0 10px 0; color: #1f2937; }
                .map-empty-state p { margin: 0; font-size: 13px; color: #6b7280; }
                .empty-icon-pulse {
                    width: 80px;
                    height: 80px;
                    background: rgba(99, 102, 241, 0.1);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 20px;
                    color: #6366f1;
                    animation: soft-pulse 2s infinite ease-in-out;
                }
                @keyframes soft-pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.1); opacity: 0.7; }
                    100% { transform: scale(1); opacity: 1; }
                }

                /* TOP BAR */
                .map-top-bar {
                    position: absolute;
                    top: 20px;
                    left: 20px;
                    right: 20px;
                    display: flex;
                    justify-content: space-between;
                    pointer-events: none;
                    z-index: 10;
                }
                .map-search-info, .map-basket-pill {
                    pointer-events: auto;
                    background: rgba(var(--v6-bg-card-rgb, 255, 255, 255), 0.95);
                    backdrop-filter: blur(8px);
                    padding: 8px 16px;
                    border-radius: 100px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                    border: 1px solid rgba(0,0,0,0.05);
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 13px;
                    color: var(--v6-text-muted, #4b5563);
                }
                .map-basket-pill {
                    background: var(--v6-accent, #6366f1);
                    color: white;
                    font-weight: 700;
                    box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);
                }

                /* LAYER SWITCHER */
                .map-layer-switcher {
                    pointer-events: auto;
                    display: flex;
                    gap: 4px;
                    background: rgba(255,255,255,0.92);
                    backdrop-filter: blur(10px);
                    border-radius: 100px;
                    padding: 4px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                    border: 1px solid rgba(0,0,0,0.06);
                }
                .layer-btn {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    border: none;
                    background: transparent;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #6b7280;
                    transition: all 0.18s;
                }
                .layer-btn:hover { background: rgba(99,102,241,0.1); color: #6366f1; }
                .layer-btn.active { background: #6366f1; color: white; }

                /* MILICA FAB BUTTON */
                .milica-map-fab {
                    pointer-events: auto;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: linear-gradient(135deg, #8B5CF6, #6D28D9);
                    border: 2px solid rgba(255,255,255,0.25);
                    border-radius: 100px;
                    padding: 5px 14px 5px 5px;
                    color: white;
                    cursor: pointer;
                    box-shadow: 0 8px 24px rgba(109,40,217,0.5);
                    position: relative;
                }
                .milica-avatar-ring {
                    width: 34px;
                    height: 34px;
                    border-radius: 50%;
                    border: 2px solid rgba(255,255,255,0.5);
                    overflow: hidden;
                    background: rgba(255,255,255,0.15);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                    flex-shrink: 0;
                }
                .milica-online-dot {
                    position: absolute;
                    top: 4px;
                    left: 36px;
                    width: 9px;
                    height: 9px;
                    background: #22c55e;
                    border: 2px solid white;
                    border-radius: 50%;
                    animation: blink-online 2.5s infinite;
                }
                @keyframes blink-online {
                    0%, 100% { opacity: 1; } 50% { opacity: 0.4; }
                }
                .milica-fab-label {
                    font-size: 13px;
                    font-weight: 700;
                    letter-spacing: 0.01em;
                }

                /* SEARCH THIS AREA PILL */
                .search-this-area-pill {
                    position: absolute;
                    top: 76px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 10;
                    display: flex;
                    align-items: center;
                    gap: 7px;
                    padding: 9px 20px;
                    background: #1e1b4b;
                    color: white;
                    border: 1px solid rgba(99,102,241,0.5);
                    border-radius: 100px;
                    font-size: 13px;
                    font-weight: 700;
                    cursor: pointer;
                    box-shadow: 0 8px 28px rgba(30,27,75,0.45);
                    pointer-events: auto;
                    backdrop-filter: blur(8px);
                }
                .search-this-area-pill:hover {
                    background: #6366f1;
                }

                /* MILICA CHAT PANEL */
                .milica-map-panel {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    background: rgba(15, 10, 30, 0.96);
                    backdrop-filter: blur(20px);
                    z-index: 30;
                    display: flex;
                    flex-direction: column;
                    border: 1px solid rgba(139,92,246,0.3);
                    border-radius: 16px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                    /* Remove overflow hidden to allow resizers to show a bit more cleanly */
                }
                
                /* 8-Direction Resizers */
                .resizer-h, .resizer-v, .resizer-c { position: absolute; z-index: 10; }
                .resizer-h { height: 6px; left: 10px; right: 10px; cursor: ns-resize; }
                .resizer-h.n { top: -3px; }
                .resizer-h.s { bottom: -3px; }
                .resizer-v { width: 6px; top: 10px; bottom: 10px; cursor: ew-resize; }
                .resizer-v.e { right: -3px; }
                .resizer-v.w { left: -3px; }
                .resizer-c { width: 12px; height: 12px; cursor: nwse-resize; z-index: 11; }
                .resizer-c.nw { top: -3px; left: -3px; cursor: nwse-resize; }
                .resizer-c.ne { top: -3px; right: -3px; cursor: nesw-resize; }
                .resizer-c.sw { bottom: -3px; left: -3px; cursor: nesw-resize; }
                .resizer-c.se { bottom: -3px; right: -3px; cursor: nwse-resize; }

                .milica-panel-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 20px 16px 16px;
                    background: linear-gradient(135deg, #4c1d95, #2d1b69);
                    border-bottom: 1px solid rgba(139,92,246,0.3);
                }
                .milica-panel-avatar { display: flex; align-items: center; gap: 12px; }
                .milica-panel-close {
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 50%;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: white;
                    transition: background 0.2s;
                }
                .milica-panel-close:hover { background: rgba(239,68,68,0.5); }

                .milica-greeting-bubble {
                    margin: 16px;
                    padding: 13px 15px;
                    background: rgba(139,92,246,0.15);
                    border: 1px solid rgba(139,92,246,0.3);
                    border-radius: 14px 14px 14px 4px;
                    font-size: 13px;
                    color: rgba(255,255,255,0.87);
                    line-height: 1.5;
                }

                .milica-suggestions {
                    padding: 0 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    flex: 1;
                    overflow-y: auto;
                }
                .milica-suggestion-chip {
                    text-align: left;
                    background: rgba(255,255,255,0.06);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 12px;
                    padding: 11px 14px;
                    color: rgba(255,255,255,0.87);
                    font-size: 13px;
                    cursor: pointer;
                    transition: all 0.18s;
                }
                .milica-suggestion-chip:hover {
                    background: rgba(139,92,246,0.25);
                    border-color: rgba(139,92,246,0.5);
                    color: white;
                }

                .milica-input-row {
                    display: flex;
                    gap: 8px;
                    padding: 16px;
                    border-top: 1px solid rgba(255,255,255,0.08);
                }
                .milica-input {
                    flex: 1;
                    background: rgba(255,255,255,0.08);
                    border: 1px solid rgba(139,92,246,0.35);
                    border-radius: 12px;
                    padding: 10px 14px;
                    color: white;
                    font-size: 13px;
                    outline: none;
                    transition: border-color 0.2s;
                }
                .milica-input::placeholder { color: rgba(255,255,255,0.35); }
                .milica-input:focus { border-color: #8B5CF6; }
                .milica-send-btn {
                    width: 42px;
                    height: 42px;
                    flex-shrink: 0;
                    background: linear-gradient(135deg, #8B5CF6, #6D28D9);
                    border: none;
                    border-radius: 12px;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 4px 14px rgba(109,40,217,0.4);
                }

                /* ── MARKER STYLES ─────────────────────────────── */
                .marker-bubble {
                    cursor: pointer;
                    position: relative;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: fit-content;
                    transition: transform 0.18s cubic-bezier(0.4, 0, 0.2, 1), z-index 0s;
                    z-index: 1;
                }
                .marker-bubble:hover {
                    transform: scale(1.12);
                    z-index: 100;
                }
                .marker-bubble.is-hovered {
                    transform: scale(1.15);
                    z-index: 100;
                }
                .marker-bubble.is-hidden {
                    opacity: 0 !important;
                    visibility: hidden !important;
                    pointer-events: none !important;
                    transform: scale(0.8) !important;
                }
                .bubble-content {
                    display: inline-flex;
                    align-items: center;
                    gap: 2px;
                    padding: 5px 11px;
                    border-radius: 20px;
                    background: white;
                    box-shadow: 0 3px 14px rgba(0,0,0,0.22), 0 1px 4px rgba(0,0,0,0.12);
                    border: 2px solid #6366f1;
                    font-family: 'Inter', 'Outfit', sans-serif;
                    font-weight: 800;
                    color: #1e1b4b;
                    white-space: nowrap;
                    position: relative;
                    z-index: 2;
                    /* Arrow pointer down */
                }
                .bubble-content::after {
                    content: '';
                    position: absolute;
                    bottom: -7px;
                    left: 50%;
                    transform: translateX(-50%);
                    border-left: 6px solid transparent;
                    border-right: 6px solid transparent;
                    border-top: 7px solid #6366f1;
                }
                .bubble-currency {
                    font-size: 9px;
                    color: #6366f1;
                    font-weight: 700;
                    letter-spacing: 0.05em;
                    margin-top: 1px;
                }
                .bubble-price {
                    font-size: 13px;
                    line-height: 1;
                }
                .marker-bubble:hover .bubble-content,
                .marker-bubble.is-hovered .bubble-content {
                    background: #6366f1;
                    color: white;
                    border-color: #4f46e5;
                    box-shadow: 0 6px 20px rgba(99,102,241,0.45);
                }
                .marker-bubble:hover .bubble-content::after,
                .marker-bubble.is-hovered .bubble-content::after {
                    border-top-color: #4f46e5;
                }
                .marker-bubble:hover .bubble-currency,
                .marker-bubble.is-hovered .bubble-currency {
                    color: rgba(255,255,255,0.85);
                }

                /* PRIME / AI marker */
                .marker-bubble.is-prime .bubble-content {
                    border-color: #f59e0b;
                    background: linear-gradient(135deg, #fffbeb, #fff);
                    color: #92400e;
                }
                .marker-bubble.is-prime .bubble-content::after {
                    border-top-color: #f59e0b;
                }
                .marker-bubble.is-prime .bubble-currency { color: #d97706; }

                /* AI GLOW pulse */
                .ai-glow {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 46px;
                    height: 46px;
                    background: radial-gradient(circle, rgba(251,191,36,0.45) 0%, rgba(251,191,36,0) 70%);
                    border-radius: 50%;
                    animation: prime-pulse 2s infinite ease-out;
                    z-index: 0;
                    pointer-events: none;
                }
                @keyframes prime-pulse {
                    0% { transform: translate(-50%, -50%) scale(0.7); opacity: 0.9; }
                    100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
                }


                /* PREVIEW CARD */
                .hotel-map-preview-card {
                    position: absolute;
                    width: 320px;
                    background: var(--v6-bg-card, white);
                    border-radius: 20px;
                    box-shadow: 0 16px 50px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.15);
                    overflow: hidden;
                    z-index: 20;
                    border: 1px solid rgba(255,255,255,0.5);
                    /* No fixed bottom/left — set dynamically via inline style */
                }
                .preview-close {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    z-index: 5;
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    background: rgba(0,0,0,0.3);
                    backdrop-filter: blur(4px);
                    border: none;
                    color: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .preview-image-section {
                    position: relative;
                    height: 160px;
                }
                .preview-image-section img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .prime-badge {
                    position: absolute;
                    top: 10px;
                    left: 10px;
                    background: #fbbf24;
                    color: #000;
                    font-size: 10px;
                    font-weight: 800;
                    padding: 4px 8px;
                    border-radius: 6px;
                }
                .preview-fav {
                    position: absolute;
                    bottom: 10px;
                    right: 10px;
                    background: rgba(255,255,255,0.9);
                    border: none;
                    width: 34px;
                    height: 34px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                }
                .preview-fav.active { color: #f43f5e; }

                .preview-details { padding: 15px; }
                .preview-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 4px; }
                .preview-header h3 { margin: 0; fontSize: 16px; font-weight: 700; color: var(--v6-text-primary, #111827); line-height: 1.2; }
                .preview-rating { display: flex; align-items: center; gap: 4px; font-weight: 700; font-size: 13px; }
                .preview-city { font-size: 12px; color: #6b7280; margin: 0 0 10px 0; display: flex; align-items: center; gap: 4px; }
                
                .preview-amenities { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 15px; }
                .amenity-tag { font-size: 10px; background: rgba(0,0,0,0.05); padding: 2px 8px; border-radius: 4px; color: #4b5563; }

                .preview-price-row { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 12px; border-top: 1px dashed rgba(0,0,0,0.1); }
                .price-label { font-size: 10px; color: #6b7280; display: block; }
                .price-value { display: flex; align-items: baseline; gap: 2px; color: var(--v6-accent, #6366f1); font-weight: 800; }
                .price-amount { font-size: 18px; }
                .price-currency { font-size: 12px; }
                .price-meal { font-size: 10px; color: #10b981; font-weight: 600; display: block; }

                .preview-cta {
                    background: var(--v6-accent, #6366f1);
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 12px;
                    font-weight: 700;
                    font-size: 12px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
                }

                .ai-insight-box {
                    margin-top: 12px;
                    background: rgba(16, 185, 129, 0.08);
                    border: 1px solid rgba(16, 185, 129, 0.2);
                    padding: 6px 10px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: #059669;
                    font-size: 11px;
                    font-weight: 600;
                }
                /* WOW FEATURES CSS */

                /* 1. Heatmap glow */
                .ai-glow {
                    position: absolute;
                    bottom: -30px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 250px;
                    height: 250px;
                    background: radial-gradient(circle, rgba(251,191,36,0.2) 0%, rgba(251,191,36,0) 65%);
                    border-radius: 50%;
                    pointer-events: none;
                    animation: prime-pulse-heatmap 3s infinite;
                    z-index: -1;
                }
                @keyframes prime-pulse-heatmap {
                    0% { transform: translateX(-50%) scale(0.8); opacity: 0.8; }
                    50% { transform: translateX(-50%) scale(1.2); opacity: 0.4; }
                    100% { transform: translateX(-50%) scale(0.8); opacity: 0.8; }
                }

                /* 2. Smart Route & Luka Badge */
                .smart-route-row {
                    display: flex;
                    gap: 12px;
                    margin-top: 4px;
                    margin-bottom: 8px;
                }
                .route-item {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 11px;
                    color: #4b5563;
                    background: #f3f4f6;
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-weight: 500;
                }
                .new-luka-badge {
                    background: linear-gradient(to right, rgba(16,185,129,0.1), rgba(16,185,129,0.02)) !important;
                    border: 1px solid rgba(16,185,129,0.3) !important;
                    color: #065f46 !important;
                    padding: 8px 12px !important;
                }
                .new-luka-badge .luka-icon {
                    background: #10b981;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                /* 3. Floating Basket */
                .floating-mini-basket {
                    position: absolute;
                    bottom: 30px;
                    right: 30px;
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(16px);
                    border: 1px solid rgba(255, 255, 255, 0.8);
                    box-shadow: 0 10px 40px rgba(0,0,0,0.15);
                    border-radius: 100px;
                    padding: 8px 8px 8px 20px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    z-index: 50;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                .floating-mini-basket:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 14px 45px rgba(0,0,0,0.2);
                }
                .basket-icon-wrapper { position: relative; display: flex; align-items: center; justify-content: center; }
                .basket-badge {
                    position: absolute; top: -8px; right: -12px;
                    background: #6366f1; color: white;
                    font-size: 10px; font-weight: 800;
                    width: 18px; height: 18px; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    border: 2px solid white;
                }
                .basket-content { display: flex; flex-direction: column; }
                .basket-title { font-size: 13px; font-weight: 800; color: #1f2937; line-height: 1.1; }
                .basket-subtitle { font-size: 11px; font-weight: 600; color: #6b7280; }
                .basket-btn {
                    width: 36px; height: 36px; border-radius: 50%;
                    background: #f43f5e; color: white; border: none;
                    display: flex; align-items: center; justify-content: center;
                    transition: background 0.2s;
                }
                .floating-mini-basket:hover .basket-btn { background: #e11d48; }

                /* 4. 360 View Button */
                .preview-360-btn {
                    position: absolute;
                    top: 12px;
                    left: 12px;
                    background: rgba(0,0,0,0.65);
                    backdrop-filter: blur(4px);
                    color: white;
                    border: 1px solid rgba(255,255,255,0.2);
                    padding: 6px 10px;
                    border-radius: 100px;
                    font-size: 11px;
                    font-weight: 700;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    transition: all 0.2s;
                    z-index: 5;
                }
                .preview-360-btn:hover { background: rgba(0,0,0,0.85); transform: scale(1.05); }

            `}</style>
        </div>
    );
};

export default PrimeMapSearch;
