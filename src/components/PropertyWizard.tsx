import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2,
    MapPin,
    Globe,
    ImageIcon,
    Bed,
    DollarSign,
    Shield,
    Key,
    ChevronRight,
    ChevronLeft,
    Check,
    AlertCircle,
    Save,
    LogOut,
    Calendar
} from 'lucide-react';
import type { Property } from '../types/property.types';
import { validateProperty } from '../types/property.types';

// Steps
import BasicInfoStep from './PropertyWizard/steps/BasicInfoStep';
import LocationStep from './PropertyWizard/steps/LocationStep';
import ContentStep from './PropertyWizard/steps/ContentStep';
import ImagesStep from './PropertyWizard/steps/ImagesStep';
import RoomsStep from './PropertyWizard/steps/RoomsStep';
import CapacityStep from './PropertyWizard/steps/CapacityStep';
import PricingStep from './PropertyWizard/steps/PricingStep';
import AmenitiesStep from './PropertyWizard/steps/AmenitiesStep';
import RatesStep from './PropertyWizard/steps/RatesStep';
import PoliciesStep from './PropertyWizard/steps/PoliciesStep';

// Styles
import './PropertyWizard/PropertyWizard.styles.css';

interface PropertyWizardProps {
    onClose: () => void;
    onSave: (property: Partial<Property>, shouldClose?: boolean) => void;
    initialData?: Partial<Property>;
}

const PropertyWizard: React.FC<PropertyWizardProps> = ({ onClose, onSave, initialData }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [propertyData, setPropertyData] = useState<Partial<Property>>(initialData || {
        propertyType: 'Hotel',
        isActive: false,
        content: [],
        roomTypes: [],
        propertyAmenities: [],
        ratePlans: [],
        taxes: [],
        pointsOfInterest: [],
        images: []
    });
    const [errors, setErrors] = useState<string[]>([]);

    const steps = [
        { id: 'basic', title: 'Osnovni Podaci', icon: <Building2 size={20} /> },
        { id: 'location', title: 'Lokacija', icon: <MapPin size={20} /> },
        { id: 'content', title: 'Sadržaj', icon: <Globe size={20} /> },
        { id: 'images', title: 'Slike', icon: <ImageIcon size={20} /> },
        { id: 'rooms', title: 'Sobe', icon: <Bed size={20} /> },
        { id: 'capacity', title: 'Kapaciteti', icon: <Calendar size={20} /> },
        { id: 'pricing', title: 'Cenovnik', icon: <DollarSign size={20} /> },
        { id: 'amenities', title: 'Sadržaji', icon: <Shield size={20} /> },
        { id: 'rates', title: 'Cene', icon: <DollarSign size={20} /> },
        { id: 'policies', title: 'Pravila', icon: <Key size={20} /> }
    ];

    const updateProperty = (updates: Partial<Property>) => {
        setPropertyData(prev => ({ ...prev, ...updates }));
    };

    const handleNext = () => {
        const validationErrors = validateProperty(propertyData);
        if (validationErrors.length > 0 && currentStep === steps.length - 1) {
            setErrors(validationErrors);
            return;
        }
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
            setErrors([]);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
            setErrors([]);
        }
    };

    const handleSave = (shouldClose: boolean = false) => {
        // Only validate on final step or when closing
        if (shouldClose || currentStep === steps.length - 1) {
            const validationErrors = validateProperty(propertyData);
            if (validationErrors.length > 0) {
                setErrors(validationErrors);
            }
        }
        onSave(propertyData, shouldClose);
    };

    const renderStepContent = () => {
        const stepProps = { data: propertyData, onChange: updateProperty };
        switch (steps[currentStep].id) {
            case 'basic': return <BasicInfoStep {...stepProps} />;
            case 'location': return <LocationStep {...stepProps} />;
            case 'content': return <ContentStep {...stepProps} />;
            case 'images': return <ImagesStep {...stepProps} />;
            case 'rooms': return <RoomsStep {...stepProps} />;
            case 'capacity': return <CapacityStep {...stepProps} />;
            case 'pricing': return <PricingStep property={propertyData as any} onUpdate={updateProperty} />;
            case 'amenities': return <AmenitiesStep {...stepProps} />;
            case 'rates': return <RatesStep {...stepProps} />;
            case 'policies': return <PoliciesStep {...stepProps} />;
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
                        <h2>Izmena Objekta</h2>
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                                    {steps[currentStep].icon}
                                </div>
                                <div>
                                    <h3 style={{ margin: 0 }}>{steps[currentStep].title}</h3>
                                    <span className="topbar-subtitle">
                                        MODUL: <span style={{ color: 'var(--accent)', fontWeight: 800 }}>ONBOARDING v2.0</span> • IZMENA OBJEKTA
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                KORAK {currentStep + 1} / {steps.length}
                            </div>
                            <button
                                onClick={onClose}
                                className="exit-button"
                                style={{ height: '44px', borderRadius: '12px', padding: '0 20px' }}
                            >
                                <LogOut size={16} /> Zatvori
                            </button>
                        </div>
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
                                    {renderStepContent()}
                                </motion.div>
                            </AnimatePresence>

                            {/* Validation Errors */}
                            {errors.length > 0 && (
                                <div className="validation-errors">
                                    <AlertCircle size={20} />
                                    <div>
                                        <strong>Greške u validaciji:</strong>
                                        <ul>
                                            {errors.map((error, index) => (
                                                <li key={index}>{error}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ACTION FOOTER */}
                    <div className="wizard-action-footer">
                        <button
                            onClick={handlePrevious}
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
                                        <Save size={18} /> Sačuvaj
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
                                    <Check size={18} /> Završi i Sačuvaj
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default PropertyWizard;
