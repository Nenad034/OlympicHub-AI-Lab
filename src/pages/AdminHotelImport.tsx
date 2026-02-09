import React, { useState } from 'react';
import {
    Search, Server, Database, Sparkles, Check, X,
    Filter, Download, Loader2, MapPin, Star, Zap
} from 'lucide-react';
import './AdminHotelImport.css';
import { filosApiService } from '../services/filos/api/filosApiService';
import solvexDictionaryService from '../services/solvex/solvexDictionaryService';
import { AiIntelligenceService } from '../services/ai/AiIntelligenceService';
import { saveToCloud, loadFromCloud } from '../utils/storageUtils';

interface StagedHotel {
    id: number;
    solvexId: number;
    name: string;
    city: string;
    stars: number;
    rating?: number; // External rating (e.g. Google/TripAdvisor)
    image: string;
    description?: string;
    status: 'pending' | 'processing' | 'imported' | 'discarded';
    originalData?: any;
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
    const [dataSource, setDataSource] = useState<'solvex' | 'filos'>('solvex');
    const [loading, setLoading] = useState(false);
    const [bulkStatus, setBulkStatus] = useState({ current: 0, total: 0, text: '' });

    // AI Modal State
    const [showAiModal, setShowAiModal] = useState(false);
    const [activeHotel, setActiveHotel] = useState<StagedHotel | null>(null);
    const [processingStep, setProcessingStep] = useState<number>(0);
    const [generatedDesc, setGeneratedDesc] = useState('');
    const [importMode, setImportMode] = useState<'ai' | 'script'>('ai');

