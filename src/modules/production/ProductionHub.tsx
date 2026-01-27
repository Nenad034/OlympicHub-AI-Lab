import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2,
    X,
    ArrowLeft,
    Plus,
    MapPin,
    Bed,
    Download,
    ChevronRight,
    Search,
    Navigation,
    Shield,
    Waves,
    Utensils,
    Car,
    Maximize,
    Tag,
    Clock,
    UserCheck,
    LayoutGrid,
    List,
    AlertCircle,
    CheckCircle2,
    Pencil,
    Star,
    Globe,
    Power,
    CloudCheck,
    RefreshCw,
    Users,
    User,
    Ship,
    Train,
    Ticket,
    Anchor
} from 'lucide-react';
import { exportToJSON } from '../../utils/exportUtils';
import PropertyWizard from '../../components/PropertyWizard';
import TourWizard from '../../components/TourWizard/TourWizard';
import Transport from './Transport';
import Services from './Services';
import { type Property, validateProperty } from '../../types/property.types';
import { type Tour } from '../../types/tour.types';
import {
    saveToCloud,
    loadFromCloud
} from '../../utils/storageUtils';
import { useSecurity } from '../../hooks/useSecurity';
import {
    sanitizeInput,
    generateIdempotencyKey,
    toUTC
} from '../../utils/securityUtils';

// --- TCT-IMC DATA STRUCTURES ---

interface Amenity {
    name: string;
    values: any;
}

interface PriceRule {
    dateFrom: string;
    dateTo: string;
    price: number | null;
    currency: string;
    percent?: number | null;
    arrivalDays?: string;
    departureDays?: string;
    minStay?: number;
    maxStay?: number;
    title: string;
    type: string;
    paymentType?: string;
}

interface Unit {
    id: number | string;
    name: string;
    type: string;
    basicBeds: number;
    extraBeds: number;
    minOccupancy: number;
    images: { url: string }[];
    amenites?: any[]; // Note: Typo in JSON "amenites"
    availabilities: {
        dateFrom: string;
        dateTo: string;
        type: string;
        quantity: number;
    }[];
    pricelist: {
        baseRate: PriceRule[];
        supplement: PriceRule[];
        discount: PriceRule[];
        touristTax: PriceRule[];
    };
}

interface Hotel {
    id: number | string;
    name: string;
    location: {
        address: string;
        lat: number;
        lng: number;
        place: string;
    };
    images: { url: string }[];
    amenities: Amenity[];
    units: Unit[];
    commonItems: {
        discount: PriceRule[];
        touristTax: PriceRule[];
        supplement: PriceRule[];
    };
    originalPropertyData?: Partial<Property>;
}

interface ProductionHubProps {
    onBack: () => void;
    initialTab?: string;
    initialView?: 'hub' | 'list' | 'detail' | 'transport' | 'services';
}

