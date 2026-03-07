import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    MapPin,
    Compass,
    ShoppingBag,
    Utensils,
    Landmark,
    Fuel,
    Snowflake,
    Star,
    Info,
    ArrowLeft,
    Map as MapIcon,
    Layers,
    Navigation,
    Calendar,
    ChevronRight,
    Filter,
    Heart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './DestinationPrimeExplorer.css';

// Leaflet Icon Fix
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: markerIcon, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface POI {
    id: string;
    name: string;
    category: 'market' | 'restaurant' | 'museum' | 'gas_station' | 'ski' | 'beach' | 'entertainment';
    destination: string;
    type?: string;
    rating: number;
    description: string;
    address: string;
    distance: string;
    isFeatured?: boolean;
    image?: string;
    coordinates: [number, number];
}

const targetDestinations = [
    { id: 'bansko', label: 'Bansko', count: 5 },
    { id: 'borovetz', label: 'Borovec', count: 4 },
    { id: 'zl_pjasci', label: 'Zlatni Pjasci', count: 3 },
    { id: 'sun_breg', label: 'Sunčev Breg', count: 4 },
];

const categories = [
    { id: 'all', label: 'Sve', icon: <Compass size={18} /> },
    { id: 'market', label: 'Marketi', icon: <ShoppingBag size={18} /> },
    { id: 'restaurant', label: 'Restorani', icon: <Utensils size={18} /> },
    { id: 'museum', label: 'Muzeji', icon: <Landmark size={18} /> },
    { id: 'gas_station', label: 'Pumpe', icon: <Fuel size={18} /> },
    { id: 'ski', label: 'Ski Sadržaji', icon: <Snowflake size={18} /> },
];

const mockPOIs: POI[] = [
    // BANSKO
    {
        id: '1',
        name: 'Supermarket "Balkan"',
        category: 'market',
        destination: 'bansko',
        rating: 4.8,
        description: 'Najveći izbor lokalnih proizvoda i svežeg voća.',
        address: 'Bansko, ul. Pirin 45',
        distance: '0.4 km',
        isFeatured: true,
        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400',
        coordinates: [23.48, 41.83]
    },
    {
        id: '2',
        name: 'Ethno Restaurant "Garden"',
        category: 'restaurant',
        destination: 'bansko',
        rating: 4.9,
        description: 'Tradicionalna kuhinja sa modernim dodirom.',
        address: 'Bansko, Trg Slobode 2',
        distance: '1.2 km',
        isFeatured: true,
        image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=400',
        coordinates: [23.49, 41.84]
    },
    {
        id: '3',
        name: 'Ski Gondola Station',
        category: 'ski',
        destination: 'bansko',
        type: 'Terminal',
        rating: 4.7,
        description: 'Glavni polazni terminal za Todorka vrh.',
        address: 'Bansko, Ski Centar',
        distance: '0.1 km',
        image: 'https://images.unsplash.com/photo-1551698618-1fed5d978029?auto=format&fit=crop&q=80&w=400',
        coordinates: [23.47, 41.82]
    },
    {
        id: '4',
        name: 'Petrol Station "Elite"',
        category: 'gas_station',
        destination: 'bansko',
        rating: 4.5,
        description: 'Otvoreno 24/7, dostupna kafa i sendviči.',
        address: 'Bansko, Izlaz ka Sofiji',
        distance: '3.5 km',
        image: 'https://images.unsplash.com/photo-1563906267088-b029e7101114?auto=format&fit=crop&q=80&w=400',
        coordinates: [23.50, 41.85]
    },
    {
        id: '5',
        name: 'Regional Museum',
        category: 'museum',
        destination: 'bansko',
        rating: 4.6,
        description: 'Istorija i kultura regiona kroz vekove.',
        address: 'Bansko, ul. Goce Delčev 12',
        distance: '0.8 km',
        image: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&q=80&w=400',
        coordinates: [23.485, 41.835]
    },
    // BOROVETS
    {
        id: '6',
        name: 'Restaurant "The Lodge"',
        category: 'restaurant',
        destination: 'borovetz',
        rating: 4.8,
        description: 'Vrhunski specijaliteti u planinskom ambijentu.',
        address: 'Borovec, Centar',
        distance: '0.2 km',
        image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=400',
        coordinates: [23.605, 42.265]
    },
    {
        id: '7',
        name: 'Sitnyakovo Express',
        category: 'ski',
        destination: 'borovetz',
        rating: 4.6,
        description: 'Četvorosedna žičara sa pristupom srednjim stazama.',
        address: 'Borovec, Ski Zone',
        distance: '0.3 km',
        image: 'https://images.unsplash.com/photo-1482867996988-29ec3aee817d?auto=format&fit=crop&q=80&w=400',
        coordinates: [23.61, 42.27]
    },
    // ZLATNI PJASCI
    {
        id: '8',
        name: 'Aquapolis Water Park',
        category: 'ski', // Using ski as a placeholder for general facilities or entertainment
        destination: 'zl_pjasci',
        rating: 4.7,
        description: 'Najmoderniji vodeni park u regionu.',
        address: 'Zlatni Pjasci, Northwest part',
        distance: '1.2 km',
        image: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&q=80&w=400',
        coordinates: [28.03, 43.28]
    },
    {
        id: '9',
        name: 'Beach Bar "Nirvana"',
        category: 'restaurant',
        destination: 'zl_pjasci',
        rating: 4.9,
        description: 'Najbolji kokteli na samoj obali mora.',
        address: 'Zlatni Pjasci, Nirvana Beach',
        distance: '0.1 km',
        image: 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?auto=format&fit=crop&q=80&w=400',
        coordinates: [28.05, 43.29]
    },
    // SUNCEV BREG
    {
        id: '10',
        name: 'Cacao Beach Club',
        category: 'restaurant',
        destination: 'sun_breg',
        rating: 4.8,
        description: 'Ikona noćnog života i plažnog uživanja.',
        address: 'Sunčev Breg, Southern part',
        distance: '0.5 km',
        image: 'https://images.unsplash.com/photo-1520931016638-2edec02010c9?auto=format&fit=crop&q=80&w=400',
        coordinates: [27.70, 42.67]
    },
    {
        id: '11',
        name: 'Action Aquapark',
        category: 'ski', // Entertainment placeholder
        destination: 'sun_breg',
        rating: 4.7,
        description: 'Adrenalinski tobogani i bazeni za celu porodicu.',
        address: 'Sunčev Breg, West part',
        distance: '1.5 km',
        image: 'https://images.unsplash.com/photo-1582650625119-3a31f8fa2699?auto=format&fit=crop&q=80&w=400',
        coordinates: [27.71, 42.70]
    }
];

