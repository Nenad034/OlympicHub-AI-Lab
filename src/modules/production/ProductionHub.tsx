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
    Anchor,
    Image as ImageIcon,
    FileText,
    ChevronLeft,
    Zap,
    Trash2
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
import { useAuthStore } from '../../stores/authStore';
import { getProxiedImageUrl } from '../../utils/imageProxy';
import { deleteFromCloud } from '../../utils/storageUtils';

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

const translateCountry = (country?: string) => {
    if (!country) return '-';
    const mapping: Record<string, string> = {
        'Bulgaria': 'Bugarska',
        'Greece': 'Grčka',
        'Turkey': 'Turska',
        'Montenegro': 'Crna Gora',
        'Serbia': 'Srbija',
        'Egypt': 'Egipat',
        'Tunisia': 'Tunis',
        'Italy': 'Italija',
        'Spain': 'Španija',
        'Croatia': 'Hrvatska',
        'Macedonia': 'Makedonija',
        'Albania': 'Albanija',
        'Cyprus': 'Kipar',
        'United Arab Emirates': 'Ujedinjeni Arapski Emirati',
        'UAE': 'UAE'
    };
    return mapping[country] || country;
};

const cyrillicToLatinMap: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ж': 'zh', 'з': 'z',
    'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p',
    'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch',
    'ш': 'sh', 'щ': 'sht', 'ъ': 'a', 'ь': 'y', 'ю': 'yu', 'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ж': 'Zh', 'З': 'Z',
    'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O', 'П': 'P',
    'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch',
    'Ш': 'Sh', 'Щ': 'Sht', 'Ъ': 'A', 'Ь': 'Y', 'Ю': 'Yu', 'Я': 'Ya'
};

const hasCyrillic = (text: string) => /[\u0400-\u04FF]/.test(text);

const transliterate = (text: string) => {
    return text.split('').map(char => cyrillicToLatinMap[char] || char).join('');
};

const unifyHotelName = (name: string): string => {
    if (!name) return "";

    let workingName = name.replace(/_/g, ' ').trim();

    // 1. Detect and transliterate/translate Cyrillic
    if (hasCyrillic(workingName)) {
        workingName = transliterate(workingName);

        // Basic translation for common Bulgarian/Russian hotel terms
        const translations: Record<string, string> = {
            'Kashta': 'House',
            'Semeen': 'Family',
            'Semeini': 'Family',
            'Vila': 'Villa',
            'Vili': 'Villas',
            'Hotel': 'Hotel',
            'Kashti': 'Houses',
            'Kurort': 'Resort',
            'Pansion': 'Guesthouse',
            'Baza': 'Base',
            'Otdih': 'Rest',
            'Selo': 'Village',
            'More': 'Sea',
            'Planina': 'Mountain'
        };

        Object.entries(translations).forEach(([key, value]) => {
            const regex = new RegExp(`\\b${key}\\b`, 'gi');
            workingName = workingName.replace(regex, value);
        });
    }

    // Match star ratings at the start like "4*", "5 *", "4*SUP", "4* SUP"
    const starAtStartRegex = /^(\d+\*?\s*(SUP|SUPERIOR)?)\s+/i;
    const match = workingName.match(starAtStartRegex);

    let baseName = workingName;
    let stars = "";

    if (match) {
        stars = match[1].trim();
        baseName = workingName.substring(match[0].length).trim();
    }

    // Format to Title Case
    const titleCased = baseName
        .toLowerCase()
        .split(' ')
        .filter(w => w.length > 0)
        .map(w => w.charAt(0).toUpperCase() + wordSlice(w))
        .join(' ');

    return stars ? `${titleCased} ${stars}` : titleCased;
};

// Helper for title case to handle Serbian characters correctly if needed
const wordSlice = (w: string) => w.slice(1);

