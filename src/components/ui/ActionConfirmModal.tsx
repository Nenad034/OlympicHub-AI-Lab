import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ShieldCheck, X } from 'lucide-react';

interface ActionConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info' | 'success';
    onConfirm: () => void;
    onCancel: () => void;
}

export const ActionConfirmModal: React.FC<ActionConfirmModalProps> = ({
    isOpen,
    title,
    message,
    confirmText = 'Potvrdi',
    cancelText = 'Otkaži',
    type = 'warning',
    onConfirm,
    onCancel
}) => {
    if (!isOpen) return null;

    const config = {
        danger: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', icon: <AlertTriangle size={32} /> },
        warning: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', icon: <AlertTriangle size={32} /> },
        info: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', icon: <ShieldCheck size={32} /> },
        success: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', icon: <ShieldCheck size={32} /> },
    }[type];

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.8)', padding: '20px'
        }}>
            <AnimatePresence>
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    style={{
                        background: 'var(--bg-card)',
                        border: `1px solid ${config.color}`,
                        borderRadius: '24px',
                        width: '100%',
                        maxWidth: '480px',
                        overflow: 'hidden',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }}
                >
                    <div style={{ padding: '32px', textAlign: 'center' }}>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: config.bg,
                            color: config.color,
                            marginBottom: '24px'
                        }}>
                            {config.icon}
                        </div>

                        <h2 style={{ margin: '0 0 16px', fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)' }}>
                            {title}
                        </h2>

                        <p style={{ margin: '0 0 32px', fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            {message}
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <button
                                onClick={onCancel}
                                style={{
                                    padding: '14px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border)',
                                    background: 'transparent',
                                    color: 'var(--text-primary)',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                {cancelText}
                            </button>

                            <button
                                onClick={() => { onConfirm(); onCancel(); }}
                                style={{
                                    padding: '14px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: config.color,
                                    color: '#fff',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    boxShadow: `0 4px 12px ${config.bg}`,
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};
