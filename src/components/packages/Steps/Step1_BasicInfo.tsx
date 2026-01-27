import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Users, Euro, Plus, X, Sparkles } from 'lucide-react';
import type { BasicInfoData, DestinationInput, TravelerCount } from '../../../types/packageSearch.types';

interface Step1Props {
    data: BasicInfoData | null;
    onUpdate: (data: BasicInfoData) => void;
    onNext: () => void;
}

// --- MOCK AI KNOWLEDGE BASE ---
const DESTINATION_GUIDES: Record<string, { title: string, desc: string, tip: string, image: string }> = {
    'tasos': {
        title: 'Tasos: Smaragdno Ostrvo',
        desc: 'Izgubljeni biser Egeja gde se borove šume spuštaju direktno u tirkizno more. Ostrvo mermera, meda i netaknute prirode koje nudi savršen balans između avanture i potpunog mira.',
        tip: 'Posetite Giola prirodni bazen rano ujutru pre gužve, a zatim ručajte u selu Theologos (probajte jaretinu!).',
        image: 'https://images.unsplash.com/photo-1596316891636-f09b55589688?q=80&w=2070&auto=format&fit=crop'
    },
    'milano': {
        title: 'Milano: Prestonica Stila',
        desc: 'Više od mode – Milano je grad gde se istorija susreće sa futurizmom. Od gotičke katedrale Duomo do modernih nebodera Porta Nuova dizajnerskog distrikta.',
        tip: 'Preskočite redove za Duomo kupovinom "Fast Track" karte online. Obavezno idite na aperitivo u Navigli distriktu posle 18h.',
        image: 'https://images.unsplash.com/photo-1513581166391-887a96ddeafd?q=80&w=2070&auto=format&fit=crop'
    },
    'santorini': {
        title: 'Santorini: Vulkanska Magija',
        desc: 'Najfotogeničnije ostrvo sveta. Bele kuće sa plavim kupolama na liticama Kaldera kratera nude prizore koji oduzimaju dah, posebno tokom zalaska sunca.',
        tip: 'Izbegnite gužvu u Oiji tokom zalaska sunca – idite u Imerovigli ("Skaros Rock") za podjednako lep, ali mnogo privatniji pogled.',
        image: 'https://images.unsplash.com/photo-1613395877344-13d4c79e4284?q=80&w=2070&auto=format&fit=crop'
    },
    'pariz': {
        title: 'Pariz: Grad Svetlosti',
        desc: 'Večna inspiracija umetnika i ljubavnika. Grad muzeja, bulevara, kafea i neodoljivog šarma koji se mora doživeti bar jednom (ili sto puta) u životu.',
        tip: 'Umesto penjanja na Ajfelov toranj, popnite se na Trijumfalnu kapiju – odatle imate najbolji pogled NA Ajfelov toranj.',
        image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2073&auto=format&fit=crop'
    },
    'rim': {
        title: 'Rim: Večni Grad',
        desc: 'Muzej na otvorenom. Svaki kamen priča priču staru hiljadama godina. Haotičan, strastven i apsolutno prelep u svojoj nesavršenosti.',
        tip: 'Kupite kartu za Koloseum koja uključuje i Palatin i Rimski forum. Najbolja pasta Carbonara nije u turističkom centru, već u delu Trastevere.',
        image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=1996&auto=format&fit=crop'
    }
};

