import React, { type KeyboardEvent, useEffect, useState } from 'react';
import { Sparkles, Search } from 'lucide-react';
import { useSearchStore } from '../stores/useSearchStore';

export interface AIAssistantFieldProps {
    onSearch?: () => void;
    isSubmitting?: boolean;
}

export const AIAssistantField: React.FC<AIAssistantFieldProps> = ({ onSearch, isSubmitting }) => {
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
            const messages = [
                "Milica traži idealne destinacije...",
                "Milica traži najbolje termine...",
                "Milica traži ekskluzivne Solvex popuste...",
                "Milica traži smeštaj sa vašim željama...",
                "Milica traži najbolje sobe za vas...",
                "Skoro gotovo, pakujem rezultate!"
            ];
            let idx = 0;
            const timer = setInterval(() => {
                idx = (idx + 1) % messages.length;
                setLoadingMessage(messages[idx]);
            }, 2000); 
            return () => clearInterval(timer);
        } else {
            setLoadingMessage("Milica traži najbolju ponudu za vas...");
        }
    }, [isSubmitting]);

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (onSearch && semanticQuery.trim()) {
                onSearch();
            }
        }
    };

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
                            width: '100px', height: '100px', borderRadius: '24px', margin: '0 auto 24px',
                            overflow: 'hidden', border: '3px solid var(--v6-accent)'
                        }}>
                            <img src="/images/milica-avatar.png" alt="Milica" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <h3 style={{ fontSize: '24px', color: 'white', marginBottom: '16px' }}>{pendingClarification.question}</h3>
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

            {/* NORMAL INPUT VIEW */}
            <div className="v6-semantic-search-row v6-fade-in" style={{ marginBottom: '16px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                
                {/* SQUPORTRAIT AVATAR MODULE */}
                <div style={{
                    flexShrink: 0,
                    width: '96px',
                    height: '110px',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    border: '3px solid var(--v6-accent)',
                    boxShadow: '0 8px 24px rgba(99, 179, 237, 0.2)',
                    background: 'linear-gradient(135deg, rgba(23,37,84,1), rgba(30,58,138,1))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    marginTop: '6px'
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
                    
                    {/* AI Badge inside the module */}
                    <div style={{
                        position: 'absolute',
                        bottom: '0',
                        left: '0',
                        right: '0',
                        background: 'rgba(15, 23, 42, 0.8)',
                        backdropFilter: 'blur(4px)',
                        padding: '4px 0',
                        textAlign: 'center',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'var(--v6-accent)',
                        borderTop: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        MILICA AI
                    </div>
                </div>

                {/* INPUT CONTAINER */}
                <div className="v6-semantic-input-container" style={{ position: 'relative', flex: 1 }}>
                    <div className="v6-ai-glow-orb" />
                    <textarea
                        className="v6-semantic-textarea"
                        placeholder="Zdravo, ja sam Milica! Kako mogu da dizajniram vaše idealno putovanje danas? Opišite mi u jednoj rečenici šta želite! (npr. 'Nađi mi dobar hotel za decu u Grčkoj')"
                        value={semanticQuery}
                        onChange={(e) => setSemanticQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        style={{
                            width: '100%',
                            minHeight: '120px',
                            padding: '24px 80px 24px 24px', // Right padding for button
                            borderRadius: 'var(--v6-radius-lg)',
                            background: 'var(--v6-bg-section)',
                            border: '2px solid var(--v6-accent)',
                            color: 'var(--v6-text-primary)',
                            fontSize: 'var(--v6-fs-md)',
                            fontFamily: 'var(--v6-font)',
                            outline: 'none',
                            resize: 'none',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 8px 32px rgba(99, 179, 237, 0.1)',
                        }}
                    />
                    
                    {/* FLOATING ACTION BUTTON */}
                    <button 
                      onClick={onSearch}
                      disabled={isSubmitting || !semanticQuery.trim()}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '12px',
                        width: '48px',
                        height: '48px',
                        borderRadius: '14px',
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
                      className="v6-ai-search-trigger"
                    >
                        <Search size={22} color="white" />
                    </button>

                    <div style={{ position: 'absolute', right: '20px', bottom: '15px', display: 'flex', gap: '8px', pointerEvents: 'none' }}>
                        <span style={{ fontSize: '12px', color: 'var(--v6-text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                            <Sparkles size={12} style={{ marginRight: '4px' }} />
                            Smart Extraction Active
                        </span>
                    </div>
                </div>
            </div>
        </>
    );
};