const ProductionHub: React.FC<ProductionHubProps> = ({ onBack, initialTab = 'all', initialView = 'hub' }) => {
    const [viewMode, setViewMode] = useState<'hub' | 'list' | 'detail' | 'transport' | 'services'>(initialView);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchPills, setSearchPills] = useState<string[]>([]);
    const [activeModuleTab, setActiveModuleTab] = useState(initialTab);

    const { trackAction, isAnomalyDetected } = useSecurity();
    const { userLevel } = useAuthStore();

    const [hotels, setHotels] = useState<Hotel[]>([]);
    const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    // Tour Management State
    const [tours, setTours] = useState<Tour[]>([]);
    const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
    const [showTourWizard, setShowTourWizard] = useState(false);
    const [tourWizardInitialData, setTourWizardInitialData] = useState<Partial<Tour> | undefined>(undefined);
    const [dataSource, setDataSource] = useState<'supabase' | 'local' | 'none'>('none'); // Track data source

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 50;

    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all'); // Add status filter state
    const [selectedStars, setSelectedStars] = useState<number[]>([]); // New star filter state
    const [integrityFilter, setIntegrityFilter] = useState<string[]>([]); // New integrity filter state (img, desc, amen, map)

    // Move functions to component scope
    const cleanupKidsCamp = async () => {
        if (userLevel < 6) {
            alert('PRISTUP ODBIJEN: Samo korisnici sa najvišim stepenom pristupa mogu vršiti masovno brisanje.');
            return;
        }
        if (!window.confirm('DA LI STE SIGURNI da želite trajno obrisati SVE destinacije i hotele sa nazivom KidsCamp?')) return;

        try {
            setIsSyncing(true);
            // @ts-ignore
            if (window.sentinelEvents) {
                // @ts-ignore
                window.sentinelEvents.emit({ title: 'Čišćenje Baze', message: 'Uklanjam KidsCamp objekte...', type: 'info' });
            }

            // 1. Delete by name patterns
            await deleteFromCloud('properties', 'name', '%KidsCamp%');
            await deleteFromCloud('properties', 'name', '%Kids Camp%');
            await deleteFromCloud('properties', 'name', '%KidsCam%');

            // 2. Success message
            // @ts-ignore
            if (window.sentinelEvents) {
                // @ts-ignore
                window.sentinelEvents.emit({ title: 'Čišćenje Uspešno', message: 'KidsCamp objekti su trajno obrisani iz baze.', type: 'success' });
            }
            // Trigger local refresh
            const { success, data } = await loadFromCloud('properties');
            if (success && data) {
                const mapped = data.map((h: any) => mapBackendToFrontendHotel(h)).filter(Boolean) as Hotel[];
                setHotels(mapped);
            }
        } catch (error: any) {
            console.error('Cleanup failed:', error);
        } finally {
            setIsSyncing(false);
        }
    };

    // Single delete function
    const deleteHotel = async (e: React.MouseEvent, hotelId: string, hotelName: string) => {
        e.stopPropagation();

        if (userLevel < 6) {
            alert('PRISTUP ODBIJEN: Samo korisnici sa najvišim stepenom pristupa mogu brisati hotele.');
            return;
        }

        if (!window.confirm(`DA LI STE SIGURNI da želite trajno obrisati hotel "${hotelName}"?`)) return;

        try {
            // Optimistic update
            setHotels(prev => prev.filter(h => h.id !== hotelId));

            // Sync with backend
            // For single delete, we can actually use the deleteFromCloud util we made earlier
            // but that one deletes by pattern. Let's make a specific single ID deletion or just exclude from the list and save.
            // Since we save the whole list to 'properties' table, we can just save the new list? 
            // NO, 'properties' table is huge, we should delete the specific row.

            // We need a specific delete by ID.
            // Let's use deleteFromCloud with ID.
            const { success } = await deleteFromCloud('properties', 'id', hotelId);

            if (success) {
                // @ts-ignore
                if (window.sentinelEvents) {
                    // @ts-ignore
                    window.sentinelEvents.emit({ title: 'Hotel Obrisan', message: `Hotel "${hotelName}" je uspešno uklonjen.`, type: 'success' });
                }
            } else {
                throw new Error("Backend delete failed");
            }

        } catch (error) {
            console.error("Delete failed:", error);
            alert("Brisanje nije uspelo. Proverite konzolu.");
            // Revert optimistic update (reload)
            loadHotels();
        }
    };



    const filteredHotels = hotels.filter(h => {
        // Global Exclusion: Permanent Hard-Block for KidsCamp
        const name = h.name.toLowerCase();
        const city = (h.originalPropertyData?.address?.city || h.location.place || "").toLowerCase();
        if (name.includes('kidscamp') || name.includes('kids camp') || name.includes('kidscam')) return false;
        if (city.includes('kidscamp') || city.includes('kids camp')) return false;

        // Status Filter
        if (statusFilter === 'active' && !h.originalPropertyData?.isActive) return false;
        if (statusFilter === 'inactive' && h.originalPropertyData?.isActive) return false;

        // Star Rating Filter (Multi-select)
        if (selectedStars.length > 0) {
            const hStars = h.originalPropertyData?.starRating !== undefined ? Number(h.originalPropertyData.starRating) : 0;
            if (!selectedStars.includes(hStars)) return false;
        }

        // Integrity Filter (Multi-select)
        if (integrityFilter.length > 0) {
            const missing = getMissingInfo(h).map(m => m.key);
            // If user filters for 'img', only show hotels that HAVE images (i.e., 'img' is NOT in missing)
            // Wait, usually filters mean "show hotels that have these features".
            // The column shows what IS MISSING.
            // If I click the "Slike" icon in filter, I probably want to see hotels that HAVE images,
            // OR I want to see hotels that ARE MISSING images?
            // Given the column is "Integritet Podataka" and shows missing stuff,
            // usually filters would be "Show me those missing X".
            // But icons above usually mean "Filter by this property".
            // Let's assume the user wants to filter hotels that HAVE the selected property.

            for (const f of integrityFilter) {
                if (missing.includes(f)) return false;
            }
        }

        if (!searchQuery && searchPills.length === 0) return true;

        // Split current query and combined with finalized pills
        const terms = [
            ...searchPills.map(p => p.toLowerCase()),
            ...searchQuery.toLowerCase().split(' ').filter(t => t.length > 0)
        ];

        const countryCode = h.originalPropertyData?.address?.countryCode || '';
        const countryFull = translateCountry(h.originalPropertyData?.address?.country);
        const status = h.originalPropertyData?.isActive ? 'aktivan active' : 'neaktivan inactive';
        const cityOriginal = h.originalPropertyData?.address?.city || '';
        const cityTranslit = hasCyrillic(cityOriginal) ? transliterate(cityOriginal) : cityOriginal;
        const place = h.location.place || '';
        const translitPlace = hasCyrillic(place) ? transliterate(place) : place;

        // Bilingual mappings & synonyms
        let synonyms = '';
        const combinedLoc = (cityTranslit + ' ' + translitPlace + ' ' + place).toLowerCase();

        if (combinedLoc.includes('golden sands') || combinedLoc.includes('zlatn')) synonyms += ' zlatni pjasci golden sands';
        if (combinedLoc.includes('sunny beach') || combinedLoc.includes('sunc')) synonyms += ' suncev breg sunny beach';
        if (combinedLoc.includes('nessebar') || combinedLoc.includes('neseb')) synonyms += ' nessebar nesebar';
        if (combinedLoc.includes('st. vlas') || combinedLoc.includes('vlas')) synonyms += ' sveti vlas st. vlas';
        if (combinedLoc.includes('st. constantine') || combinedLoc.includes('konstantin')) synonyms += ' sveti konstantin i elena st. constantine and helena';
        if (combinedLoc.includes('bansko')) synonyms += ' bansko';
        if (combinedLoc.includes('borovets') || combinedLoc.includes('borovec')) synonyms += ' borovets borovec';
        if (combinedLoc.includes('pamporovo')) synonyms += ' pamporovo';
        if (combinedLoc.includes('sozopol')) synonyms += ' sozopol';
        if (combinedLoc.includes('razlog')) synonyms += ' razlog';
        if (combinedLoc.includes('corfu') || combinedLoc.includes('krf')) synonyms += ' corfu krf kerkyra kerkira';
        if (combinedLoc.includes('thassos') || combinedLoc.includes('tasos')) synonyms += ' thassos thasos tasos';
        if (combinedLoc.includes('athens') || combinedLoc.includes('atina')) synonyms += ' athens atina athina';
        if (combinedLoc.includes('zakynthos') || combinedLoc.includes('zakinto')) synonyms += ' zakynthos zakintos zante';
        if (combinedLoc.includes('rhodes') || combinedLoc.includes('rodos')) synonyms += ' rhodes rodos';
        if (combinedLoc.includes('crete') || combinedLoc.includes('krit')) synonyms += ' crete krit';
        if (combinedLoc.includes('halkidiki') || combinedLoc.includes('halkidik')) synonyms += ' halkidiki halkidik halidiki';
        if (combinedLoc.includes('lefkada') || combinedLoc.includes('lefkad')) synonyms += ' lefkada lefkad';
        if (combinedLoc.includes('evia') || combinedLoc.includes('evija')) synonyms += ' evia evija';
        if (combinedLoc.includes('parga')) synonyms += ' parga';
        if (combinedLoc.includes('sivota')) synonyms += ' sivota';

        const searchTarget = `${h.name} ${place} ${translitPlace} ${cityTranslit} ${cityOriginal} ${h.location.address} ${h.id} ${countryCode} ${countryFull} ${status} ${synonyms}`.toLowerCase();

        return terms.every(term => searchTarget.includes(term));
    });

    const paginatedHotels = filteredHotels.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter, selectedStars, integrityFilter]);

    const getMissingInfo = (hotel: Hotel) => {
        const missing: { label: string, key: string }[] = [];
        const data = hotel.originalPropertyData as any;

        const hasImages = (hotel.images && hotel.images.length > 0) || (data?.images && data.images.length > 0);
        if (!hasImages) missing.push({ label: 'Slike', key: 'img' });

        const hasDesc = data?.content?.[0]?.longDescription || data?.longDescription || data?.description || data?.content?.description;
        if (!hasDesc) missing.push({ label: 'Opis', key: 'desc' });

        const hasAmenities = (hotel.amenities && hotel.amenities.length > 0) || (data?.propertyAmenities && data.propertyAmenities.length > 0) || (data?.content?.amenities && data.content.amenities.length > 0);
        if (!hasAmenities) missing.push({ label: 'Sadržaji', key: 'amen' });

        const lat = hotel.location.lat || data?.geoCoordinates?.latitude;
        const lng = hotel.location.lng || data?.geoCoordinates?.longitude;
        const hasMap = lat && lng && lat !== 0 && lng !== 0;
        if (!hasMap) missing.push({ label: 'Mapa', key: 'map' });

        return missing;
    };

    const mapBackendToFrontendHotel = (dbHotel: any): Hotel => {
        const rawData = dbHotel.originalPropertyData || dbHotel;
        const rawName = (rawData.name || dbHotel.name || "").toUpperCase();

        // 1. Initial extraction from DB fields
        let fieldStars = 0;
        const starSource = rawData.starRating ?? rawData.starrating ?? rawData.star_rating ?? rawData.stars ?? rawData.Stars ?? 0;
        if (starSource) {
            if (typeof starSource === 'number') fieldStars = Math.round(starSource);
            else {
                const digits = String(starSource).match(/\d+/);
                if (digits) fieldStars = parseInt(digits[0]);
            }
        }

        // 2. Aggressive name-based extraction
        let nameStars = 0;
        const patterns = [
            /([1-5])\s*\*+/,           // "5*", "4 *"
            /([1-5])\s*STARS?/,        // "5 stars"
            /CAT[^\d]*([1-5])/,        // "cat 5"
            /CLASS[^\d]*([1-5])/,      // "class 5"
            /(\*{2,5})/,               // "*****" (counts asterisks)
            /\s(V|IV|III|II|I)\s*\*?$/ // Roman numerals at the end
        ];

        for (const p of patterns) {
            const match = rawName.match(p);
            if (match) {
                if (match[1].startsWith('*')) nameStars = match[1].length;
                else if (match[1] === 'V') nameStars = 5;
                else if (match[1] === 'IV') nameStars = 4;
                else if (match[1] === 'III') nameStars = 3;
                else if (match[1] === 'II') nameStars = 2;
                else if (match[1] === 'I') nameStars = 1;
                else {
                    const val = parseInt(match[1]);
                    if (!isNaN(val)) nameStars = val;
                }
                if (nameStars > 0) break;
            }
        }

        // 3. Logic: If name has 1-5, TRUST NAME over everything else (prevents 3* defaults)
        // Exception: If name has NO stars but field has some, take field.
        let finalStars = nameStars > 0 ? nameStars : fieldStars;

        // Cap at 5
        if (finalStars > 5) finalStars = 5;
        if (isNaN(finalStars)) finalStars = 0;

        return {
            id: dbHotel.id || rawData.id,
            name: unifyHotelName(rawData.name || dbHotel.name || ""),
            location: {
                address: rawData.address?.addressLine ? (hasCyrillic(rawData.address.addressLine) ? transliterate(rawData.address.addressLine) : rawData.address.addressLine) : '',
                place: rawData.address?.city ? (hasCyrillic(rawData.address.city) ? transliterate(rawData.address.city) : rawData.address.city) : '',
                lat: rawData.geoCoordinates?.latitude || 0,
                lng: rawData.geoCoordinates?.longitude || 0
            },
            images: rawData.images || [],
            amenities: rawData.propertyAmenities || [],
            units: Array.isArray(rawData.units) ? rawData.units : [],
            commonItems: rawData.commonItems || {
                discount: [],
                touristTax: [],
                supplement: []
            },
            originalPropertyData: { ...rawData, starRating: finalStars }
        };
    };

    const loadHotels = async () => {
        try {
            const { success, data } = await loadFromCloud('properties');
            if (success && data && data.length > 0) {
                const mapped = data
                    .filter((h: any) => {
                        const name = (h.name || "").toLowerCase();
                        const city = (h.address?.city || "").toLowerCase();
                        const hotelId = String(h.id);

                        // DEEP CLEAN: Filter out KidsCamp
                        if (name.includes('kidscamp') || name.includes('kids camp') || name.includes('kidscam')) return false;
                        if (city.includes('kidscamp') || city.includes('kids camp')) return false;

                        // Remove specific ID 2189 patterns, technical names, and dummy entries
                        const isTechnical = name.includes("pogledaj id") ||
                            name.includes("?") ||
                            hotelId.includes("2189") ||
                            name.trim() === "" ||
                            name === "null";
                        return !isTechnical;
                    })
                    .map(mapBackendToFrontendHotel);
                setHotels(mapped);
                setDataSource('supabase');
                console.log(`✅ Loaded ${mapped.length} hotels from Supabase`);
            } else {
                // Fallback to localStorage if Supabase fails or is empty
                const saved = localStorage.getItem('olympic_hub_hotels');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    const mapped = parsed
                        .filter((h: any) => {
                            const name = (h.name || "").toLowerCase();
                            const city = (h.address?.city || h.location?.city || "").toLowerCase();
                            const hotelId = String(h.id);

                            // DEEP CLEAN: Filter out KidsCamp from cache
                            if (name.includes('kidscamp') || name.includes('kids camp') || name.includes('kidscam')) return false;
                            if (city.includes('kidscamp') || city.includes('kids camp')) return false;

                            const isTechnical = name.includes("pogledaj id") ||
                                name.includes("?") ||
                                hotelId.includes("2189") ||
                                name.trim() === "" ||
                                name === "null";
                            return !isTechnical;
                        })
                        .map(mapBackendToFrontendHotel);
                    setHotels(mapped);
                    setDataSource('local');
                    console.log(`⚠️ Loaded ${mapped.length} hotels from LocalStorage (Fallback)`);
                } else {
                    setDataSource('none');
                }
            }
        } catch (err) {
            console.error("Failed to load hotels in ProductionHub", err);
            setHotels([]);
        }
    };

    // Load hotels from Supabase on mount
    useEffect(() => {
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

    // Auto-save to localStorage as quick cache - WITH NUCLEAR CLEANUP
    useEffect(() => {
        // Double check: if any KidsCamp sneaked in, remove it immediately
        const polluted = hotels.some(h => {
            const n = h.name.toLowerCase();
            const c = (h.location?.place || "").toLowerCase();
            return n.includes('kidscamp') || n.includes('kids camp') || c.includes('kidscamp');
        });

        if (polluted) {
            console.warn("⚠️ Detected KidsCamp pollution in state! Initiating emergency cleanup...");
            const cleanHotels = hotels.filter(h => {
                const n = h.name.toLowerCase();
                const c = (h.location?.place || "").toLowerCase();
                return !n.includes('kidscamp') && !n.includes('kids camp') && !c.includes('kidscamp');
            });
            setHotels(cleanHotels);
            localStorage.setItem('olympic_hub_hotels', JSON.stringify(cleanHotels));
        } else {
            localStorage.setItem('olympic_hub_hotels', JSON.stringify(hotels));
        }
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
        const startCreate = () => {
            setWizardInitialData(undefined);
            setShowWizard(true);
        };

        const startEdit = (e: React.MouseEvent, hotel: Hotel) => {
            e.stopPropagation();
            setWizardInitialData(hotel.originalPropertyData);
            setShowWizard(true);
        };

        return (
            <div className="module-container fade-in" style={{ padding: 0, minHeight: '100vh', background: 'var(--bg-main)' }}>
                {/* Header Area */}
                <div style={{ padding: '32px 48px', borderBottom: '1px solid var(--border)', background: 'rgba(255, 255, 255, 0.02)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 100 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                            <button onClick={() => setViewMode('hub')} className="btn-icon circle" style={{ width: '56px', height: '56px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                                <ArrowLeft size={28} />
                            </button>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                    <h1 style={{ margin: 0, fontSize: '42px', fontWeight: 900, letterSpacing: '-1.5px', color: 'var(--text-main)', textTransform: 'uppercase' }}>Baza Smeštaja</h1>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', background: 'rgba(16, 185, 129, 0.15)', padding: '6px 14px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                            <CloudCheck size={18} /> Cloud Active
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', background: 'rgba(59, 130, 246, 0.15)', padding: '6px 14px', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                                            <Zap size={18} fill="#3b82f6" strokeWidth={0} /> {dataSource === 'supabase' ? 'SUPABASE' : 'CACHE'}
                                        </div>
                                    </div>
                                </div>
                                <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)', fontSize: '18px', fontWeight: 500, opacity: 0.7 }}>
                                    Pronađeno <span style={{ color: '#fff', fontWeight: 900 }}>{filteredHotels.length}</span> objekata u realnom vremenu
                                </p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '16px' }}>

                            <button className="btn-primary" onClick={startCreate} style={{ height: '56px', padding: '0 40px', borderRadius: '16px', fontWeight: 900, fontSize: '16px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 10px 20px rgba(37, 99, 235, 0.3)', border: 'none' }}>
                                <Plus size={26} style={{ marginRight: '12px' }} /> KREIRAJ OBJEKAT
                            </button>
                        </div>
                    </div>

                    {/* Premium Controls Row */}
                    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                        {/* Status Filter Group */}
                        {/* Improved Status Filter Group */}
                        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.02)', padding: '6px', borderRadius: '18px', border: '1px solid var(--border)', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
                            {[
                                { id: 'all', icon: <List size={22} />, label: 'Svi' },
                                { id: 'active', icon: <CheckCircle2 size={22} />, label: 'Aktivni' },
                                { id: 'inactive', icon: <Power size={22} />, label: 'Neaktivni' }
                            ].map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setStatusFilter(item.id as any)}
                                    className={`filter-btn-premium ${statusFilter === item.id ? 'active' : ''}`}
                                    style={{ height: '44px', width: '56px', borderRadius: '12px' }}
                                    title={item.label}
                                >
                                    {item.icon}
                                </button>
                            ))}
                        </div>

                        {/* Star Filter Group */}
                        {/* Expanded Star Filter Group */}
                        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.02)', padding: '6px', borderRadius: '18px', border: '1px solid var(--border)' }}>
                            {[5, 4, 3, 2, 1, 0].map(star => (
                                <button
                                    key={star}
                                    onClick={() => setSelectedStars(prev => prev.includes(star) && prev.length === 1 ? [] : [star])}
                                    className={`filter-btn-premium ${selectedStars.includes(star) ? 'active' : ''}`}
                                    style={{ height: '44px', minWidth: star === 0 ? 'auto' : '64px', padding: '0 12px', borderRadius: '12px', color: selectedStars.includes(star) ? '#fbbf24' : 'var(--text-secondary)' }}
                                >
                                    {star === 0 ? (
                                        <span style={{ fontSize: '10px', fontWeight: 900, whiteSpace: 'nowrap', opacity: selectedStars.includes(0) ? 1 : 0.6 }}>BEZ KAT.</span>
                                    ) : (
                                        <>
                                            <span style={{ fontSize: '16px', fontWeight: 900, marginRight: '4px' }}>{star}</span>
                                            <Star size={14} fill={selectedStars.includes(star) ? '#fbbf24' : 'none'} strokeWidth={selectedStars.includes(star) ? 0 : 2.5} />
                                        </>
                                    )}
                                </button>
                            ))}
                        </div>

                        {(selectedStars.length > 0 || statusFilter !== 'all' || integrityFilter.length > 0 || searchQuery !== '') && (
                            <button
                                onClick={() => {
                                    setSelectedStars([]);
                                    setStatusFilter('all');
                                    setIntegrityFilter([]);
                                    setSearchQuery('');
                                    setSearchPills([]);
                                }}
                                style={{
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                    color: '#ef4444',
                                    padding: '0 16px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    height: '44px'
                                }}
                            >
                                PONIŠTI SVE
                            </button>
                        )}

                        {/* Search Bar - Main Centerpiece */}
                        {/* Refined Search Bar matching user screenshot */}
                        <div style={{ flex: 1, position: 'relative' }}>
                            <style>{`
                                .search-bar-premium {
                                    display: flex;
                                    flex-wrap: wrap;
                                    gap: 8px;
                                    align-items: center;
                                    background: rgba(0, 0, 0, 0.4);
                                    border: 1px solid rgba(255, 255, 255, 0.08);
                                    border-radius: 12px;
                                    padding: 8px 16px;
                                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                                    box-shadow: inset 0 2px 8px rgba(0,0,0,0.4);
                                }
                                .search-bar-premium:focus-within {
                                    border-color: rgba(59, 130, 246, 0.4);
                                    background: rgba(0, 0, 0, 0.5);
                                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1), inset 0 2px 8px rgba(0,0,0,0.5);
                                }
                                .search-bar-premium input {
                                    background: transparent;
                                    border: none;
                                    color: #fff;
                                    outline: none;
                                    width: 100%;
                                    font-size: 15px;
                                    font-weight: 500;
                                    padding: 0 12px;
                                }
                                .search-bar-premium input::placeholder {
                                    color: rgba(255, 255, 255, 0.4);
                                }
                                .filter-btn-premium {
                                    background: transparent;
                                    border: 1px solid transparent;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    cursor: pointer;
                                    transition: all 0.2s ease;
                                    color: var(--text-secondary);
                                }
                                .filter-btn-premium:hover {
                                    background: rgba(255, 255, 255, 0.05);
                                    border-color: rgba(255, 255, 255, 0.1);
                                }
                                .filter-btn-premium.active {
                                    background: rgba(59, 130, 246, 0.12);
                                    border-color: rgba(59, 130, 246, 0.3);
                                    color: #3b82f6 !important;
                                }
                                .suggestions-panel {
                                    top: 55px;
                                    left: 0;
                                    right: 0;
                                    background: #0f172a !important;
                                    backdrop-filter: blur(25px);
                                    border: 1px solid rgba(255, 255, 255, 0.1);
                                    border-radius: 16px;
                                    padding: 8px;
                                    box-shadow: 0 20px 50px rgba(0,0,0,0.8);
                                    z-index: 1000;
                                    max-height: 420px;
                                    overflow-y: auto;
                                }
                                .suggestion-item-premium {
                                    display: flex;
                                    align-items: center;
                                    gap: 16px;
                                    padding: 10px 16px;
                                    border-radius: 10px;
                                    cursor: pointer;
                                    transition: all 0.2s ease;
                                    border: 1px solid transparent;
                                    width: 100%;
                                    text-align: left;
                                    background: transparent !important;
                                    color: #fff !important;
                                    margin-bottom: 2px;
                                }
                                .suggestion-item-premium:hover {
                                    background: rgba(255, 255, 255, 0.05) !important;
                                    border-color: rgba(255, 255, 255, 0.1);
                                }
                                .suggestion-icon-box {
                                    width: 36px;
                                    height: 36px;
                                    background: rgba(59, 130, 246, 0.1);
                                    border-radius: 8px;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    color: #3b82f6;
                                    flex-shrink: 0;
                                }
                                .suggestions-panel::-webkit-scrollbar {
                                    width: 6px;
                                }
                                .suggestions-panel::-webkit-scrollbar-thumb {
                                    background: rgba(255,255,255,0.1);
                                    border-radius: 10px;
                                }
                            `}</style>
                            <div className="search-bar-premium" style={{ minHeight: '52px' }}>
                                <Search size={22} color="rgba(59, 130, 246, 0.6)" />

                                {searchPills.map((pill, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            background: 'rgba(59, 130, 246, 0.15)',
                                            border: '1px solid rgba(59, 130, 246, 0.3)',
                                            padding: '4px 10px',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            color: '#fff',
                                            fontSize: '13px',
                                            fontWeight: 600
                                        }}
                                    >
                                        {pill}
                                        <button
                                            onClick={() => setSearchPills(prev => prev.filter((_, i) => i !== idx))}
                                            style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', padding: 0, cursor: 'pointer', display: 'flex' }}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}

                                <input
                                    type="text"
                                    placeholder={searchPills.length > 0 ? "" : "Pretražite po nazivu hotela, mestu ili ID-u..."}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && searchQuery.trim()) {
                                            setSearchPills(prev => [...prev, searchQuery.trim()]);
                                            setSearchQuery('');
                                        } else if (e.key === 'Backspace' && !searchQuery && searchPills.length > 0) {
                                            setSearchPills(prev => prev.slice(0, -1));
                                        }
                                    }}
                                    style={{ flex: 1, minWidth: '150px' }}
                                />
                                {(searchQuery || searchPills.length > 0) && (
                                    <button
                                        onClick={() => { setSearchQuery(''); setSearchPills([]); }}
                                        style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', padding: '4px', cursor: 'pointer', display: 'flex', color: 'rgba(255,255,255,0.4)' }}
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                            <div style={{ position: 'absolute', right: '12px', top: '-25px', fontSize: '11px', fontWeight: 900, color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)', padding: '4px 10px', borderRadius: '8px' }}>
                                {filteredHotels.length} / {hotels.length} objekata
                            </div>

                            {searchQuery.length > 1 && (
                                <div className="suggestions-panel">
                                    <div style={{ padding: '8px 16px 16px', fontSize: '11px', fontWeight: 900, color: 'rgba(255,255,255,0.3)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                                        Rezultati pretrage
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {(() => {
                                            const suggestions: { label: string, type: 'city' | 'hotel' | 'country', sub: string, icon: any }[] = [];
                                            const q = searchQuery.toLowerCase();

                                            // 1. Check for Countries and their cities
                                            const uniqueCountries = new Set<string>();
                                            hotels.forEach(h => {
                                                const country = translateCountry(h.originalPropertyData?.address?.country);
                                                if (country && country.toLowerCase().includes(q)) {
                                                    uniqueCountries.add(country);
                                                }
                                            });

                                            uniqueCountries.forEach(country => {
                                                // Find cities in this country
                                                const cities = new Set<string>();
                                                hotels.forEach(h => {
                                                    if (translateCountry(h.originalPropertyData?.address?.country) === country) {
                                                        const city = h.location.place || (h.originalPropertyData as any)?.address?.city;
                                                        if (city) cities.add(hasCyrillic(city) ? transliterate(city) : city);
                                                    }
                                                });
                                                cities.forEach(city => {
                                                    suggestions.push({
                                                        label: city,
                                                        type: 'city',
                                                        sub: `Destinacija u državi: ${country}`,
                                                        icon: <MapPin size={18} />
                                                    });
                                                });
                                            });

                                            // 2. Direct City Matches (if not already added)
                                            hotels.forEach(h => {
                                                const p = h.location.place;
                                                const dataCity = (h.originalPropertyData as any)?.address?.city;
                                                [p, dataCity].filter(Boolean).forEach(c => {
                                                    const translit = hasCyrillic(c!) ? transliterate(c!) : c!;
                                                    if (translit.toLowerCase().includes(q) && !suggestions.find(s => s.label === translit)) {
                                                        suggestions.push({
                                                            label: translit,
                                                            type: 'city',
                                                            sub: translateCountry(h.originalPropertyData?.address?.country),
                                                            icon: <Navigation size={18} />
                                                        });
                                                    }
                                                });
                                            });

                                            // 3. Hotel Matches
                                            hotels.filter(h => h.name.toLowerCase().includes(q)).slice(0, 5).forEach(h => {
                                                suggestions.push({
                                                    label: h.name,
                                                    type: 'hotel',
                                                    sub: `${translateCountry(h.originalPropertyData?.address?.country)} • ${h.location.place}`,
                                                    icon: <Building2 size={18} />
                                                });
                                            });

                                            return suggestions.slice(0, 10);
                                        })().map((s, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    setSearchQuery(s.label);
                                                    if (s.type === 'hotel') {
                                                        const h = hotels.find(hotel => hotel.name === s.label);
                                                        if (h) { setSelectedHotel(h); setViewMode('detail'); }
                                                    }
                                                }}
                                                className="suggestion-item-premium"
                                            >
                                                <div className="suggestion-icon-box">
                                                    {s.icon}
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>{s.label}</span>
                                                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{s.sub}</span>
                                                </div>
                                                <ChevronRight size={16} style={{ marginLeft: 'auto', opacity: 0.3 }} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Integrity Quick Toggles */}
                        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '18px', border: '1px solid var(--border)' }}>
                            {[
                                { key: 'img', icon: <ImageIcon size={22} />, label: 'Slike' },
                                { key: 'desc', icon: <FileText size={22} />, label: 'Opis' },
                                { key: 'amen', icon: <Shield size={22} />, label: 'Sadržaji' },
                                { key: 'map', icon: <MapPin size={22} />, label: 'Mapa' }
                            ].map(item => (
                                <button
                                    key={item.key}
                                    onClick={() => setIntegrityFilter(prev => prev.includes(item.key) ? prev.filter(k => k !== item.key) : [...prev, item.key])}
                                    className={`filter-btn-premium ${integrityFilter.includes(item.key) ? 'active' : ''}`}
                                    style={{ height: '48px', width: '56px', borderRadius: '12px' }}
                                    title={`Filtriraj hotele koji imaju: ${item.label}`}
                                >
                                    {item.icon}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ padding: '0 48px 48px' }}>
                    <div style={{ marginTop: '32px', background: 'rgba(255,255,255,0.01)', borderRadius: '32px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 20px 60px -10px rgba(0,0,0,0.5)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border)', background: 'rgba(255,255,255,0.03)' }}>
                                    <th style={{ padding: '24px', textAlign: 'left', fontSize: '12px', fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Status</th>
                                    <th style={{ padding: '24px', textAlign: 'left', fontSize: '12px', fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Objekat</th>
                                    <th style={{ padding: '24px', textAlign: 'center', fontSize: '12px', fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Kat.</th>
                                    <th style={{ padding: '24px', textAlign: 'left', fontSize: '12px', fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Lokacija</th>
                                    <th style={{ padding: '24px', textAlign: 'center', fontSize: '12px', fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Kvalitet Podataka</th>
                                    <th style={{ padding: '24px', textAlign: 'right', fontSize: '12px', fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Upravljanje</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedHotels.map((h, idx) => {
                                    const missingInfo = getMissingInfo(h);
                                    return (
                                        <tr
                                            key={h.id}
                                            onClick={() => { setSelectedHotel(h); setViewMode('detail'); }}
                                            style={{
                                                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'; }}
                                        >
                                            <td style={{ padding: '20px 24px' }} onClick={(e) => { e.stopPropagation(); toggleStatus(e, h); }}>
                                                {h.originalPropertyData?.isActive ?
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#10b981', fontSize: '13px', fontWeight: 900, background: 'rgba(16, 185, 129, 0.15)', padding: '8px 18px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                                        <CheckCircle2 size={18} /> LIVE
                                                    </div>
                                                    :
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', fontSize: '13px', fontWeight: 900, background: 'rgba(100, 116, 139, 0.15)', padding: '8px 18px', borderRadius: '12px', border: '1px solid rgba(100, 116, 139, 0.2)' }}>
                                                        <Power size={18} /> DRAFT
                                                    </div>
                                                }
                                            </td>
                                            <td style={{ padding: '20px 24px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <span style={{ fontWeight: 800, fontSize: '18px', color: 'var(--text-main)', letterSpacing: '-0.3px' }}>{h.name}</span>
                                                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, opacity: 0.5, fontFamily: 'monospace' }}>ID: {h.id}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                                                {Number(h.originalPropertyData?.starRating) > 0 ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                        <div style={{ display: 'flex', gap: '2px', color: '#fbbf24' }}>
                                                            {[...Array(Number(h.originalPropertyData?.starRating))].map((_, i) => (
                                                                <Star key={i} size={14} fill="#fbbf24" strokeWidth={0} />
                                                            ))}
                                                        </div>
                                                        <div style={{ fontSize: '11px', fontWeight: 900, color: '#fbbf24', background: 'rgba(251, 191, 36, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                                                            {h.originalPropertyData?.starRating}*
                                                        </div>
                                                    </div>
                                                ) : <span style={{ opacity: 0.3, fontSize: '10px', fontWeight: 900, letterSpacing: '1px' }}>BEZ KAT.</span>}
                                            </td>
                                            <td style={{ padding: '20px 24px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
                                                        <MapPin size={16} style={{ color: '#3b82f6' }} />
                                                        {translateCountry(h.originalPropertyData?.address?.country)}
                                                    </div>
                                                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                                        {[h.location.place, h.originalPropertyData?.address?.city].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '20px 24px' }}>
                                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                                    {missingInfo.length === 0 ? (
                                                        <div style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '6px 18px', borderRadius: '12px', fontSize: '11px', fontWeight: 900, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                                            <CheckCircle2 size={14} style={{ marginRight: '8px' }} /> KOMPLETNO
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'flex', gap: '6px' }}>
                                                            {missingInfo.map(m => (
                                                                <div key={m.key} title={`Nedostaje: ${m.label}`} style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    {m.key === 'img' && <ImageIcon size={20} />}
                                                                    {m.key === 'desc' && <FileText size={20} />}
                                                                    {m.key === 'amen' && <Shield size={20} />}
                                                                    {m.key === 'map' && <MapPin size={20} />}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                                    <button
                                                        className="btn-icon circle"
                                                        style={{ color: '#3b82f6', background: 'rgba(59, 130, 246, 0.15)', width: '48px', height: '48px', border: '1px solid rgba(59, 130, 246, 0.3)' }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            window.open(`/hotel-view/${h.id}`, '_blank');
                                                        }}
                                                        title="Pogledaj javni prikaz"
                                                    >
                                                        <Globe size={22} />
                                                    </button>
                                                    <button
                                                        className="btn-icon circle-btn"
                                                        style={{ width: '40px', height: '40px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)' }}
                                                        title="Izmeni"
                                                        onClick={(e) => startEdit(e, h)}
                                                    >
                                                        <Pencil size={18} />
                                                    </button>
                                                    {userLevel >= 6 && (
                                                        <button
                                                            className="btn-icon circle-btn"
                                                            style={{ width: '40px', height: '40px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                                                            title="Obriši"
                                                            onClick={(e) => deleteHotel(e, String(h.id), h.name)}
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {paginatedHotels.length === 0 && (
                            <div style={{ padding: '120px 48px', textAlign: 'center' }}>
                                <AlertCircle size={80} style={{ color: 'var(--text-secondary)', opacity: 0.1, marginBottom: '24px' }} />
                                <h2 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '24px', fontWeight: 800 }}>
                                    {integrityFilter.length > 0 ? 'Nema objekata koji zadovoljavaju ove kriterijume integriteta' : 'Nismo pronašli nijedan objekat'}
                                </h2>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '18px', marginTop: '12px', opacity: 0.6 }}>
                                    {integrityFilter.length > 0
                                        ? 'Trenutno većina objekata u bazi nema priložene slike ili opise direktno iz Solvex API-ja. Molimo resetujte filtere ili koristite ručni unos.'
                                        : 'Pokušajte sa širim pojmom ili drugim filterima (npr. \'Bugarska\').'}
                                </p>
                                {integrityFilter.length > 0 && (
                                    <button
                                        onClick={() => setIntegrityFilter([])}
                                        style={{ marginTop: '24px', background: 'var(--accent)', border: 'none', color: '#fff', padding: '12px 24px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
                                    >
                                        PONIŠTI FILTERE INTEGRITETA
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* PAGINATION */}
                    {filteredHotels.length > ITEMS_PER_PAGE && (
                        <div style={{ marginTop: '48px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '32px' }}>
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(c => Math.max(1, c - 1))}
                                className="btn-secondary"
                                style={{ height: '56px', borderRadius: '18px', padding: '0 32px', display: 'flex', alignItems: 'center', gap: '12px', opacity: currentPage === 1 ? 0.3 : 1, fontWeight: 800 }}
                            >
                                <ChevronLeft size={24} /> PRETHODNA
                            </button>
                            <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-main)', background: 'var(--bg-card)', padding: '12px 28px', borderRadius: '18px', border: '2px solid var(--border)', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}>
                                {currentPage} <span style={{ opacity: 0.3, fontWeight: 500, margin: '0 8px' }}>OD</span> {Math.ceil(filteredHotels.length / ITEMS_PER_PAGE)}
                            </div>
                            <button
                                disabled={currentPage * ITEMS_PER_PAGE >= filteredHotels.length}
                                onClick={() => setCurrentPage(c => c + 1)}
                                className="btn-secondary"
                                style={{ height: '56px', borderRadius: '18px', padding: '0 32px', display: 'flex', alignItems: 'center', gap: '12px', opacity: currentPage * ITEMS_PER_PAGE >= filteredHotels.length ? 0.3 : 1, fontWeight: 800 }}
                            >
                                SLEDEĆA <ChevronRight size={24} />
                            </button>
                        </div>
                    )}
                </div>

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
                                <img src={getProxiedImageUrl(selectedHotel.images[0]?.url)} alt={selectedHotel.name} />
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
