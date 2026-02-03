import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    const [currentStep, setCurrentStep] = useState<number>(1);
    const [steps, setSteps] = useState<WizardStep[]>(WIZARD_STEPS);
    const [basicInfo, setBasicInfo] = useState<BasicInfoData | null>(null);
    const [selectedFlights, setSelectedFlights] = useState<FlightSelectionData | null>(null);
    const [selectedHotels, setSelectedHotels] = useState<HotelSelectionData[]>([]);
    const [selectedTransfers, setSelectedTransfers] = useState<TransferSelectionData[]>([]);
    const [selectedExtras, setSelectedExtras] = useState<ExtraSelectionData[]>([]);
    const [isAIMode, setIsAIMode] = useState<boolean>(false);

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

    const totalPrice = (selectedFlights?.totalPrice || 0) +
        (selectedHotels || []).filter(Boolean).reduce((s, h) => s + (h?.totalPrice || 0), 0) +
        (selectedTransfers || []).filter(Boolean).reduce((s, t) => s + (t?.totalPrice || 0), 0) +
        (selectedExtras || []).filter(Boolean).reduce((s, e) => s + (e?.totalPrice || 0), 0);

    const goNext = () => {
        if (currentStep < 6) {
            setSteps(prev => prev.map(s => s.id === currentStep ? { ...s, isComplete: true } : s));
            setCurrentStep(currentStep + 1);
        }
    };

    const goBack = () => currentStep > 1 && setCurrentStep(currentStep - 1);

    const renderStep = () => {
        switch (currentStep) {
            case 1: return <Step1_BasicInfo basicInfo={basicInfo} onUpdate={setBasicInfo} onNext={goNext} />;
            case 2: return <Step2_FlightSelection basicInfo={basicInfo} data={selectedFlights} onUpdate={setSelectedFlights} onNext={goNext} onBack={goBack} />;
            case 3: return <Step3_HotelSelection basicInfo={basicInfo} data={selectedHotels} onUpdate={setSelectedHotels} onNext={goNext} onBack={goBack} />;
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
                    {steps.map((step, index) => (
                        <div key={step.id} className={`p-step-ss ${currentStep === step.id ? 'active' : ''} ${step.isComplete ? 'complete' : ''}`} onClick={() => setCurrentStep(step.id)}>
                            <div className="s-num-ss">{step.isComplete ? <Check size={14} /> : step.id}</div>
                            <div className="s-info-ss">
                                <div className="s-title-ss">{step.title}</div>
                                <div className="s-desc-ss">{step.description}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. MAIN AREA */}
            <div className="search-content py-8">
                {renderStep()}
            </div>

            {/* 4. FLOATING FOOTER NAV */}
            <div className="wizard-navigation ss-floating-nav">
                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
                    <button className="nav-btn secondary ss-glow-muted" style={{ minWidth: '180px', height: '56px', fontSize: '12px', fontWeight: 900 }} onClick={goBack} disabled={currentStep === 1}>
                        <ChevronLeft size={20} /> NAZAD
                    </button>
                </div>

                <div className="total-display-middle" style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '2px' }}>Trenutni Total</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--accent)', letterSpacing: '-2px', lineHeight: 1 }}>{totalPrice.toFixed(2)}€</div>
                </div>

                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                    {currentStep < 6 ? (
                        <button className="nav-btn primary ss-glow-indigo" style={{ minWidth: '240px', height: '56px', fontSize: '13px', fontWeight: 900 }} onClick={goNext}>
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
                                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                                boxShadow: '0 10px 30px -5px rgba(99, 102, 241, 0.5)',
                                border: '1px solid rgba(255,255,255,0.2)'
                            }}
                            onClick={() => navigate('/packages/created')}
                        >
                            <Check size={20} /> KREIRAJ PAKET
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PackageSearch;
