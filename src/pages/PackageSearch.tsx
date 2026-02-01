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
                nights: 0
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
        selectedHotels.reduce((s, h) => s + h.totalPrice, 0) +
        selectedTransfers.reduce((s, t) => s + t.totalPrice, 0) +
        selectedExtras.reduce((s, e) => s + e.totalPrice, 0);

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
        <div className="package-search-page ss-dark-theme">
            {/* 1. PREMIUM HEADER */}
            <div className="search-header">
                <div className="search-header-content">
                    <div className="header-left">
                        <div className="bg-indigo-600/20 p-3 rounded-2xl border border-indigo-500/30">
                            <Sparkles size={32} className="text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white uppercase tracking-tight">Dynamic Package Builder</h1>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Smart Search AI Experience</p>
                        </div>
                    </div>
                </div>
            </div>

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
            <div className="search-content py-12 px-8">
                {renderStep()}
            </div>

            {/* 4. FLOATING FOOTER NAV */}
            <div className="wizard-navigation ss-floating-nav">
                <button className="nav-btn secondary ss-glow-muted" onClick={goBack} disabled={currentStep === 1}>
                    <ChevronLeft size={20} /> NAZAD
                </button>

                <div className="flex items-center gap-10">
                    <div className="text-right hidden md:block">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Trenutni Total</div>
                        <div className="text-2xl font-black text-indigo-400 tracking-tighter">{totalPrice.toFixed(2)}€</div>
                    </div>
                    {currentStep < 6 ? (
                        <button className="nav-btn primary ss-glow-indigo min-w-[200px]" onClick={goNext}>
                            SLEDEĆI KORAK <ChevronRight size={20} />
                        </button>
                    ) : (
                        <button className="nav-btn primary ss-glow-indigo min-w-[200px]" onClick={() => navigate('/packages/created')}>
                            <Check size={20} /> KREIRAJ PAKET
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PackageSearch;
