import React, { useState, useEffect } from 'react';
import {
    Search, Server, Database, Sparkles, Check, X,
    Filter, Download, AlertCircle, Loader2, MapPin, Star
} from 'lucide-react';
import './AdminHotelImport.css';

interface StagedHotel {
    id: number;
    solvexId: number;
    name: string;
    city: string;
    stars: number;
    rating?: number; // External rating (e.g. Google/TripAdvisor)
    image: string;
    status: 'pending' | 'processing' | 'imported' | 'discarded';
}

const MOCK_HOTELS: StagedHotel[] = [
    {
        id: 1,
        solvexId: 2451,
        name: "Alexandra Beach Spa Resort",
        city: "Tasos",
        stars: 4,
        rating: 4.6,
        image: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=1000&auto=format&fit=crop",
        status: 'pending'
    },
    {
        id: 2,
        solvexId: 2452,
        name: "Royal Paradise Beach Resort",
        city: "Tasos",
        stars: 5,
        rating: 4.8,
        image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1000&auto=format&fit=crop",
        status: 'pending'
    },
    {
        id: 3,
        solvexId: 2453,
        name: "Makryammos Bungalows",
        city: "Tasos",
        stars: 4,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1000&auto=format&fit=crop",
        status: 'pending'
    },
    {
        id: 4,
        solvexId: 2455,
        name: "Blue Dream Palace",
        city: "Tasos",
        stars: 5,
        rating: 4.7,
        image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1000&auto=format&fit=crop",
        status: 'pending'
    },
    {
        id: 5,
        solvexId: 2490,
        name: "Hotel Prljava Soba (Low Rating)",
        city: "Tasos",
        stars: 2,
        rating: 2.1,
        image: "https://images.unsplash.com/photo-1605537964076-3cb0ea2e356d?q=80&w=1000&auto=format&fit=crop",
        status: 'pending'
    }
];

