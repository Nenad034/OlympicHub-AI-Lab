import React, { useState, useEffect } from 'react';
import { Upload, FileText, Sparkles, Check, X, AlertCircle, DollarSign, Calendar, Building2, CreditCard, Settings, Layers, Grid3X3, Link as LinkIcon, Info, Users, Baby, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Property, RoomType } from '../../../types/property.types';
import type {
    PriceList,
    PersonCategory,
    RoomTypePricing,
    PricingRule,
    ImportPreview,
    AIAssistantMessage,
    PricingMatrix,
    PricingMatrixContext,
    MatrixCell
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
    const [activeTab, setActiveTab] = useState<'basic' | 'matrix' | 'rooms' | 'details'>('basic');
    const [selectedVariantId, setSelectedVariantId] = useState<string>('v1');

    // Initialize price list with default categories and variant-based matrix
    useEffect(() => {
        if (!priceList) {
            if (property.priceList) {
                // Initialize from existing property data
                setPriceList(property.priceList);
                return;
            }

            const defaultCategories: PersonCategory[] = [
                { code: 'ADL', label: 'Odrasli', ageFrom: 18, ageTo: 99 },
                { code: 'CHD1', label: 'Deca 2-7', ageFrom: 2, ageTo: 7 },
                { code: 'CHD2', label: 'Deca 7-12', ageFrom: 7, ageTo: 12 },
                { code: 'INF', label: 'Beba 0-2', ageFrom: 0, ageTo: 2 }
            ];

            const mockVariants = [
                { id: 'v1', persons: ['ADL', 'ADL', 'CHD1'], label: '2 Odrasli + 1 Dete (2-7)' },
                { id: 'v2', persons: ['ADL', 'ADL', 'CHD2'], label: '2 Odrasli + 1 Dete (7-12)' },
                { id: 'v3', persons: ['ADL', 'CHD1', 'CHD1'], label: '1 Odrasla + 2 Dece (2-7)' },
                { id: 'v4', persons: ['ADL', 'ADL', 'CHD1', 'CHD2'], label: '2 Odrasli + 2 Dece (Mix)' },
                { id: 'v5', persons: ['ADL', 'ADL', 'ADL'], label: '3 Odrasle osobe' },
                { id: 'v6', persons: ['ADL', 'ADL', 'INF'], label: '2 Odrasli + Beba' },
                { id: 'v7', persons: ['ADL', 'CHD1'], label: '1 Odrasla + 1 Dete (2-7)' },
                { id: 'v8', persons: ['ADL', 'ADL', 'CHD1', 'INF'], label: '2 ADL + 1 CHD + 1 INF' }
            ];

            const initialMatrix: PricingMatrix = {
                id: 'm1',
                name: 'Glavna Matrica',
                targetRoomTypeIds: property.roomTypes?.map(r => r.roomTypeId || '') || [],
                contexts: mockVariants.map(v => ({
                    id: v.id,
                    baseAdults: v.persons.filter(p => p === 'ADL').length,
                    label: v.label,
                    grid: v.persons.reduce((acc, p, idx) => {
                        const bedKey = idx < 2 ? `BASIC_${idx + 1}` : `EXTRA_${idx - 1}`;
                        acc[bedKey] = {
                            [p]: {
                                type: 'percent',
                                value: p === 'ADL' && idx < 2 ? 100 : (idx >= 2 ? 50 : 80)
                            }
                        };
                        return acc;
                    }, {} as any)
                }))
            };

            const timestamp = Date.now();
            setPriceList({
                id: `${property.id || 'temp'}_${timestamp}`,
                name: 'Novi Cenovnik',
                propertyId: property.id || '',
                validFrom: new Date(),
                validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                currency: 'EUR',
                personCategories: defaultCategories,
                roomTypePricing: [],
                pricingMatrices: [initialMatrix],
                priceIncludes: [],
                priceExcludes: [],
                notes: [],
                validationStatus: 'pending',
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }
    }, [property.id, property.roomTypes, property.priceList]);

    // Sync state back to parent
    useEffect(() => {
        if (priceList) {
            onUpdate({ priceList });
        }
    }, [priceList]);

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
                content: `Učitao sam cenovnik iz fajla "${file.name}".Pronađeno je ${preview.personCategories.length} kategorija osoba i ${preview.roomTypePricing.length} tipova soba.Molim vas pregledajte i potvrdite.`,
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

    // Apply Matrix to a Room Type
    const handleApplyMatrix = (roomTypeId: string) => {
        if (!priceList || !priceList.pricingMatrices || priceList.pricingMatrices.length === 0) return;

        const matrix = priceList.pricingMatrices[0];
        const rtp = priceList.roomTypePricing.find(r => r.roomTypeId === roomTypeId);
        if (!rtp) return;

        const baseRoomPrice = rtp.basePrice || 0;

        const updatedRules = rtp.pricingRules.map(rule => {
            // Find matching context in matrix
            const matchingContext = matrix.contexts.find(ctx => {
                const ctxKeys = Object.keys(ctx.grid);
                if (ctxKeys.length !== rule.bedAssignment.length) return false;

                return rule.bedAssignment.every(bed => {
                    const bedKey = `${bed.bedType === 'osnovni' ? 'BASIC' : 'EXTRA'}_${bed.bedIndex + 1}`;
                    return ctx.grid[bedKey] && ctx.grid[bedKey][bed.personCategory];
                });
            });

            if (!matchingContext) return rule;

            // Calculate total multiplier or fixed additions from matrix
            let rulePrice = baseRoomPrice;
            let totalPercent = 0;
            let totalFixed = 0;

            rule.bedAssignment.forEach(bed => {
                const bedKey = `${bed.bedType === 'osnovni' ? 'BASIC' : 'EXTRA'}_${bed.bedIndex + 1}`;
                const cell = matchingContext.grid[bedKey][bed.personCategory];

                if (cell.type === 'percent') {
                    // Percent is usually of the baseRoomPrice?
                    // Or is it shared? Let's assume percent of base per person.
                    // If base is 100€ and matrix says 100% for ADL, then it's 100€ for that ADL.
                    // Wait, usually the baseRoomPrice is for the WHOLE room for standard occupancy.
                    // Let's assume baseRoomPrice is the price for 1 Adult in Basic Bed.
                    totalPercent += cell.value;
                } else if (cell.type === 'fixed') {
                    totalFixed += cell.value;
                }
            });

            const finalBase = (baseRoomPrice * totalPercent / 100) + totalFixed;

            return {
                ...rule,
                basePrice: finalBase,
                finalPrice: calculateFinalPrice({ ...rule, basePrice: finalBase })
            };
        });

        setPriceList({
            ...priceList,
            roomTypePricing: priceList.roomTypePricing.map(r =>
                r.roomTypeId === roomTypeId ? { ...r, pricingRules: updatedRules } : r
            )
        });
    };

    if (!priceList) {
        return <div>Loading...</div>;
    }

    return (
        <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>Cenovnik</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Kreirajte i upravljajte cenovnicima za sve tipove soba</p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border)' }}>
                <button
                    onClick={() => setActiveTab('basic')}
                    style={{
                        padding: '12px 24px',
                        background: activeTab === 'basic' ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'basic' ? '2px solid var(--accent)' : '2px solid transparent',
                        color: activeTab === 'basic' ? 'var(--accent)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 600,
                        transition: 'all 0.2s'
                    }}
                >
                    Osnovni Podaci
                </button>
                <button
                    onClick={() => setActiveTab('matrix')}
                    style={{
                        padding: '12px 24px',
                        background: activeTab === 'matrix' ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'matrix' ? '2px solid var(--accent)' : '2px solid transparent',
                        color: activeTab === 'matrix' ? 'var(--accent)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 600,
                        transition: 'all 0.2s'
                    }}
                >
                    <Grid3X3 size={16} style={{ marginRight: '8px', display: 'inline' }} />
                    Matrica Cena (Globalna)
                </button>
                <button
                    onClick={() => setActiveTab('rooms')}
                    style={{
                        padding: '12px 24px',
                        background: activeTab === 'rooms' ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'rooms' ? '2px solid var(--accent)' : '2px solid transparent',
                        color: activeTab === 'rooms' ? 'var(--accent)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 600,
                        transition: 'all 0.2s'
                    }}
                >
                    <Layers size={16} style={{ marginRight: '8px', display: 'inline' }} />
                    Tipovi Soba
                </button>
                <button
                    onClick={() => setActiveTab('details')}
                    style={{
                        padding: '12px 24px',
                        background: activeTab === 'details' ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'details' ? '2px solid var(--accent)' : '2px solid transparent',
                        color: activeTab === 'details' ? 'var(--accent)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 600,
                        transition: 'all 0.2s'
                    }}
                >
                    <FileText size={16} style={{ marginRight: '8px', display: 'inline' }} />
                    Dodatni Detalji
                </button>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                {activeTab === 'matrix' && (
                    <motion.div
                        key="matrix"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="glass-card"
                        style={{ padding: '32px' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                            <div>
                                <h3 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '8px', color: 'var(--text-primary)' }}>Grafička Matrica Pravila</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '600px', opacity: 0.7 }}>
                                    Definišite cene direktno na osnovu vizuelnog sastava gostiju. Odaberite kombinaciju iz menija ispod.
                                </p>
                            </div>
                            <div style={{ padding: '12px 20px', background: 'rgba(59,130,246,0.1)', borderRadius: '14px', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Sparkles size={18} color="var(--accent)" />
                                <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent)', letterSpacing: '1px' }}>VISUAL MODE</span>
                            </div>
                        </div>

                        {/* Variant Selector (Dropdown) */}
                        <div className="glass-card" style={{ padding: '24px', background: 'var(--bg-sidebar)', border: '1px solid var(--border)', marginBottom: '32px' }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, color: 'var(--text-secondary)', opacity: 0.6, textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '1px' }}>
                                Odaberite Sastav Gostiju (Varijanta)
                            </label>
                            <div style={{ position: 'relative' }}>
                                <select
                                    value={selectedVariantId}
                                    onChange={(e) => setSelectedVariantId(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '16px 20px',
                                        borderRadius: '16px',
                                        background: 'var(--bg-input)',
                                        border: '1px solid var(--border)',
                                        color: 'var(--text-primary)',
                                        fontSize: '16px',
                                        fontWeight: 700,
                                        appearance: 'none',
                                        outline: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {priceList.pricingMatrices?.[0].contexts.map((variant: PricingMatrixContext) => (
                                        <option key={variant.id} value={variant.id} style={{ background: 'var(--bg-sidebar)', color: 'var(--text-primary)' }}>
                                            {variant.label}
                                        </option>
                                    ))}
                                </select>
                                <div style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.5, color: 'var(--text-secondary)' }}>
                                    <Layers size={20} />
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '32px' }}>
                            {/* Interactive Matrix Area */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {/* visual Detail Area */}
                                {(() => {
                                    const matrix = priceList.pricingMatrices?.[0];
                                    const variant: PricingMatrixContext | undefined = matrix?.contexts.find(c => c.id === selectedVariantId);
                                    if (!variant) return null;

                                    return (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                            {/* Graphic Sequence */}
                                            <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(59,130,246,0.03)', borderRadius: '32px', border: '1px solid var(--border)' }}>
                                                <div style={{ display: 'inline-flex', gap: '20px', alignItems: 'center' }}>
                                                    {Object.keys(variant.grid).map((bedKey) => {
                                                        const personCode = Object.keys(variant.grid[bedKey])[0];
                                                        const isADL = personCode === 'ADL';
                                                        const isINF = personCode === 'INF';

                                                        return (
                                                            <div key={bedKey} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                                                <div style={{
                                                                    width: '64px',
                                                                    height: '64px',
                                                                    borderRadius: '20px',
                                                                    background: isADL ? 'var(--accent)' : (isINF ? '#f59e0b' : 'var(--accent-green)'),
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    boxShadow: '0 10px 20px rgba(0,0,0,0.05)',
                                                                    border: bedKey.includes('BASIC') ? '2px solid rgba(255,255,255,0.3)' : 'none'
                                                                }}>
                                                                    {isADL ? <Building2 size={32} color="#fff" /> : (isINF ? <Baby size={32} color="#fff" /> : <Users size={32} color="#fff" />)}
                                                                </div>
                                                                <div style={{ textAlign: 'center' }}>
                                                                    <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-primary)' }}>{personCode}</div>
                                                                    <div style={{ fontSize: '9px', opacity: 0.5, color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '2px' }}>
                                                                        {bedKey.replace('_', ' ')}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Data Inputs */}
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
                                                {Object.entries(variant.grid).map(([bedKey, personEntry]) => {
                                                    const personCode = Object.keys(personEntry)[0];
                                                    const cell = personEntry[personCode];
                                                    const isBasic = bedKey.includes('BASIC');
                                                    const vIdx = matrix?.contexts.findIndex(c => c.id === selectedVariantId) ?? -1;
                                                    if (vIdx === -1 || !matrix) return null;

                                                    return (
                                                        <div key={bedKey} className="glass-card" style={{ padding: '24px', background: 'var(--bg-input)', position: 'relative', overflow: 'hidden', border: '1px solid var(--border)' }}>
                                                            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: isBasic ? 'var(--accent)' : 'var(--accent-green)' }} />

                                                            <div style={{ marginBottom: '20px' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <span style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-secondary)', opacity: 0.5, letterSpacing: '1px' }}>{bedKey}</span>
                                                                    <div style={{ padding: '4px 8px', borderRadius: '6px', background: isBasic ? 'rgba(59,130,246,0.1)' : 'rgba(16,185,129,0.1)', fontSize: '9px', fontWeight: 800, color: isBasic ? 'var(--accent)' : 'var(--accent-green)' }}>
                                                                        {isBasic ? 'FIXED' : 'EXTRA'}
                                                                    </div>
                                                                </div>
                                                                <h5 style={{ margin: '8px 0 2px 0', fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                                                                    {personCode === 'ADL' ? 'Odrasla' :
                                                                        personCode === 'INF' ? 'Beba 0-2' :
                                                                            personCode === 'CHD1' ? 'Dete 2-7' : 'Dete 7-12'}
                                                                </h5>
                                                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', opacity: 0.6 }}>Pozicija: {isBasic ? 'Osnovni krev.' : 'Pomoćni krev.'}</div>
                                                            </div>

                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                                <div style={{ background: 'var(--bg-sidebar)', borderRadius: '12px', padding: '10px', border: '1px solid var(--border)' }}>
                                                                    <select
                                                                        value={cell.type}
                                                                        onChange={(e) => {
                                                                            if (!matrix) return;
                                                                            const newMatrices = [...priceList.pricingMatrices!];
                                                                            newMatrices[0].contexts[vIdx].grid[bedKey][personCode].type = e.target.value as any;
                                                                            setPriceList({ ...priceList, pricingMatrices: newMatrices });
                                                                        }}
                                                                        style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '12px', fontWeight: 700, width: '100%', outline: 'none' }}
                                                                    >
                                                                        <option value="percent">% Od Baze</option>
                                                                        <option value="fixed">€ Fiksna dopl.</option>
                                                                        <option value="free">Gratis / Uključ.</option>
                                                                    </select>
                                                                </div>

                                                                {cell.type !== 'free' && (
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-sidebar)', borderRadius: '12px', padding: '12px 16px', border: '1px solid var(--accent)' }}>
                                                                        <input
                                                                            type="number"
                                                                            value={cell.value}
                                                                            onChange={(e) => {
                                                                                if (!matrix) return;
                                                                                const newMatrices = [...priceList.pricingMatrices!];
                                                                                newMatrices[0].contexts[vIdx].grid[bedKey][personCode].value = parseFloat(e.target.value) || 0;
                                                                                setPriceList({ ...priceList, pricingMatrices: newMatrices });
                                                                            }}
                                                                            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '24px', fontWeight: 800, width: '100%', outline: 'none' }}
                                                                        />
                                                                        <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent)' }}>{cell.type === 'percent' ? '%' : '€'}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Room Apply Selector (Sidebar) */}
                            <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '32px' }}>
                                <div className="glass-card" style={{ padding: '24px', background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                                    <h4 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)' }}>
                                        <LinkIcon size={18} color="var(--accent)" /> Povezane Sobe
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {property.roomTypes?.map(room => {
                                            const isLinked = priceList.pricingMatrices?.[0].targetRoomTypeIds.includes(room.roomTypeId || '');
                                            return (
                                                <div
                                                    key={room.roomTypeId}
                                                    onClick={() => {
                                                        const newMatrices = [...(priceList.pricingMatrices || [])];
                                                        const currentIds = newMatrices[0].targetRoomTypeIds;
                                                        if (currentIds.includes(room.roomTypeId!)) {
                                                            newMatrices[0].targetRoomTypeIds = currentIds.filter(id => id !== room.roomTypeId);
                                                        } else {
                                                            newMatrices[0].targetRoomTypeIds = [...currentIds, room.roomTypeId!];
                                                        }
                                                        setPriceList({ ...priceList, pricingMatrices: newMatrices });
                                                    }}
                                                    style={{
                                                        padding: '12px 16px',
                                                        borderRadius: '12px',
                                                        background: isLinked ? 'rgba(59,130,246,0.08)' : 'var(--bg-sidebar)',
                                                        border: `1px solid ${isLinked ? 'var(--accent)' : 'var(--border)'}`,
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '12px',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <div style={{ width: '18px', height: '18px', borderRadius: '5px', border: '2px solid var(--accent)', background: isLinked ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        {isLinked && <Check size={12} color="#fff" />}
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{room.nameInternal}</div>
                                                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', opacity: 0.6 }}>{room.category}</div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div style={{ marginTop: '32px', padding: '16px', background: 'rgba(255,221,0,0.05)', borderRadius: '12px', border: '1px dashed rgba(255,221,0,0.3)', display: 'flex', gap: '12px' }}>
                                        <Info size={20} color="#f59e0b" style={{ flexShrink: 0 }} />
                                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                                            Promene će odmah biti primenjene.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </motion.div>
                )}

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
                            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>Kategorije Osoba</h3>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                                {priceList.personCategories.map((category, index) => {
                                    // Auto-generate label from code and age range
                                    const autoLabel = category.code === 'ADL'
                                        ? `Odrasli(${category.ageFrom} - ${category.ageTo})`
                                        : category.code === 'INF'
                                            ? `Beba(${category.ageFrom} - ${category.ageTo})`
                                            : `${category.code}(${category.ageFrom} - ${category.ageTo})`;

                                    return (
                                        <div key={category.code} className="glass-card" style={{ padding: '16px', background: 'var(--bg-sidebar)', border: '1px solid var(--border)' }}>
                                            <div style={{ fontWeight: 700, marginBottom: '12px', color: 'var(--accent)' }}>
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
                                                                    ? `Odrasli(${newCategory.ageFrom} - ${newCategory.ageTo})`
                                                                    : newCategory.code === 'INF'
                                                                        ? `Beba(${newCategory.ageFrom} - ${newCategory.ageTo})`
                                                                        : `${newCategory.code}(${newCategory.ageFrom} - ${newCategory.ageTo})`;
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
                                                                    ? `Odrasli(${newCategory.ageFrom} - ${newCategory.ageTo})`
                                                                    : newCategory.code === 'INF'
                                                                        ? `Beba(${newCategory.ageFrom} - ${newCategory.ageTo})`
                                                                        : `${newCategory.code}(${newCategory.ageFrom} - ${newCategory.ageTo})`;
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

                            <button
                                onClick={() => {
                                    const newCat: PersonCategory = {
                                        code: `CHD${priceList.personCategories.length}` as any,
                                        label: 'Novo dete',
                                        ageFrom: 0,
                                        ageTo: 12
                                    };
                                    setPriceList({
                                        ...priceList,
                                        personCategories: [...priceList.personCategories, newCat]
                                    });
                                }}
                                className="glass-button"
                                style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent)' }}
                            >
                                <Plus size={16} /> Dodaj Kategoriju
                            </button>
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

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <label style={{ fontSize: '11px', fontWeight: 700, opacity: 0.6 }}>Osnovna Cena (€)</label>
                                                    <input
                                                        type="number"
                                                        value={roomPricing?.basePrice || 0}
                                                        onChange={(e) => {
                                                            const val = parseFloat(e.target.value) || 0;
                                                            setPriceList({
                                                                ...priceList,
                                                                roomTypePricing: priceList.roomTypePricing.map(r =>
                                                                    r.roomTypeId === room.roomTypeId ? { ...r, basePrice: val } : r
                                                                )
                                                            });
                                                        }}
                                                        className="glass-input"
                                                        style={{ width: '120px', padding: '8px 12px' }}
                                                    />
                                                </div>

                                                <button
                                                    className="glass-button"
                                                    onClick={() => handleApplyMatrix(room.roomTypeId || '')}
                                                    disabled={!roomPricing}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent)' }}
                                                >
                                                    <Grid3X3 size={16} />
                                                    Primeni Matricu
                                                </button>

                                                <button
                                                    className="glass-button"
                                                    onClick={() => handleGenerateRules(room)}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                                >
                                                    <Sparkles size={16} />
                                                    {roomPricing ? 'Regeneriši' : 'Generiši Pravila'}
                                                </button>
                                            </div>
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
            {/* AI Assistant Sidebar */}
            <div style={{
                position: 'fixed',
                right: '40px',
                bottom: '120px',
                width: '380px',
                height: '600px',
                background: 'rgba(15, 23, 42, 0.9)',
                backdropFilter: 'blur(20px)',
                borderRadius: '32px',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                zIndex: 100
            }}>
                <div style={{ padding: '24px', background: 'rgba(59, 130, 246, 0.1)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '10px', background: 'var(--accent)', borderRadius: '12px' }}>
                        <Sparkles size={20} color="#fff" />
                    </div>
                    <div>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>AI Pricing Analyst</h4>
                        <div style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 700 }}>ONLINE • OPTIMIZACIJA CENOVNIKA</div>
                    </div>
                </div>

                <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }} className="glass-scroll">
                    {aiMessages.length === 0 ? (
                        <div style={{ textAlign: 'center', marginTop: '40px', opacity: 0.5 }}>
                            <DollarSign size={40} style={{ marginBottom: '16px' }} />
                            <p style={{ fontSize: '14px' }}>Nema aktivnih analiza.<br />Pitajte me bilo šta o vašim cenama.</p>
                        </div>
                    ) : (
                        aiMessages.map(msg => (
                            <div key={msg.id} style={{
                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '85%',
                                padding: '12px 16px',
                                borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                                background: msg.role === 'user' ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                                fontSize: '14px',
                                lineHeight: 1.5
                            }}>
                                {msg.content}
                            </div>
                        ))
                    )}
                </div>

                <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && aiPrompt.trim()) {
                                    const userMsg: AIAssistantMessage = {
                                        id: `msg_${Date.now()}`,
                                        role: 'user',
                                        content: aiPrompt,
                                        timestamp: new Date()
                                    };
                                    setAiMessages(prev => [...prev, userMsg]);
                                    setAiPrompt('');
                                    // Simulate AI thinking and response
                                    setTimeout(() => {
                                        const aiMsg: AIAssistantMessage = {
                                            id: `msg_${Date.now() + 1}`,
                                            role: 'assistant',
                                            content: 'Analiziram vaše podatke... Trenutno vidim da imate dobru pokrivenost za CHD kategorije, ali preporučujem proveru doplata za 3. odraslu osobu.',
                                            timestamp: new Date()
                                        };
                                        setAiMessages(prev => [...prev, aiMsg]);
                                    }, 1000);
                                }
                            }}
                            placeholder="Pitajte AI..."
                            style={{
                                width: '100%',
                                padding: '14px 20px',
                                background: 'rgba(0,0,0,0.2)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '16px',
                                color: '#fff',
                                paddingRight: '50px',
                                outline: 'none'
                            }}
                        />
                        <div style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>
                            <Sparkles size={18} />
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}
