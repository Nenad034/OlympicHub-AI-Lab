import React, { useState, useEffect, useMemo } from 'react';
import {
    Calendar as CalendarIcon, Plus, Trash2, Zap, ArrowRight, Save,
    Clock, RefreshCw, Layers, MapPin, Hotel, Users,
    AlertTriangle, CheckCircle2, Search, Info, ChevronRight,
    ArrowUpCircle, ArrowDownCircle, Loader2, Bot, Filter,
    CalendarDays, X, Sparkles, Settings2, SlidersHorizontal,
    LayoutGrid, List, Menu, Building2, Calendar, ArrowLeft,
    Globe, Database, ExternalLink, Edit3, Eye, MoreVertical,
    CheckCircle, AlertCircle, LogIn, LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SmartDateInput from '../modules/pricing/SmartDateInput';
import { MultiSelectDropdown } from '../components/MultiSelectDropdown';
import { useThemeStore } from '../stores';
import { loadFromCloud, saveToCloud } from '../utils/storageUtils';

interface GeneratedShift {
    id: string;
    hotelId: string;
    hotelName: string;
    destination: string;
    from: string;
    to: string;
    nights: number;
    capacityDeparture: number;
    capacityReturn: number;
    soldDeparture: number;
    soldReturn: number;
    status: 'active' | 'sold_out' | 'draft';
    pricelistName?: string;
    entryDayLater?: boolean;
    exitDayLater?: boolean;
}

interface RecyclePattern {
    id: string;
    from: string;
    to: string;
    entryDays: string[];
    exitDays: string[];
    scopeHotels: string[];
    scopeDestinations: string[];
    status: 'active' | 'draft';
    pricelistName?: string;
}

const ShiftsGeneratorPage: React.FC = () => {
    const { theme } = useThemeStore();
    const DARK_BLUE = '#063970';

    // UI States
    const [viewMode, setViewMode] = useState<'shifts' | 'patterns'>('shifts');
    const [showGeneratorLayer, setShowGeneratorLayer] = useState(true);

    // Data States
    const [hotels, setHotels] = useState<any[]>([]);
    const [destinations, setDestinations] = useState<any[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [generatedShifts, setGeneratedShifts] = useState<GeneratedShift[]>([]);
    const [recyclePatterns, setRecyclePatterns] = useState<RecyclePattern[]>([]);
    const [allPricelists, setAllPricelists] = useState<any[]>([]);
    const [scopePricelists, setScopePricelists] = useState<string[]>(['all']);

    // Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDestinations, setFilterDestinations] = useState<string[]>(['all']);

    // Generator Context (Robot)
    const [scopeDestinations, setScopeDestinations] = useState<string[]>(['all']);
    const [scopeHotels, setScopeHotels] = useState<string[]>(['all']);
    const [batchStart, setBatchStart] = useState('2026-06-01');
    const [batchEnd, setBatchEnd] = useState('2026-09-01');
    const [batchNights, setBatchNights] = useState<number | ''>(10);
    const [baseCapacity, setBaseCapacity] = useState<number | ''>(100);
    const [entryDayLater, setEntryDayLater] = useState(false);
    const [exitDayLater, setExitDayLater] = useState(false);

    // Entry Master State (Reciklusi)
    const [patternStart, setPatternStart] = useState('2026-06-01');
    const [patternEnd, setPatternEnd] = useState('2026-09-01');
    const [entryDays, setEntryDays] = useState<string[]>(['all']);
    const [exitDays, setExitDays] = useState<string[]>(['all']);

    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Editing state
    const [editingShift, setEditingShift] = useState<GeneratedShift | null>(null);

    useEffect(() => {
        const fetchAllData = async () => {
            setIsLoadingData(true);
            const propertiesRes = await loadFromCloud('properties');
            const destinationsRes = await loadFromCloud('destinations');
            const savedShiftsRes = await loadFromCloud('generated_shifts');
            const savedPatternsRes = await loadFromCloud('recycle_patterns');
            const pricelistsRes = await loadFromCloud('pricelists');

            let finalDestinations: any[] = [];
            const uniqueDestsMap = new Map<string, string>();

            // 1. Load from Destinations table
            if (destinationsRes.success && destinationsRes.data) {
                destinationsRes.data.forEach((d: any) => {
                    const name = d.name || d.label || '';
                    if (name) uniqueDestsMap.set(name.toLowerCase(), name);
                });
            }

            // 2. Load and merge from Properties (Smestaj)
            if (propertiesRes.success && propertiesRes.data) {
                setHotels(propertiesRes.data);
                propertiesRes.data.forEach((h: any) => {
                    // Check multiple possible paths for city name based on current DB structure
                    const city = h.location?.place ||
                        h.originalPropertyData?.address?.city ||
                        h.originalPropertyData?.location?.place ||
                        h.address?.city ||
                        '';

                    if (city) {
                        const trimmedCity = city.trim();
                        if (trimmedCity) uniqueDestsMap.set(trimmedCity.toLowerCase(), trimmedCity);
                    }
                });
            }

            finalDestinations = Array.from(uniqueDestsMap.entries()).map(([value, label]) => ({
                value,
                label
            }));

            setDestinations(finalDestinations);

            // Load saved data if exists
            if (savedShiftsRes.success && savedShiftsRes.data && savedShiftsRes.data.length > 0) {
                setGeneratedShifts(savedShiftsRes.data);
            } else {
                // Fallback to demo data only if cloud is empty
                setGeneratedShifts([
                    { id: 'm1', hotelId: 'h1', hotelName: 'Hotel Potos', destination: 'Tasos', from: '2026-06-01', to: '2026-06-11', nights: 10, capacityDeparture: 100, capacityReturn: 100, soldDeparture: 45, soldReturn: 20, status: 'active' },
                    { id: 'm2', hotelId: 'h2', hotelName: 'Villa Eleni', destination: 'Lefkada', from: '2026-06-11', to: '2026-06-21', nights: 10, capacityDeparture: 50, capacityReturn: 50, soldDeparture: 28, soldReturn: 12, status: 'active' }
                ]);
            }

            if (savedPatternsRes.success && savedPatternsRes.data && savedPatternsRes.data.length > 0) {
                setRecyclePatterns(savedPatternsRes.data);
            } else {
                setRecyclePatterns([
                    { id: 'p1', from: '2026-06-01', to: '2026-09-01', entryDays: ['1', '4'], exitDays: ['1', '4'], scopeHotels: ['all'], scopeDestinations: ['Tasos'], status: 'active' }
                ]);
            }

            if (pricelistsRes.success && pricelistsRes.data) {
                setAllPricelists(pricelistsRes.data);
            }

            setIsLoadingData(false);
        };

        fetchAllData();
    }, []);

    const daysOfWeek = [
        { value: '0', label: 'Nedelja' }, { value: '1', label: 'Ponedeljak' }, { value: '2', label: 'Utorak' },
        { value: '3', label: 'Sreda' }, { value: '4', label: 'Četvrtak' }, { value: '5', label: 'Petak' }, { value: '6', label: 'Subota' }
    ];

    const filteredShifts = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        let normalizedDateQuery = '';
        if (/^\d{8}$/.test(query)) {
            normalizedDateQuery = `${query.substring(4, 8)}-${query.substring(2, 4)}-${query.substring(0, 2)}`;
        }

        return generatedShifts.filter(s => {
            const matchesDestFilter = filterDestinations.includes('all') || filterDestinations.includes(s.destination.toLowerCase());
            if (!matchesDestFilter) return false;

            if (query === '') return true;

            const hotelMatch = s.hotelName.toLowerCase().includes(query);
            const destinationMatch = s.destination.toLowerCase().includes(query);
            const dateMatch = (normalizedDateQuery && (s.from === normalizedDateQuery || s.to === normalizedDateQuery)) ||
                new Date(s.from).toLocaleDateString('sr-RS').includes(query) ||
                new Date(s.to).toLocaleDateString('sr-RS').includes(query);

            return hotelMatch || destinationMatch || dateMatch;
        });
    }, [generatedShifts, searchQuery, filterDestinations]);

    const filteredPatterns = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        let normalizedDateQuery = '';
        if (/^\d{8}$/.test(query)) {
            normalizedDateQuery = `${query.substring(4, 8)}-${query.substring(2, 4)}-${query.substring(0, 2)}`;
        }

        return recyclePatterns.filter(p => {
            if (query === '') return true;

            const destLabel = p.scopeDestinations.join(', ').toLowerCase();
            const hotelMatch = p.scopeHotels.includes('all')
                ? 'svi objekti'.includes(query)
                : hotels.some(h => p.scopeHotels.includes(h.id) && h.name.toLowerCase().includes(query));

            const dateMatch = (normalizedDateQuery && (p.from === normalizedDateQuery || p.to === normalizedDateQuery)) ||
                new Date(p.from).toLocaleDateString('sr-RS').includes(query) ||
                new Date(p.to).toLocaleDateString('sr-RS').includes(query);

            return destLabel.includes(query) || hotelMatch || dateMatch;
        });
    }, [recyclePatterns, searchQuery, hotels]);

    const hotelsByDest = useMemo(() => {
        return hotels.filter(h => {
            const city = (h.originalPropertyData?.address?.city || h.location?.place || '').toLowerCase();
            return scopeDestinations.includes('all') || scopeDestinations.includes(city);
        }).map(h => ({ value: h.id, label: h.name }));
    }, [hotels, scopeDestinations]);

    const pricelistsOptions = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return allPricelists
            .filter(pl => {
                const hotelMatch = scopeHotels.includes('all') || scopeHotels.includes(pl.property_id);
                const notExpired = !pl.stay_to || pl.stay_to >= today;
                return hotelMatch && notExpired;
            })
            .map(pl => {
                const hotelName = hotels.find(h => h.id === pl.property_id)?.name || 'Nepoznat hotel';
                return {
                    value: pl.id,
                    label: `${pl.title} (${hotelName})`
                };
            });
    }, [allPricelists, scopeHotels, hotels]);

    const handleSave = async () => {
        setIsSaving(true);
        // Save both shifts and patterns to Supabase
        const resShifts = await saveToCloud('generated_shifts', generatedShifts);
        const resPatterns = await saveToCloud('recycle_patterns', recyclePatterns);

        setIsSaving(false);
        if (resShifts.success && resPatterns.success) {
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } else {
            alert('Greška pri čuvanju podataka na serveru.');
        }
    };

    const generateShifts = () => {
        const targets = hotels.filter(h => {
            const city = (h.originalPropertyData?.address?.city || h.location?.place || '').toLowerCase();
            const destMatch = scopeDestinations.includes('all') || scopeDestinations.includes(city);
            const hotelMatch = scopeHotels.includes('all') || scopeHotels.includes(h.id);
            return destMatch && hotelMatch;
        });
        if (targets.length === 0) return alert('Izaberite hotele.');

        const newShifts: GeneratedShift[] = [];
        targets.forEach(hotel => {
            const hotelCity = hotel.originalPropertyData?.address?.city || hotel.location?.place || 'Nepoznato';
            let current = new Date(batchStart);
            const end = new Date(batchEnd);
            while (current < end) {
                const from = current.toISOString().split('T')[0];
                const next = new Date(current);
                next.setDate(next.getDate() + (batchNights === '' ? 0 : batchNights));
                const to = next.toISOString().split('T')[0];
                newShifts.push({
                    id: Math.random().toString(36).substr(2, 9),
                    hotelId: hotel.id, hotelName: hotel.name, destination: hotelCity,
                    from, to, nights: batchNights === '' ? 0 : batchNights,
                    capacityDeparture: Number(baseCapacity) || 0,
                    capacityReturn: Number(baseCapacity) || 0,
                    soldDeparture: 0, soldReturn: 0, status: 'draft',
                    pricelistName: scopePricelists.includes('all')
                        ? 'Svi dostupni cenovnici'
                        : scopePricelists.map(id => allPricelists.find(pl => pl.id === id)?.title).filter(Boolean).join(', '),
                    entryDayLater,
                    exitDayLater
                });
                current = next;
            }
        });
        setGeneratedShifts([...newShifts, ...generatedShifts]);
    };

    const addRecyclePattern = () => {
        if (entryDays.length === 0 || exitDays.length === 0) return alert('Izaberite dane ulaska i izlaska.');

        const newPattern: RecyclePattern = {
            id: Math.random().toString(36).substr(2, 9),
            from: patternStart,
            to: patternEnd,
            entryDays,
            exitDays,
            scopeHotels,
            scopeDestinations,
            status: 'draft',
            pricelistName: scopePricelists.includes('all')
                ? 'Svi dostupni cenovnici'
                : scopePricelists.map(id => allPricelists.find(pl => pl.id === id)?.title).filter(Boolean).join(', ')
        };

        setRecyclePatterns([newPattern, ...recyclePatterns]);
        setViewMode('patterns');
    };

    // Styling helpers for clear borders and centered items
    const commonBorder = '1px solid var(--border)';

    const fieldStyle: React.CSSProperties = {
        background: 'var(--bg-input)',
        border: commonBorder,
        borderRadius: '10px',
        color: DARK_BLUE,
        padding: '10px 14px',
        fontSize: '13px',
        fontWeight: 600,
        outline: 'none',
        height: '42px',
        width: '100%',
        boxSizing: 'border-box',
        textAlign: 'center'
    };

    const sectionTitleStyle: React.CSSProperties = {
        fontSize: '10px',
        fontWeight: 900,
        color: DARK_BLUE,
        letterSpacing: '2px',
        marginBottom: '16px',
        textAlign: 'center'
    };

    return (
        <div style={{ padding: '32px', minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-primary)' }}>

            {/* 1. TOP HEADER */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 900, letterSpacing: '-1px' }}>PLANER SMENA</h1>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={() => setShowGeneratorLayer(!showGeneratorLayer)}
                        style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', border: commonBorder, borderRadius: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        {showGeneratorLayer ? <X size={18} /> : <Settings2 size={18} />} {showGeneratorLayer ? 'ZATVORI KONFIGURATOR' : 'KONFIGURIŠI PLAN'}
                    </button>
                    <button
                        onClick={handleSave}
                        style={{ padding: '12px 24px', background: 'var(--gradient-green)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        {isSaving ? <Loader2 size={18} className="spin" /> : <Save size={18} />} {showSuccess ? 'SAČUVANO' : 'SAČUVAJ PLAN'}
                    </button>
                </div>
            </header>

            {/* 2. MAIN GENERATOR LAYER */}
            <AnimatePresence>
                {showGeneratorLayer && (
                    <motion.div
                        initial={{ height: 0, opacity: 0, y: -20 }}
                        animate={{ height: 'auto', opacity: 1, y: 0 }}
                        exit={{ height: 0, opacity: 0, y: -20 }}
                        style={{
                            width: '100%',
                            background: 'var(--bg-card)',
                            border: commonBorder,
                            borderRadius: '24px',
                            padding: '32px',
                            marginBottom: '32px',
                            display: 'grid',
                            gridTemplateColumns: 'minmax(250px, 1fr) minmax(400px, 1.5fr) minmax(400px, 1.5fr)',
                            gap: '32px',
                            position: 'relative',
                            zIndex: 100,
                            overflow: 'visible',
                            color: DARK_BLUE
                        }}
                    >
                        {/* 01. OBIM (OBJEKTI) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={sectionTitleStyle}>01. OBIM (OBJEKTI)</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                                <div style={{ border: commonBorder, borderRadius: '10px', width: '100%' }}>
                                    <MultiSelectDropdown options={destinations} selected={scopeDestinations} onChange={setScopeDestinations} placeholder="SVE DESTINACIJE" />
                                </div>
                                <div style={{ border: commonBorder, borderRadius: '10px', width: '100%' }}>
                                    <MultiSelectDropdown options={hotelsByDest} selected={scopeHotels} onChange={setScopeHotels} placeholder="SVI HOTELI" />
                                </div>
                                <div style={{ border: commonBorder, borderRadius: '10px', width: '100%' }}>
                                    <MultiSelectDropdown options={pricelistsOptions} selected={scopePricelists} onChange={setScopePricelists} placeholder="SVI CENOVNICI" />
                                </div>
                            </div>
                        </div>

                        {/* 02. ROBOT (PERIOD SEZONE) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: commonBorder, borderRight: commonBorder, padding: '0 32px' }}>
                            <div style={sectionTitleStyle}>02. MODUL POLAZAKA (ROBOT)</div>

                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ display: 'flex', background: 'rgba(0,0,0,0.03)', borderRadius: '10px', overflow: 'hidden', border: commonBorder, flex: 1 }}>
                                    <div style={{ flex: 1 }}><SmartDateInput label="OD:" value={batchStart} onChange={setBatchStart} style={{ border: 'none', background: 'transparent' }} /></div>
                                    <div style={{ width: '1px', background: 'var(--border-subtle)' }}></div>
                                    <div style={{ flex: 1 }}><SmartDateInput label="DO:" value={batchEnd} onChange={setBatchEnd} style={{ border: 'none', background: 'transparent' }} /></div>
                                </div>
                                <div style={{ width: '70px' }}>
                                    <input type="number" placeholder="Noći" value={batchNights} onChange={e => setBatchNights(Number(e.target.value))} style={{ ...fieldStyle, background: 'rgba(0,0,0,0.03)' }} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', margin: '8px 0' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: DARK_BLUE }}>
                                    <input
                                        type="checkbox"
                                        checked={entryDayLater}
                                        onChange={(e) => setEntryDayLater(e.target.checked)}
                                        style={{ width: '16px', height: '16px', accentColor: '#3b82f6' }}
                                    />
                                    Ulazak dan kasnije
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: DARK_BLUE }}>
                                    <input
                                        type="checkbox"
                                        checked={exitDayLater}
                                        onChange={(e) => setExitDayLater(e.target.checked)}
                                        style={{ width: '16px', height: '16px', accentColor: '#3b82f6' }}
                                    />
                                    Povratak dan kasnije
                                </label>
                            </div>

                            <button
                                onClick={generateShifts}
                                style={{ width: '100%', padding: '12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 900, cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: 'auto' }}
                            >
                                <Zap size={16} fill="#fff" /> GENERIŠI SVE SMENE
                            </button>
                        </div>

                        {/* 03. RECIKLUSI (ENTRY MASTER) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={sectionTitleStyle}>03. ULAZ / IZLAZ (RECIKLUSI)</div>

                            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.03)', borderRadius: '10px', overflow: 'hidden', border: commonBorder, width: '100%' }}>
                                <div style={{ flex: 1 }}><SmartDateInput label="OD:" value={patternStart} onChange={setPatternStart} style={{ border: 'none', background: 'transparent' }} /></div>
                                <div style={{ width: '1px', background: 'var(--border-subtle)' }}></div>
                                <div style={{ flex: 1 }}><SmartDateInput label="DO:" value={patternEnd} onChange={setPatternEnd} style={{ border: 'none', background: 'transparent' }} /></div>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                <div style={{ flex: 1, border: commonBorder, borderRadius: '10px' }}>
                                    <MultiSelectDropdown options={daysOfWeek} selected={entryDays} onChange={setEntryDays} placeholder="DAN ULASKA" />
                                </div>
                                <div style={{ flex: 1, border: commonBorder, borderRadius: '10px' }}>
                                    <MultiSelectDropdown options={daysOfWeek} selected={exitDays} onChange={setExitDays} placeholder="DAN IZLASKA" />
                                </div>
                            </div>

                            <button
                                onClick={addRecyclePattern}
                                style={{ width: '100%', padding: '12px', background: 'linear-gradient(to right, #3b82f6, #6366f1)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', marginTop: 'auto' }}
                            >
                                <Sparkles size={16} fill="#fff" /> DODAJ PRAVILO RECIKLUSA
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 3. SUB-FILTER BAR */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', background: 'var(--bg-card)', padding: '5px', borderRadius: '12px', border: commonBorder }}>
                    <button onClick={() => setViewMode('shifts')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: viewMode === 'shifts' ? '#3b82f6' : 'transparent', color: viewMode === 'shifts' ? '#fff' : 'var(--text-secondary)', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}>SMENE</button>
                    <button onClick={() => setViewMode('patterns')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: viewMode === 'patterns' ? '#3b82f6' : 'transparent', color: viewMode === 'patterns' ? '#fff' : 'var(--text-secondary)', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}>RECIKLUSI</button>
                </div>

                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', opacity: 0.5 }} />
                    <input
                        placeholder={viewMode === 'shifts' ? "Pretraži smene..." : "Pretraži pravila..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ width: '100%', padding: '12px 16px 12px 48px', borderRadius: '14px', background: 'var(--bg-sidebar)', border: commonBorder, color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
                    />
                </div>

                <div style={{ width: '220px', border: commonBorder, borderRadius: '14px' }}>
                    <MultiSelectDropdown options={destinations} selected={filterDestinations} onChange={setFilterDestinations} placeholder="SVE DESTINACIJE" />
                </div>
            </div>

            {/* 4. MAIN LIST */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {isLoadingData ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <Loader2 size={24} className="spin" style={{ marginBottom: '12px' }} />
                        <div>Učitavanje podataka...</div>
                    </div>
                ) : viewMode === 'shifts' ? (
                    filteredShifts.map(item => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                display: 'grid', gridTemplateColumns: '100px 2fr 1fr 1fr 1fr 100px',
                                padding: '16px 24px', background: 'var(--bg-card)', border: commonBorder,
                                borderRadius: '16px', alignItems: 'center', marginBottom: '8px'
                            }}
                        >
                            <div>
                                <div style={{ background: 'var(--success-bg)', color: 'var(--accent-green)', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 900, width: 'fit-content' }}>LIVE</div>
                            </div>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                                    <Calendar size={18} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: '14px' }}>{new Date(item.from).toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit', year: 'numeric' })} — {new Date(item.to).toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                        <Building2 size={12} style={{ opacity: 0.6 }} /> {item.hotelName}
                                        <span style={{ color: 'var(--accent)', opacity: 0.8 }}>({item.destination})</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                                        {item.entryDayLater && (
                                            <div style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '4px', fontSize: '9px', fontWeight: 800, border: '1px solid #f59e0b' }}>
                                                ULAZ DAN KASNIJE
                                            </div>
                                        )}
                                        {item.exitDayLater && (
                                            <div style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '4px', fontSize: '9px', fontWeight: 800, border: '1px solid #f59e0b' }}>
                                                POVRATAK DAN KASNIJE
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 700, marginTop: '6px', background: 'var(--bg-sidebar)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-subtle)', width: 'fit-content', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Database size={10} style={{ color: 'var(--accent)' }} /> {item.pricelistName || 'Nije dodeljen cenovnik'}
                                    </div>
                                </div>
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: 700 }}>
                                {item.nights} noćenja
                                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 400, marginTop: '4px' }}>Standardno</div>
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={12} /> {item.destination}</div>
                                <div style={{ fontSize: '10px', opacity: 0.6 }}>Regija: {item.destination}</div>
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <div style={{ padding: '4px 8px', background: 'var(--bg-input)', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>{item.capacityDeparture - item.soldDeparture} SL</div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => setEditingShift(item)}
                                    style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'var(--bg-input)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                                >
                                    <Edit3 size={14} />
                                </button>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    filteredPatterns.map(item => {
                        const destNames = item.scopeDestinations.includes('all')
                            ? 'Sve lokacije'
                            : item.scopeDestinations.map(sd => destinations.find(d => d.value === sd)?.label || sd).join(', ');

                        const hotelNames = item.scopeHotels.includes('all')
                            ? (item.scopeDestinations.includes('all') ? 'Svi objekti u bazi' : `Svi hoteli u regiji: ${destNames}`)
                            : (() => {
                                const names = hotels.filter(h => item.scopeHotels.includes(h.id)).map(h => h.name);
                                return names.length > 3 ? `${names.length} izabrana hotela` : names.join(', ');
                            })();

                        return (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    display: 'grid', gridTemplateColumns: '100px 2fr 1.5fr 1fr 100px',
                                    padding: '16px 24px', background: 'var(--bg-card)', border: commonBorder,
                                    borderRadius: '16px', alignItems: 'center', marginBottom: '2px'
                                }}
                            >
                                <div>
                                    <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 900, width: 'fit-content' }}>RECIKLUS</div>
                                </div>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                                        <RefreshCw size={18} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ fontWeight: 800, fontSize: '14px' }}>Pravilo: {item.exitDays.length} ulaza / {item.entryDays.length} izlaza</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                            {hotelNames}
                                        </div>
                                        <div style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 500 }}>Period: {new Date(item.from).toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit', year: 'numeric' })} — {new Date(item.to).toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 700, marginTop: '4px', background: 'var(--bg-sidebar)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-subtle)', width: 'fit-content', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Database size={10} style={{ color: 'var(--accent)' }} /> {item.pricelistName || 'Svi cenovnici'}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ fontSize: '12px', fontWeight: 700, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <LogIn size={12} /> ULAZ: {item.entryDays.includes('all') ? 'Svi dani' : item.entryDays.map(d => daysOfWeek.find(dw => dw.value === d)?.label).join(', ')}
                                    </div>
                                    <div style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <LogOut size={12} /> IZLAZ: {item.exitDays.includes('all') ? 'Svi dani' : item.exitDays.map(d => daysOfWeek.find(dw => dw.value === d)?.label).join(', ')}
                                    </div>
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <MapPin size={12} /> {destNames}
                                </div>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                    <button style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'var(--bg-input)', color: 'var(--text-secondary)', cursor: 'pointer' }}><Edit3 size={14} /></button>
                                    <button
                                        onClick={() => setRecyclePatterns(recyclePatterns.filter(p => p.id !== item.id))}
                                        style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', cursor: 'pointer' }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>

            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>

            <AnimatePresence>
                {editingShift && (
                    <div className="modal-overlay-blur" style={{ zIndex: 9999 }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="modal-content-glass"
                            style={{ width: '500px' }}
                        >
                            <div className="modal-header">
                                <div>
                                    <h3 style={{ color: 'var(--text-primary)' }}>Uredi Smenu</h3>
                                    <div style={{ fontSize: '12px', color: 'var(--accent)' }}>{editingShift.hotelName}</div>
                                </div>
                                <button onClick={() => setEditingShift(null)}><X size={20} /></button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ display: 'flex', background: 'var(--bg-sidebar)', borderRadius: '10px', overflow: 'hidden', border: commonBorder }}>
                                    <div style={{ flex: 1 }}><SmartDateInput label="OD:" value={editingShift.from} onChange={(val) => setEditingShift({ ...editingShift, from: val })} style={{ border: 'none', background: 'transparent' }} /></div>
                                    <div style={{ width: '1px', background: 'var(--border-subtle)' }}></div>
                                    <div style={{ flex: 1 }}><SmartDateInput label="DO:" value={editingShift.to} onChange={(val) => setEditingShift({ ...editingShift, to: val })} style={{ border: 'none', background: 'transparent' }} /></div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>KAPACITET</label>
                                        <input
                                            type="number"
                                            value={editingShift.capacityDeparture}
                                            onChange={(e) => setEditingShift({ ...editingShift, capacityDeparture: Number(e.target.value) })}
                                            style={fieldStyle}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>NOĆENJA</label>
                                        <input
                                            type="number"
                                            value={editingShift.nights}
                                            onChange={(e) => setEditingShift({ ...editingShift, nights: Number(e.target.value) })}
                                            style={fieldStyle}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer" style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    className="btn-secondary"
                                    style={{ flex: 1 }}
                                    onClick={() => setEditingShift(null)}
                                >
                                    ODUSTANI
                                </button>
                                <button
                                    className="btn-primary-glow"
                                    style={{ flex: 1 }}
                                    onClick={() => {
                                        setGeneratedShifts(generatedShifts.map(s => s.id === editingShift.id ? editingShift : s));
                                        setEditingShift(null);
                                    }}
                                >
                                    SAČUVAJ IZMENE
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ShiftsGeneratorPage;
