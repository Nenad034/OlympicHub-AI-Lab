import React, { useState, useEffect } from 'react';
import { Upload, FileText, Sparkles, Check, X, AlertCircle, DollarSign, Calendar, Building2, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Property, RoomType } from '../../../types/property.types';
import type {
    PriceList,
    PersonCategory,
    RoomTypePricing,
    PricingRule,
    ImportPreview,
    AIAssistantMessage
} from '../../../types/pricing.types';
import { generatePricingRules, calculateFinalPrice } from '../../../utils/pricingRulesGenerator';
import { parsePriceListFile, detectFileType, validateImportPreview } from '../../../utils/priceListParsers';
import PriceCards from '../components/PriceCards';

interface PricingStepProps {
    property: Property;
    onUpdate: (property: Partial<Property>) => void;
}

export default function PricingStep({ property, onUpdate }: PricingStepProps) {
    const [priceList, setPriceList] = useState<PriceList | null>(null);
    const [selectedRoomType, setSelectedRoomType] = useState<string | null>(null);
    const [includePermutations, setIncludePermutations] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
    const [aiMessages, setAiMessages] = useState<AIAssistantMessage[]>([]);
    const [aiPrompt, setAiPrompt] = useState('');
    const [activeTab, setActiveTab] = useState<'basic' | 'rooms' | 'details'>('basic');

    // Initialize price list with default categories
    useEffect(() => {
        if (!priceList) {
            const defaultCategories: PersonCategory[] = [
                { code: 'ADL', label: 'Odrasli', ageFrom: 18, ageTo: 99 },
                { code: 'CHD1', label: 'Deca 2-7', ageFrom: 2, ageTo: 7 },
                { code: 'CHD2', label: 'Deca 7-12', ageFrom: 7, ageTo: 12 },
                { code: 'CHD3', label: 'Deca 12-18', ageFrom: 12, ageTo: 18 },
                { code: 'INF', label: 'Beba 0-2', ageFrom: 0, ageTo: 2 }
            ];

            const timestamp = Date.now();
            setPriceList({
                id: `${property.id || 'temp'}_${timestamp}`,
                name: 'Novi Cenovnik',
                propertyId: property.id || '',
                validFrom: new Date(),
                validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // +1 year
                currency: 'EUR',
                personCategories: defaultCategories,
                roomTypePricing: [],
                priceIncludes: [],
                priceExcludes: [],
                notes: [],
                validationStatus: 'pending',
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }
    }, []); // Run only once on mount

    // Handle file upload
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsImporting(true);

        try {
            const fileType = detectFileType(file.name);
            if (!fileType) {
                alert('Nepodržan format fajla. Podržani formati: Excel, PDF, JSON, XML, HTML');
                return;
            }

            const preview = await parsePriceListFile(file, fileType);

            // Validate preview
            const validationErrors = validateImportPreview(preview);
            if (validationErrors.length > 0) {
                preview.errors = [...preview.errors, ...validationErrors];
            }

            setImportPreview(preview);

            // Add AI message
            const message: AIAssistantMessage = {
                id: `msg_${Date.now()}`,
                role: 'assistant',
                content: `Učitao sam cenovnik iz fajla "${file.name}". Pronađeno je ${preview.personCategories.length} kategorija osoba i ${preview.roomTypePricing.length} tipova soba. Molim vas pregledajte i potvrdite.`,
                timestamp: new Date(),
                preview,
                requiresValidation: true,
                validationStatus: 'pending'
            };

            setAiMessages(prev => [...prev, message]);
        } catch (error) {
            alert(`Greška pri učitavanju fajla: ${error instanceof Error ? error.message : 'Nepoznata greška'}`);
        } finally {
            setIsImporting(false);
        }
    };

    // Handle import approval
    const handleApproveImport = () => {
        if (!importPreview || !priceList) return;

        setPriceList({
            ...priceList,
            personCategories: importPreview.personCategories,
            roomTypePricing: importPreview.roomTypePricing,
            validationStatus: 'approved'
        });

        setImportPreview(null);

        // Update AI message
        setAiMessages(prev => prev.map(msg =>
            msg.requiresValidation && msg.validationStatus === 'pending'
                ? { ...msg, validationStatus: 'approved' }
                : msg
        ));
    };

    // Handle import rejection
    const handleRejectImport = (reason: string) => {
        setImportPreview(null);

        // Update AI message
        setAiMessages(prev => prev.map(msg =>
            msg.requiresValidation && msg.validationStatus === 'pending'
                ? { ...msg, validationStatus: 'rejected' }
                : msg
        ));

        // Add user feedback message
        const feedbackMessage: AIAssistantMessage = {
            id: `msg_${Date.now()}`,
            role: 'user',
            content: `Odbijen import: ${reason}`,
            timestamp: new Date()
        };

        setAiMessages(prev => [...prev, feedbackMessage]);
    };

    // Generate pricing rules for a room type
    const handleGenerateRules = (roomType: RoomType) => {
        if (!priceList) return;

        const rules = generatePricingRules(roomType, priceList.personCategories, includePermutations);

        const roomTypePricing: RoomTypePricing = {
            roomTypeId: roomType.roomTypeId || '',
            roomTypeName: roomType.nameInternal || '',
            baseOccupancyVariants: roomType.allowedOccupancyVariants || [],
            pricingRules: rules
        };

        setPriceList({
            ...priceList,
            roomTypePricing: [
                ...priceList.roomTypePricing.filter(rtp => rtp.roomTypeId !== roomType.roomTypeId),
                roomTypePricing
            ]
        });

        setSelectedRoomType(roomType.roomTypeId || null);
    };

    // Update pricing rule
    const handleUpdateRule = (roomTypeId: string, ruleId: string, updates: Partial<PricingRule>) => {
        if (!priceList) return;

        setPriceList({
            ...priceList,
            roomTypePricing: priceList.roomTypePricing.map(rtp => {
                if (rtp.roomTypeId !== roomTypeId) return rtp;

                return {
                    ...rtp,
                    pricingRules: rtp.pricingRules.map(rule => {
                        if (rule.id !== ruleId) return rule;

                        const updatedRule = { ...rule, ...updates };
                        updatedRule.finalPrice = calculateFinalPrice(updatedRule);
                        return updatedRule;
                    })
                };
            })
        });
    };

    if (!priceList) {
        return <div>Loading...</div>;
    }

    return (
        <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>Cenovnik</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Kreirajte i upravljajte cenovnicima za sve tipove soba</p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <button
                    onClick={() => setActiveTab('basic')}
                    style={{
                        padding: '12px 24px',
                        background: activeTab === 'basic' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'basic' ? '2px solid #3b82f6' : '2px solid transparent',
                        color: activeTab === 'basic' ? '#3b82f6' : 'rgba(255,255,255,0.6)',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 600,
                        transition: 'all 0.2s'
                    }}
                >
                    Osnovni Podaci
                </button>
                <button
                    onClick={() => setActiveTab('rooms')}
                    style={{
                        padding: '12px 24px',
                        background: activeTab === 'rooms' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'rooms' ? '2px solid #3b82f6' : '2px solid transparent',
                        color: activeTab === 'rooms' ? '#3b82f6' : 'rgba(255,255,255,0.6)',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 600,
                        transition: 'all 0.2s'
                    }}
                >
                    Tipovi Soba
                </button>
                <button
                    onClick={() => setActiveTab('details')}
                    style={{
                        padding: '12px 24px',
                        background: activeTab === 'details' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'details' ? '2px solid #3b82f6' : '2px solid transparent',
                        color: activeTab === 'details' ? '#3b82f6' : 'rgba(255,255,255,0.6)',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 600,
                        transition: 'all 0.2s'
                    }}
                >
                    Detalji
                </button>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                {activeTab === 'basic' && (
                    <motion.div
                        key="basic"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        {/* Basic Info */}
                        <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FileText size={20} />
                                Osnovne Informacije
                            </h3>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label className="form-label">ID Cenovnika</label>
                                    <input
                                        className="glass-input"
                                        value={priceList.id}
                                        disabled
                                        style={{ opacity: 0.6 }}
                                    />
                                </div>

                                <div>
                                    <label className="form-label">Naziv</label>
                                    <input
                                        className="glass-input"
                                        value={priceList.name}
                                        onChange={(e) => setPriceList({ ...priceList, name: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="form-label">Za rezervacije od</label>
                                    <input
                                        type="date"
                                        className="glass-input"
                                        value={priceList.validFrom.toISOString().split('T')[0]}
                                        onChange={(e) => setPriceList({ ...priceList, validFrom: new Date(e.target.value) })}
                                    />
                                </div>

                                <div>
                                    <label className="form-label">Za rezervacije do</label>
                                    <input
                                        type="date"
                                        className="glass-input"
                                        value={priceList.validTo.toISOString().split('T')[0]}
                                        onChange={(e) => setPriceList({ ...priceList, validTo: new Date(e.target.value) })}
                                    />
                                </div>

                                <div>
                                    <label className="form-label">Za boravke od</label>
                                    <input
                                        type="date"
                                        className="glass-input"
                                        value={priceList.stayFrom?.toISOString().split('T')[0] || ''}
                                        onChange={(e) => setPriceList({ ...priceList, stayFrom: e.target.value ? new Date(e.target.value) : undefined })}
                                    />
                                </div>

                                <div>
                                    <label className="form-label">Za boravke do</label>
                                    <input
                                        type="date"
                                        className="glass-input"
                                        value={priceList.stayTo?.toISOString().split('T')[0] || ''}
                                        onChange={(e) => setPriceList({ ...priceList, stayTo: e.target.value ? new Date(e.target.value) : undefined })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Supplier & Financial Info */}
                        <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Building2 size={20} />
                                Dobavljač i Finansije
                            </h3>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label className="form-label">Dobavljač</label>
                                    <input
                                        className="glass-input"
                                        value={priceList.supplierId || ''}
                                        onChange={(e) => setPriceList({ ...priceList, supplierId: e.target.value })}
                                        placeholder="ID dobavljača"
                                    />
                                </div>

                                <div>
                                    <label className="form-label">Provizija dobavljača (%)</label>
                                    <input
                                        type="number"
                                        className="glass-input"
                                        value={priceList.supplierCommission || ''}
                                        onChange={(e) => setPriceList({ ...priceList, supplierCommission: parseFloat(e.target.value) || undefined })}
                                        placeholder="0.00"
                                        step="0.01"
                                    />
                                </div>

                                <div>
                                    <label className="form-label">Valuta</label>
                                    <select
                                        className="glass-input"
                                        value={priceList.currency}
                                        onChange={(e) => setPriceList({ ...priceList, currency: e.target.value })}
                                    >
                                        <option value="EUR">EUR (€)</option>
                                        <option value="USD">USD ($)</option>
                                        <option value="RSD">RSD (дин)</option>
                                        <option value="GBP">GBP (£)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="form-label">Provizija za Subagenta (%)</label>
                                    <input
                                        type="number"
                                        className="glass-input"
                                        value={priceList.subagentCommission || ''}
                                        onChange={(e) => setPriceList({ ...priceList, subagentCommission: parseFloat(e.target.value) || undefined })}
                                        placeholder="0.00"
                                        step="0.01"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Service Details */}
                        <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CreditCard size={20} />
                                Usluga i Uslovi
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label className="form-label">Naziv usluge</label>
                                    <input
                                        className="glass-input"
                                        value={priceList.serviceName || ''}
                                        onChange={(e) => setPriceList({ ...priceList, serviceName: e.target.value })}
                                        placeholder="Npr. Polupansion, All Inclusive..."
                                    />
                                </div>

                                <div>
                                    <label className="form-label">Model plaćanja</label>
                                    <textarea
                                        className="glass-input"
                                        value={priceList.paymentModel || ''}
                                        onChange={(e) => setPriceList({ ...priceList, paymentModel: e.target.value })}
                                        placeholder="Npr. Akontacija 40%, ostatak do 15 dana pre polaska"
                                        rows={3}
                                        style={{ resize: 'vertical' }}
                                    />
                                </div>

                                <div>
                                    <label className="form-label">Uslovi otkaza</label>
                                    <textarea
                                        className="glass-input"
                                        value={priceList.cancellationPolicy || ''}
                                        onChange={(e) => setPriceList({ ...priceList, cancellationPolicy: e.target.value })}
                                        placeholder="Opišite uslove otkaza rezervacije..."
                                        rows={3}
                                        style={{ resize: 'vertical' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Person Categories */}
                        <div className="glass-card" style={{ padding: '24px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Kategorije Osoba</h3>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                                {priceList.personCategories.map((category, index) => {
                                    // Auto-generate label from code and age range
                                    const autoLabel = category.code === 'ADL'
                                        ? `Odrasli (${category.ageFrom}-${category.ageTo})`
                                        : category.code === 'INF'
                                            ? `Beba (${category.ageFrom}-${category.ageTo})`
                                            : `${category.code} (${category.ageFrom}-${category.ageTo})`;

                                    return (
                                        <div key={category.code} className="glass-card" style={{ padding: '16px' }}>
                                            <div style={{ fontWeight: 700, marginBottom: '12px', color: '#3b82f6' }}>
                                                {category.code}
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                <div>
                                                    <label className="form-label" style={{ fontSize: '12px', marginBottom: '4px' }}>
                                                        Naziv (auto-generisan)
                                                    </label>
                                                    <input
                                                        className="glass-input"
                                                        value={autoLabel}
                                                        disabled
                                                        style={{ fontSize: '14px', padding: '8px', opacity: 0.7, cursor: 'not-allowed' }}
                                                    />
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                                    <div>
                                                        <label className="form-label" style={{ fontSize: '12px', marginBottom: '4px' }}>Od (godina)</label>
                                                        <input
                                                            type="number"
                                                            className="glass-input"
                                                            value={category.ageFrom === 0 ? '' : category.ageFrom}
                                                            onChange={(e) => {
                                                                const updated = [...priceList.personCategories];
                                                                const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                                                                const newCategory = { ...updated[index], ageFrom: value };
                                                                const newAutoLabel = newCategory.code === 'ADL'
                                                                    ? `Odrasli (${newCategory.ageFrom}-${newCategory.ageTo})`
                                                                    : newCategory.code === 'INF'
                                                                        ? `Beba (${newCategory.ageFrom}-${newCategory.ageTo})`
                                                                        : `${newCategory.code} (${newCategory.ageFrom}-${newCategory.ageTo})`;
                                                                updated[index] = {
                                                                    ...newCategory,
                                                                    label: newAutoLabel
                                                                };
                                                                setPriceList({ ...priceList, personCategories: updated });
                                                            }}
                                                            style={{ fontSize: '14px', padding: '8px' }}
                                                            min="0"
                                                            max="99"
                                                            placeholder="0"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="form-label" style={{ fontSize: '12px', marginBottom: '4px' }}>Do (godina)</label>
                                                        <input
                                                            type="number"
                                                            className="glass-input"
                                                            value={category.ageTo === 0 ? '' : category.ageTo}
                                                            onChange={(e) => {
                                                                const updated = [...priceList.personCategories];
                                                                const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                                                                const newCategory = { ...updated[index], ageTo: value };
                                                                const newAutoLabel = newCategory.code === 'ADL'
                                                                    ? `Odrasli (${newCategory.ageFrom}-${newCategory.ageTo})`
                                                                    : newCategory.code === 'INF'
                                                                        ? `Beba (${newCategory.ageFrom}-${newCategory.ageTo})`
                                                                        : `${newCategory.code} (${newCategory.ageFrom}-${newCategory.ageTo})`;
                                                                updated[index] = {
                                                                    ...newCategory,
                                                                    label: newAutoLabel
                                                                };
                                                                setPriceList({ ...priceList, personCategories: updated });
                                                            }}
                                                            style={{ fontSize: '14px', padding: '8px' }}
                                                            min="0"
                                                            max="99"
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'rooms' && (
                    <motion.div
                        key="rooms"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        {/* Import Section */}
                        <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Upload size={20} />
                                Import Cenovnika
                            </h3>

                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                <label className="glass-button" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FileText size={16} />
                                    Excel (.xlsx, .xls)
                                    <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} style={{ display: 'none' }} />
                                </label>

                                <label className="glass-button" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FileText size={16} />
                                    PDF (.pdf)
                                    <input type="file" accept=".pdf" onChange={handleFileUpload} style={{ display: 'none' }} />
                                </label>

                                <label className="glass-button" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FileText size={16} />
                                    JSON (.json)
                                    <input type="file" accept=".json" onChange={handleFileUpload} style={{ display: 'none' }} />
                                </label>

                                <label className="glass-button" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FileText size={16} />
                                    XML (.xml)
                                    <input type="file" accept=".xml" onChange={handleFileUpload} style={{ display: 'none' }} />
                                </label>

                                <label className="glass-button" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FileText size={16} />
                                    HTML (.html)
                                    <input type="file" accept=".html,.htm" onChange={handleFileUpload} style={{ display: 'none' }} />
                                </label>
                            </div>

                            {isImporting && (
                                <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px' }}>
                                    Učitavam fajl...
                                </div>
                            )}
                        </div>

                        {/* Import Preview */}
                        <AnimatePresence>
                            {importPreview && (
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="glass-card"
                                    style={{ padding: '24px', marginBottom: '24px', border: '2px solid rgba(59, 130, 246, 0.3)' }}
                                >
                                    <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <AlertCircle size={20} color="#3b82f6" />
                                        Pregled Importa - Potrebna Validacija
                                    </h3>

                                    <div style={{ marginBottom: '16px' }}>
                                        <strong>Kategorije Osoba ({importPreview.personCategories.length}):</strong>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                                            {importPreview.personCategories.map(cat => (
                                                <div key={cat.code} style={{ padding: '6px 12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '6px', fontSize: '14px' }}>
                                                    {cat.label} ({cat.ageFrom}-{cat.ageTo})
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {importPreview.warnings.length > 0 && (
                                        <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '8px' }}>
                                            <strong>Upozorenja:</strong>
                                            <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                                                {importPreview.warnings.map((w, i) => <li key={i}>{w}</li>)}
                                            </ul>
                                        </div>
                                    )}

                                    {importPreview.errors.length > 0 && (
                                        <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
                                            <strong>Greške:</strong>
                                            <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                                                {importPreview.errors.map((e, i) => <li key={i}>{e}</li>)}
                                            </ul>
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button
                                            className="glass-button"
                                            onClick={handleApproveImport}
                                            disabled={importPreview.errors.length > 0}
                                            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(34, 197, 94, 0.15)' }}
                                        >
                                            <Check size={16} />
                                            Odobri Import
                                        </button>

                                        <button
                                            className="glass-button"
                                            onClick={() => {
                                                const reason = prompt('Razlog odbijanja:');
                                                if (reason) handleRejectImport(reason);
                                            }}
                                            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.15)' }}
                                        >
                                            <X size={16} />
                                            Odbij Import
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Room Types */}
                        <div className="glass-card" style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Tipovi Soba</h3>

                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                                    <input
                                        type="checkbox"
                                        checked={includePermutations}
                                        onChange={(e) => setIncludePermutations(e.target.checked)}
                                    />
                                    Uključi permutacije (različit redosled dece)
                                </label>
                            </div>

                            {property.roomTypes && property.roomTypes.map(room => {
                                const roomPricing = priceList.roomTypePricing.find(rtp => rtp.roomTypeId === room.roomTypeId);
                                const isExpanded = selectedRoomType === room.roomTypeId;

                                return (
                                    <div key={room.roomTypeId} className="glass-card" style={{ padding: '16px', marginBottom: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <h4 style={{ fontSize: '16px', fontWeight: 700 }}>{room.nameInternal}</h4>
                                                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                                    {room.osnovniKreveti} osnovnih + {room.pomocniKreveti} pomoćnih kreveta
                                                </div>
                                            </div>

                                            <button
                                                className="glass-button"
                                                onClick={() => handleGenerateRules(room)}
                                                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                            >
                                                <Sparkles size={16} />
                                                {roomPricing ? 'Regeneriši Pravila' : 'Generiši Pravila'}
                                            </button>
                                        </div>

                                        {roomPricing && (
                                            <div style={{ marginTop: '16px', fontSize: '14px' }}>
                                                <strong>Generisano {roomPricing.pricingRules.length} pravila</strong>
                                                <button
                                                    className="glass-button"
                                                    onClick={() => setSelectedRoomType(isExpanded ? null : room.roomTypeId || null)}
                                                    style={{ marginLeft: '12px', fontSize: '12px', padding: '4px 12px' }}
                                                >
                                                    {isExpanded ? 'Sakrij' : 'Prikaži'}
                                                </button>
                                            </div>
                                        )}

                                        <AnimatePresence>
                                            {isExpanded && roomPricing && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    style={{ overflow: 'hidden', marginTop: '16px' }}
                                                >
                                                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                                        <table style={{ width: '100%', fontSize: '14px' }}>
                                                            <thead>
                                                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                                                    <th style={{ padding: '8px', textAlign: 'left' }}>Aktivno</th>
                                                                    <th style={{ padding: '8px', textAlign: 'left' }}>Raspored</th>
                                                                    <th style={{ padding: '8px', textAlign: 'right' }}>Osnovna Cena</th>
                                                                    <th style={{ padding: '8px', textAlign: 'right' }}>Finalna Cena</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {roomPricing.pricingRules.map(rule => (
                                                                    <tr key={rule.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                                        <td style={{ padding: '8px' }}>
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={rule.isActive}
                                                                                onChange={(e) => handleUpdateRule(room.roomTypeId || '', rule.id, { isActive: e.target.checked })}
                                                                            />
                                                                        </td>
                                                                        <td style={{ padding: '8px' }}>
                                                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                                                {rule.bedAssignment.map((bed, idx) => (
                                                                                    <span
                                                                                        key={idx}
                                                                                        style={{
                                                                                            padding: '2px 6px',
                                                                                            borderRadius: '4px',
                                                                                            fontSize: '11px',
                                                                                            background: bed.personCategory === 'ADL' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                                                                            color: bed.personCategory === 'ADL' ? '#3b82f6' : '#10b981'
                                                                                        }}
                                                                                    >
                                                                                        {bed.personCategory}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        </td>
                                                                        <td style={{ padding: '8px', textAlign: 'right' }}>
                                                                            <input
                                                                                type="number"
                                                                                value={rule.basePrice}
                                                                                onChange={(e) => handleUpdateRule(room.roomTypeId || '', rule.id, { basePrice: parseFloat(e.target.value) || 0 })}
                                                                                style={{ width: '80px', textAlign: 'right', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '4px 8px' }}
                                                                            />
                                                                        </td>
                                                                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700 }}>
                                                                            {priceList.currency} {rule.finalPrice.toFixed(2)}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'details' && (
                    <motion.div
                        key="details"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        {/* Price Includes */}
                        <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#22c55e' }}>
                                ✓ Cena Uključuje
                            </h3>
                            <PriceCards
                                cards={priceList.priceIncludes}
                                onChange={(cards) => setPriceList({ ...priceList, priceIncludes: cards })}
                                placeholder="Dodaj šta cena uključuje..."
                            />
                        </div>

                        {/* Price Excludes */}
                        <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#ef4444' }}>
                                ✗ Cena Ne Uključuje
                            </h3>
                            <PriceCards
                                cards={priceList.priceExcludes}
                                onChange={(cards) => setPriceList({ ...priceList, priceExcludes: cards })}
                                placeholder="Dodaj šta cena ne uključuje..."
                            />
                        </div>

                        {/* Notes */}
                        <div className="glass-card" style={{ padding: '24px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#f59e0b' }}>
                                📝 Napomene
                            </h3>
                            <PriceCards
                                cards={priceList.notes}
                                onChange={(cards) => setPriceList({ ...priceList, notes: cards })}
                                placeholder="Dodaj napomenu..."
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