const AdminHotelImport: React.FC = () => {
    // State
    const [searchTerm, setSearchTerm] = useState('');
    const [minStars, setMinStars] = useState<number>(3);
    const [minRating, setMinRating] = useState<number>(4.0);
    const [hotels, setHotels] = useState<StagedHotel[]>(MOCK_HOTELS);

    // AI Modal State
    const [showAiModal, setShowAiModal] = useState(false);
    const [activeHotel, setActiveHotel] = useState<StagedHotel | null>(null);
    const [processingStep, setProcessingStep] = useState<number>(0);
    const [generatedDesc, setGeneratedDesc] = useState('');

    // Filter logic
    const filteredHotels = hotels.filter(h => {
        const matchesSearch = h.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStars = h.stars >= minStars;
        const matchesRating = (h.rating || 0) >= minRating;
        const isNotDiscarded = h.status !== 'discarded';
        return matchesSearch && matchesStars && matchesRating && isNotDiscarded;
    });

    // Handle Import Click
    const handleImportClick = (hotel: StagedHotel) => {
        setActiveHotel(hotel);
        setShowAiModal(true);
        startAiProcess(hotel);
    };

    // Simulate AI Process
    const startAiProcess = (hotel: StagedHotel) => {
        setProcessingStep(0);
        setGeneratedDesc('');

        // Step 1: Fetching Data
        setTimeout(() => setProcessingStep(1), 1000);

        // Step 2: Analyzing Images
        setTimeout(() => setProcessingStep(2), 2500);

        // Step 3: Generating Text
        setTimeout(() => {
            setProcessingStep(3);
            streamText(`Dobrodošli u ${hotel.name}, oazu mira na obali Egejskog mora. Ovaj prelepi kompleks sa ${hotel.stars} zveda nudi savršen spoj luksuza i prirode. 
            
Uživajte u privatnoj plaži sa zlatnim peskom, opustite se u našem nagrađivanom spa centru ili isprobajte mediteranske specijalitete u našem restoranu sa pogledom na zalazak sunca.

Idealno za porodice i parove koji traže beg od svakodnevnice.`);
        }, 4000);
    };

    const streamText = (text: string) => {
        let i = 0;
        const interval = setInterval(() => {
            setGeneratedDesc(text.substring(0, i));
            i++;
            if (i > text.length) clearInterval(interval);
        }, 30);
    };

    const confirmImport = () => {
        if (!activeHotel) return;

        // Update status
        setHotels(prev => prev.map(h => h.id === activeHotel.id ? { ...h, status: 'imported' } : h));
        setShowAiModal(false);
        setActiveHotel(null);
    };

    return (
        <div className="importer-container">
            {/* Header */}
            <div className="importer-header">
                <div className="header-title">
                    <h1><Database size={32} color="#667eea" /> Hotel Import Center</h1>
                    <p>Upravljajte uvozom hotela iz eksternih sistema (Solvex / OpenGreece)</p>
                </div>
                <div className="data-source-badge">
                    <Server size={14} /> Connected to Solvex API
                </div>
            </div>

            {/* Filter Bar */}
            <div className="filter-bar">
                <div className="filter-group">
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: 12, top: 12, color: '#64748b' }} />
                        <input
                            type="text"
                            className="filter-input"
                            style={{ paddingLeft: '40px' }}
                            placeholder="Pretraži hotele po imenu..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="filter-group" style={{ flex: '0 0 200px' }}>
                    <select
                        className="filter-input"
                        value={minStars}
                        onChange={e => setMinStars(Number(e.target.value))}
                    >
                        <option value="0">Sve Zvezdice</option>
                        <option value="3">3+ Zvezdice</option>
                        <option value="4">4+ Zvezdice</option>
                        <option value="5">5 Zvezdica</option>
                    </select>
                </div>

                <div className="filter-group" style={{ flex: '0 0 200px' }}>
                    <select
                        className="filter-input"
                        value={minRating}
                        onChange={e => setMinRating(Number(e.target.value))}
                    >
                        <option value="0">Sve Ocene</option>
                        <option value="4.0">Ocena 4.0+</option>
                        <option value="4.5">Ocena 4.5+</option>
                        <option value="4.8">Premium (4.8+)</option>
                    </select>
                </div>

                <button className="search-btn">
                    <Filter size={18} /> Filtriraj
                </button>
            </div>

            {/* Results Info */}
            <div style={{ marginBottom: '20px', color: '#94a3b8', fontSize: '14px' }}>
                Prikazano {filteredHotels.length} od {hotels.length} hotela spremnih za uvoz.
                (Sakriveno {hotels.length - filteredHotels.length} zbog filtera kvaliteta)
            </div>

            {/* Grid */}
            <div className="hotels-grid">
                {filteredHotels.map(hotel => (
                    <div key={hotel.id} className="import-card">
                        <div className="card-image-placeholder" style={{
                            background: hotel.image ? `url(${hotel.image}) center/cover` : undefined
                        }}>
                            {!hotel.image && <Database size={40} color="rgba(255,255,255,0.2)" />}
                            {hotel.status === 'imported' && (
                                <div style={{
                                    position: 'absolute', inset: 0, background: 'rgba(16, 185, 129, 0.8)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'white'
                                }}>
                                    <Check size={40} />
                                    <span style={{ fontWeight: 700, marginTop: '8px' }}>IMPORTED</span>
                                </div>
                            )}
                        </div>
                        <div className="card-content">
                            <div className="hotel-name">{hotel.name}</div>
                            <div className="hotel-meta">
                                <div className="meta-item">
                                    <MapPin size={14} /> {hotel.city}
                                </div>
                                <div className="meta-item stars">
                                    {[...Array(hotel.stars)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                                </div>
                            </div>

                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px',
                                fontSize: '13px', color: hotel.rating && hotel.rating >= 4.5 ? '#10b981' : '#fbbf24'
                            }}>
                                <div style={{
                                    padding: '2px 6px', borderRadius: '4px',
                                    background: hotel.rating && hotel.rating >= 4.5 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(251, 191, 36, 0.2)',
                                    fontWeight: 700
                                }}>
                                    {hotel.rating} / 5.0
                                </div>
                                <span>Guest Rating</span>
                            </div>

                            <div className="import-actions">
                                {hotel.status === 'imported' ? (
                                    <button className="btn-import" disabled style={{ opacity: 0.5, cursor: 'default' }}>
                                        <Check size={16} /> Uvezeno
                                    </button>
                                ) : (
                                    <>
                                        <button className="btn-import" onClick={() => handleImportClick(hotel)}>
                                            <Sparkles size={16} /> AI Import
                                        </button>
                                        <button className="btn-discard" onClick={() => setHotels(h => h.map(x => x.id === hotel.id ? { ...x, status: 'discarded' } : x))}>
                                            <X size={16} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* AI Modal */}
            {showAiModal && activeHotel && (
                <div className="ai-modal-overlay">
                    <div className="ai-modal">
                        <div className="ai-modal-header">
                            <div style={{ color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Sparkles size={20} /> AI Agent: Processing {activeHotel.name}
                            </div>
                            <button onClick={() => setShowAiModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="ai-processing">
                            {processingStep < 3 ? (
                                <div style={{ marginBottom: '30px' }}>
                                    <Loader2 size={40} className="spin" color="#667eea" />
                                    <h3 style={{ marginTop: '16px', color: '#94a3b8' }}>Analiziram podatke hotela...</h3>
                                </div>
                            ) : null}

                            <div className="processing-steps">
                                <div className={`step-item ${processingStep >= 1 ? 'completed' : processingStep === 0 ? 'active' : ''}`}>
                                    {processingStep >= 1 ? <Check size={16} /> : <div style={{ width: 16 }} />}
                                    Povlačenje sirovih podataka iz Solvex API-ja (ID: {activeHotel.solvexId})
                                </div>
                                <div className={`step-item ${processingStep >= 2 ? 'completed' : processingStep === 1 ? 'active' : ''}`}>
                                    {processingStep >= 2 ? <Check size={16} /> : <div style={{ width: 16 }} />}
                                    Analiza slika i amenity liste
                                </div>
                                <div className={`step-item ${processingStep >= 3 ? 'completed' : processingStep === 2 ? 'active' : ''}`}>
                                    {processingStep >= 3 ? <Check size={16} /> : <div style={{ width: 16 }} />}
                                    Generisanje premium opisa (Srpski)
                                </div>
                            </div>
                        </div>

                        {processingStep >= 3 && (
                            <div className="ai-result">
                                <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase' }}>
                                    GENERISANI OPIS (DRAFT)
                                </div>
                                <div className="generated-desc">
                                    {generatedDesc}
                                    <span className="typing-cursor"></span>
                                </div>
                                <button className="step-confirm-btn" onClick={confirmImport}>
                                    <Download size={18} /> Potvrdi i Sačuvaj u Bazu
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminHotelImport;
