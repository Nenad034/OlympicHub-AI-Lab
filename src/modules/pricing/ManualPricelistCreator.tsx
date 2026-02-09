import React, { useState } from 'react';
import { FileText, Zap, Upload, Settings, ChevronUp, ChevronDown, Eye, EyeOff, LayoutPanelLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QuickPricelistForm from './QuickPricelistForm';
import AdvancedPricelistForm from './AdvancedPricelistForm';
import PricelistItemsList from './PricelistItemsList';

type SubView = 'quick' | 'advanced' | 'bulk';

interface ManualPricelistCreatorProps {
    onAddItem: (item: any) => void;
    addedItems: any[];
}

const ManualPricelistCreator: React.FC<ManualPricelistCreatorProps> = ({ onAddItem, addedItems }) => {
    const [activeView, setActiveView] = useState<SubView>('quick');
    const [isInputVisible, setIsInputVisible] = useState(true);

    const isWideView = activeView === 'advanced' || activeView === 'bulk';

    const subTabs = [
        { id: 'quick' as SubView, label: 'Brzo Kreiranje', icon: Zap, description: 'Brzi unos standardnih cenovnika' },
        { id: 'advanced' as SubView, label: 'Napredni Unos', icon: Settings, description: 'Potpuna kontrola i sve opcije' },
        { id: 'bulk' as SubView, label: 'Bulk Import', icon: Upload, description: 'Masovni uvoz iz fajlova' },
    ];

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            background: 'transparent',
            padding: isWideView ? '0' : '0 12px',
            gap: '24px'
        }}>
            {/* Control Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0 8px'
            }}>
                <div>
                    <h2 style={{ fontSize: '28px', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px', fontFamily: "'Outfit', sans-serif" }}>
                        <LayoutPanelLeft size={32} color="var(--accent)" />
                        Upravljanje Cenovnicima
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 44px', fontSize: '14px' }}>
                        Kreirajte, modifikujte i pregledajte hotelske cene u realnom vremenu.
                    </p>
                </div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsInputVisible(!isInputVisible)}
                    style={{
                        padding: '12px 20px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        color: isInputVisible ? 'var(--text-secondary)' : 'var(--accent)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '14px',
                        fontWeight: 600,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        transition: 'all 0.2s',
                        fontFamily: "inherit"
                    }}
                >
                    {isInputVisible ? <><EyeOff size={18} /> Sakrij Modul Za Unos</> : <><Eye size={18} /> Prikaži Modul Za Unos</>}
                </motion.button>
            </div>

            <AnimatePresence mode="wait">
                {isInputVisible && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -20, height: 0 }}
                        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div style={{
                            background: 'var(--glass-bg)',
                            backdropFilter: 'blur(12px)',
                            borderRadius: isWideView ? '0' : '24px', // No radius for wide view to look full screen
                            border: isWideView ? 'none' : '1px solid var(--glass-border)',
                            borderBottom: '1px solid var(--glass-border)',
                            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
                            padding: '2px',
                            width: '100%',
                            transition: 'all 0.3s ease'
                        }}>
                            {/* Sub Tabs */}
                            <div style={{
                                display: 'flex',
                                gap: '4px',
                                padding: '8px',
                                borderBottom: '1px solid var(--border)',
                                background: 'rgba(0,0,0,0.2)',
                                borderTopLeftRadius: '22px',
                                borderTopRightRadius: '22px'
                            }}>
                                {subTabs.map(tab => {
                                    const Icon = tab.icon;
                                    const isActive = activeView === tab.id;

                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveView(tab.id)}
                                            style={{
                                                flex: 1,
                                                padding: '12px 16px',
                                                borderRadius: '16px',
                                                border: 'none',
                                                background: isActive ? 'var(--accent)' : 'transparent',
                                                color: isActive ? '#fff' : 'var(--text-secondary)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '12px',
                                                transition: 'all 0.2s',
                                                fontWeight: 600,
                                                fontSize: '14px',
                                                fontFamily: "inherit"
                                            }}
                                        >
                                            <Icon size={18} style={{ opacity: isActive ? 1 : 0.7 }} />
                                            <span>{tab.label}</span>
                                            {isActive && (
                                                <div style={{ fontSize: '10px', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '10px' }}>
                                                    Aktivan
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Form Area */}
                            <div style={{
                                padding: isWideView ? '16px' : '32px',
                                width: '100%',
                                boxSizing: 'border-box',
                                transition: 'all 0.3s ease'
                            }}>
                                {activeView === 'quick' && <QuickPricelistForm onAddItem={onAddItem} addedItems={addedItems} />}
                                {activeView === 'advanced' && (
                                    <div style={{ width: '100%' }}>
                                        <AdvancedPricelistForm onAddItem={onAddItem} />
                                    </div>
                                )}
                                {activeView === 'bulk' && (
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '100px 60px',
                                        gap: '20px',
                                        color: 'var(--text-secondary)',
                                        background: 'rgba(255,255,255,0.02)',
                                        borderRadius: '16px',
                                        border: '2px dashed var(--border)',
                                        width: '100%',
                                        boxSizing: 'border-box'
                                    }}>
                                        <Upload size={80} style={{ opacity: 0.2, color: 'var(--accent)' }} />
                                        <div style={{ textAlign: 'center' }}>
                                            <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '24px' }}>Bulk Import Modul</h3>
                                            <p style={{ margin: '8px 0 0 0', fontSize: '16px' }}>Prevucite Excel fajl ili odaberite sa računara za masovni unos.</p>
                                        </div>
                                        <button className="btn-secondary" style={{ padding: '14px 32px', borderRadius: '14px', fontSize: '16px', fontWeight: 600 }}>Odaberi Fajl</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ManualPricelistCreator;
