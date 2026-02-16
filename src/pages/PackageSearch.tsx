import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    MapPin, Calendar, Users, Plane, Hotel,
    Car, Ticket, Map, ChevronLeft, ChevronRight,
    Save, Check, Sparkles
} from 'lucide-react';
import type {
    PackageSearchState,
    WizardStep,
    BasicInfoData,
    FlightSelectionData,
    HotelSelectionData,
    TransferSelectionData,
    ExtraSelectionData,
    DestinationInput
} from '../types/packageSearch.types';
import './PackageSearch.css';
import '../components/packages/Steps/SmartSearchV2.css';

// Step components
import Step1_BasicInfo from '../components/packages/Steps/Step1_BasicInfo';
import Step2_FlightSelection from '../components/packages/Steps/Step2_FlightSelection';
import Step3_HotelSelection from '../components/packages/Steps/Step3_HotelSelection';
import Step4_TransferSelection from '../components/packages/Steps/Step4_TransferSelection';
import Step5_ExtrasSelection from '../components/packages/Steps/Step5_ExtrasSelection';
import Step6_ReviewConfirm from '../components/packages/Steps/Step6_ReviewConfirm';
import { dynamicPackageService } from '../services/dynamicPackageService';

// Services for Prefetching
import flightSearchManager from '../services/flight/flightSearchManager';
import { tctApi } from '../services/tctApi';
import type { UnifiedFlightOffer, FlightSearchParams } from '../types/flight.types';
import type { InternalHotelResult } from '../components/packages/Steps/Step3_HotelSelection';

const WIZARD_STEPS: WizardStep[] = [
    { id: 1, name: 'basic-info', title: 'Destinacije', description: 'Plan i putnici', isComplete: false, isActive: true },
    { id: 2, name: 'flights', title: 'Letovi', description: 'Avio karte', isComplete: false, isActive: false },
    { id: 3, name: 'hotels', title: 'Hoteli', description: 'Smeštaj', isComplete: false, isActive: false },
    { id: 4, name: 'transfers', title: 'Transferi', description: 'Prevoz', isComplete: false, isActive: false },
    { id: 5, name: 'extras', title: 'Dodaci', description: 'Atrakcije', isComplete: false, isActive: false },
    { id: 6, name: 'review', title: 'Potvrda', description: 'Finalni rezime', isComplete: false, isActive: false }
];

interface PackageSearchProps {
    initialDestinations?: any[];
    initialCheckIn?: string;
    initialCheckOut?: string;
    initialTravelers?: { adults: number; children: number; childrenAges: number[] }[];
}