    // Fetch real hotels from Filos
    const fetchFilosHotels = async () => {
        setLoading(true);
        try {
            const result = await filosApiService.getHotels();
            if (result.success && Array.isArray(result.data)) {
                const staged: StagedHotel[] = result.data.map((h: any, idx: number) => ({
                    id: 1000 + idx,
                    solvexId: 0,
                    name: h.name || 'Unknown Hotel',
                    city: h.location?.city || 'Greece',
                    stars: h.rating?.value || 4,
                    rating: h.rating?.value || 4.0,
                    image: h.photos?.[0] || '',
                    description: h.description || '',
                    status: 'pending',
                    originalData: h
                }));
                setHotels(staged);
                setDataSource('filos');
            }
        } catch (error) {
            console.error('Failed to fetch Filos hotels:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSolvexHotels = async () => {
        setLoading(true);
        try {
            const cities = [33, 68, 9, 6]; // Golden Sands, Sunny Beach, Bansko, Borovets
            let allHotels: any[] = [];
            for (const cityId of cities) {
                const result = await solvexDictionaryService.getHotels(cityId);
                if (result.success && result.data) {
                    allHotels = [...allHotels, ...result.data];
                }
            }

            const staged: StagedHotel[] = allHotels.map((h: any, idx: number) => ({
                id: 2000 + idx,
                solvexId: h.id,
                name: h.name || 'Unknown Hotel',
                city: h.city || 'Bugarska',
                stars: h.stars || 0,
                rating: 4.5,
                image: h.images?.[0] || '',
                description: h.description || '',
                status: 'pending',
                originalData: h
            }));
            setHotels(staged);
            setDataSource('solvex');
        } catch (error) {
            console.error('Failed to fetch Solvex hotels:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter logic
    const filteredHotels = hotels.filter(h => {
        const matchesSearch = h.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStars = h.stars >= minStars;
        const matchesRating = (h.rating || 0) >= minRating;
        const isNotDiscarded = h.status !== 'discarded';
        return matchesSearch && matchesStars && matchesRating && isNotDiscarded;
    });

    // Handle Import Click
    const handleImportClick = (hotel: StagedHotel, mode: 'ai' | 'script' = 'ai') => {
        setActiveHotel(hotel);
        setImportMode(mode);

        if (mode === 'script') {
            setProcessingStep(0);
            setShowAiModal(true);
            setTimeout(() => {
                setProcessingStep(3);
                setGeneratedDesc(`[SCRIPT IMPORT] Osnovni podaci uvezeni direktno iz Filos sistema (ID: ${hotel.originalData?.id || 'N/A'}). Opis će biti generisan naknadno po potrebi (ušteda tokena).`);
            }, 800);
        } else {
            setShowAiModal(true);
            startAiProcess(hotel);
        }
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
            streamText(`Dobrodošli u ${hotel.name}, oazu mira na obali Egejskog mora. Ovaj prelepi kompleks sa ${hotel.stars} zvezda nudi savršen spoj luksuza i prirode. 
            
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

    const handleBulkImport = async (mode: 'script' | 'ai' = 'script') => {
        const confirmMsg = mode === 'ai'
            ? `PAŽNJA: Bulk AI Import će generisati opise koristeći OpenAI/Gemini tokene za svih ${hotels.length} hotela. Ovo može potrajati i koštati. Da li ste sigurni?`
            : `Da li ste sigurni da želite da uvezete svih ${hotels.length} hotela putem skripte? (0 tokena, preporučen način)`;

        if (!window.confirm(confirmMsg)) return;

        setLoading(true);
        setBulkStatus({ current: 0, total: hotels.length, text: 'Inicijalizacija...' });

        try {
            const existing = await loadFromCloud('properties');
            const currentList = existing.success ? existing.data : [];
            const ai = AiIntelligenceService.getInstance();

            const finalNewHotels = [];

            for (let i = 0; i < hotels.length; i++) {
                const h = hotels[i];
                setBulkStatus({
                    current: i + 1,
                    total: hotels.length,
                    text: `Obrađujem: ${h.name} (${mode === 'ai' ? 'AI Enrichment' : 'Script Fast'})`
                });

                let longDesc = h.originalData?.description || h.description || '';

                if (mode === 'ai') {
                    // Actual AI generation simulation for bulk
                    try {
                        const aiContent = await ai.processExternalContent(
                            longDesc || `Hotel ${h.name} u mestu ${h.city}`,
                            "Napiši marketinški opisan opis na srpskom jeziku koji ističe luksuz i udobnost. Max 1000 karaktera."
                        );
                        if (aiContent && !aiContent.includes('reached')) {
                            longDesc = aiContent;
                        }
                    } catch (e) {
                        console.warn('AI skip for', h.name);
                    }
                }

                const mapped = {
                    id: `${dataSource}-${h.originalData?.id || h.solvexId || h.id}`,
                    name: h.name,
                    propertyType: 'Hotel',
                    starRating: h.stars || 0,
                    isActive: true,
                    address: {
                        addressLine1: h.originalData?.address || '',
                        city: h.city || '',
                        postalCode: '',
                        countryCode: dataSource === 'filos' ? 'GR' : 'BG'
                    },
                    geoCoordinates: {
                        latitude: h.originalData?.location?.latitude || h.originalData?.location?.lat || 0,
                        longitude: h.originalData?.location?.longitude || h.originalData?.location?.lng || 0
                    },
                    images: (h.originalData?.photos || h.originalData?.images || []).map((url: string) => ({ url })),
                    propertyAmenities: [],
                    content: [{
                        languageCode: 'sr',
                        officialName: h.name,
                        displayName: h.name,
                        shortDescription: longDesc.substring(0, 200),
                        longDescription: longDesc
                    }]
                };
                finalNewHotels.push(mapped);

                // Small delay if AI to not hit rate limits too hard
                if (mode === 'ai') await new Promise(r => setTimeout(r, 500));
            }

            const merged = [...(currentList || [])];
            finalNewHotels.forEach(nh => {
                const idx = merged.findIndex(m => m.id === nh.id);
                if (idx > -1) merged[idx] = nh;
                else merged.push(nh);
            });

            const saveResult = await saveToCloud('properties', merged);
            if (saveResult.success) {
                alert(`Uspešno uvezeno/ažurirano ${finalNewHotels.length} hotela u bazu (${mode === 'ai' ? 'sa AI opisima' : 'skriptom'}).`);
                setHotels(prev => prev.map(h => ({ ...h, status: 'imported' })));
            } else {
                alert(`Greška pri čuvanju: ${saveResult.error}`);
            }
        } catch (error) {
            console.error('Bulk Import Failed:', error);
            alert('Bulk import nije uspeo. Detalji u konzoli.');
        } finally {
            setLoading(false);
            setBulkStatus({ current: 0, total: 0, text: '' });
        }
    };

    const confirmImport = () => {
        if (!activeHotel) return;
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
                    <p>Upravljajte uvozom hotela iz eksternih sistema (Solvex / Filos)</p>
                </div>
                <div className="data-source-badge" onClick={fetchFilosHotels} style={{ cursor: 'pointer', background: dataSource === 'filos' ? 'rgba(16, 185, 129, 0.2)' : undefined }}>
                    <Server size={14} /> {dataSource === 'filos' ? 'Connected to Filos (API v2)' : 'Connected to Solvex API'}
                    {loading && <Loader2 size={12} className="spin" style={{ marginLeft: '8px' }} />}
                </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                    onClick={fetchSolvexHotels}
                    style={{ background: dataSource === 'solvex' ? 'rgba(102, 126, 234, 0.2)' : 'transparent', border: '1px solid var(--border)', padding: '8px 16px', borderRadius: '20px', color: '#fff', cursor: 'pointer', fontWeight: dataSource === 'solvex' ? 700 : 400 }}
                >
                    Solvex Bulgarian API
                </button>
                <button
                    onClick={fetchFilosHotels}
                    style={{ background: dataSource === 'filos' ? 'rgba(16, 185, 129, 0.2)' : 'transparent', border: '1px solid var(--border)', padding: '8px 16px', borderRadius: '20px', color: '#fff', cursor: 'pointer', fontWeight: dataSource === 'filos' ? 700 : 400 }}
                >
                    Filos Greece API
                </button>

                {loading && bulkStatus.total > 0 && (
                    <div style={{ marginLeft: '10px', fontSize: '12px', color: 'var(--accent)', fontWeight: 800 }}>
                        {bulkStatus.text} ({bulkStatus.current}/{bulkStatus.total})
                    </div>
                )}

                {hotels.length > 5 && (
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => handleBulkImport('script')}
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', padding: '8px 20px', borderRadius: '20px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}
                        >
                            <Zap size={16} /> Bulk Script ({hotels.length})
                        </button>
                        <button
                            onClick={() => handleBulkImport('ai')}
                            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', border: 'none', padding: '8px 20px', borderRadius: '20px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}
                        >
                            <Sparkles size={16} /> Bulk AI Enrich ({hotels.length})
                        </button>
                    </div>
                )}
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
                                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                        <button className="btn-import" onClick={() => handleImportClick(hotel, 'ai')} title="AI Enrichment (Utrošak tokena)">
                                            <Sparkles size={16} /> AI
                                        </button>
                                        <button className="btn-import" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }} onClick={() => handleImportClick(hotel, 'script')} title="Script Import (0 tokena)">
                                            <Database size={16} /> Script
                                        </button>
                                        <button className="btn-discard" onClick={() => setHotels(h => h.map(x => x.id === hotel.id ? { ...x, status: 'discarded' } : x))}>
                                            <X size={16} />
                                        </button>
                                    </div>
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
                                {importMode === 'ai' ? <Sparkles size={20} /> : <Database size={20} />}
                                {importMode === 'ai' ? `AI Agent: Processing ${activeHotel.name}` : `Script Import: ${activeHotel.name}`}
                            </div>
                            <button onClick={() => setShowAiModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="ai-processing">
                            {processingStep < 3 ? (
                                <div style={{ marginBottom: '30px' }}>
                                    <Loader2 size={40} className="spin" color="#667eea" />
                                    <h3 style={{ marginTop: '16px', color: '#94a3b8' }}>{importMode === 'ai' ? 'Analiziram podatke hotela...' : 'Uvozim osnovne specifikacije...'}</h3>
                                </div>
                            ) : null}

                            <div className="processing-steps">
                                <div className={`step-item ${processingStep >= 1 ? 'completed' : processingStep === 0 ? 'active' : ''}`}>
                                    {processingStep >= 1 ? <Check size={16} /> : <div style={{ width: 16 }} />}
                                    Povlačenje sirovih podataka iz {dataSource.toUpperCase()} API-ja
                                </div>
                                <div className={`step-item ${processingStep >= 2 ? 'completed' : processingStep === 1 ? 'active' : ''}`}>
                                    {processingStep >= 2 ? <Check size={16} /> : <div style={{ width: 16 }} />}
                                    {importMode === 'ai' ? 'Analiza slika i amenity liste' : 'Preskakanje analize slika (ušteda)'}
                                </div>
                                <div className={`step-item ${processingStep >= 3 ? 'completed' : processingStep === 2 ? 'active' : ''}`}>
                                    {processingStep >= 3 ? <Check size={16} /> : <div style={{ width: 16 }} />}
                                    {importMode === 'ai' ? 'Generisanje premium opisa (Srpski)' : 'Direktan prenos podataka'}
                                </div>
                            </div>
                        </div>

                        {processingStep >= 3 && (
                            <div className="ai-result">
                                <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase' }}>
                                    {importMode === 'ai' ? 'GENERISANI OPIS (DRAFT)' : 'STATUS UVOZA'}
                                </div>
                                <div className="generated-desc">
                                    {generatedDesc}
                                    {importMode === 'ai' && <span className="typing-cursor"></span>}
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
