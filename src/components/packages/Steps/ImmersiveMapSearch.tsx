import React, { useState, useEffect } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup, Marker } from "react-simple-maps";
import { ArrowLeft, Search, MapPin } from 'lucide-react';
import { getCountries, searchDestinations } from '../../../integrations/solvex/api/solvexDictionaryService';
import { ImmersiveSearchV2 } from './ImmersiveSearchV2';
import { ClickToTravelLogo } from '../../icons/ClickToTravelLogo';
import './ImmersiveMapSearch.css';

// A lightweight TopoJSON map of the world
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Define the steps
type Step = 'world' | 'country' | 'destinations' | 'dates' | 'travelers' | 'confirm';

export interface ImmersiveMapSearchData {
    destinations: any[];
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number;
    childrenAges: number[];
    roomAllocations: any[];
}

interface ImmersiveMapSearchProps {
    onSearch: (data: ImmersiveMapSearchData) => void;
    onPartialUpdate?: (data: ImmersiveMapSearchData) => void;
}

// Map mapping to Solvex names
const MAP_TO_SOLVEX: Record<string, string> = {
    "Bulgaria": "Bugarska",
    "Greece": "Grčka",
    "Turkey": "Turska",
    "Egypt": "Egipat",
    "Montenegro": "Crna Gora",
    "Italy": "Italija",
    "Tunisia": "Tunis",
    "Spain": "Španija",
    "Croatia": "Hrvatska",
    "Albania": "Albanija",
    "United Arab Emirates": "Dubai",
    "Cyprus": "Kipar",
    "Morocco": "Maroko",
    "Portugal": "Portugal",
    "France": "Francuska",
    "Germany": "Nemačka",
    "Austria": "Austrija",
    "Serbia": "Srbija"
};

const ACTIVE_COUNTRIES_TO_ANNOTATE = [
    { name: 'Bugarska', coords: [25.4858, 42.7339] as [number, number] },
    { name: 'Grčka', coords: [21.8243, 39.0742] as [number, number] },
    { name: 'Turska', coords: [35.2433, 38.9637] as [number, number] },
    { name: 'Egipat', coords: [30.8025, 26.8206] as [number, number] },
    { name: 'Srbija', coords: [21.0059, 44.0165] as [number, number] },
    { name: 'Crna Gora', coords: [19.3744, 42.7087] as [number, number] },
    { name: 'Kipar', coords: [33.4299, 35.1264] as [number, number] },
    { name: 'Španija', coords: [-3.7492, 40.4637] as [number, number] },
    { name: 'Italija', coords: [12.5674, 41.8719] as [number, number] },
];

const DEFAULT_ACTIVE_COUNTRIES = [
    { id: 1, name: 'Bugarska', name_lat: 'Bulgaria' },
    { id: 2, name: 'Grčka', name_lat: 'Greece' },
    { id: 3, name: 'Turska', name_lat: 'Turkey' },
    { id: 4, name: 'Egipat', name_lat: 'Egypt' },
    { id: 5, name: 'Srbija', name_lat: 'Serbia' },
    { id: 6, name: 'Crna Gora', name_lat: 'Montenegro' },
    { id: 7, name: 'Kipar', name_lat: 'Cyprus' },
    { id: 8, name: 'Španija', name_lat: 'Spain' },
    { id: 9, name: 'Italija', name_lat: 'Italy' }
];