const ProductionHub: React.FC<ProductionHubProps> = ({ onBack, initialTab = 'all', initialView = 'hub' }) => {
    const [viewMode, setViewMode] = useState<'hub' | 'list' | 'detail' | 'transport' | 'services'>(initialView);
    const [displayType, setDisplayType] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeModuleTab, setActiveModuleTab] = useState(initialTab);

    const { trackAction, isAnomalyDetected } = useSecurity();

    const [hotels, setHotels] = useState<Hotel[]>([]);
    const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    // Tour Management State
    const [tours, setTours] = useState<Tour[]>([]);
    const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
    const [showTourWizard, setShowTourWizard] = useState(false);
    const [tourWizardInitialData, setTourWizardInitialData] = useState<Partial<Tour> | undefined>(undefined);

    const filteredHotels = hotels.filter(h =>
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.location.place.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Load hotels from Supabase on mount
    useEffect(() => {
        const loadHotels = async () => {
            const { success, data } = await loadFromCloud('properties');
            if (success && data && data.length > 0) {
                setHotels(data as Hotel[]);
            } else {
                // Fallback to localStorage if Supabase fails or is empty
                const saved = localStorage.getItem('olympic_hub_hotels');
                if (saved) setHotels(JSON.parse(saved));
            }
        };
        loadHotels();

        const loadTours = async () => {
            const { success, data } = await loadFromCloud('tours');
            if (success && data && data.length > 0) {
                setTours(data as Tour[]);
            } else {
                const saved = localStorage.getItem('olympic_hub_tours');
                if (saved) setTours(JSON.parse(saved));
            }
        };
        loadTours();
    }, []);

    // Save/Sync helper
    const syncToSupabase = async (updatedHotels: Hotel[]) => {
        setIsSyncing(true);
        const { success } = await saveToCloud('properties', updatedHotels);
        if (success) {
            localStorage.setItem('olympic_hub_hotels', JSON.stringify(updatedHotels));
        }
        setTimeout(() => setIsSyncing(false), 500);
    };

    // Auto-save to localStorage as quick cache
    useEffect(() => {
        localStorage.setItem('olympic_hub_hotels', JSON.stringify(hotels));
    }, [hotels]);
    const [showImport, setShowImport] = useState(false);
    const [importData, setImportData] = useState('');
    const [showWizard, setShowWizard] = useState(false);
    const [wizardInitialData, setWizardInitialData] = useState<Partial<Property> | undefined>(undefined);

    const handleWizardSave = (property: Partial<Property>, shouldClose: boolean = true) => {
        // ENFORCE IDEMPOTENCY
        const requestId = generateIdempotencyKey('save_prop');
        console.log(`[Idempotency] Request: ${requestId}`);

        // NORMALIZE TIMESTAMPS TO UTC
        const nowUtc = toUTC(new Date());

        if (wizardInitialData && selectedHotel) {
            // EDIT EXISTING
            const updatedHotel: Hotel = {
                ...selectedHotel,
                originalPropertyData: property
            };
            console.log(`[Security] Update request authorized at ${nowUtc} UTC`);
            const updatedList = hotels.map(h => h.id === selectedHotel.id ? updatedHotel : h);
            setHotels(updatedList);
            setSelectedHotel(updatedHotel);
            syncToSupabase(updatedList);
        } else {
            // CREATE NEW
            const newHotel: Hotel = {
                id: Math.random().toString(36).substr(2, 9),
                name: property.content?.[0]?.displayName || 'New Property',
                location: {
                    address: property.address?.addressLine1 || '',
                    lat: property.geoCoordinates?.latitude || 0,
                    lng: property.geoCoordinates?.longitude || 0,
                    place: property.address?.city || ''
                },
                amenities: [],
                units: [],
                commonItems: { discount: [], touristTax: [], supplement: [] },
                images: [],
                originalPropertyData: property // Normal metadata save
            };
            const updatedList = [...hotels, newHotel];
            console.log(`[Security] Record created at ${nowUtc} UTC`);
            setHotels(updatedList);
            syncToSupabase(updatedList);

            if (!shouldClose) {
                // Switch to Edit Mode for the new hotel so subsequent saves don't duplicate
                setSelectedHotel(newHotel);
                setWizardInitialData(newHotel.originalPropertyData);
            }
        }

        if (shouldClose) {
            setShowWizard(false);
            setWizardInitialData(undefined);
        }
    };

    const handleBulkExport = () => {
        if (isAnomalyDetected) {
            alert("BEZBEDNOSNO BLOKIRANJE: Detektovana anomalija u izvozu. Sačekajte audit administratora.");
            return;
        }

        trackAction('bulk_export');
        exportToJSON(hotels, `Olympic_Hotels_Export_${new Date().toISOString().split('T')[0]}.json`);
    };

    const handlePublicPreview = (e: React.MouseEvent, hotel: Hotel) => {
        e.stopPropagation();
        const content = hotel.originalPropertyData?.content?.[0];
        const description = content?.longDescription || '<p>Nema opisa.</p>';
        const title = hotel.name;
        const mainImage = hotel.images?.[0]?.url || 'https://placehold.co/1200x800?text=Hotel+Image';
        const stars = hotel.originalPropertyData?.starRating || 0;
        const starStr = '★'.repeat(stars);

        const html = `
            <!DOCTYPE html>
            <html lang="sr">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>${title} | Olympic Travel Preview</title>
                <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
                <style>
                    :root { --primary: #e30613; --text: #333; --bg: #f4f5f7; }
                    body { font-family: 'Roboto', sans-serif; margin: 0; padding: 0; background: var(--bg); color: var(--text); line-height: 1.6; }
                    h1, h2, h3, h4 { font-family: 'Outfit', sans-serif; margin: 0; }
                    
                    /* Navigation Bar (Mock) */
                    .top-nav { background: #fff; border-bottom: 1px solid #ddd; padding: 15px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
                    .nav-container { max-width: 1170px; margin: 0 auto; padding: 0 15px; display: flex; justify-content: space-between; align-items: center; }
                    .logo { font-weight: 800; font-size: 24px; color: var(--primary); letter-spacing: -1px; }

                    /* Main Container */
                    .container { max-width: 1170px; margin: 30px auto; padding: 0 15px; }

                    /* Breadcrumbs */
                    .breadcrumbs { font-size: 13px; color: #888; margin-bottom: 20px; }
                    .breadcrumbs span { margin: 0 5px; }

                    /* Hotel Header */
                    .hotel-header { margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
                    .hotel-title { font-size: 32px; font-weight: 700; display: flex; align-items: center; gap: 10px; color: #222; }
                    .stars { color: #f4b400; font-size: 20px; letter-spacing: 2px; }
                    .location { color: #666; font-size: 14px; margin-top: 8px; display: flex; align-items: center; gap: 6px; }

                    /* Gallery Grid */
                    .gallery { display: grid; grid-template-columns: 2fr 1fr; gap: 10px; height: 450px; margin-bottom: 30px; border-radius: 8px; overflow: hidden; }
                    .gallery-main { width: 100%; height: 100%; object-fit: cover; cursor: pointer; transition: transform 0.3s; }
                    .gallery-side { display: grid; grid-template-rows: 1fr 1fr; gap: 10px; }
                    .gallery-img { width: 100%; height: 100%; object-fit: cover; cursor: pointer; transition: opacity 0.3s; }
                    .gallery-img:hover { opacity: 0.9; }

                    /* Content Layout */
                    .content-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 30px; }
                    
                    /* Main Column */
                    .main-col { background: #fff; padding: 40px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
                    
                    /* Tabs */
                    .tabs { display: flex; border-bottom: 1px solid #eee; margin-bottom: 30px; }
                    .tab { padding: 12px 24px; font-weight: 600; color: #666; cursor: pointer; border-bottom: 3px solid transparent; font-family: 'Outfit', sans-serif; }
                    .tab.active { color: var(--primary); border-bottom-color: var(--primary); }

                    /* Description Content */
                    .description-content h1 { font-size: 24px; margin: 30px 0 15px 0; border-bottom: 2px solid #e30613; display: inline-block; padding-bottom: 5px; }
                    .description-content p { margin-bottom: 15px; font-size: 15px; color: #555; text-align: justify; }
                    .description-content .section { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 30px 0 15px; border-left: 4px solid #e30613; }
                    .description-content .section b { color: #333; font-size: 18px; display: block; margin-bottom: 10px; }
                    .description-content hr { border: 0; border-top: 1px solid #eee; margin: 30px 0; }
                    
                    /* Sidebar */
                    .sidebar { }
                    .booking-card { background: #fff; padding: 25px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); position: sticky; top: 20px; }
                    .price-label { font-size: 14px; color: #888; text-transform: uppercase; font-weight: 600; }
                    .price-val { font-size: 32px; font-weight: 700; color: #222; margin: 5px 0 20px; }
                    .btn-book { background: var(--primary); color: #fff; width: 100%; padding: 15px; border: none; border-radius: 4px; font-weight: 700; font-size: 16px; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px; transition: background 0.2s; }
                    .btn-book:hover { background: #c20510; }
                    .sidebar-info { margin-top: 25px; font-size: 14px; color: #666; border-top: 1px solid #eee; padding-top: 15px; }
                    .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px dashed #eee; padding-bottom: 5px; }
                    .info-row:last-child { border: none; }

                    /* Amenities Icons */
                    .amenities-preview { display: flex; gap: 15px; margin-bottom: 30px; flex-wrap: wrap; }
                    .amenity-pill { background: #f0f2f5; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 500; color: #444; }

                </style>
            </head>
            <body>
                <div class="top-nav">
                    <div class="nav-container">
                        <div class="logo">OLYMPIC TRAVEL</div>
                    </div>
                </div>

                <div class="container">
                    <div class="breadcrumbs">
                        Početna <span>&rsaquo;</span> ZIMOVANJE <span>&rsaquo;</span> ${hotel.location.place} <span>&rsaquo;</span> ${title}
                    </div>

                    <div class="hotel-header">
                        <h1 class="hotel-title">${title} <div class="stars">${starStr}</div></h1>
                        <div class="location">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                            ${hotel.location.address}, ${hotel.location.place}
                        </div>
                    </div>

                    <div class="gallery">
                        <img src="${mainImage}" class="gallery-main" alt="Main View" />
                        <div class="gallery-side">
                            <img src="${hotel.images?.[1]?.url || 'https://placehold.co/800x600/eee/999?text=Enterijer+Sobe'}" class="gallery-img" />
                            <img src="${hotel.images?.[2]?.url || 'https://placehold.co/800x600/eee/999?text=Restoran'}" class="gallery-img" />
                        </div>
                    </div>

                    <div class="content-grid">
                        <div class="main-col">
                            <div class="tabs">
                                <div class="tab active">Pregled</div>
                                <div class="tab">Sadržaj</div>
                                <div class="tab">Sobe</div>
                                <div class="tab">Galerija</div>
                                <div class="tab">Lokacija</div>
                            </div>
                            
                            <div class="amenities-preview">
                                <div class="amenity-pill">✨ Wellness Centar</div>
                                <div class="amenity-pill">📶 Besplatan WiFi</div>
                                <div class="amenity-pill">🅿️ Parking</div>
                                <div class="amenity-pill">❄️ Ski Oprema</div>
                            </div>

                            <div class="description-content">
                                ${description}
                            </div>
                        </div>

                        <div class="sidebar">
                            <div class="booking-card">
                                <div class="price-label">Već od</div>
                                <div class="price-val">€ 150 <span style="font-size:16px;font-weight:400;color:#666">/ osoba</span></div>
                                <button class="btn-book">Pošaljite Upit</button>
                                <div class="sidebar-info">
                                    <div class="info-row"><span>Tip Smeštaja:</span> <b>${hotel.originalPropertyData?.propertyType || 'Hotel'}</b></div>
                                    <div class="info-row"><span>Destinacija:</span> <b>${hotel.location.place}</b></div>
                                    <div class="info-row"><span>Država:</span> <b>${hotel.originalPropertyData?.address?.countryCode || 'Slovenija'}</b></div>
                                    <div class="info-row"><span>Usluga:</span> <b>Polupansion</b></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        window.open(URL.createObjectURL(blob), '_blank');
    };

    const toggleStatus = (e: React.MouseEvent, hotel: Hotel) => {
        e.stopPropagation();
        const currentData = hotel.originalPropertyData || {};
        const newStatus = !currentData.isActive;
        const updatedData = { ...currentData, isActive: newStatus };

        const updatedHotel = { ...hotel, originalPropertyData: updatedData as Property };

        const updatedList = hotels.map(h => h.id === hotel.id ? updatedHotel : h);
        setHotels(updatedList);
        if (selectedHotel?.id === hotel.id) {
            setSelectedHotel(updatedHotel);
        }
        syncToSupabase(updatedList);
    };

    const startCreate = () => {
        setWizardInitialData(undefined);
        setShowWizard(true);
    };

    const startEdit = (hotelToEdit?: Hotel) => {
        const targetHotel = hotelToEdit || selectedHotel;

        if (hotelToEdit) {
            setSelectedHotel(hotelToEdit);
        }

        if (targetHotel) {
            // Ensure we have a complete object structure to prevent crashes in Wizard
            const defaultStructure: Partial<Property> = {
                propertyType: 'Hotel',
                isActive: false,
                content: [],
                roomTypes: [],
                propertyAmenities: [],
                ratePlans: [],
                taxes: [],
                pointsOfInterest: [],
                images: [],
                houseRules: {
                    checkInStart: '14:00',
                    checkInEnd: '22:00',
                    checkOutTime: '10:00',
                    smokingAllowed: false,
                    partiesAllowed: false,
                    petsAllowed: false
                },
                keyCollection: {
                    method: 'Reception',
                    instructions: ''
                },
                hostProfile: {
                    hostName: '',
                    languagesSpoken: []
                }
            };

            const existingData = targetHotel.originalPropertyData || {};

            // Fallback content if missing
            if (!existingData.content || existingData.content.length === 0) {
                existingData.content = [{
                    languageCode: 'sr',
                    officialName: targetHotel.name,
                    displayName: targetHotel.name,
                    shortDescription: '',
                    longDescription: ''
                }];
            }

            // Fallback address if missing
            if (!existingData.address) {
                existingData.address = {
                    addressLine1: targetHotel.location.address,
                    city: targetHotel.location.place,
                    postalCode: '11000',
                    countryCode: 'RS'
                };
            }

            // Fallback coordinates if missing
            if (!existingData.geoCoordinates) {
                existingData.geoCoordinates = {
                    latitude: targetHotel.location.lat,
                    longitude: targetHotel.location.lng,
                    coordinateSource: 'MAP_PIN'
                };
            }

            // Merge default structure with existing data
            const initialData = { ...defaultStructure, ...existingData };

            setWizardInitialData(initialData);
            setShowWizard(true);
        }
    };

    const handleImport = () => {
        try {
            const parsed = JSON.parse(importData);
            const data = parsed.data || (Array.isArray(parsed) ? parsed : [parsed]);
            const updatedList = [...hotels, ...data];
            setHotels(updatedList);
            syncToSupabase(updatedList);
            setShowImport(false);
            setImportData('');
            alert(`Uspešno uvezeno ${data.length} objekata!`);
        } catch (e) {
            alert('Greška u formatu JSON-a.');
        }
    };

    // Tour Management Handlers
    const syncToursToSupabase = async (updatedTours: Tour[]) => {
        setIsSyncing(true);
        const { success } = await saveToCloud('tours', updatedTours);
        if (success) {
            localStorage.setItem('olympic_hub_tours', JSON.stringify(updatedTours));
        }
        setTimeout(() => setIsSyncing(false), 500);
    };

    const handleTourWizardSave = (tour: Partial<Tour>) => {
        const requestId = generateIdempotencyKey('save_tour');
        console.log(`[Idempotency] Tour Request: ${requestId}`);

        const nowUtc = toUTC(new Date());

        if (tourWizardInitialData && selectedTour) {
            // EDIT EXISTING TOUR
            const updatedTour: Tour = {
                ...selectedTour,
                ...tour,
                updatedAt: nowUtc
            } as Tour;
            console.log(`[Security] Tour update authorized at ${nowUtc} UTC`);
            const updatedList = tours.map(t => t.id === selectedTour.id ? updatedTour : t);
            setTours(updatedList);
            setSelectedTour(updatedTour);
            syncToursToSupabase(updatedList);
        } else {
            // CREATE NEW TOUR
            const newTour: Tour = {
                id: Math.random().toString(36).substr(2, 9),
                title: tour.title || 'Nova Tura',
                slug: (tour.title || 'nova-tura').toLowerCase().replace(/\s+/g, '-'),
                category: tour.category || 'Grupno',
                status: tour.status || 'Draft',
                shortDescription: tour.shortDescription || '',
                longDescription: tour.longDescription || '',
                highlights: tour.highlights || [],
                gallery: tour.gallery || [],
                startDate: tour.startDate || '',
                endDate: tour.endDate || '',
                durationDays: tour.durationDays || 1,
                totalSeats: tour.totalSeats || 0,
                availableSeats: tour.availableSeats || 0,
                itinerary: tour.itinerary || [],
                basePrice: tour.basePrice || 0,
                currency: tour.currency || 'EUR',
                supplements: tour.supplements || [],
                createdAt: nowUtc,
                updatedAt: nowUtc,
                ...tour
            } as Tour;
            const updatedList = [...tours, newTour];
            console.log(`[Security] Tour created at ${nowUtc} UTC`);
            setTours(updatedList);
            syncToursToSupabase(updatedList);
        }

        setShowTourWizard(false);
        setTourWizardInitialData(undefined);
    };

    const startCreateTour = () => {
        setTourWizardInitialData(undefined);
        setSelectedTour(null);
        setShowTourWizard(true);
    };

    const getDistance = (name: string) => {
        const item = selectedHotel?.amenities.find(a => a.name === name);
        return item ? `${item.values} m` : 'N/A';
    };

    const getAmenityValue = (name: string) => {
        const item = selectedHotel?.amenities.find(a => a.name === name);
        if (!item) return 'N/A';
        if (typeof item.values === 'boolean') return item.values ? 'Da' : 'Ne';
        return item.values;
    };

    if (viewMode === 'hub') {
        return (
            <div className="module-container fade-in">
                <div className="hub-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button onClick={onBack} className="btn-icon circle"><ArrowLeft size={20} /></button>
                        <div>
                            <h2 className="title-gradient">ERP Produkcija</h2>
                            <p className="subtitle">Centralni sistem za upravljanje turističkim inventarom</p>
                        </div>
                    </div>
                    <div className="header-actions" style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn-glass" onClick={handleBulkExport}><Download size={18} /> Bulk Export</button>
                        <button className="btn-glass" onClick={() => setShowImport(true)}><RefreshCw size={18} /> Import JSON</button>
                    </div>
                </div>


                {/* TAB FILTRIRANJE */}
                <div className="hub-tabs-container" style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '32px',
                    background: 'var(--bg-card)',
                    padding: '6px',
                    borderRadius: '16px',
                    width: 'fit-content',
                    border: '1px solid var(--border)'
                }}>
                    {[
                        { id: 'all', label: 'Sve', icon: <LayoutGrid size={16} /> },
                        { id: 'accommodation', label: 'Smeštaj', icon: <Building2 size={16} /> },
                        { id: 'trips', label: 'Putovanja', icon: <Globe size={16} /> },
                        { id: 'transport', label: 'Prevoz', icon: <Car size={16} /> },
                        { id: 'amenities', label: 'Dodatne usluge', icon: <Plus size={16} /> }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveModuleTab(tab.id)}
                            className={`hub-tab-btn ${activeModuleTab === tab.id ? 'active' : ''}`}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 20px',
                                borderRadius: '12px',
                                border: 'none',
                                background: activeModuleTab === tab.id ? 'var(--accent)' : 'transparent',
                                color: activeModuleTab === tab.id ? '#fff' : 'var(--text-secondary)',
                                fontWeight: '600',
                                fontSize: '14px',
                                cursor: 'pointer',
                                transition: '0.2s'
                            }}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="dashboard-grid">
                    {[
                        // SMEŠTAJ
                        { id: 'accommodation', category: 'accommodation', name: 'Smeštaj', desc: 'Hoteli, apartmani i smeštajni objekti.', icon: <Building2 />, color: '#10b981', badge: 'LIVE' },

                        // PUTOVANJA
                        { id: 'group_trips', category: 'trips', name: 'Grupna Putovanja', desc: 'Organizovana grupna putovanja sa vodičem.', icon: <Users />, color: '#ec4899', badge: 'LIVE' },
                        { id: 'ind_trips', category: 'trips', name: 'Individualna Putovanja', desc: 'Putovanja krojena po meri pojedinca.', icon: <User />, color: '#6366f1', badge: 'USKORO' },
                        { id: 'cruises', category: 'trips', name: 'Krstarenja', desc: 'Luksuzna krstarenja svetskim morima.', icon: <Ship />, color: '#06b6d4', badge: 'USKORO' },

                        // PREVOZ
                        { id: 'flights', category: 'transport', name: 'Avion', desc: 'Prodaja avio karata i čarter letovi.', icon: <Navigation />, color: '#3b82f6', badge: 'USKORO' },
                        { id: 'bus', category: 'transport', name: 'Autobus', desc: 'Autobuski prevoz i linijski transferi.', icon: <Car />, color: '#f59e0b', badge: 'USKORO' },
                        { id: 'train', category: 'transport', name: 'Voz', desc: 'Železnički prevoz i karte.', icon: <Train />, color: '#64748b', badge: 'USKORO' },
                        { id: 'ferry', category: 'transport', name: 'Brod', desc: 'Trajekti i brodski prevoz putnika.', icon: <Anchor />, color: '#0ea5e9', badge: 'USKORO' },

                        // DODATNE USLUGE
                        { id: 'trips', category: 'amenities', name: 'Izleti', desc: 'Lokalni izleti i fakultativne ture.', icon: <Waves />, color: '#8b5cf6', badge: 'USKORO' },
                        { id: 'tickets', category: 'amenities', name: 'Ulaznice', desc: 'Karte za muzeje, parkove i događaje.', icon: <Ticket />, color: '#f43f5e', badge: 'USKORO' }
                    ].filter(s => activeModuleTab === 'all' || s.category === activeModuleTab).map(s => (
                        <motion.div
                            key={s.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ y: -4, scale: 1.02 }}
                            className="module-card"
                            onClick={() => {
                                if (s.id === 'accommodation') setViewMode('list');
                                if (s.id === 'group_trips') startCreateTour();
                                if (s.category === 'transport') setViewMode('transport');
                                if (s.category === 'amenities') setViewMode('services');
                            }}
                            style={{
                                cursor: 'pointer',
                                border: (s.id === 'accommodation' || s.id === 'group_trips' || s.category === 'transport' || s.category === 'amenities') ? '1px solid var(--accent)' : '1px solid var(--border)'
                            }}
                        >
                            <div className="module-icon" style={{ background: `linear-gradient(135deg, ${s.color}, ${s.color}dd)` }}>
                                {s.icon}
                            </div>
                            <div className={`module-badge ${(['accommodation', 'group_trips'].includes(s.id) || ['transport', 'amenities'].includes(s.category)) ? 'live' : 'new'}`}>
                                {(['accommodation', 'group_trips'].includes(s.id) || ['transport', 'amenities'].includes(s.category)) ? 'LIVE' : 'USKORO'}
                            </div>
                            <h3 className="module-title">{s.name}</h3>
                            <p className="module-desc">{s.desc}</p>
                            <button className="module-action">
                                {s.id === 'accommodation' ? 'Otvori Modul' : s.id === 'group_trips' ? 'Kreiraj Turu' : 'Otvori Modul'}
                                <ChevronRight size={16} />
                            </button>
                        </motion.div>
                    ))}
                </div>


                <AnimatePresence>
                    {showImport && (
                        <div className="modal-overlay-blur" onClick={() => setShowImport(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <motion.div
                                drag
                                dragMomentum={false}
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="modal-content-glass"
                                onClick={e => e.stopPropagation()}
                                style={{
                                    width: '600px',
                                    background: '#1a1f2e',
                                    borderRadius: '24px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    overflow: 'hidden',
                                    padding: 0,
                                    boxShadow: '0 50px 100px -20px rgba(0,0,0,0.5)'
                                }}
                            >
                                <div
                                    className="modal-header"
                                    style={{
                                        padding: '20px',
                                        background: 'rgba(255,255,255,0.03)',
                                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        cursor: 'grab'
                                    }}
                                >
                                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#fff' }}>Import TCT-IMC Podataka</h3>
                                    <button onClick={() => setShowImport(false)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={20} /></button>
                                </div>
                                <div style={{ padding: '24px' }}>
                                    <textarea
                                        placeholder="Nalepite JSON objekat ovde..."
                                        className="import-textarea"
                                        value={importData}
                                        onChange={e => setImportData(e.target.value)}
                                        style={{
                                            width: '100%',
                                            height: '300px',
                                            background: 'rgba(0,0,0,0.3)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '12px',
                                            padding: '16px',
                                            color: '#fff',
                                            fontFamily: 'monospace',
                                            fontSize: '12px',
                                            resize: 'none',
                                            outline: 'none',
                                            marginBottom: '20px'
                                        }}
                                    />
                                    <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 0 }}>
                                        <button className="btn-primary-glow" onClick={handleImport} style={{ padding: '12px 24px', borderRadius: '12px', background: '#3b82f6', color: '#fff', border: 'none', fontWeight: '600', cursor: 'pointer' }}>Potvrdi Uvoz</button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Tour Wizard - Available from Hub */}
                <AnimatePresence>
                    {showTourWizard && (
                        <TourWizard
                            onClose={() => { setShowTourWizard(false); setTourWizardInitialData(undefined); }}
                            onSave={handleTourWizardSave}
                            initialData={tourWizardInitialData}
                        />
                    )}
                </AnimatePresence>
            </div>
        );
    }

    if (viewMode === 'list') {
        return (
            <div className="module-container fade-in">
                <div className="top-section-bar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button onClick={() => setViewMode('hub')} className="btn-icon circle"><ArrowLeft size={20} /></button>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <h1 style={{ fontSize: '32px', fontWeight: '700', margin: 0 }}>Baza Smeštaja</h1>
                                {isSyncing ? (
                                    <div className="sync-badge syncing">
                                        <RefreshCw size={14} className="spin" /> Syncing...
                                    </div>
                                ) : (
                                    <div className="sync-badge synced">
                                        <CloudCheck size={14} /> Cloud Active
                                    </div>
                                )}
                            </div>
                            <p className="subtitle">Upravljanje hotelima i smeštajnim objektima</p>
                        </div>
                    </div>
                    <style>{`
                        .sync-badge { display: flex; alignItems: center; gap: 6px; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
                        .sync-badge.syncing { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
                        .sync-badge.synced { background: rgba(16, 185, 129, 0.1); color: #10b981; }
                        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                        .spin { animation: spin 2s linear infinite; }
                    `}</style>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', background: 'var(--bg-card)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <button
                                onClick={() => setDisplayType('grid')}
                                style={{
                                    background: displayType === 'grid' ? 'var(--accent)' : 'transparent',
                                    color: displayType === 'grid' ? '#fff' : 'var(--text-secondary)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '6px',
                                    cursor: 'pointer',
                                    display: 'flex'
                                }}
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button
                                onClick={() => setDisplayType('list')}
                                style={{
                                    background: displayType === 'list' ? 'var(--accent)' : 'transparent',
                                    color: displayType === 'list' ? '#fff' : 'var(--text-secondary)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '6px',
                                    cursor: 'pointer',
                                    display: 'flex'
                                }}
                            >
                                <List size={18} />
                            </button>
                        </div>
                        <div className="search-bar">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Pretraži objekte..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(sanitizeInput(e.target.value))}
                            />
                        </div>
                        <button className="btn-primary-action" onClick={startCreate}>
                            <Plus size={18} /> Kreiraj Objekat
                        </button>
                        <button className="btn-secondary" onClick={() => setShowImport(true)}>
                            <Download size={18} /> Import
                        </button>
                    </div>
                </div>

                {/* Property Wizard */}
                {showWizard && (
                    <PropertyWizard
                        onClose={() => setShowWizard(false)}
                        onSave={handleWizardSave}
                        initialData={wizardInitialData}
                    />
                )}

                {displayType === 'grid' ? (
                    <div className="dashboard-grid" style={{ marginTop: '32px' }}>
                        {filteredHotels.map(h => {

                            return (
                                <motion.div
                                    key={h.id}
                                    className="module-card"
                                    whileHover={{ y: -4, scale: 1.02 }}
                                    onClick={() => { setSelectedHotel(h); setViewMode('detail'); }}
                                    style={{ cursor: 'pointer', position: 'relative' }}
                                >
                                    <div
                                        style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10, cursor: 'pointer' }}
                                        onClick={(e) => toggleStatus(e, h)}
                                        title={h.originalPropertyData?.isActive ? 'Deaktiviraj Objekat' : 'Aktiviraj Objekat'}
                                    >
                                        {h.originalPropertyData?.isActive ?
                                            <div style={{ background: '#dcfce7', padding: '6px', borderRadius: '50%', display: 'flex', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                                                <Power size={20} color="#16a34a" />
                                            </div>
                                            :
                                            <div style={{ background: '#fee2e2', padding: '6px', borderRadius: '50%', display: 'flex', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                                                <Power size={20} color="#dc2626" />
                                            </div>
                                        }
                                    </div>



                                    <div className="module-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                                        <Building2 size={28} />
                                    </div>



                                    <h3 className="module-title">{h.name}</h3>
                                    {h.originalPropertyData?.starRating ? (
                                        <div style={{ display: 'flex', gap: '2px', marginBottom: '8px', alignItems: 'center' }}>
                                            {[...Array(h.originalPropertyData.starRating)].map((_, i) => (
                                                <Star key={i} size={14} fill="#fbbf24" strokeWidth={0} />
                                            ))}
                                        </div>
                                    ) : null}
                                    <p className="module-desc">
                                        <MapPin size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                                        {h.location.place}, {h.location.address}
                                    </p>

                                    <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        <div className="info-badge">
                                            <Bed size={12} />
                                            {h.units.length} Jedinica
                                        </div>
                                        <div className="info-badge">
                                            <Tag size={12} />
                                            ID: {h.id}
                                        </div>
                                    </div>

                                    <div style={{ marginTop: 'auto', display: 'flex', gap: '8px' }}>
                                        <button
                                            className="module-action"
                                            style={{ marginTop: 0, flex: 1 }}
                                            onClick={(e) => { e.stopPropagation(); startEdit(h); }}
                                        >
                                            Otvori Modul
                                            <ChevronRight size={16} />
                                        </button>
                                        <div
                                            className="module-action"
                                            style={{ marginTop: 0, width: '46px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            onClick={(e) => handlePublicPreview(e, h)}
                                            title="Prikaži Web Stranicu"
                                        >
                                            <Globe size={18} />
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}

                        <motion.div
                            className="module-card add-new"
                            whileHover={{ y: -4, scale: 1.02 }}
                            onClick={startCreate}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="add-icon">
                                <Plus size={48} />
                            </div>
                            <span className="add-text">Dodaj Novi Objekat</span>
                        </motion.div>
                    </div>
                ) : (
                    <div style={{ marginTop: '32px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)' }}>
                                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)' }}>Status</th>
                                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)' }}>Naziv Objekta</th>
                                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)' }}>Lokacija</th>
                                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)' }}>Jedinica</th>
                                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)' }}>ID</th>
                                    <th style={{ padding: '16px', textAlign: 'right', fontSize: '12px', color: 'var(--text-secondary)' }}>Akcija</th>
                                </tr>
                            </thead>
                            <tbody>
                                {hotels.map(h => {
                                    const isComplete = !h.originalPropertyData || validateProperty(h.originalPropertyData).length === 0;
                                    return (
                                        <tr
                                            key={h.id}
                                            onClick={() => { setSelectedHotel(h); setViewMode('detail'); }}
                                            style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.2s' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-main)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <td style={{ padding: '16px' }}>
                                                {isComplete ?
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '13px', fontWeight: 'bold' }}>
                                                        <CheckCircle2 size={18} /> Završeno
                                                    </div>
                                                    :
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontSize: '13px', fontWeight: 'bold' }}>
                                                        <AlertCircle size={18} /> Nezavršeno
                                                    </div>
                                                }
                                            </td>
                                            <td style={{ padding: '16px', fontWeight: '600' }}>{h.name}</td>
                                            <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{h.location.place}, {h.location.address}</td>
                                            <td style={{ padding: '16px' }}>{h.units.length}</td>
                                            <td style={{ padding: '16px', fontFamily: 'monospace' }}>{h.id}</td>
                                            <td style={{ padding: '16px', textAlign: 'right' }}>
                                                <button className="btn-icon">
                                                    <ChevronRight size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {hotels.length === 0 && (
                                    <tr>
                                        <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                            Nema unetih objekata.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                <AnimatePresence>
                    {showWizard && (
                        <PropertyWizard
                            onClose={() => { setShowWizard(false); setWizardInitialData(undefined); }}
                            onSave={handleWizardSave}
                            initialData={wizardInitialData}
                        />
                    )}
                </AnimatePresence>
            </div>
        );
    }

    if (viewMode === 'detail' && selectedHotel) {
        return (
            <div className="module-container fade-in detail-view">
                <div className="detail-top-bar">
                    <button onClick={() => setViewMode('list')} className="btn-back-circle"><ArrowLeft size={20} /></button>
                    <div className="breadcrumb">Produkcija / Smeštaj / {selectedHotel.name}</div>
                    <div className="detail-actions">
                        <button className="btn-export" onClick={() => exportToJSON(selectedHotel, `hotel_${selectedHotel.id} `)}>EXPORT</button>
                    </div>
                </div>

                <div className="detail-grid-layout">
                    {/* Left Panel: Profile Info */}
                    <div className="profile-panel">
                        <section className="profile-hero">
                            <div className="hero-img">
                                <img src={selectedHotel.images[0]?.url} alt={selectedHotel.name} />
                            </div>
                            <div className="hero-content" style={{ position: 'relative', zIndex: 2 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                                    <div>
                                        <div className="badge-id">#OBJ-{selectedHotel.id}</div>
                                        <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            {selectedHotel.name}
                                            {selectedHotel.originalPropertyData?.starRating && (
                                                <div style={{ display: 'flex', gap: '2px', fontSize: '16px', color: '#fbbf24' }}>
                                                    {[...Array(selectedHotel.originalPropertyData.starRating)].map((_, i) => (
                                                        <Star key={i} size={20} fill="#fbbf24" strokeWidth={0} />
                                                    ))}
                                                </div>
                                            )}
                                        </h1>

                                        {selectedHotel.originalPropertyData?.propertyType && (
                                            <div style={{
                                                display: 'inline-block',
                                                background: 'rgba(255,255,255,0.1)',
                                                padding: '4px 12px',
                                                borderRadius: '20px',
                                                fontSize: '12px',
                                                marginBottom: '12px',
                                                border: '1px solid var(--border)'
                                            }}>
                                                {selectedHotel.originalPropertyData.propertyType}
                                            </div>
                                        )}

                                        <div className="location-info">
                                            <MapPin size={16} />
                                            <span>{selectedHotel.location.address}, {selectedHotel.location.place}</span>
                                        </div>
                                        <div className="coords">
                                            <Navigation size={14} /> {selectedHotel.location.lat}, {selectedHotel.location.lng}
                                        </div>
                                    </div>

                                    <button
                                        className="btn-secondary"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            console.log("Edit button clicked");
                                            startEdit();
                                        }}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', position: 'relative', zIndex: 3 }}
                                    >
                                        <Pencil size={16} /> Izmeni
                                    </button>
                                </div>
                            </div>
                        </section>

                        <section className="location-map-section" style={{ marginTop: '20px', borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--border)', height: '250px', background: 'var(--bg-card)' }}>
                            <iframe
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                scrolling="no"
                                marginHeight={0}
                                marginWidth={0}
                                title="Hotel Location"
                                src={`https://maps.google.com/maps?q=${selectedHotel.location.lat},${selectedHotel.location.lng}&z=15&output=embed`}
                                style={{ filter: 'grayscale(0.2) contrast(1.1)' }
                                }
                            ></iframe >
                        </section >

                        <section className="amenities-section">
                            <h2 className="section-title"><Shield size={18} /> Sadržaji Objekta</h2>
                            <div className="amenity-groups">
                                <div className="amenity-group">
                                    <h4><Maximize size={16} /> Karakteristike</h4>
                                    <ul>
                                        <li>Broj soba: {getAmenityValue('numberOfRooms')}</li>
                                        <li>Spratnost: {getAmenityValue('numberOfFloors')}</li>
                                        <li>Internet: {getAmenityValue('internetAccess')}</li>
                                        <li>Klimatizovano: {getAmenityValue('airConditioning')}</li>
                                    </ul>
                                </div>
                                <div className="amenity-group">
                                    <h4><MapPin size={16} /> Udaljenosti</h4>
                                    <div className="distance-grid">
                                        <div className="dist-item"><span>Centar</span><strong>{getDistance('Center')}</strong></div>
                                        <div className="dist-item"><span>Plaža</span><strong>{getDistance('Beach')}</strong></div>
                                        <div className="dist-item"><span>Prodavnica</span><strong>{getDistance('Shop')}</strong></div>
                                        <div className="dist-item"><span>Restoran</span><strong>{getDistance('Restaurant')}</strong></div>
                                    </div>
                                </div>
                                <div className="amenity-group">
                                    <h4><Utensils size={16} /> Ishrana i Bar</h4>
                                    <p>{getAmenityValue('fb')}</p>
                                </div>
                            </div>
                        </section>
                    </div >

                    {/* Right Panel: Units & Pricing */}
                    < div className="logic-panel" >
                        <section className="units-section">
                            <div className="section-header">
                                <h2><Bed size={20} /> Smeštajne Jedinice</h2>
                                <span className="unit-count">{selectedHotel.units.length} Jedinica</span>
                            </div>

                            {selectedHotel.units.map(unit => (
                                <div key={unit.id} className="unit-card-erp">
                                    <div className="unit-header">
                                        <h3>{unit.name} <span>(ID: {unit.id})</span></h3>
                                        <div className="unit-type-tag">{unit.type}</div>
                                    </div>

                                    <div className="unit-stats-grid">
                                        <div className="stat-box"><Bed size={14} /> {unit.basicBeds} osnovnih</div>
                                        <div className="stat-box"><Plus size={14} /> {unit.extraBeds} pomoćnih</div>
                                        <div className="stat-box"><Clock size={14} /> Min. {unit.minOccupancy} osobe</div>
                                        <div className="stat-box"><UserCheck size={14} /> Instant Booking</div>
                                    </div>

                                    {/* Pricing Logic Table */}
                                    <div className="pricing-matrix">
                                        <div className="matrix-title">Cenovnik i pravila (Base Rate)</div>
                                        <table className="erp-table">
                                            <thead>
                                                <tr>
                                                    <th>Period</th>
                                                    <th>Noćenje</th>
                                                    <th>Min. Stay</th>
                                                    <th>Dolasci / Odlasci</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {unit.pricelist.baseRate.map((rate, i) => (
                                                    <tr key={i}>
                                                        <td>{rate.dateFrom} - {rate.dateTo}</td>
                                                        <td className="price-td">{rate.price} {rate.currency}</td>
                                                        <td>{rate.minStay} dana</td>
                                                        <td>D: {rate.arrivalDays} / O: {rate.departureDays}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="supplements-row">
                                        <div className="supp-item">
                                            <Tag size={12} /> <strong>Popust:</strong> {unit.pricelist.discount[0]?.title} ({unit.pricelist.discount[0]?.percent}%)
                                        </div>
                                        <div className="supp-item">
                                            <Waves size={12} /> <strong>Taksa:</strong> {unit.pricelist.touristTax[0]?.title} ({unit.pricelist.touristTax[0]?.price} {unit.pricelist.touristTax[0]?.currency})
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </section>

                        <section className="common-rules-section">
                            <h2><CheckCircle2 size={18} /> Zajednička pravila i doplate</h2>
                            <div className="common-items-cards">
                                {selectedHotel.commonItems.supplement.map((s, i) => (
                                    <div key={i} className="common-rule-card">
                                        <div className="rule-title">{s.title}</div>
                                        <div className="rule-price">{s.price} {s.currency} <span>({s.paymentType})</span></div>
                                    </div>
                                ))}
                                {selectedHotel.commonItems.discount.map((d, i) => (
                                    <div key={i} className="common-rule-card discount">
                                        <div className="rule-title">{d.title}</div>
                                        <div className="rule-price">{d.percent}% popusta</div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div >
                </div >

                <AnimatePresence>
                    {showWizard && (
                        <PropertyWizard
                            onClose={() => { setShowWizard(false); setWizardInitialData(undefined); }}
                            onSave={handleWizardSave}
                            initialData={wizardInitialData}
                        />
                    )}
                    {showTourWizard && (
                        <TourWizard
                            onClose={() => { setShowTourWizard(false); setTourWizardInitialData(undefined); }}
                            onSave={handleTourWizardSave}
                            initialData={tourWizardInitialData}
                        />
                    )}
                </AnimatePresence>
            </div >
        );
    }

    if (viewMode === 'transport') {
        return <Transport onBack={() => setViewMode('hub')} />;
    }

    if (viewMode === 'services') {
        return <Services onBack={() => setViewMode('hub')} />;
    }

    return null;
};

export default ProductionHub;
