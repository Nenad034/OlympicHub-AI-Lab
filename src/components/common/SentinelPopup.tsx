import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Shield, X, Bell, Zap } from 'lucide-react';
import { sentinelEvents } from '../../utils/sentinelEvents';

interface SentinelAlert {
    title: string;
    message: string;
    type: 'critical' | 'warning' | 'info';
    timestamp: Date;
}

export const SentinelPopup = () => {
    const [alert, setAlert] = useState<SentinelAlert | null>(null);

    useEffect(() => {
        const unsubscribe = sentinelEvents.subscribe((newAlert) => {
            setAlert(newAlert);

            // Auto-dismiss after 8 seconds if not critical
            if (newAlert.type !== 'critical') {
                setTimeout(() => {
                    setAlert(prev => prev === newAlert ? null : prev);
                }, 8000);
            }
        });

        return unsubscribe;
    }, []);

    if (!alert) return null;

    const colors = {
        critical: {
            bg: 'rgba(239, 68, 68, 0.1)',
            border: '#ef4444',
            icon: '#ef4444',
            shadow: 'rgba(239, 68, 68, 0.3)'
        },
        warning: {
            bg: 'rgba(245, 158, 11, 0.1)',
            border: '#f59e0b',
            icon: '#f59e0b',
            shadow: 'rgba(245, 158, 11, 0.3)'
        },
        info: {
            bg: 'rgba(59, 130, 246, 0.1)',
            border: '#3b82f6',
            icon: '#3b82f6',
            shadow: 'rgba(59, 130, 246, 0.3)'
        }
    }[alert.type];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
                style={{
                    position: 'fixed',
                    bottom: '30px',
                    right: '30px',
                    zIndex: 9999,
                    width: '380px',
                    background: 'rgba(15, 23, 42, 0.95)',
                    backdropFilter: 'blur(12px)',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '16px',
                    padding: '20px',
                    boxShadow: `0 10px 40px -10px ${colors.shadow}`,
                    display: 'flex',
                    gap: '15px',
                    overflow: 'hidden'
                }}
            >
                {/* Decorative background element */}
                <div style={{
                    position: 'absolute',
                    top: '-20px',
                    right: '-20px',
                    width: '100px',
                    height: '100px',
                    background: `radial-gradient(circle, ${colors.bg} 0%, transparent 70%)`,
                    pointerEvents: 'none'
                }} />

                <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: colors.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: colors.icon,
                    flexShrink: 0
                }}>
                    {alert.type === 'critical' ? <AlertCircle size={24} /> :
                        alert.type === 'warning' ? <Zap size={24} /> : <Shield size={24} />}
                </div>

                <div style={{ flex: 1 }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '6px'
                    }}>
                        <h4 style={{
                            margin: 0,
                            fontSize: '15px',
                            fontWeight: 700,
                            color: '#fff',
                            letterSpacing: '0.01em'
                        }}>
                            {alert.title}
                        </h4>
                        <span style={{
                            fontSize: '10px',
                            color: 'rgba(255,255,255,0.4)',
                            fontWeight: 600
                        }}>
                            {alert.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                    <p style={{
                        margin: 0,
                        fontSize: '13px',
                        lineHeight: '1.5',
                        color: 'rgba(255,255,255,0.7)'
                    }}>
                        {alert.message}
                    </p>

                    {alert.type === 'critical' && (
                        <div style={{
                            marginTop: '12px',
                            display: 'flex',
                            gap: '8px'
                        }}>
                            <button
                                onClick={() => setAlert(null)}
                                style={{
                                    padding: '6px 14px',
                                    background: colors.border,
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                Razumem
                            </button>
                        </div>
                    )}
                </div>

                <button
                    onClick={() => setAlert(null)}
                    style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: 'transparent',
                        border: 'none',
                        color: 'rgba(255,255,255,0.3)',
                        cursor: 'pointer',
                        padding: '4px'
                    }}
                >
                    <X size={16} />
                </button>
            </motion.div>
        </AnimatePresence>
    );
};

export default SentinelPopup;