const destCoords: Record<string, [number, number]> = {
    bansko: [41.83, 23.48],
    borovetz: [42.26, 23.60],
    zl_pjasci: [43.28, 28.04],
    sun_breg: [42.69, 27.71]
};

const ChangeMapView: React.FC<{ center: [number, number] }> = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center, 14);
    }, [center, map]);
    return null;
};

const MapEvents: React.FC<{ onMapClick: (lat: number, lng: number) => void }> = ({ onMapClick }) => {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
};

const InvalidateSize: React.FC<{ size: string, radius: number, center: [number, number] | null }> = ({ size, radius, center }) => {
    const map = useMap();

    useEffect(() => {
        setTimeout(() => {
            map.invalidateSize();
        }, 450);
    }, [size, map]);

    useEffect(() => {
        if (center) {
            let zoom = 14;
            if (radius <= 300) zoom = 17;
            else if (radius <= 600) zoom = 16;
            else if (radius <= 1200) zoom = 15;
            else if (radius <= 2500) zoom = 14;
            else zoom = 13;

            map.setView(center, zoom, { animate: true });
        }
    }, [radius, center, map]);

    return null;
};

interface DraggableScannerProps {
    position: [number, number];
    onDrag: (pos: [number, number]) => void;
    onDragStart: () => void;
    onDragEnd: () => void;
    radius: number;
}