const Step1_BasicInfo: React.FC<Step1Props> = ({ data, onUpdate, onNext }) => {
    // ... (existing state code) ...
    const [destinations, setDestinations] = useState<DestinationInput[]>(
        data?.destinations || [{
            id: '1',
            city: '',
            country: '',
            countryCode: '',
            airportCode: '',
            checkIn: '',
            checkOut: '',
            nights: 0
        }]
    );
    const [travelers, setTravelers] = useState<TravelerCount>(
        data?.travelers || {
            adults: 2,
            children: 0,
            childrenAges: []
        }
    );
    const [budget, setBudget] = useState<number | undefined>(data?.budget);

    // --- AI GUIDE STATE ---
    // Stores array of { index, guideData } for matched cities
    const [availableGuides, setAvailableGuides] = useState<Array<{ index: number, city: string, data: any }>>([]);
    const [selectedGuideIndex, setSelectedGuideIndex] = useState<number>(0); // Index within availableGuides array
    const [showGuideModal, setShowGuideModal] = useState(false);

    // Check for guide availability when ANY destination changes
    useEffect(() => {
        const matches: Array<{ index: number, city: string, data: any }> = [];

        destinations.forEach((dest, idx) => {
            const cityKey = dest.city?.toLowerCase().trim();
            if (cityKey && DESTINATION_GUIDES[cityKey]) {
                matches.push({
                    index: idx,
                    city: dest.city,
                    data: DESTINATION_GUIDES[cityKey]
                });
            }
        });

        setAvailableGuides(matches);
        // Reset selection if out of bounds (though typically we want to keep current selection if possible, but for simplicity reset to 0 or clamp)
        if (selectedGuideIndex >= matches.length) {
            setSelectedGuideIndex(0);
        }
    }, [destinations]); // Re-run whenever destinations change

    const currentGuide = availableGuides[selectedGuideIndex];

    // ... (existing helper functions: calculateNights, updateDestination, etc.) ...

    // Calculate nights when dates change
    const calculateNights = (checkIn: string, checkOut: string): number => {
        if (!checkIn || !checkOut) return 0;
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const diff = end.getTime() - start.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    // Update destination
    const updateDestination = (index: number, field: keyof DestinationInput, value: any) => {
        const updated = [...destinations];
        updated[index] = { ...updated[index], [field]: value };

        // Auto-calculate nights if dates changed
        if (field === 'checkIn' || field === 'checkOut') {
            updated[index].nights = calculateNights(updated[index].checkIn, updated[index].checkOut);
        }

        setDestinations(updated);
    };

    // Add destination
    const addDestination = () => {
        setDestinations([
            ...destinations,
            {
                id: String(destinations.length + 1),
                city: '',
                country: '',
                countryCode: '',
                airportCode: '',
                checkIn: '',
                checkOut: '',
                nights: 0
            }
        ]);
    };

    // Remove destination
    const removeDestination = (index: number) => {
        if (destinations.length > 1) {
            setDestinations(destinations.filter((_, i) => i !== index));
        }
    };

    // Update travelers
    const updateTravelers = (field: keyof TravelerCount, value: number) => {
        const updated = { ...travelers, [field]: value };

        // Update children ages array
        if (field === 'children') {
            updated.childrenAges = Array(value).fill(0);
        }

        setTravelers(updated);
    };

    // Effect to update parent when state changes
    useEffect(() => {
        const startDate = destinations[0]?.checkIn || '';
        const endDate = destinations[destinations.length - 1]?.checkOut || '';
        const totalDays = calculateNights(startDate, endDate);

        const basicInfo: BasicInfoData = {
            destinations,
            travelers,
            budget,
            currency: 'EUR',
            startDate,
            endDate,
            totalDays
        };
        onUpdate(basicInfo);
    }, [destinations, travelers, budget]);

    return (
        <div className="step-content" style={{ position: 'relative' }}>
            <div className="step-header">
                <h2>Osnovne Informacije</h2>
                <p>Unesite destinacije, datume i broj putnika</p>
            </div>

            {/* AI GUIDE TOAST - MULTI SUPPORT */}
            {availableGuides.length > 0 && !showGuideModal && (
                <div style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: '0 10px 25px rgba(118, 75, 162, 0.4)',
                    zIndex: 10,
                    animation: 'slideInRight 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    maxWidth: '300px',
                    cursor: 'pointer'
                }} onClick={() => setShowGuideModal(true)}>
                    <div style={{
                        background: 'rgba(255,255,255,0.2)',
                        borderRadius: '50%',
                        width: '32px', height: '32px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Sparkles size={16} color="white" />
                    </div>
                    <div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', fontWeight: 600, textTransform: 'uppercase' }}>
                            {availableGuides.length > 1 ? 'AI ASISTENT' : 'AI VODIČ DOSTUPAN'}
                        </div>
                        <div style={{ fontSize: '13px', color: 'white', fontWeight: 700 }}>
                            {availableGuides.length > 1
                                ? `Saznajte više o ${availableGuides.length} destinacije`
                                : `Saznajte više o ${availableGuides[0].city}`}
                        </div>
                    </div>
                    <X size={14} color="rgba(255,255,255,0.6)" style={{ marginLeft: 'auto' }}
                        onClick={(e) => { e.stopPropagation(); setAvailableGuides([]); }} />
                </div>
            )}

            {/* AI GUIDE MODAL - MULTI DESTINATION */}
            {showGuideModal && currentGuide && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(8px)'
                }} onClick={() => setShowGuideModal(false)}>

                    <div style={{
                        width: '700px',
                        background: '#1e293b',
                        borderRadius: '24px',
                        overflow: 'hidden',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        animation: 'scaleIn 0.3s ease-out',
                        display: 'flex',
                        height: '500px'
                    }} onClick={e => e.stopPropagation()}>

                        {/* LEFT SIDEBAR - NAVIGATION */}
                        <div style={{
                            width: '200px',
                            background: '#0f172a',
                            borderRight: '1px solid rgba(255,255,255,0.1)',
                            padding: '20px',
                            display: 'flex', flexDirection: 'column', gap: '8px'
                        }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '12px', textTransform: 'uppercase' }}>
                                Dostupni Vodiči
                            </div>
                            {availableGuides.map((g, i) => (
                                <button
                                    key={i}
                                    onClick={() => setSelectedGuideIndex(i)}
                                    style={{
                                        textAlign: 'left',
                                        background: i === selectedGuideIndex ? '#334155' : 'transparent',
                                        color: i === selectedGuideIndex ? 'white' : '#94a3b8',
                                        border: 'none',
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        fontSize: '13px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                    }}
                                >
                                    {g.city}
                                    {destinations[g.index].includedGuide && <Sparkles size={10} color="#10b981" />}
                                </button>
                            ))}
                        </div>

                        {/* RIGHT SIDE - CONTENT */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                            {/* Image Header */}
                            <div style={{
                                height: '180px',
                                background: `url(${currentGuide.data.image}) center/cover no-repeat`,
                                position: 'relative',
                                flexShrink: 0
                            }}>
                                <div style={{
                                    position: 'absolute', inset: 0,
                                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(30,41,59,1))'
                                }}></div>
                                <button style={{
                                    position: 'absolute', top: '15px', right: '15px',
                                    background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white',
                                    borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }} onClick={() => setShowGuideModal(false)}>
                                    <X size={18} />
                                </button>
                                <div style={{
                                    position: 'absolute', bottom: '20px', left: '24px'
                                }}>
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        marginBottom: '6px', color: '#a78bfa', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase'
                                    }}>
                                        <Sparkles size={12} /> Olympic AI Experience
                                    </div>
                                    <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'white', margin: 0 }}>{currentGuide.data.title}</h3>
                                </div>
                            </div>

                            {/* Content */}
                            <div style={{ padding: '24px', flex: 1 }}>
                                <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#cbd5e1', marginBottom: '20px' }}>
                                    {currentGuide.data.desc}
                                </p>

                                <div style={{
                                    background: 'rgba(124, 58, 237, 0.1)',
                                    borderLeft: '4px solid #7c3aed',
                                    padding: '12px 16px',
                                    borderRadius: '0 8px 8px 0',
                                    marginBottom: '20px'
                                }}>
                                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', marginBottom: '4px' }}>
                                        EXPERT PRO TIP
                                    </div>
                                    <p style={{ fontSize: '13px', color: 'white', margin: 0, fontStyle: 'italic' }}>
                                        "{currentGuide.data.tip}"
                                    </p>
                                </div>

                                {/* INCLUDE IN OFFER OPTION - FOR CURRENT DESTINATION */}
                                <div style={{
                                    marginTop: 'auto',
                                    padding: '12px 16px',
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    border: destinations[currentGuide.index].includedGuide ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)'
                                }}>
                                    <input
                                        type="checkbox"
                                        id={`includeGuideCheck-${currentGuide.index}`}
                                        checked={!!destinations[currentGuide.index].includedGuide}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                updateDestination(currentGuide.index, 'includedGuide', currentGuide.data);
                                            } else {
                                                updateDestination(currentGuide.index, 'includedGuide', undefined);
                                            }
                                        }}
                                        style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }}
                                    />
                                    <div>
                                        <label htmlFor={`includeGuideCheck-${currentGuide.index}`} style={{ color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'block' }}>
                                            Uključi opis za {currentGuide.city}
                                        </label>
                                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>
                                            Dodaj ovaj sadržaj u finalnu ponudu za klijenta.
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Destinations */}
            <div className="form-section">
                <div className="section-header">
                    <h3><MapPin size={20} /> Destinacije</h3>
                    <button className="add-btn" onClick={addDestination}>
                        <Plus size={16} />
                        Dodaj Destinaciju
                    </button>
                </div>

                {destinations.map((dest, index) => (
                    <div key={dest.id} className="destination-card">
                        <div className="card-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span>Destinacija {index + 1}</span>
                                {dest.includedGuide && (
                                    <span style={{
                                        fontSize: '10px',
                                        background: '#10b981',
                                        color: 'white',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        display: 'flex', alignItems: 'center', gap: '4px'
                                    }}>
                                        <Sparkles size={8} /> AI OPIS UKLJUČEN
                                    </span>
                                )}
                            </div>
                            {destinations.length > 1 && (
                                <button
                                    className="remove-btn"
                                    onClick={() => removeDestination(index)}
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        {/* FIX: Explicit CSS Grid to prevent layout issues */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                            <div className="form-group">
                                <label className="form-label">Grad *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Milano"
                                    value={dest.city}
                                    onChange={(e) => updateDestination(index, 'city', e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Država</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Italija"
                                    value={dest.country}
                                    onChange={(e) => updateDestination(index, 'country', e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Check-in *</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={dest.checkIn}
                                    onChange={(e) => updateDestination(index, 'checkIn', e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Check-out *</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={dest.checkOut}
                                    onChange={(e) => updateDestination(index, 'checkOut', e.target.value)}
                                />
                            </div>

                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="form-label">Broj noći</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={dest.nights}
                                    readOnly
                                    style={{ opacity: 0.7, cursor: 'not-allowed' }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Travelers */}
            <div className="form-section">
                <h3><Users size={20} /> Putnici</h3>

                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label">Odrasli (18+) *</label>
                        <input
                            type="number"
                            className="form-input"
                            min="1"
                            max="10"
                            value={travelers.adults}
                            onChange={(e) => updateTravelers('adults', parseInt(e.target.value))}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Deca (0-17)</label>
                        <input
                            type="number"
                            className="form-input"
                            min="0"
                            max="10"
                            value={travelers.children}
                            onChange={(e) => updateTravelers('children', parseInt(e.target.value))}
                        />
                    </div>
                </div>

                {travelers.children > 0 && (
                    <div className="children-ages">
                        <label className="form-label">Uzrast dece</label>
                        <div className="ages-grid">
                            {travelers.childrenAges?.map((age, index) => (
                                <input
                                    key={index}
                                    type="number"
                                    className="form-input"
                                    placeholder={`Dete ${index + 1}`}
                                    min="0"
                                    max="17"
                                    value={age}
                                    onChange={(e) => {
                                        const updated = [...(travelers.childrenAges || [])];
                                        updated[index] = parseInt(e.target.value);
                                        setTravelers({ ...travelers, childrenAges: updated });
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Budget (Optional) */}
            <div className="form-section">
                <h3><Euro size={20} /> Budget (Opciono)</h3>

                <div className="form-group">
                    <label className="form-label">Maksimalni budžet</label>
                    <input
                        type="number"
                        className="form-input"
                        placeholder="3000"
                        value={budget || ''}
                        onChange={(e) => setBudget(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                    <span className="form-hint">
                        Unesite maksimalni budžet u EUR. Ovo će pomoći AI asistentu da predloži odgovarajuće pakete.
                    </span>
                </div>
            </div>

            {/* Summary */}
            <div className="step-summary">
                <h4>Pregled:</h4>
                <ul>
                    <li>{destinations.length} destinacija</li>
                    <li>{destinations.reduce((sum, d) => sum + d.nights, 0)} noći ukupno</li>
                    <li>{travelers.adults} odraslih + {travelers.children} dece</li>
                    {budget && <li>Budget: {budget.toFixed(2)} €</li>}
                </ul>
            </div>

        </div>
    );
};

export default Step1_BasicInfo;
