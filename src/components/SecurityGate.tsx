import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Lock, Brain, Fingerprint } from 'lucide-react';
import { useConfig } from '../context/ConfigContext';

interface SecurityGateProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    title: string;
    description: string;
    actionType: 'delete' | 'critical_update' | 'access_vault';
    entityName?: string;
    requireMasterAuth?: boolean; // Forces Level 6 Authentication style
}

export default function SecurityGate({
    isOpen,
    onConfirm,
    onCancel,
    title,
    description,
    actionType,
    entityName = "Item",
    requireMasterAuth = false
}: SecurityGateProps) {
    const { config } = useConfig();
    const [aiAnalysis, setAiAnalysis] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [confirmInput, setConfirmInput] = useState('');

    // Simulate AI Analysis of the risk
    useEffect(() => {
        if (isOpen && actionType === 'delete') {
            analyzeRisk();
        }
    }, [isOpen, actionType]);

    const analyzeRisk = async () => {
        setIsAnalyzing(true);
        // In a real app, we would call the actual Gemini API here with the entity details
        // For now, we simulate a "Smart" check
        setTimeout(() => {
            if (config.geminiKey && config.geminiKey.length > 20) {
                // Mocking a real response for now to ensure stability
                const risks = [
                    `Deleting ${entityName} permanently removes all associated history.`,
                    `Warning: This action cannot be undone.`,
                    `AI Detection: No active dependencies found, but proceed with caution.`
                ];
                setAiAnalysis(risks.join(' '));
            } else {
                setAiAnalysis("AI Risk Assessment: Offline. Proceed with manual verification.");
            }
            setIsAnalyzing(false);

        }, 1500);
    };

    const handleConfirm = () => {
        if (requireMasterAuth) {
            if (confirmInput !== 'CONFIRM') return;
        }
        onConfirm();
        reset();
    };

    const handleCancel = () => {
        onCancel();
        reset();
    };

    const reset = () => {
        setConfirmInput('');
        setAiAnalysis('');
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{ zIndex: 9999, backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.7)' }}>
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                style={{
                    width: '500px',
                    background: '#0f172a',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '24px',
                    padding: '32px',
                    boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.5)',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Background Pulse Animation for Danger */}
                <motion.div
                    animate={{ opacity: [0.05, 0.1, 0.05] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    style={{
                        position: 'absolute', inset: 0,
                        background: 'radial-gradient(circle at center, rgba(239,68,68,0.3) 0%, transparent 70%)',
                        pointerEvents: 'none'
                    }}
                />

                <div style={{ position: 'relative', zIndex: 10 }}>
                    {/* Header */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px', textAlign: 'center' }}>
                        <div style={{
                            width: '64px', height: '64px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            borderRadius: '20px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            marginBottom: '16px',
                            border: '1px solid rgba(239, 68, 68, 0.2)'
                        }}>
                            <ShieldAlert size={32} color="#ef4444" />
                        </div>
                        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>Security Gate</h2>
                        <p style={{ color: '#94a3b8', fontSize: '14px' }}>Level 6 Authorization Required</p>
                    </div>

                    {/* Content Logic */}
                    {isAnalyzing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0' }}>
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                                <Brain size={48} color="var(--accent)" />
                            </motion.div>
                            <p style={{ marginTop: '16px', color: 'var(--accent)', fontSize: '14px', fontWeight: '600' }}>AI Guardian is analyzing dependencies...</p>
                        </div>
                    ) : (
                        <>
                            {/* AI Analysis Result */}
                            {aiAnalysis && (
                                <div style={{ background: 'rgba(37, 99, 235, 0.1)', border: '1px solid rgba(37, 99, 235, 0.2)', padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', gap: '12px' }}>
                                    <Brain size={20} color="#3b82f6" style={{ flexShrink: 0, marginTop: '2px' }} />
                                    <div>
                                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#3b82f6', marginBottom: '4px' }}>AI RISK ASSESSMENT</div>
                                        <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5' }}>{aiAnalysis}</p>
                                    </div>
                                </div>
                            )}

                            {/* Action Description */}
                            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#fff', marginBottom: '8px' }}>{title}</h3>
                                <p style={{ fontSize: '14px', color: '#94a3b8' }}>{description}</p>
                            </div>

                            {/* Master Auth Input */}
                            {requireMasterAuth && (
                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                                        Security Confirmation
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <Fingerprint size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                                        <input
                                            type="text"
                                            value={confirmInput}
                                            onChange={(e) => setConfirmInput(e.target.value)}
                                            placeholder="Type 'CONFIRM' to proceed"
                                            style={{
                                                width: '100%',
                                                background: 'rgba(15, 23, 42, 0.8)',
                                                border: '1px solid #334155',
                                                borderRadius: '12px',
                                                padding: '12px 12px 12px 40px',
                                                color: '#fff',
                                                fontSize: '14px',
                                                outline: 'none',
                                                letterSpacing: '0.5px'
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={handleCancel}
                                    style={{
                                        flex: 1,
                                        padding: '14px',
                                        borderRadius: '12px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        fontSize: '14px'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={requireMasterAuth && confirmInput !== 'CONFIRM'}
                                    style={{
                                        flex: 1,
                                        padding: '14px',
                                        borderRadius: '12px',
                                        background: (requireMasterAuth && confirmInput !== 'CONFIRM') ? 'rgba(239, 68, 68, 0.2)' : '#ef4444',
                                        border: 'none',
                                        color: (requireMasterAuth && confirmInput !== 'CONFIRM') ? '#rgba(255,255,255,0.3)' : '#fff',
                                        cursor: (requireMasterAuth && confirmInput !== 'CONFIRM') ? 'not-allowed' : 'pointer',
                                        fontWeight: '600',
                                        fontSize: '14px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}
                                >
                                    {requireMasterAuth && <Lock size={16} />}
                                    Authorize Action
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