const DraggableScanner: React.FC<DraggableScannerProps> = ({ position, onDrag, onDragStart, onDragEnd, radius }) => {
    const map = useMap();
    const nativeMarker = useRef<L.Marker | null>(null);
    const nativeCircle = useRef<L.Circle | null>(null);
    const isDragging = useRef(false);
    const throttle = useRef(0);

    // Stable callback refs - prevents stale closures
    const onDragRef = useRef(onDrag);
    const onDragStartRef = useRef(onDragStart);
    const onDragEndRef = useRef(onDragEnd);
    useEffect(() => { onDragRef.current = onDrag; }, [onDrag]);
    useEffect(() => { onDragStartRef.current = onDragStart; }, [onDragStart]);
    useEffect(() => { onDragEndRef.current = onDragEnd; }, [onDragEnd]);

    // Create ONCE with native Leaflet API - this is the key fix
    useEffect(() => {
        const icon = L.divIcon({
            className: 'custom-scanner-icon',
            html: '<div class="scanner-dot-handle"></div>',
            iconSize: [40, 40],
            iconAnchor: [20, 20],
        });

        const marker = L.marker(position, { draggable: true, icon, zIndexOffset: 10000 }).addTo(map);
        const circle = L.circle(position, {
            radius: radius,
            color: '#8b5cf6',
            fillColor: '#8b5cf6',
            fillOpacity: 0.2,
            weight: 2,
            interactive: false,
        }).addTo(map);

        marker.on('dragstart', () => {
            isDragging.current = true;
            onDragStartRef.current();
        });

        marker.on('drag', () => {
            const latlng = marker.getLatLng();
            circle.setLatLng(latlng);
            const now = Date.now();
            if (now - throttle.current > 80) {
                onDragRef.current([latlng.lat, latlng.lng]);
                throttle.current = now;
            }
        });

        marker.on('dragend', () => {
            isDragging.current = false;
            const latlng = marker.getLatLng();
            onDragRef.current([latlng.lat, latlng.lng]);
            onDragEndRef.current();
        });

        nativeMarker.current = marker;
        nativeCircle.current = circle;

        return () => {
            marker.remove();
            circle.remove();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map]); // Only re-create if map instance changes

    // Sync external position changes (e.g. clicking new spot on map)
    useEffect(() => {
        if (!isDragging.current && nativeMarker.current && nativeCircle.current) {
            nativeMarker.current.setLatLng(position);
            nativeCircle.current.setLatLng(position);
        }
    }, [position]);

    // Sync radius changes from the slider
    useEffect(() => {
        if (nativeCircle.current) {
            nativeCircle.current.setRadius(radius);
        }
    }, [radius]);

    return null;
};

// Distance calculation helper (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const DestinationPrimeExplorer: React.FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedDestination, setSelectedDestination] = useState('bansko');
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [searchRadius, setSearchRadius] = useState<number>(1000); // 1km default
    const [activePoiId, setActivePoiId] = useState<string | null>(null);
    const [customCenter, setCustomCenter] = useState<[number, number] | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [mapSize, setMapSize] = useState<'normal' | 'full'>('normal');
    const [filteredPOIs, setFilteredPOIs] = useState<POI[]>(mockPOIs);
    const [lastUpdated, setLastUpdated] = useState<string>('');

    useEffect(() => {
        // Postavljanje datuma poslednjeg ažuriranja (pre 3 dana kao primer)
        const date = new Date();
        date.setDate(date.getDate() - 3);
        setLastUpdated(date.toLocaleDateString('sr-RS'));
    }, []);

    useEffect(() => {
        let results = mockPOIs;

        // Filter by destination
        results = results.filter(poi => poi.destination === selectedDestination);

        // Filter by Radius if active POI or custom center is selected
        if (activePoiId || customCenter) {
            const center: [number, number] | undefined = activePoiId
                ? [mockPOIs.find(p => p.id === activePoiId)!.coordinates[1], mockPOIs.find(p => p.id === activePoiId)!.coordinates[0]]
                : customCenter ? [customCenter[0], customCenter[1]] : undefined;

            if (center) {
                results = results.filter(poi => {
                    if (poi.id === activePoiId) return true;
                    const dist = calculateDistance(
                        center[0], center[1],
                        poi.coordinates[1], poi.coordinates[0]
                    );
                    return dist * 1000 <= searchRadius;
                });
            }
        }

        if (selectedCategory !== 'all') {
            results = results.filter(poi => poi.category === selectedCategory);
        }

        if (searchQuery) {
            results = results.filter(poi =>
                poi.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                poi.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                poi.address.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredPOIs(results);
    }, [searchQuery, selectedCategory, selectedDestination, activePoiId, customCenter, searchRadius]);

    const handleDrag = useCallback((pos: [number, number]) => {
        setCustomCenter(pos);
    }, []);

    const handleDragStart = useCallback(() => {
        setIsScanning(true);
    }, []);

    const handleDragEnd = useCallback(() => {
        setIsScanning(false);
    }, []);

    return (
        <div className="prime-explorer-page">
            <div className="explorer-header">
                <div className="header-content">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="breadcrumb"
                        onClick={() => navigate('/')}
                    >
                        <ArrowLeft size={16} /> Nazad na Dashboard
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        Destination Prime Explorer <span className="beta-badge">BETA</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="header-subtitle"
                    >
                        Otkrijte najbolje tačke od interesa na vašoj destinaciji. Podaci se ažuriraju na svakih 30 dana.
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="search-container-glass"
                >
                    <div className="search-input-wrapper">
                        <Search className="search-icon" size={20} />
                        <input
                            type="text"
                            className="explorer-search-input"
                            placeholder="Pretražite destinaciju (npr. Bansko, Kopaonik...)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button className="search-cta">Istraži</button>
                    </div>

                    <div className="cache-info">
                        <Calendar size={14} />
                        <span>Poslednje ažuriranje: {lastUpdated} (Sledeće za 27 dana)</span>
                    </div>
                </motion.div>
            </div>

            <div className={`explorer-main ${mapSize === 'full' && viewMode === 'map' ? 'is-full-map' : ''}`}>
                <div className="categories-sidebar">
                    <h3>Kategorije</h3>
                    <div className="category-list">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                className={`category-item-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(cat.id)}
                            >
                                <span className="cat-icon">{cat.icon}</span>
                                <span className="cat-label">{cat.label}</span>
                                {selectedCategory === cat.id && <div className="active-dot" />}
                            </button>
                        ))}
                    </div>

                    <h3 style={{ marginTop: '40px' }}>Top Destinacije</h3>
                    <div className="category-list">
                        {targetDestinations.map(dest => (
                            <button
                                key={dest.id}
                                className={`category-item-btn ${selectedDestination === dest.id ? 'active' : ''}`}
                                onClick={() => setSelectedDestination(dest.id)}
                            >
                                <span className="cat-icon"><MapPin size={18} /></span>
                                <span className="cat-label">{dest.label}</span>
                                <span className="dest-count">{dest.count}</span>
                                {selectedDestination === dest.id && <div className="active-dot" />}
                            </button>
                        ))}
                    </div>

                    <div className="sponsored-card">
                        <div className="sponsored-tag">PODEŠAVANJA RADIJUSA</div>
                        <div className="radius-control">
                            <div className="radius-labels">
                                <span>Radijus:</span>
                                <span className="radius-value">{searchRadius >= 1000 ? (searchRadius / 1000).toFixed(1) + ' km' : searchRadius + ' m'}</span>
                            </div>
                            <input
                                type="range"
                                min="200"
                                max="5000"
                                step="100"
                                value={searchRadius}
                                onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                                className="radius-slider"
                            />
                            <div className="radius-hint">
                                {activePoiId || customCenter ? "Prikazuju se mesta u odabranom krugu." : "Kliknite na bilo koje mesto na mapi ili listi da aktivirate radijus."}
                            </div>
                            {(activePoiId || customCenter) && (
                                <button className="clear-radius-btn" onClick={() => { setActivePoiId(null); setCustomCenter(null); }}>Poništi radijus</button>
                            )}
                        </div>
                    </div>

                    <div className="sponsored-card">
                        <div className="sponsored-tag">SPONZORISANO</div>
                        <h4>Postanite Partner</h4>
                        <p>Želite da se vaš objekat vidi prvi? Pregovarajte sa našim timom o isticanju ponude.</p>
                        <button className="contact-btn">Kontaktirajte nas</button>
                    </div>
                </div>

                <div className="results-container">
                    <div className="results-header">
                        <h2>
                            {targetDestinations.find(d => d.id === selectedDestination)?.label} - {selectedCategory === 'all' ? 'Sve lokacije' : categories.find(c => c.id === selectedCategory)?.label}
                            <span className="results-count">({filteredPOIs.length})</span>
                        </h2>
                        <div className="results-actions">
                            {viewMode === 'map' && (
                                <div className="map-size-controls">
                                    <button className={`size-btn ${mapSize === 'normal' ? 'active' : ''}`} onClick={() => setMapSize('normal')}>Standardna Mapa</button>
                                    <button className={`size-btn ${mapSize === 'full' ? 'active' : ''}`} onClick={() => setMapSize('full')}>Full Screen (100%)</button>
                                </div>
                            )}
                            <div className="view-toggles">
                                <button
                                    className={`view-toggle ${viewMode === 'list' ? 'active' : ''}`}
                                    onClick={() => setViewMode('list')}
                                ><Layers size={18} /> Lista</button>
                                <button
                                    className={`view-toggle ${viewMode === 'map' ? 'active' : ''}`}
                                    onClick={() => setViewMode('map')}
                                ><MapIcon size={18} /> Mapa</button>
                            </div>
                        </div>
                    </div>

                    {viewMode === 'list' ? (
                        <div className={`poi-grid ${isScanning ? 'is-scanning' : ''}`}>
                            <AnimatePresence mode="popLayout">
                                {filteredPOIs.map((poi, index) => (
                                    <motion.div
                                        key={poi.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={`poi-card ${poi.isFeatured ? 'featured' : ''} ${activePoiId === poi.id ? 'active-center' : ''}`}
                                        onClick={() => {
                                            setActivePoiId(poi.id);
                                            if (viewMode === 'list') setViewMode('map');
                                        }}
                                    >
                                        {poi.image && (
                                            <div className="poi-image">
                                                <img src={poi.image} alt={poi.name} />
                                                {poi.isFeatured && <div className="featured-badge"><Star size={12} /> Preporučeno</div>}
                                                <button className="favorite-btn"><Heart size={18} /></button>
                                            </div>
                                        )}
                                        <div className="poi-content">
                                            <div className="poi-meta">
                                                <span className="poi-category-tag">
                                                    {categories.find(c => c.id === poi.category)?.icon}
                                                    {categories.find(c => c.id === poi.category)?.label}
                                                </span>
                                                <div className="poi-rating">
                                                    <Star size={14} fill="#FFD700" color="#FFD700" />
                                                    <span>{poi.rating}</span>
                                                </div>
                                            </div>
                                            <h3>{poi.name}</h3>
                                            <p className="poi-desc">{poi.description}</p>
                                            <div className="poi-footer">
                                                <div className="poi-address">
                                                    <MapPin size={14} />
                                                    <span>{poi.address}</span>
                                                </div>
                                                <div className="poi-distance">
                                                    <Navigation size={14} />
                                                    <span>{poi.distance}</span>
                                                </div>
                                            </div>
                                            <button className="poi-details-btn">Detalji i Navigacija <ChevronRight size={16} /></button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {filteredPOIs.length === 0 && (
                                <div className="no-results">
                                    <Search size={48} />
                                    <p>Nismo pronašli nijednu lokaciju za vaše kriterijume.</p>
                                    <button onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}>Poništi filtere</button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`map-view-container size-${mapSize}`}
                        >
                            {isScanning && (
                                <div className="scanning-indicator">
                                    <div className="scanning-pulse" />
                                    SKENIRANJE TERENA...
                                </div>
                            )}
                            <MapContainer
                                center={destCoords[selectedDestination] || [42.7339, 25.4858]}
                                zoom={14}
                                style={{ height: '100%', width: '100%' }}
                            >
                                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                                <ChangeMapView center={destCoords[selectedDestination] || [42.7339, 25.4858]} />
                                <MapEvents onMapClick={(lat, lng) => {
                                    setCustomCenter([lat, lng]);
                                    setActivePoiId(null);
                                }} />
                                <InvalidateSize
                                    size={mapSize}
                                    radius={searchRadius}
                                    center={customCenter || (activePoiId ? [mockPOIs.find(p => p.id === activePoiId)!.coordinates[1], mockPOIs.find(p => p.id === activePoiId)!.coordinates[0]] : null)}
                                />

                                {activePoiId && (
                                    <Circle
                                        center={[
                                            mockPOIs.find(p => p.id === activePoiId)!.coordinates[1],
                                            mockPOIs.find(p => p.id === activePoiId)!.coordinates[0]
                                        ]}
                                        radius={searchRadius}
                                        pathOptions={{
                                            fillColor: searchRadius <= 1000 ? '#10b981' : '#3b82f6',
                                            color: searchRadius <= 1000 ? '#10b981' : '#3b82f6',
                                            weight: 1,
                                            fillOpacity: 0.15
                                        }}
                                    />
                                )}

                                {customCenter && (
                                    <DraggableScanner
                                        position={customCenter}
                                        onDrag={handleDrag}
                                        onDragStart={handleDragStart}
                                        onDragEnd={handleDragEnd}
                                        radius={searchRadius}
                                    />
                                )}

                                {filteredPOIs.map(poi => (
                                    <Marker
                                        key={poi.id}
                                        position={[poi.coordinates[1], poi.coordinates[0]]}
                                        eventHandlers={{
                                            click: () => setActivePoiId(poi.id)
                                        }}
                                    >
                                        <Popup>
                                            <div className="map-popup-custom">
                                                <img src={poi.image} alt="" style={{ width: '100%', borderRadius: '8px', marginBottom: '8px' }} />
                                                <h4 style={{ margin: 0, color: '#111' }}>{poi.name}</h4>
                                                <p style={{ margin: '4px 0', fontSize: '11px', color: '#666' }}>{poi.description}</p>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', color: '#fbbf24' }}>
                                                    <Star size={12} fill="#fbbf24" /> {poi.rating}
                                                </div>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}
                            </MapContainer>
                        </motion.div>
                    )}
                </div>
            </div>

            <div className="map-preview-floating">
                <div className="map-placeholder">
                    <MapIcon size={24} />
                    <span>Otvori Interaktivnu Mapu</span>
                </div>
            </div>
        </div>
    );
};

export default DestinationPrimeExplorer;
