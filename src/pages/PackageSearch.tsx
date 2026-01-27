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
    ExtraSelectionData
} from '../types/packageSearch.types';
import './PackageSearch.css';

// Step components (to be created)
import Step1_BasicInfo from '../components/packages/Steps/Step1_BasicInfo';
import Step2_FlightSelection from '../components/packages/Steps/Step2_FlightSelection';
import Step3_HotelSelection from '../components/packages/Steps/Step3_HotelSelection';
import Step4_TransferSelection from '../components/packages/Steps/Step4_TransferSelection';
import Step5_ExtrasSelection from '../components/packages/Steps/Step5_ExtrasSelection';
import Step6_ReviewConfirm from '../components/packages/Steps/Step6_ReviewConfirm';
import { dynamicPackageService } from '../services/dynamicPackageService';

const WIZARD_STEPS: WizardStep[] = [
    {
        id: 1,
        name: 'basic-info',
        title: 'Osnovne Informacije',
        description: 'Destinacije, datumi i putnici',
        isComplete: false,
        isActive: true
    },
    {
        id: 2,
        name: 'flights',
        title: 'Letovi',
        description: 'Izaberite letove',
        isComplete: false,
        isActive: false
    },
    {
        id: 3,
        name: 'hotels',
        title: 'Hoteli',
        description: 'Izaberite smeštaj',
        isComplete: false,
        isActive: false
    },
    {
        id: 4,
        name: 'transfers',
        title: 'Transferi',
        description: 'Prevoz između lokacija',
        isComplete: false,
        isActive: false
    },
    {
        id: 5,
        name: 'extras',
        title: 'Dodatne Usluge',
        description: 'Ture, ulaznice, aktivnosti',
        isComplete: false,
        isActive: false
    },
    {
        id: 6,
        name: 'review',
        title: 'Pregled i Potvrda',
        description: 'Finalizujte paket',
        isComplete: false,
        isActive: false
    }
];