const PackageSearch: React.FC<PackageSearchProps> = ({
    initialDestinations,
    initialCheckIn,
    initialCheckOut,
    initialTravelers
}) => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [currentStep, setCurrentStep] = useState<number>(() => {
        const stepParam = searchParams.get('step');
        return stepParam ? parseInt(stepParam) : 1;
    });
    const [steps, setSteps] = useState<WizardStep[]>(WIZARD_STEPS);
    const [basicInfo, setBasicInfo] = useState<BasicInfoData | null>(null);
    const [selectedFlights, setSelectedFlights] = useState<FlightSelectionData | null>(null);
    const [selectedHotels, setSelectedHotels] = useState<HotelSelectionData[]>([]);
    const [selectedTransfers, setSelectedTransfers] = useState<TransferSelectionData[]>([]);
    const [selectedExtras, setSelectedExtras] = useState<ExtraSelectionData[]>([]);
    const [isAIMode, setIsAIMode] = useState<boolean>(false);

    // Background Prefetch State
    const [prefetchedFlightOffers, setPrefetchedFlightOffers] = useState<Record<number, UnifiedFlightOffer[]>>({});
    const [prefetchedHotelResults, setPrefetchedHotelResults] = useState<Record<number, InternalHotelResult[]>>({});
    const [prefetchKey, setPrefetchKey] = useState<string>('');

    // Initial Data Effect
    useEffect(() => {
        if (!basicInfo && initialDestinations && initialDestinations.length > 0) {
            let totalAdults = 0, totalChildren = 0, allAges: number[] = [];
            if (initialTravelers) {
                initialTravelers.forEach(room => {
                    totalAdults += room.adults;
                    totalChildren += room.children;
                    allAges = [...allAges, ...room.childrenAges];
                });
            }
            const mappedDestinations: DestinationInput[] = initialDestinations.map((d, index) => ({
                id: d.id || String(index + 1),
                city: d.name,
                country: '',
                countryCode: '',
                airportCode: '',
                checkIn: initialCheckIn || '',
                checkOut: initialCheckOut || '',
                nights: 0,
                travelers: initialTravelers ? initialTravelers[index] : { adults: 2, children: 0, childrenAges: [] }
            }));
            setBasicInfo({
                destinations: mappedDestinations,
                travelers: { adults: totalAdults || 2, children: totalChildren || 0, childrenAges: allAges },
                currency: 'EUR',
                startDate: initialCheckIn || '',
                endDate: initialCheckOut || '',
                totalDays: 0
            });
        }
    }, [initialDestinations, initialCheckIn, initialCheckOut]);

    // BACKGROUND SEARCH LOGIC
    useEffect(() => {
        const timer = setTimeout(() => {
            handleBackgroundSearch();
        }, 1500); // 1.5s debounce
        return () => clearTimeout(timer);
    }, [basicInfo]);

    const handleBackgroundSearch = async () => {
        if (!basicInfo || !basicInfo.destinations || basicInfo.destinations.length === 0) return;
        const currentKey = JSON.stringify(basicInfo);
        if (currentKey === prefetchKey) return;

        setPrefetchKey(currentKey); // Mark as started

        // 1. Prefetch Flight (First Hop: Origin -> Dest 1)
        try {
            const origin = basicInfo.originCode || 'BEG';
            const firstDest = basicInfo.destinations[0];
            const searchParams: FlightSearchParams = {
                origin: origin,
                destination: firstDest.airportCode || firstDest.city,
                departureDate: firstDest.checkIn,
                adults: basicInfo.travelers.adults,
                children: basicInfo.travelers.children,
                childrenAges: basicInfo.travelers.childrenAges || [],
                cabinClass: 'economy',
                currency: 'EUR'
            };

            // Only search if we have valid dates
            if (searchParams.departureDate) {
                flightSearchManager.searchFlights(searchParams).then(response => {
                    setPrefetchedFlightOffers(prev => ({ ...prev, 0: response.offers })); // 0 is index of first hop
                }).catch(e => console.warn('Flight prefetch failed', e));
            }
        } catch (e) {
            console.warn('Flight prefetch setup failed', e);
        }

        // 2. Prefetch Hotels (All Destinations)
        basicInfo.destinations.forEach((dest, idx) => {
            // Skip if no date
            if (!dest.checkIn || !dest.checkOut) return;

            tctApi.searchHotelsSync({
                location: dest.city,
                checkin: dest.checkIn,
                checkout: dest.checkOut,
                rooms: [{
                    adults: basicInfo.travelers.adults,
                    children: basicInfo.travelers.children,
                    children_ages: basicInfo.travelers.childrenAges || []
                }],
                search_type: 'city',
                currency: 'EUR'
            }).then(response => {
                let hotelResults: InternalHotelResult[] = [];
                if (response.success && response.data?.hotels && response.data.hotels.length > 0) {
                    hotelResults = response.data.hotels.map((h: any) => ({
                        id: String(h.hotel_id || h.hid),
                        source: 'TCT' as const,
                        name: h.hotel_name || h.name,
                        location: h.address || dest.city,
                        price: h.min_rate || (Math.random() * 1000 + 400),
                        currency: 'EUR',
                        image: h.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800',
                        stars: parseInt(h.stars) || 4,
                        mealPlanName: h.meal_plan || 'Polupansion',
                        mealPlanCode: (h.meal_plan_code || 'HB') as "RO" | "BB" | "HB" | "FB" | "AI" | "UAI",
                        rooms: h.rooms || [],
                        originalData: h
                    }));
                }
                if (hotelResults.length > 0) {
                    setPrefetchedHotelResults(prev => ({ ...prev, [idx]: hotelResults }));
                }
            }).catch(e => console.warn(`Hotel prefetch failed for ${dest.city}`, e));
        });
    };

    const totalPrice = (selectedFlights?.totalPrice || 0) +
        (selectedHotels || []).filter(Boolean).reduce((s, h) => s + (h?.totalPrice || 0), 0) +
        (selectedTransfers || []).filter(Boolean).reduce((s, t) => s + (t?.totalPrice || 0), 0) +
        (selectedExtras || []).filter(Boolean).reduce((s, e) => s + (e?.totalPrice || 0), 0);

    const goNext = () => {
        if (currentStep < 6) {
            setSteps(prev => prev.map(s => s.id === currentStep ? { ...s, isComplete: true } : s));
            const nextStep = currentStep + 1;
            setCurrentStep(nextStep);

            // Update URL
            setSearchParams(prev => {
                const newParams = new URLSearchParams(prev);
                newParams.set('step', String(nextStep));
                return newParams;
            }, { replace: false });
        }
    };

    const goBack = () => {
        if (currentStep > 1) {
            const prevStep = currentStep - 1;
            setCurrentStep(prevStep);

            // Update URL
            setSearchParams(prev => {
                const newParams = new URLSearchParams(prev);
                newParams.set('step', String(prevStep));
                return newParams;
            }, { replace: false });
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1: return <Step1_BasicInfo basicInfo={basicInfo} onUpdate={setBasicInfo} onNext={goNext} />;
            case 2: return <Step2_FlightSelection basicInfo={basicInfo} data={selectedFlights} onUpdate={setSelectedFlights} onNext={goNext} onBack={goBack} prefetchedOffers={prefetchedFlightOffers} />;
            case 3: return <Step3_HotelSelection basicInfo={basicInfo} data={selectedHotels} onUpdate={setSelectedHotels} onNext={goNext} onBack={goBack} prefetchedResults={prefetchedHotelResults} />;
            case 4: return <Step4_TransferSelection basicInfo={basicInfo} flights={selectedFlights} hotels={selectedHotels} data={selectedTransfers} onUpdate={setSelectedTransfers} onNext={goNext} onBack={goBack} />;
            case 5: return <Step5_ExtrasSelection basicInfo={basicInfo} data={selectedExtras} onUpdate={setSelectedExtras} onNext={goNext} onBack={goBack} />;
            case 6: return <Step6_ReviewConfirm basicInfo={basicInfo} flights={selectedFlights} hotels={selectedHotels} transfers={selectedTransfers} extras={selectedExtras} totalPrice={totalPrice} onBack={goBack} onConfirm={() => navigate('/packages/created')} onEditStep={setCurrentStep} />;
            default: return null;
        }
    };

    return (
        <div className="package-search-page">
            {/* 1. PREMIUM HEADER REMOVED */}
            {/* <div className="search-header"> ... </div> */}

            {/* 2. PROGRESS STEPS (SMART STYLE) */}
            <div className="wizard-progress ss-glass-bar">
                <div className="progress-steps-ss">
                    {steps.map((step) => (
                        <a
                            href={`/smart-search?tab=package&step=${step.id}`}
                            key={step.id}
                            className={`p-step-ss ${currentStep === step.id ? 'active' : ''} ${step.isComplete ? 'complete' : ''}`}
                            style={{ textDecoration: 'none', cursor: 'pointer', display: 'flex' }}
                            onClick={(e) => {
                                e.preventDefault();
                                setCurrentStep(step.id);
                                setSearchParams(prev => {
                                    const newParams = new URLSearchParams(prev);
                                    newParams.set('step', String(step.id));
                                    return newParams;
                                });
                            }}
                        >
                            <div className="s-num-ss">{step.isComplete ? <Check size={14} /> : step.id}</div>
                            <div className="s-info-ss">
                                <div className="s-title-ss">{step.title}</div>
                                <div className="s-desc-ss">{step.description}</div>
                            </div>
                        </a>
                    ))}
                </div>
            </div>

            {/* 3. MAIN AREA */}
            <div className="search-content py-8" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {renderStep()}

                {/* 4. NAV - ALIGNED WITH CONTENT */}
                <div id="wizard-nav-static" className="wizard-navigation" style={{
                    position: 'relative',
                    marginTop: '10px',
                    width: '100%',
                    maxWidth: '1400px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    zIndex: 10
                }}>
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
                        <button className="nav-btn secondary ss-glow-muted" style={{ minWidth: '180px', height: '56px', fontSize: '12px', fontWeight: 900 }} onClick={goBack} disabled={currentStep === 1}>
                            <ChevronLeft size={20} /> NAZAD
                        </button>
                    </div>

                    <div className="total-display-middle" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(14, 75, 94, 0.4)', borderRadius: '12px', padding: '0 20px', margin: '0 10px', height: '56px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ fontSize: '9px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', lineHeight: 1, marginBottom: '2px' }}>Trenutni Total</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', letterSpacing: '-1px', lineHeight: 1 }}>{totalPrice.toFixed(2)}€</div>
                    </div>

                    <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                        {currentStep < 6 ? (
                            <button className="nav-btn primary" style={{ minWidth: '240px', height: '56px', fontSize: '13px', fontWeight: 900, background: '#0E4B5E', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} onClick={goNext}>
                                SLEDEĆI KORAK <ChevronRight size={20} />
                            </button>
                        ) : (
                            <button
                                className="nav-btn primary animate-pulse-slow"
                                style={{
                                    minWidth: '240px',
                                    height: '56px',
                                    fontSize: '15px',
                                    fontWeight: '900',
                                    fontStyle: 'italic',
                                    textTransform: 'uppercase',
                                    letterSpacing: '2px',
                                    background: '#0E4B5E',
                                    boxShadow: '0 10px 30px -5px rgba(14, 75, 94, 0.5)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    color: 'white'
                                }}
                                onClick={() => navigate('/packages/created')}
                            >
                                <Check size={20} /> KREIRAJ PAKET
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PackageSearch;