export const ImmersiveMapSearch: React.FC<ImmersiveMapSearchProps> = ({ onSearch, onPartialUpdate }) => {
    const [step, setStep] = useState<Step>('world');
    const [showImmersiveV2, setShowImmersiveV2] = useState<boolean>(false);
    const [allCountries, setAllCountries] = useState<any[]>([]);

    // Map State (Restored coordinates for World view)
    const [position, setPosition] = useState({ coordinates: [10, 15] as [number, number], zoom: 1 });
    const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
    const [selectedCountryName, setSelectedCountryName] = useState<string | null>(null);
    const [typedCountrySearch, setTypedCountrySearch] = useState<string>('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Sidebar & Data state
    const [selectedDestinations, setSelectedDestinations] = useState<any[]>([]);
    const [availableDestinations, setAvailableDestinations] = useState<any[]>([]);
    const [isSearchingDestinations, setIsSearchingDestinations] = useState(false);

    // Initial Data Fetch
    useEffect(() => {
        let isMounted = true;
        const fetchAll = async () => {
            try {
                const res = await getCountries();
                if (isMounted && res && res.success && res.data) {
                    setAllCountries(res.data);
                }
            } catch (error) {
                console.error('[GeoExplorer] Initial fetch failed:', error);
            }
        };
        fetchAll();
        return () => { isMounted = false; };
    }, []);

    // Predictive Search Logic - Optimized for Cities & Countries
    useEffect(() => {
        if (!typedCountrySearch || typedCountrySearch.length < 2) {
            setSearchResults([]);
            setShowSuggestions(false);
            return;
        }

        const query = typedCountrySearch.toLowerCase();
        // Combine API countries with hardcoded defaults to ensure search always works
        const searchPool = [...(allCountries || []), ...DEFAULT_ACTIVE_COUNTRIES];

        // 1. Find matched countries (partial match)
        const matchedCountries = searchPool.filter(c =>
            (c.name && c.name.toLowerCase().includes(query)) ||
            (c.name_lat && c.name_lat.toLowerCase().includes(query)) ||
            (c.nameLat && c.nameLat.toLowerCase().includes(query))
        );

        // 2. Specific common destinations fallback list
        const allPlaces = [
            { id: 33, name: 'Zlatni Pjasci / Golden Sands', type: 'city', country: 'Bugarska' },
            { id: 68, name: 'Sunčev Breg / Sunny Beach', type: 'city', country: 'Bugarska' },
            { id: 1, name: 'Nesebar / Nessebar', type: 'city', country: 'Bugarska' },
            { id: 9, name: 'Bansko', type: 'city', country: 'Bugarska' },
            { id: 6, name: 'Borovec', type: 'city', country: 'Bugarska' },
            { id: 101, name: 'Hanioti', type: 'city', country: 'Grčka' },
            { id: 102, name: 'Pefkohori', type: 'city', country: 'Grčka' },
            { id: 201, name: 'Antalija / Antalya', type: 'city', country: 'Turska' },
            { id: 301, name: 'Hurgada / Hurghada', type: 'city', country: 'Egipat' }
        ];

        let results: any[] = [];

        // Add countries and their corresponding hardcoded cities
        matchedCountries.forEach(country => {
            results.push({ id: country.id, name: country.name, type: 'country', country: country.name });
            const countryCities = allPlaces.filter(p => p.country.toLowerCase() === country.name.toLowerCase());
            results = [...results, ...countryCities];
        });

        // Add direct city matches
        const directPlaceMatches = allPlaces.filter(p =>
            p.name.toLowerCase().includes(query) &&
            !results.some(r => r.type === 'city' && r.name === p.name)
        );
        results = [...results, ...directPlaceMatches];

        // Final deduplication
        const uniqueResults = results.filter((value, index, self) =>
            index === self.findIndex((t) => t.name === value.name && t.type === value.type)
        );

        setSearchResults(uniqueResults.slice(0, 15));
        setShowSuggestions(uniqueResults.length > 0);
    }, [typedCountrySearch, allCountries]);

    // Helper: Is a country active in our database?
    const isCountryActive = (geoName: string) => {
        const solvexName = MAP_TO_SOLVEX[geoName] || geoName;
        const fallbackActiveList = Object.values(MAP_TO_SOLVEX);

        const inApi = allCountries.some((c: any) =>
            c.name.toLowerCase() === solvexName.toLowerCase() ||
            c.name.toLowerCase() === geoName.toLowerCase() ||
            (c.nameLat && c.nameLat.toLowerCase() === solvexName.toLowerCase())
        );

        return inApi || fallbackActiveList.includes(solvexName);
    };

    const jumpToCountry = (countryName: string): Promise<void> => {
        return new Promise((resolve) => {
            let englishName = Object.keys(MAP_TO_SOLVEX).find(k => MAP_TO_SOLVEX[k].toLowerCase() === countryName.toLowerCase());
            const geoName = englishName || countryName;
            const solvexName = MAP_TO_SOLVEX[geoName] || geoName;

            setSelectedCountryName(solvexName);

            // Cinematic Zoom Coordinates (Faza 2)
            let coords: [number, number] = [20, 35];
            let zoom = 4;

            switch (solvexName) {
                case 'Bugarska': coords = [25.4858, 42.7339]; zoom = 8; break;
                case 'Grčka': coords = [21.8243, 39.0742]; zoom = 7; break;
                case 'Turska': coords = [35.2433, 38.9637]; zoom = 6; break;
                case 'Egipat': coords = [30.8025, 26.8206]; zoom = 6; break;
                case 'Srbija': coords = [21.0059, 44.0165]; zoom = 8; break;
                case 'Crna Gora': coords = [19.3744, 42.7087]; zoom = 9; break;
                case 'Kipar': coords = [33.4299, 35.1264]; zoom = 8; break;
                case 'Španija': coords = [-3.7492, 40.4637]; zoom = 6; break;
                case 'Italija': coords = [12.5674, 41.8719]; zoom = 6; break;
                case 'Albanija': coords = [20.1683, 41.1533]; zoom = 8; break;
                default: coords = [20, 35]; zoom = 2;
            }

            setPosition({ coordinates: coords, zoom });
            setStep('country');

            setIsSearchingDestinations(true);
            const runFetch = async () => {
                try {
                    const results = await searchDestinations(solvexName, 100);
                    const cities = results.filter((r: any) => r.type === 'city' || r.type === 'hotel');

                    if (solvexName === 'Bugarska' || solvexName === 'Bulgaria') {
                        const finalAllowed = [
                            { id: 33, name: 'Zlatni Pjasci / Golden Sands', type: 'city', coords: [28.0461, 43.2847] },
                            { id: 68, name: 'Sunčev Breg / Sunny Beach', type: 'city', coords: [27.7088, 42.6953] },
                            { id: 1, name: 'Nesebar / Nessebar', type: 'city', coords: [27.7360, 42.6599] },
                            { id: 9, name: 'Bansko', type: 'city', coords: [23.4857, 41.8384] },
                            { id: 6, name: 'Borovec', type: 'city', coords: [23.6063, 42.2662] },
                            { id: 10, name: 'Pamporovo', type: 'city', coords: [24.6946, 41.6575] },
                            { id: 12, name: 'Elenite', type: 'city', coords: [27.8106, 42.7061] }
                        ];
                        setAvailableDestinations(finalAllowed);
                    } else if (cities.length === 0) {
                        setAvailableDestinations([]);
                    } else {
                        const citiesWithCoords = cities.map((c: any) => ({
                            ...c,
                            coords: [coords[0] + (Math.random() * 2 - 1), coords[1] + (Math.random() * 2 - 1)]
                        }));
                        setAvailableDestinations(citiesWithCoords);
                    }
                } catch (e) {
                    console.error(e);
                } finally {
                    setIsSearchingDestinations(false);
                    setStep('destinations');
                    resolve();
                }
            };
            runFetch();
        });
    };

    const handleCountryClick = async (geo: any) => {
        const geoName = geo.properties.name;
        if (!isCountryActive(geoName)) return;
        jumpToCountry(geoName);
    };

    const handleBackToWorld = () => {
        setStep('world');
        setPosition({ coordinates: [10, 15], zoom: 1 });
        setSelectedCountryName(null);
        setSelectedDestinations([]);
        setAvailableDestinations([]);
    };

    const triggerImmersiveV2 = (dests: any[]) => {
        setSelectedDestinations(dests);
        setShowImmersiveV2(true);
    };

    if (showImmersiveV2) {
        return (
            <div className="geo-immersive-return-container">
                <ImmersiveSearchV2
                    onSearch={onSearch}
                    onPartialUpdate={onPartialUpdate}
                    initialStep="dates"
                    initialDestinations={selectedDestinations}
                    initialCountry={selectedCountryName ? { id: 0, name: selectedCountryName } : null}
                />
            </div>
        );
    }

    return (
        <div className="geo-explorer-container geo-fullscreen-mode">
            {/* ZOOM CONTROLS - RESTORED PREMIUM UI */}
            <div className="geo-zoom-controls">
                <button className="geo-zoom-btn" onClick={() => setPosition(pos => ({ ...pos, zoom: Math.min(pos.zoom * 1.5, 10) }))} title="Uvećaj">+</button>
                <button className="geo-zoom-btn" onClick={() => setPosition(pos => ({ ...pos, zoom: Math.max(pos.zoom / 1.5, 1) }))} title="Smanji">−</button>
            </div>

            <div className="map-background-layer">
                <ComposableMap
                    projectionConfig={{ scale: 145 }}
                    width={800}
                    height={400}
                    viewBox="0 0 800 400"
                    className="world-map-svg"
                    style={{ width: "100%", height: "100%" }}
                    preserveAspectRatio="xMidYMid meet"
                >
                    <ZoomableGroup zoom={position.zoom} center={position.coordinates} onMoveEnd={(pos) => setPosition(pos)}>
                        <Geographies geography={geoUrl}>
                            {({ geographies }) => {
                                return geographies.map((geo) => {
                                    const geoName = geo.properties.name || geo.properties.NAME || geo.id;
                                    const isActive = isCountryActive(geoName);
                                    const isSelected = selectedCountryName && (MAP_TO_SOLVEX[geoName] === selectedCountryName || geoName === selectedCountryName);

                                    return (
                                        <Geography
                                            key={geo.rsmKey}
                                            geography={geo}
                                            onMouseEnter={() => { if (isActive && step === 'world') setHoveredCountry(geoName); }}
                                            onMouseLeave={() => setHoveredCountry(null)}
                                            onClick={() => handleCountryClick(geo)}
                                            style={{
                                                default: {
                                                    fill: isSelected ? "#38bdf8" : isActive ? "#94a3b8" : "#d1d5db",
                                                    outline: "none",
                                                    stroke: isActive ? "#38bdf8" : "#94a3b8",
                                                    strokeWidth: isActive ? 0.5 : 0.2,
                                                    transition: "all 500ms cubic-bezier(0.23, 1, 0.32, 1)"
                                                },
                                                hover: {
                                                    fill: isActive ? "#0ea5e9" : "#d1d5db",
                                                    outline: "none",
                                                    cursor: isActive ? "pointer" : "default",
                                                    filter: isActive ? "drop-shadow(0 0 10px rgba(14, 165, 233, 0.5))" : "none"
                                                },
                                                pressed: { fill: "#0284c7", outline: "none" }
                                            }}
                                            className={`country-geo ${isActive ? 'active-country' : ''}`}
                                        />
                                    );
                                });
                            }}
                        </Geographies>

                        {/* DESTINATION MARKERS (Faza 2: Fokus na državu) */}
                        {step === 'destinations' && availableDestinations.map(d => (
                            <Marker key={d.id} coordinates={d.coords || [0, 0]} onClick={() => triggerImmersiveV2([d])} className="geo-hotspot">
                                <circle r={8 / (position.zoom / 2)} className="geo-hotspot-circle" />
                                <circle r={3 / (position.zoom / 2)} fill="#fff" />
                                <g className="geo-hotspot-label">
                                    <rect x="-45" y={-35 / (position.zoom / 2)} width="90" height="24" rx="6" className="geo-hotspot-label-bg" />
                                    <text textAnchor="middle" y={-20 / (position.zoom / 2)} className="geo-hotspot-label-text" fontSize={14 / (position.zoom / 2)}>{d.name.split(' / ')[0]}</text>
                                </g>
                            </Marker>
                        ))}
                    </ZoomableGroup>
                </ComposableMap>

                {/* INTERACTIVE TOOLTIP */}
                {hoveredCountry && step === 'world' && (
                    <div className="map-tooltip">
                        🌍 <strong>{MAP_TO_SOLVEX[hoveredCountry] || hoveredCountry}</strong>
                        <div className="tooltip-sub">Kliknite da istražite destinacije</div>
                    </div>
                )}
            </div>

            {/* TOP SEARCH BAR (Premium Geo-Search) */}
            {step === 'world' && (
                <div className="geo-top-search-bar">
                    <Search size={20} color="#94a3b8" />
                    <input
                        id="geo-search-input"
                        type="text"
                        placeholder="Gde želite da putujete?"
                        value={typedCountrySearch}
                        onChange={(e) => setTypedCountrySearch(e.target.value)}
                        onFocus={() => { if (searchResults.length > 0) setShowSuggestions(true); }}
                        onClick={() => { if (searchResults.length > 0) setShowSuggestions(true); }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && typedCountrySearch) {
                                jumpToCountry(typedCountrySearch);
                                setShowSuggestions(false);
                            }
                        }}
                    />
                    <button
                        onClick={() => { if (typedCountrySearch) jumpToCountry(typedCountrySearch); }}
                        style={{ padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <ClickToTravelLogo height={18} iconOnly={true} />
                    </button>

                    {showSuggestions && searchResults.length > 0 && (
                        <div className="geo-search-suggestions">
                            {/* Group 1: Countries */}
                            {searchResults.some(r => r.type === 'country') && (
                                <div className="res-group">
                                    <div className="res-group-label">Države</div>
                                    {searchResults.filter(r => r.type === 'country').map(res => (
                                        <div
                                            key={`${res.type}-${res.id}-${res.name}`}
                                            className="suggestion-item"
                                            onClick={() => {
                                                setTypedCountrySearch(res.name);
                                                setShowSuggestions(false);
                                                jumpToCountry(res.name);
                                            }}
                                        >
                                            <span className="suggestion-icon">🌍</span>
                                            <div className="suggestion-info">
                                                <span className="suggestion-name">{res.name}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Group 2: Destinations */}
                            {searchResults.some(r => r.type !== 'country') && (
                                <div className="res-group">
                                    <div className="res-group-label">Destinacije & Gradovi</div>
                                    {searchResults.filter(r => r.type !== 'country').map(res => (
                                        <div
                                            key={`${res.type}-${res.id}-${res.name}`}
                                            className="suggestion-item"
                                            onClick={() => {
                                                setTypedCountrySearch(res.name);
                                                setShowSuggestions(false);
                                                jumpToCountry(res.country).then(() => triggerImmersiveV2([res]));
                                            }}
                                        >
                                            <span className="suggestion-icon">📍</span>
                                            <div className="suggestion-info">
                                                <span className="suggestion-name">{res.name}</span>
                                                <span className="suggestion-sub">{res.country}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* CINEMATIC LOADING OVERLAY */}
            {step === 'country' && isSearchingDestinations && (
                <div className="world-title-overlay">
                    <h2 style={{ color: 'white', marginBottom: '10px' }}>Pripremamo mapu destinacija za {selectedCountryName}...</h2>
                    <div className="spinner-loader"></div>
                </div>
            )}

            {/* GLASS SIDE PANEL (Slide-In Results) */}
            {step !== 'world' && !isSearchingDestinations && (
                <div className="geo-side-panel animate-slide-in-right">
                    <button className="back-to-world-btn" onClick={handleBackToWorld}>
                        <ArrowLeft size={16} /> Povratak na svet
                    </button>
                    <h2 className="panel-country-title">{selectedCountryName}</h2>
                    {step === 'destinations' && (
                        <div className="panel-section">
                            <h3 style={{ color: '#94a3b8', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px' }}>Popularne destinacije</h3>
                            <div className="pill-list">
                                {availableDestinations.map(dest => (
                                    <div key={dest.id} className="dest-pill" onClick={() => triggerImmersiveV2([dest])}>
                                        <MapPin size={14} style={{ marginRight: '8px', color: '#0ea5e9' }} />
                                        {dest.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