const PackageSearch: React.FC = () => {
    const navigate = useNavigate();

    // Wizard state
    const [currentStep, setCurrentStep] = useState<number>(1);
    const [steps, setSteps] = useState<WizardStep[]>(WIZARD_STEPS);

    // Search data
    const [basicInfo, setBasicInfo] = useState<BasicInfoData | null>(null);
    const [selectedFlights, setSelectedFlights] = useState<FlightSelectionData | null>(null);
    const [selectedHotels, setSelectedHotels] = useState<HotelSelectionData[]>([]);
    const [selectedTransfers, setSelectedTransfers] = useState<TransferSelectionData[]>([]);
    const [selectedExtras, setSelectedExtras] = useState<ExtraSelectionData[]>([]);

    // AI mode
    const [isAIMode, setIsAIMode] = useState<boolean>(false);

    // Calculate total price
    const calculateTotalPrice = (): number => {
        let total = 0;

        if (selectedFlights) {
            total += selectedFlights.totalPrice;
        }

        selectedHotels.forEach(hotel => {
            total += hotel.totalPrice;
        });

        selectedTransfers.forEach(transfer => {
            total += transfer.totalPrice;
        });

        selectedExtras.forEach(extra => {
            total += extra.totalPrice;
        });

        return total;
    };

    const totalPrice = calculateTotalPrice();

    // Navigation handlers
    const goToStep = (stepId: number) => {
        if (stepId >= 1 && stepId <= 6) {
            setCurrentStep(stepId);
            updateStepStatus(stepId);
        }
    };

    const goBack = () => {
        if (currentStep > 1) {
            goToStep(currentStep - 1);
        }
    };

    const goNext = () => {
        if (currentStep < 6) {
            // Mark current step as complete
            markStepComplete(currentStep);
            goToStep(currentStep + 1);
        }
    };

    const updateStepStatus = (activeStepId: number) => {
        setSteps(prevSteps =>
            prevSteps.map(step => ({
                ...step,
                isActive: step.id === activeStepId
            }))
        );
    };

    const markStepComplete = (stepId: number) => {
        setSteps(prevSteps =>
            prevSteps.map(step =>
                step.id === stepId
                    ? { ...step, isComplete: true }
                    : step
            )
        );
    };

    // Save draft
    const saveDraft = () => {
        const draft: PackageSearchState = {
            currentStep,
            steps,
            basicInfo,
            selectedFlights: selectedFlights ? [selectedFlights as any] : [],
            selectedHotels: selectedHotels as any,
            selectedTransfers: selectedTransfers as any,
            selectedExtras: selectedExtras as any,
            totalPrice,
            isDraft: true
        };

        localStorage.setItem('package-search-draft', JSON.stringify(draft));
        alert('Draft saved successfully!');
    };

    // Load draft on mount
    useEffect(() => {
        const savedDraft = localStorage.getItem('package-search-draft');
        if (savedDraft) {
            try {
                const draft: PackageSearchState = JSON.parse(savedDraft);
                // Restore state
                setCurrentStep(draft.currentStep);
                setSteps(draft.steps);
                setBasicInfo(draft.basicInfo);
                // ... restore other fields
            } catch (error) {
                console.error('Failed to load draft:', error);
            }
        }
    }, []);

    // Render current step
    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <Step1_BasicInfo
                        data={basicInfo}
                        onUpdate={setBasicInfo}
                        onNext={goNext}
                    />
                );
            case 2:
                return (
                    <Step2_FlightSelection
                        basicInfo={basicInfo}
                        data={selectedFlights}
                        onUpdate={setSelectedFlights}
                        onNext={goNext}
                        onBack={goBack}
                    />
                );
            case 3:
                return (
                    <Step3_HotelSelection
                        basicInfo={basicInfo}
                        data={selectedHotels}
                        onUpdate={setSelectedHotels}
                        onNext={goNext}
                        onBack={goBack}
                    />
                );
            case 4:
                return (
                    <Step4_TransferSelection
                        basicInfo={basicInfo}
                        flights={selectedFlights}
                        hotels={selectedHotels}
                        data={selectedTransfers}
                        onUpdate={setSelectedTransfers}
                        onNext={goNext}
                        onBack={goBack}
                    />
                );
            case 5:
                return (
                    <Step5_ExtrasSelection
                        basicInfo={basicInfo}
                        data={selectedExtras}
                        onUpdate={setSelectedExtras}
                        onNext={goNext}
                        onBack={goBack}
                    />
                );
            case 6:
                return (
                    <Step6_ReviewConfirm
                        basicInfo={basicInfo}
                        flights={selectedFlights}
                        hotels={selectedHotels}
                        transfers={selectedTransfers}
                        extras={selectedExtras}
                        totalPrice={totalPrice}
                        onBack={goBack}
                        onConfirm={async () => {
                            try {
                                if (!basicInfo) return;

                                const draftName = `${basicInfo.destinations.map(d => d.city).join(' / ')} - ${new Date().toLocaleDateString()}`;

                                await dynamicPackageService.saveDraft({
                                    name: draftName,
                                    basicInfo,
                                    flights: selectedFlights,
                                    hotels: selectedHotels,
                                    transfers: selectedTransfers,
                                    extras: selectedExtras,
                                    totalPrice,
                                    status: 'draft'
                                });

                                // Navigate to success or created list
                                navigate('/packages/created');
                            } catch (error) {
                                console.error('Error saving package:', error);
                                navigate('/packages/created'); // Still navigate for demo, but log error
                            }
                        }}
                        onEditStep={(step) => setCurrentStep(step)}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="package-search-page">
            {/* Header */}
            <div className="search-header">
                <div className="search-header-content">
                    <div className="header-left">
                        <Map size={32} />
                        <div>
                            <h1>Kreiraj Dinamički Paket</h1>
                            <p>Kombinujte letove, hotele, transfere i dodatne usluge</p>
                        </div>
                    </div>
                    <div className="header-right">
                        <button
                            className={`mode-toggle ${isAIMode ? 'active' : ''}`}
                            onClick={() => setIsAIMode(!isAIMode)}
                        >
                            <Sparkles size={18} />
                            AI Asistent
                        </button>
                    </div>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="wizard-progress">
                <div className="progress-steps">
                    {steps.map((step, index) => (
                        <div
                            key={step.id}
                            className={`progress-step ${step.isActive ? 'active' : ''} ${step.isComplete ? 'complete' : ''}`}
                            onClick={() => goToStep(step.id)}
                        >
                            <div className="step-number">
                                {step.isComplete ? <Check size={16} /> : step.id}
                            </div>
                            <div className="step-info">
                                <div className="step-title">{step.title}</div>
                                <div className="step-desc">{step.description}</div>
                            </div>
                            {index < steps.length - 1 && (
                                <div className="step-connector"></div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="search-content">
                <div className="step-container">
                    {renderStep()}
                </div>

                {/* Sticky Summary Sidebar */}
                <div className="package-summary-sidebar">
                    <h3>Sažetak Paketa</h3>

                    <div className="summary-section">
                        <div className="summary-item">
                            <Plane size={18} />
                            <span>Letovi</span>
                            <span className="summary-count">
                                {selectedFlights ? '✓' : '0'}
                            </span>
                            <span className="summary-price">
                                {selectedFlights ? `${selectedFlights.totalPrice.toFixed(2)} €` : '0.00 €'}
                            </span>
                        </div>

                        <div className="summary-item">
                            <Hotel size={18} />
                            <span>Hoteli</span>
                            <span className="summary-count">{selectedHotels.length}</span>
                            <span className="summary-price">
                                {selectedHotels.reduce((sum, h) => sum + h.totalPrice, 0).toFixed(2)} €
                            </span>
                        </div>

                        <div className="summary-item">
                            <Car size={18} />
                            <span>Transferi</span>
                            <span className="summary-count">{selectedTransfers.length}</span>
                            <span className="summary-price">
                                {selectedTransfers.reduce((sum, t) => sum + t.totalPrice, 0).toFixed(2)} €
                            </span>
                        </div>

                        <div className="summary-item">
                            <Ticket size={18} />
                            <span>Dodatne Usluge</span>
                            <span className="summary-count">{selectedExtras.length}</span>
                            <span className="summary-price">
                                {selectedExtras.reduce((sum, e) => sum + e.totalPrice, 0).toFixed(2)} €
                            </span>
                        </div>
                    </div>

                    <div className="summary-total">
                        <span>UKUPNO:</span>
                        <span className="total-price">{totalPrice.toFixed(2)} €</span>
                    </div>

                    {basicInfo && (
                        <div className="summary-per-person">
                            Po osobi: {(totalPrice / (basicInfo.travelers.adults + basicInfo.travelers.children)).toFixed(2)} €
                        </div>
                    )}

                    <button className="save-draft-btn" onClick={saveDraft}>
                        <Save size={18} />
                        Sačuvaj Draft
                    </button>
                </div>
            </div>

            {/* Navigation Footer */}
            <div className="wizard-navigation">
                <button
                    className="nav-btn secondary"
                    onClick={goBack}
                    disabled={currentStep === 1}
                >
                    <ChevronLeft size={18} />
                    Nazad
                </button>

                <div className="nav-right-actions">
                    <div className="nav-info">
                        Korak {currentStep} od {steps.length}
                    </div>

                    {currentStep < 6 ? (
                        <button
                            className="nav-btn primary"
                            onClick={goNext}
                        >
                            Sledeći Korak
                            <ChevronRight size={18} />
                        </button>
                    ) : (
                        <button
                            className="nav-btn success"
                            onClick={() => navigate('/packages/created')}
                        >
                            <Check size={18} />
                            Kreiraj Paket
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PackageSearch;
