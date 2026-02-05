import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { getUnreadNotifications, acknowledgeNotification } from '../services/solvex/solvexSyncService';
import { useAuthStore } from '../stores';

interface SolvexNotification {
    id: string;
    message: string;
    type: string;
    cis_code: string;
    new_status: string;
    created_at: string;
}

export const SolvexNotificationHub: React.FC = () => {
    const [notifications, setNotifications] = useState<SolvexNotification[]>([]);
    const { userName } = useAuthStore();

    const fetchNotifications = async () => {
        const res = await getUnreadNotifications();
        if (res.success && res.data) {
            setNotifications(res.data);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Polling every 30 seconds for new notifications
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleAcknowledge = async (id: string) => {
        const res = await acknowledgeNotification(id, userName || 'Operator');
        if (res.success) {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }
    };

    if (notifications.length === 0) return null;

    return (
        <div className="solvex-notification-container" style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            width: '100%',
            maxWidth: '500px',
            padding: '0 20px'
        }}>
            <AnimatePresence>
                {notifications.map((notif) => (
                    <motion.div
                        key={notif.id}
                        initial={{ y: -50, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="solvex-alert-card"
                        style={{
                            background: '#1e293b',
                            border: '1px solid rgba(251, 191, 36, 0.4)',
                            borderRadius: '12px',
                            padding: '16px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 20px rgba(251, 191, 36, 0.1)',
                            display: 'flex',
                            gap: '12px',
                            backdropFilter: 'blur(20px)'
                        }}
                    >
                        <div style={{ color: '#fbbf24' }}>
                            <AlertCircle size={24} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <strong style={{ color: 'white', fontSize: '14px' }}>PROMENA STATUSA (SOLVEX)</strong>
                                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                                    {new Date(notif.created_at).toLocaleTimeString()}
                                </span>
                            </div>
                            <p style={{ color: '#cbd5e1', fontSize: '13px', margin: 0, lineHeight: '1.4' }}>
                                {notif.message}
                            </p>
                            <button
                                onClick={() => handleAcknowledge(notif.id)}
                                style={{
                                    marginTop: '12px',
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    color: '#10b981',
                                    border: '1px solid rgba(16, 185, 129, 0.2)',
                                    borderRadius: '6px',
                                    padding: '6px 16px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <CheckCircle2 size={14} /> POTVRĐUJEM PRIJEM
                            </button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};
