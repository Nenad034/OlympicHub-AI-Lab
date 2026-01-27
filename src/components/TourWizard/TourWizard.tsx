import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Flag,
    Map,
    Truck,
    DollarSign,
    Check,
    ChevronRight,
    ChevronLeft,
    Save,
    LogOut
} from 'lucide-react';
import type { Tour } from '../../types/tour.types';

// Steps (will create these next)
import BasicInfoStep from './steps/BasicInfoStep';
import ItineraryStep from './steps/ItineraryStep';
import LogisticsStep from './steps/LogisticsStep';
import CommercialStep from './steps/CommercialStep';

// Use PropertyWizard styles
import '../PropertyWizard/PropertyWizard.styles.css';

interface TourWizardProps {
    onClose: () => void;
    onSave: (tour: Partial<Tour>) => void;
    initialData?: Partial<Tour>;
}

const TourWizard: React.FC<TourWizardProps> = ({ onClose, onSave, initialData }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [tourData, setTourData] = useState<Partial<Tour>>(initialData || {
        category: 'Grupno',
        status: 'Draft',
        itinerary: [],
        supplements: [],
        highlights: [],
        currency: 'EUR'
    });

    const steps = [
        { id: 'basic', title: 'Koncept', icon: <Flag size={20} /> },
        { id: 'itinerary', title: 'Itinerer', icon: <Map size={20} /> },
        { id: 'logistics', title: 'Logistika', icon: <Truck size={20} /> },
        { id: 'commercial', title: 'Cenovnik', icon: <DollarSign size={20} /> }
    ];

    const updateTour = (updates: Partial<Tour>) => {
        setTourData(prev => ({ ...prev, ...updates }));
    };

    const handleNext = () => {
        if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
    };

    const handlePrev = () => {
        if (currentStep > 0) setCurrentStep(currentStep - 1);
    };

    const handleSave = (shouldClose: boolean = false) => {
        onSave(tourData);
        if (shouldClose) onClose();
    };

    const renderStep = () => {
        const props = { data: tourData, onChange: updateTour };
        switch (steps[currentStep].id) {
            case 'basic': return <BasicInfoStep {...props} />;
            case 'itinerary': return <ItineraryStep {...props} />;
            case 'logistics': return <LogisticsStep {...props} />;
            case 'commercial': return <CommercialStep {...props} />;
            default: return null;
        }
    };

    return (
        <div className="wizard-overlay">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="wizard-container"
            >
                {/* SIDEBAR NAVIGATION */}
                <div className="wizard-sidebar">
                    <div className="wizard-sidebar-header">
                        <h2>Grupna Putovanja</h2>
                    </div>

                    <div className="wizard-steps-list">
                        {steps.map((step, index) => (
                            <div
                                key={step.id}
                                className={`step-item-row ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
                                onClick={() => setCurrentStep(index)}
                            >
                                <div className="step-icon-small">
                                    {index < currentStep ? <Check size={16} /> : (index + 1)}
                                </div>
                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{step.title}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* MAIN CONTENT AREA */}
                <div className="wizard-main-area">
                    {/* TOPBAR */}
                    <div className="wizard-topbar">
                        <div className="topbar-title">
                            <h3>{steps[currentStep].title}</h3>
                            <span className="topbar-subtitle">Korak {currentStep + 1} od {steps.length} • Musashi Strategija</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="exit-button"
                        >
                            <LogOut size={16} /> Exit
                        </button>
                    </div>

                    {/* SCROLLABLE CONTENT */}
                    <div className="wizard-content-wrapper">
                        <div className="content-center-limit">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentStep}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {renderStep()}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* ACTION FOOTER */}
                    <div className="wizard-action-footer">
                        <button
                            onClick={handlePrev}
                            disabled={currentStep === 0}
                            className={`footer-btn-prev ${currentStep === 0 ? 'disabled' : ''}`}
                        >
                            <ChevronLeft size={18} /> Nazad
                        </button>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            {currentStep < steps.length - 1 ? (
                                <>
                                    <button
                                        onClick={() => handleSave(false)}
                                        className="footer-btn-save"
                                    >
                                        <Save size={18} /> Sačuvaj Draft
                                    </button>
                                    <button
                                        onClick={handleNext}
                                        className="footer-btn-next"
                                    >
                                        Sledeće <ChevronRight size={18} />
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => handleSave(true)}
                                    className="footer-btn-finish"
                                >
                                    <Check size={18} /> Objavi Putovanje
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default TourWizard;
