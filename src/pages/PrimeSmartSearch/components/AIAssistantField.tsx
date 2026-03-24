import React, { type KeyboardEvent, useEffect, useState } from 'react';
import { Sparkles, Search } from 'lucide-react';
import { useSearchStore } from '../stores/useSearchStore';

export interface AIAssistantFieldProps {
    onSearch?: () => void;
    isSubmitting?: boolean;
    context?: 'stay' | 'flight' | 'package';
}

export const AIAssistantField: React.FC<AIAssistantFieldProps> = ({ onSearch, isSubmitting, context = 'stay' }) => {
    const { 
        semanticQuery, 
        setSemanticQuery, 
        pendingClarification, 
        setPendingClarification,
        updateRoomAllocation,
        addRoom,
        roomAllocations
    } = useSearchStore();
    const [loadingMessage, setLoadingMessage] = useState("Milica traži najbolju ponudu za vas...");

    useEffect(() => {
        if (isSubmitting) {
            const stayMessages = [
                "Milica traži idealne destinacije...",
                "Milica traži najbolje termine...",
                "Milica traži ekskluzivne Solvex popuste...",
                "Milica traži smeštaj sa vašim željama...",
                "Milica traži najbolje sobe za vas...",
                "Skoro gotovo, pakujem rezultate!"
            ];
            const flightMessages = [
                "Milica traži najbrže rute...",
                "Milica pretražuje sve avio kompanije...",
                "Milica traži najbolje cene karata...",
                "Milica proverava slobodna mesta...",
                "Milica optimizuje vaše putovanje...",
                "Skoro gotovo, polećemo!"
            ];
            
            const messages = context === 'flight' ? flightMessages : stayMessages;
            let idx = 0;
            const timer = setInterval(() => {
                idx = (idx + 1) % messages.length;
                setLoadingMessage(messages[idx]);
            }, 2000); 
            return () => clearInterval(timer);
        } else {
            setLoadingMessage("Milica traži najbolju ponudu za vas...");
        }
    }, [isSubmitting, context]);

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (onSearch && semanticQuery.trim()) {
                onSearch();
            }
        }
    };

    const tags = context === 'flight' ? [
        { id: 'direct', label: 'Samo direktni letovi', query: 'samo direktne letove' },
        { id: 'flextariff', label: 'Fleksibilna karta', query: 'sa fleksibilnom kartom' },
        { id: 'baggage', label: 'Prtljag uključen', query: 'sa uključenim prtljagom' },
        { id: 'business', label: 'Biznis klasa', query: 'u biznis klasi' },
        { id: 'morning', label: 'Jutarnji polazak', query: 'sa polaskom ujutru' },
        { id: 'evening', label: 'Večernji polazak', query: 'sa polaskom uveče' }
    ] : [
        { id: 'refundable', label: 'Besplatan otkaz', query: 'sa besplatnim otkazom' },
        { id: 'pool', label: 'Bazen', query: 'sa bazenom' },
        { id: 'wifi', label: 'WiFi', query: 'sa WiFi internetom' },
        { id: 'parking', label: 'Parking', query: 'sa parkingom' },
        { id: 'breakfast', label: 'Doručak', query: 'sa doručkom' },
        { id: 'center', label: 'Centar', query: 'u centru grada' },
        { id: 'stars5', label: '5 Zvezdica', query: 'sa 5 zvezdica' }
    ];

    const handleOptionSelect = (value: any) => {
        if (pendingClarification?.type === 'pax_split') {
            if (value === 'split') {
                // Current adults in first room
                const totalAdults = roomAllocations.reduce((sum, r) => sum + r.adults, 0);
                // Split 5 people into 3+2 or similar
                updateRoomAllocation(0, { adults: 3, children: 0, childrenAges: [] });
                // Add second room
                addRoom();
                const lastIdx = roomAllocations.length; // Next room index
                // This is a bit tricky with state timing, but the goal is to split
            }
            // Clear clarification and resume search
            setPendingClarification(null);
            setTimeout(() => onSearch?.(), 100);
        }
    };

    return (
        <>
            {/* INTERACTIVE CLARIFICATION OVERLAY */}
            {!isSubmitting && pendingClarification && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 99999,
                    backgroundColor: 'rgba(8, 15, 30, 0.95)',
                    backdropFilter: 'blur(20px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'v6FadeIn 0.3s ease-out',
                    padding: '24px'
                }}>
                    <div style={{
                        background: 'var(--v6-bg-section)',
                        border: '2px solid var(--v6-accent)',
                        borderRadius: '32px',
                        padding: '40px',
                        maxWidth: '500px',
                        width: '100%',
                        textAlign: 'center',
                        boxShadow: '0 30px 60px rgba(0,0,0,0.5)'
                    }}>
                        <div style={{
                            width: '120px', height: '120px', borderRadius: '32px', margin: '0 auto 24px',
                            overflow: 'hidden', border: '3px solid var(--v6-accent)',
                            boxShadow: '0 12px 32px rgba(99, 179, 237, 0.4)'
                        }}>
                            <img src="/images/milica-avatar.png" alt="Milica" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <h3 style={{ fontSize: '26px', color: 'white', marginBottom: '8px', fontWeight: 800 }}>Milica</h3>
                        <p style={{ color: 'var(--v6-text-muted)', marginBottom: '24px', fontSize: '16px' }}>Vaša AI asistentkinja za hotele</p>
                        <div style={{
                            padding: '24px', borderRadius: '20px', background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.1)', marginBottom: '24px'
                        }}>
                            <p style={{ fontSize: '18px', color: 'white', margin: 0, lineHeight: 1.5 }}>{pendingClarification.question}</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {pendingClarification.options.map((opt, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => handleOptionSelect(opt.value)}
                                    style={{
                                        padding: '16px', borderRadius: '16px', background: 'var(--v6-accent)',
                                        color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer',
                                        transition: 'transform 0.2s',
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    {opt.label}
                                </button>
                            ))}
                            <button 
                                onClick={() => setPendingClarification(null)}
                                style={{ background: 'none', border: 'none', color: 'var(--v6-text-muted)', cursor: 'pointer', marginTop: '10px' }}
                            >
                                Otkaži pretragu
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* FULL SCREEN OVERLAY WHEN SEARCHING */}
            {isSubmitting && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 99999,
                    backgroundColor: 'rgba(8, 15, 30, 0.9)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'v6FadeIn 0.3s ease-out'
                }}>
                    <style>
                        {`
                        @keyframes v6PulseAvatar {
                            0% { box-shadow: 0 0 0 0 rgba(235, 94, 40, 0.5); transform: scale(1); }
                            50% { box-shadow: 0 0 0 40px rgba(235, 94, 40, 0); transform: scale(1.02); }
                            100% { box-shadow: 0 0 0 0 rgba(235, 94, 40, 0); transform: scale(1); }
                        }
                        @keyframes v6FadeText {
                            0% { opacity: 0; transform: translateY(15px); }
                            15% { opacity: 1; transform: translateY(0); }
                            85% { opacity: 1; transform: translateY(0); }
                            100% { opacity: 0; transform: translateY(-15px); }
                        }
                        @keyframes v6LoadingSlide {
                            0% { left: -50%; }
                            100% { left: 100%; }
                        }
                        `}
                    </style>
                    
                    {/* Big Avatar Card (Center Screen) */}
                    <div style={{
                        width: '240px',
                        height: '240px',
                        borderRadius: '24px',
                        overflow: 'hidden',
                        border: '6px solid var(--v6-accent)',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                        position: 'relative',
                        animation: 'v6PulseAvatar 2.5s infinite ease-in-out',
                        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                    }}>
                        <img 
                            src="/images/milica-avatar.png" 
                            alt="Milica AI Agent" 
                            style={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'cover',
                                objectPosition: 'center top',
                                scale: '1.05'
                            }} 
                        />
                    </div>
                    
                    {/* Glowing Changing Text */}
                    <div style={{
                        marginTop: '36px',
                        fontSize: '22px',
                        fontWeight: 600,
                        color: 'white',
                        textShadow: '0 2px 10px rgba(255,255,255,0.2)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '16px'
                    }}>
                        {/* Custom loading bar indicator */}
                        <div style={{ 
                            width: '40px', height: '4px', background: 'rgba(99, 179, 237, 0.3)', 
                            borderRadius: '2px', overflow: 'hidden', position: 'relative' 
                        }}>
                            <div style={{ 
                                position: 'absolute', top: 0, left: 0, height: '100%', width: '50%', 
                                background: 'white', borderRadius: '2px',
                                animation: 'v6LoadingSlide 1s infinite ease-in-out alternate' 
                            }} />
                        </div>
                        
                        <span key={loadingMessage} style={{ animation: 'v6FadeText 2s forwards' }}>
                            {loadingMessage}
                        </span>
                    </div>
                </div>
            )}

            {/* NORMAL INPUT VIEW - MILICA ONLY */}
            <div className="v6-semantic-search-row v6-fade-in" style={{ 
              marginBottom: '32px', 
              display: 'flex', 
              gap: '16px', 
              alignItems: 'stretch',
              position: 'relative'
            }}>
                
                {/* LEFT SIDE: MILICA AVATAR (STRETCHED) */}
                <div style={{
                    flexShrink: 0,
                    width: '90px',
                    borderRadius: 'var(--v6-radius-lg)',
                    overflow: 'hidden',
                    border: '2px solid var(--v6-accent)',
                    boxShadow: '0 8px 32px rgba(99, 179, 237, 0.1)',
                    background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                }}>
                    <img 
                        src="/images/milica-avatar.png" 
                        alt="Milica AI" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', scale: '1.05' }} 
                    />
                    <div style={{ 
                        position: 'absolute', bottom: 0, left: 0, right: 0, 
                        background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)',
                        padding: '6px 0', textAlign: 'center', fontSize: '10px', fontWeight: 900,
                        color: 'var(--v6-accent)', borderTop: '1px solid rgba(255,255,255,0.1)',
                        letterSpacing: '0.05em'
                    }}>
                        MILICA AI
                    </div>
                </div>

                {/* INPUT CONTAINER */}
                <div className="v6-semantic-input-container" style={{ 
                    position: 'relative', 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column',
                    background: 'var(--v6-bg-section)',
                    border: '2px solid var(--v6-accent)',
                    borderRadius: 'var(--v6-radius-lg)',
                    overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(99, 179, 237, 0.1)',
                }}>
                    <div className="v6-ai-glow-orb" />
                    
                    {/* ── SMART TAGS BAR (TOP HALF) ── */}
                    <div style={{ 
                        padding: '8px 16px', 
                        borderBottom: '1.5px solid rgba(99, 179, 237, 0.2)',
                        background: 'rgba(99, 179, 237, 0.03)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        overflowX: 'auto',
                        scrollbarWidth: 'none',
                    }} className="v6-silent-scroll">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '4px' }}>
                            <Sparkles size={14} color="var(--v6-accent)" />
                            <span style={{ fontSize: '10px', fontWeight: 900, color: 'var(--v6-text-muted)', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>BRZI FILTERI:</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {tags.map(tag => (
                                <button
                                    key={tag.id}
                                    onClick={() => {
                                        const baseText = context === 'flight' ? 'Pronađi letove' : 'Pronađi hotele';
                                        const newQuery = semanticQuery.trim() 
                                            ? `${semanticQuery.trim()}, ${tag.query}`
                                            : `${baseText} ${tag.query}`;
                                        setSemanticQuery(newQuery);
                                    }}
                                    style={{
                                        padding: '6px 14px',
                                        background: 'var(--v6-bg-card)',
                                        border: '1.2px solid rgba(99, 179, 237, 0.3)',
                                        borderRadius: '100px',
                                        fontSize: '11px',
                                        fontWeight: 800,
                                        color: 'var(--v6-text-secondary)',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--v6-accent)';
                                        e.currentTarget.style.color = 'var(--v6-accent)';
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.borderColor = 'rgba(99, 179, 237, 0.3)';
                                        e.currentTarget.style.color = 'var(--v6-text-secondary)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    {tag.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── INPUT ZONE (BOTTOM HALF) ── */}
                    <div style={{ position: 'relative', flex: 1 }}>
                        <textarea
                            className="v6-semantic-textarea"
                            placeholder="Pitajte Milicu bilo šta... (npr. Hotel u centru sa bazenom do 200 EUR)"
                            value={semanticQuery}
                            onChange={(e) => setSemanticQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            style={{
                                width: '100%',
                                minHeight: '52px',
                                padding: '14px 80px 14px 16px',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--v6-text-primary)',
                                fontSize: '16px',
                                fontFamily: 'var(--v6-font)',
                                outline: 'none',
                                resize: 'none',
                                transition: 'all 0.3s ease',
                            }}
                        />
                        
                        {/* FLOATING ACTION BUTTON */}
                        <button 
                          onClick={onSearch}
                          disabled={isSubmitting || !semanticQuery.trim()}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            bottom: '12px',
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            background: 'var(--v6-accent)',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            opacity: semanticQuery.trim() ? 1 : 0.5,
                            boxShadow: '0 4px 12px rgba(99, 179, 237, 0.3)'
                          }}
                        >
                            <Search size={20} color="white" />
                        </button>
                    </div>
                </div>

            </div>
        </>
    );
};
