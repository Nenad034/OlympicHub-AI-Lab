import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock,
    Sparkles,
    TrendingUp,
    ArrowRight,
    Search,
    Calendar,
    MapPin,
    ShieldAlert
} from 'lucide-react';

import { usePromoStore } from '../stores/promoStore';
import type { B2BCampaign } from '../stores/promoStore';
// Helper to calculate time left
const getTimeLeft = (targetDate: string) => {
    const total = Date.parse(targetDate) - Date.parse(new Date().toString());
    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));

    return { total, days, hours, minutes, seconds };
};

const B2BPortal: React.FC = () => {
    const navigate = useNavigate();
    const [now, setNow] = useState(new Date());
    const { campaigns } = usePromoStore();

    // Update timer every second
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleCampaignClick = (campaign: B2BCampaign) => {
        // Here we build the query string for Smart Search using the campaign logic
        const queryParams = new URLSearchParams();
        if (campaign.searchParams.destination) queryParams.set('dest', campaign.searchParams.destination);
        if (campaign.searchParams.provider) queryParams.set('provider', campaign.searchParams.provider);
        queryParams.set('trigger', 'true'); // Auto-trigger search on mount

        navigate(`/smart-search?${queryParams.toString()}`);
    };

    return (
        <div style={{
            padding: '40px',
            maxWidth: '1600px',
            margin: '0 auto',
            minHeight: '100vh'
        }}>
            {/* Header Area */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '40px'
            }}>
                <div>
                    <h1 style={{
                        fontSize: '32px',
                        fontWeight: '800',
                        color: 'var(--text-primary)',
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <Sparkles color="var(--accent)" />
                        Ekskluzivne B2B Ponude
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
                        Istaknute kampanje sa uvećanim provizijama. Klik na kampanju vas vodi direktno u Smart Search rezultate.
                    </p>
                </div>

                <button
                    onClick={() => navigate('/smart-search')}
                    style={{
                        padding: '14px 28px',
                        background: 'linear-gradient(135deg, var(--accent), #033d8b)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        boxShadow: '0 8px 20px var(--accent-glow)',
                        transition: 'transform 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <Search size={18} />
                    Otvori Glavni Smart Search
                </button>
            </div>

            {/* Campaigns Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                gap: '30px'
            }}>
                {campaigns.filter(c => c.isActive).map((campaign) => {
                    const timeLeft = getTimeLeft(campaign.validTo);
                    const isExpiringSoon = timeLeft.days === 0 && timeLeft.hours < 24;
                    const isExpired = timeLeft.total <= 0;

                    if (isExpired) return null; // Don't show expired campaigns

                    return (
                        <motion.div
                            key={campaign.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ y: -8, scale: 1.02 }}
                            onClick={() => handleCampaignClick(campaign)}
                            style={{
                                background: 'var(--bg-card)',
                                borderRadius: '20px',
                                overflow: 'hidden',
                                border: '1px solid var(--border)',
                                cursor: 'pointer',
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
                            }}
                        >
                            {/* Priority / Badge Ribbon */}
                            <div style={{
                                position: 'absolute',
                                top: '20px',
                                left: '-30px',
                                background: 'var(--accent)',
                                color: 'white',
                                padding: '6px 40px',
                                fontWeight: '800',
                                fontSize: '11px',
                                textTransform: 'uppercase',
                                letterSpacing: '2px',
                                transform: 'rotate(-45deg)',
                                zIndex: 10,
                                boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                            }}>
                                {campaign.badge}
                            </div>

                            {/* Image Section */}
                            <div style={{
                                height: '220px',
                                width: '100%',
                                position: 'relative'
                            }}>
                                <img
                                    src={campaign.image}
                                    alt={campaign.title}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                    }}
                                />
                                {/* Glassmorphism overlay for Commission */}
                                <div style={{
                                    position: 'absolute',
                                    bottom: '16px',
                                    right: '16px',
                                    background: 'rgba(16, 185, 129, 0.9)',
                                    backdropFilter: 'blur(10px)',
                                    padding: '8px 16px',
                                    borderRadius: '100px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    color: 'white',
                                    fontWeight: '800',
                                    fontSize: '14px',
                                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                                    border: '1px solid rgba(255,255,255,0.3)'
                                }}>
                                    <TrendingUp size={16} />
                                    {campaign.commissionBoost}
                                </div>
                            </div>

                            {/* Content Section */}
                            <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <h3 style={{
                                    fontSize: '22px',
                                    color: 'var(--text-primary)',
                                    marginBottom: '8px',
                                    fontWeight: '700'
                                }}>
                                    {campaign.title}
                                </h3>
                                <p style={{
                                    color: 'var(--text-secondary)',
                                    fontSize: '14px',
                                    lineHeight: '1.5',
                                    marginBottom: '24px',
                                    flex: 1
                                }}>
                                    {campaign.subtitle}
                                </p>

                                {/* Countdown Timer Module */}
                                <div style={{
                                    background: isExpiringSoon ? 'rgba(239, 68, 68, 0.1)' : 'var(--glass-bg)',
                                    border: `1px solid ${isExpiringSoon ? 'rgba(239, 68, 68, 0.3)' : 'var(--glass-border)'}`,
                                    borderRadius: '12px',
                                    padding: '12px 16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginTop: 'auto'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {isExpiringSoon ? <ShieldAlert size={18} color="#ef4444" /> : <Clock size={18} color="var(--text-secondary)" />}
                                        <span style={{
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            color: isExpiringSoon ? '#ef4444' : 'var(--text-secondary)',
                                            textTransform: 'uppercase'
                                        }}>
                                            {isExpiringSoon ? 'ZAVRŠAVA SE USKORO' : 'DO KRAJA AKCIJE:'}
                                        </span>
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        gap: '6px',
                                        fontFamily: 'monospace',
                                        fontSize: '16px',
                                        fontWeight: '800',
                                        color: isExpiringSoon ? '#ef4444' : 'var(--text-primary)'
                                    }}>
                                        <span>{timeLeft.days}d</span>
                                        <span>:</span>
                                        <span>{timeLeft.hours.toString().padStart(2, '0')}h</span>
                                        <span>:</span>
                                        <span>{timeLeft.minutes.toString().padStart(2, '0')}m</span>
                                        <span>:</span>
                                        <span>{timeLeft.seconds.toString().padStart(2, '0')}s</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default B2BPortal;
