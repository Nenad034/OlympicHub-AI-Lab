import React, { useState, useEffect } from 'react';
import { ClickToTravelLogo } from '../components/icons/ClickToTravelLogo';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    MapPin, Calendar, Users, Plane, Hotel,
    ChevronLeft, ChevronRight, Check
} from 'lucide-react';
import type {
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
import { useThemeStore } from '../stores';

export const WIZARD_STEPS: WizardStep[] = [
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
    onPriceUpdate?: (price: number) => void;
    onStepUpdate?: (step: number) => void;
    hideHeader?: boolean;
    hideFooter?: boolean;
    compactMode?: boolean;
}

const PackageSearch: React.FC<PackageSearchProps> = ({
    initialDestinations = [],
    initialCheckIn = '',
    initialCheckOut = '',
    initialTravelers = [],
    onPriceUpdate,
    onStepUpdate,
    hideHeader = false,
    hideFooter = false,
    compactMode = false
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
                travelers: initialTravelers.length > index ? initialTravelers[index] : { adults: 2, children: 0, childrenAges: [] }
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
    }, [initialDestinations, initialCheckIn, initialCheckOut, initialTravelers]);

    const totalPrice = (selectedFlights?.totalPrice || 0) +
        (selectedHotels || []).filter(Boolean).reduce((s, h) => s + (h?.totalPrice || 0), 0) +
        (selectedTransfers || []).filter(Boolean).reduce((s, t) => s + (t?.totalPrice || 0), 0) +
        (selectedExtras || []).filter(Boolean).reduce((s, e) => s + (e?.totalPrice || 0), 0);

    useEffect(() => {
        if (onPriceUpdate) onPriceUpdate(totalPrice);
    }, [totalPrice, onPriceUpdate]);

    useEffect(() => {
        if (onStepUpdate) onStepUpdate(currentStep);
    }, [currentStep, onStepUpdate]);

    const goNext = () => {
        if (currentStep < 6) {
            setSteps(prev => prev.map(s => s.id === currentStep ? { ...s, isComplete: true } : s));
            const nextStep = currentStep + 1;
            setCurrentStep(nextStep);
            
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
            case 2: return <Step2_FlightSelection basicInfo={basicInfo} data={selectedFlights} onUpdate={setSelectedFlights} onNext={goNext} onBack={goBack} />;
            case 3: return <Step3_HotelSelection basicInfo={basicInfo} data={selectedHotels} onUpdate={setSelectedHotels} onNext={goNext} onBack={goBack} />;
            case 4: return <Step4_TransferSelection basicInfo={basicInfo} flights={selectedFlights} hotels={selectedHotels} data={selectedTransfers} onUpdate={setSelectedTransfers} onNext={goNext} onBack={goBack} />;
            case 5: return <Step5_ExtrasSelection basicInfo={basicInfo} data={selectedExtras} onUpdate={setSelectedExtras} onNext={goNext} onBack={goBack} />;
            case 6: return <Step6_ReviewConfirm basicInfo={basicInfo} flights={selectedFlights} hotels={selectedHotels} transfers={selectedTransfers} extras={selectedExtras} totalPrice={totalPrice} onBack={goBack} onConfirm={() => navigate('/packages/created')} onEditStep={setCurrentStep} />;
            default: return null;
        }
    };

    return (
        <div className={`package-search-page ${compactMode ? 'compact' : ''}`}>
            {!hideHeader && !compactMode && (
                <div className="wizard-progress ss-glass-bar">
                    <div className="progress-steps-ss">
                        {steps.map((step) => (
                            <div
                                key={step.id}
                                className={`p-step-ss ${currentStep === step.id ? 'active' : ''} ${step.isComplete ? 'complete' : ''}`}
                                onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                            >
                                <div className="s-num-ss">{step.isComplete ? <Check size={14} /> : step.id}</div>
                                <div className="s-content-ss">
                                    <div className="s-title-ss">{step.title}</div>
                                    <div className="s-desc-ss">{step.description}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <main className={`wizard-content ${compactMode ? 'no-padding' : ''}`}>
                <div className={`search-content ${compactMode ? 'py-2' : 'py-8'}`}>
                    {renderStep()}
                </div>
            </main>

            {!hideFooter && !compactMode && (
                <div id="floating-wizard-nav" className="ss-floating-nav">
                    {currentStep > 1 ? (
                        <button className="nav-btn secondary" onClick={goBack}>
                            <ChevronLeft size={18} /> NAZAD
                        </button>
                    ) : (
                        <div />
                    )}

                    <div className="nav-center-info" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div className="total-label" style={{ fontSize: 9, opacity: 0.7 }}>UKUPNA CENA PAKETA</div>
                        <div className="total-val" style={{ fontSize: 20, fontWeight: 900 }}>€ {totalPrice.toFixed(2)}</div>
                    </div>

                    {currentStep < 6 ? (
                        <button className="nav-btn primary" onClick={goNext}>
                            SLEDEĆI KORAK <ChevronRight size={18} />
                        </button>
                    ) : (
                        <button
                            className="nav-btn primary success"
                            onClick={() => navigate('/packages/created')}
                        >
                            <ClickToTravelLogo height={28} />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default PackageSearch;
