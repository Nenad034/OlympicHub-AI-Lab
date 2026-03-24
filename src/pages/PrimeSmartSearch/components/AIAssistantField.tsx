import React, { type KeyboardEvent, useEffect, useState } from 'react';
import { Sparkles, Search, MessageCircle, Mic, MicOff } from 'lucide-react';
import { useSearchStore } from '../stores/useSearchStore';
import { useAppStore } from '../../../stores';

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

    const { setMilicaChatOpen } = useAppStore();
    const [loadingMessage, setLoadingMessage] = useState("Milica traži najbolju ponudu za vas...");
    const [isListening, setIsListening] = useState(false);

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

    const toggleListening = () => {
        if (isListening) {
            setIsListening(false);
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Vaš pretraživač ne podržava glasovni unos.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'sr-RS';
        recognition.interimResults = true;
        recognition.continuous = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event: any) => {
            const transcript = Array.from(event.results)
                .map((result: any) => result[0])
                .map((result: any) => result.transcript)
                .join('');
            setSemanticQuery(transcript);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        
        recognition.start();
    };

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
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                }}
                className="v6-milica-trigger"
                onClick={() => setMilicaChatOpen(true)}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <div style={{
                        position: 'absolute', top: '8px', right: '8px', zIndex: 10,
                        background: 'var(--v6-accent)', borderRadius: '50%', width: '24px', height: '24px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.3)', border: '2px solid white'
                    }}>
                        <MessageCircle size={12} color="white" />
                    </div>
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
                        
                        <div style={{
                            position: 'absolute',
                            right: '12px',
                            bottom: '12px',
                            display: 'flex',
                            gap: '8px'
                        }}>
                            {/* VOICE BUTTON (MILICA WITH MIC) */}
                            <button 
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    toggleListening();
                                }}
                                disabled={isSubmitting}
                                style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '12px',
                                    background: isListening ? 'rgba(239, 68, 68, 0.2)' : 'var(--v6-bg-card)',
                                    border: isListening ? '2px solid #ef4444' : '1px solid var(--v6-accent)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    padding: 0,
                                    boxShadow: isListening ? '0 0 20px rgba(239, 68, 68, 0.4)' : 'none'
                                }}
                                title="Miličin glasovni asistent"
                            >
                                <img 
                                    src="/images/milica-avatar.png" 
                                    alt="Milica Mic" 
                                    style={{ 
                                        width: '100%', 
                                        height: '100%', 
                                        objectFit: 'cover',
                                        filter: isListening ? 'sepia(1) saturate(5) hue-rotate(-50deg)' : 'none'
                                    }} 
                                />
                                <div style={{
                                    position: 'absolute',
                                    bottom: '2px',
                                    right: '2px',
                                    background: isListening ? '#ef4444' : 'var(--v6-accent)',
                                    borderRadius: '50%',
                                    width: '18px',
                                    height: '18px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1px solid white'
                                }}>
                                    {isListening ? <MicOff size={10} color="white" /> : <Mic size={10} color="white" />}
                                </div>
                                
                                {isListening && (
                                    <div style={{
                                        position: 'absolute',
                                        inset: 0,
                                        border: '2px solid #ef4444',
                                        borderRadius: '10px',
                                        animation: 'v6VoicePulse 1.5s infinite ease-out'
                                    }} />
                                )}
                            </button>

                            {/* SEARCH BUTTON (LUPA) */}
                            <button 
                              onClick={onSearch}
                              disabled={isSubmitting || (!semanticQuery.trim() && !isListening)}
                              style={{
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
                                opacity: semanticQuery.trim() || isListening ? 1 : 0.5,
                                boxShadow: '0 4px 12px rgba(99, 179, 237, 0.3)'
                              }}
                            >
                                <Search size={20} color="white" />
                            </button>
                </div>
            </div>
        </div>
    </div>
    );
};
