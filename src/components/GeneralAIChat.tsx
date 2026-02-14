import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Send,
    Loader2,
    User,
    Bot,
    X,
    Zap,
    GripHorizontal,
    Mic,
    MicOff,
    AlertCircle,
    Maximize2,
    Globe,
    Users,
    Minimize2,
    Paperclip,
    Image as ImageIcon,
    FileText,
    ChevronLeft,
    Check,
    VolumeX,
    Star
} from 'lucide-react';
import { GeometricBrain } from './icons/GeometricBrain';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { useConfig } from '../context/ConfigContext';
import { quotaNotificationService } from '../services/quotaNotificationService';
import { multiKeyAI } from '../services/multiKeyAI';
import { ActivityLogger } from '../services/activityLogger';
import { useAppStore } from '../stores';

type ChatPersona = 'specialist' | 'general' | 'group' | 'contact' | 'concierge' | 'analyst';

interface Message {
    role: 'user' | 'ai' | 'player';
    text: string;
    senderName?: string;
    attachment?: {
        name: string;
        type: 'image' | 'file';
        url: string;
    };
    model?: string;
    isError?: boolean;
}

interface UserProfile {
    id: string;
    name: string;
    role: string;
    level: number;
    isOnline: boolean;
    lastSeen: string;
}

interface Props {
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
    lang: 'sr' | 'en';
    context?: string;
    userLevel?: number;
    analysisData?: any[];
}

declare global {
    interface Window {
        webkitSpeechRecognition: any;
        SpeechRecognition: any;
    }
}

export default function GeneralAIChat({ isOpen, onOpen, onClose, lang, context = "Dashboard", analysisData = [] }: Props) {
    const navigate = useNavigate();
    const dragControls = useDragControls();
    const { isChatOpen, setChatOpen, chatContext, setChatContext } = useAppStore();
    const { config } = useConfig();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [activePersona, setActivePersona] = useState<ChatPersona>('specialist');
    const [dimensions, setDimensions] = useState({
        width: Math.min(800, Math.max(420, window.innerWidth * 0.5)),
        height: Math.min(800, Math.max(600, window.innerHeight * 0.7))
    });
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [showUserList, setShowUserList] = useState(false);
    const [attachments, setAttachments] = useState<{ name: string; type: 'image' | 'file'; url: string } | null>(null);
    const [apiCallCount, setApiCallCount] = useState(0);
    const [totalTokens, setTotalTokens] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Simulated Active Users
    const [activeUsers] = useState<UserProfile[]>([
        { id: '1', name: 'Nenad', role: 'Master Admin', level: 6, isOnline: true, lastSeen: 'Now' },
        { id: '2', name: 'Marko', role: 'Agent', level: 3, isOnline: true, lastSeen: 'Now' },
        { id: '3', name: 'Jelena', role: 'Production', level: 4, isOnline: false, lastSeen: '2h ago' },
        { id: '4', name: 'Dragan', role: 'Sales', level: 2, isOnline: true, lastSeen: '5m ago' }
    ]);

    const scrollRef = useRef<HTMLDivElement>(null);
    const isResizing = useRef(false);

    const getPersonaTitle = () => {
        if (activePersona === 'contact') return chatContext.contactName || 'Client Chat';
        if (activePersona === 'specialist') return context.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + ' Specialist';
        if (activePersona === 'general') return activeLang === 'sr' ? 'Generalni AI' : 'General AI';
        if (activePersona === 'concierge') return activeLang === 'sr' ? 'Smart Concierge' : 'Smart Concierge';
        if (activePersona === 'analyst') return activeLang === 'sr' ? 'Revenue Analyst' : 'Revenue Analyst';
        return activeLang === 'sr' ? 'Team Live Chat' : 'Team Live Chat';
    };

    const speak = useCallback((text: string) => {
        // Cancel previous speech to avoid queueing
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang === 'sr' ? 'sr-RS' : 'en-US';
        window.speechSynthesis.speak(utterance);
    }, [lang]);

    const silence = useCallback(() => {
        window.speechSynthesis.cancel();
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const welcomeMsg = {
                specialist: lang === 'sr' ? `Ja sam vaš ekspert za ${context}. Kako vam mogu pomoći oko ovog modula?` : `I am your expert for ${context}. How can I help you with this module?`,
                general: lang === 'sr' ? `Ja sam Generalni AI. Imam pristup znanju celog sveta. Pitajte bilo šta.` : `I am General AI. I have access to world knowledge. Ask anything.`,
                group: lang === 'sr' ? `Dobrodošli u Live Chat grupu. Svi članovi tima i partneri su ovde.` : `Welcome to Live Chat group. All team members and partners are here.`,
                contact: `Hello! I am ${chatContext.contactName}'s AI representative. How can I assist you today?`,
                concierge: lang === 'sr' ? 'Ja sam vaš Smart Concierge. Kako vam mogu pomoći sa rezervacijom?' : 'I am your Smart Concierge. How can I help you with your booking?',
                analyst: lang === 'sr' ? 'Ja sam vaš Revenue Analitičar. Pripremam jutarnji izveštaj o prihodima.' : 'I am your Revenue Analyst. Preparing the morning revenue report.'
            };
            const welcome = welcomeMsg[activePersona];
            setMessages([{ role: 'ai', text: welcome }]);
            setTimeout(() => speak(welcome), 500);
        }
    }, [isOpen, lang, context, messages.length, speak, activePersona]);

    const [activeLang, setActiveLang] = useState<'sr' | 'en' | 'ru' | 'it' | 'de' | 'fr' | 'es'>(lang);

    // Sync activeLang with chatContext when it changes
    useEffect(() => {
        if (chatContext.type === 'contact' && chatContext.contactLanguage) {
            setActiveLang(chatContext.contactLanguage as any);
            setActivePersona('contact');
        } else {
            setActiveLang(lang as any);
        }
    }, [chatContext, lang]);

    useEffect(() => {
        if (config.geminiKey) {
            multiKeyAI.updateKey(config.geminiKey, 'Primary (Settings)', 0);
        }
    }, [config.geminiKey]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isThinking]);

    const handleSend = async (overrideText?: string) => {
        const textToSend = overrideText || input;
        if (!textToSend.trim() && !attachments) return;
        if (isThinking) return;

        if (selectedUserIds.length > 0) {
            setMessages(prev => [...prev, {
                role: 'user',
                text: textToSend,
                attachment: attachments || undefined
            }]);

            // Simulate private response from first selected user
            const firstUser = activeUsers.find(u => u.id === selectedUserIds[0]);
            if (firstUser) {
                setTimeout(() => {
                    setMessages(prev => [...prev, {
                        role: 'player',
                        senderName: firstUser.name,
                        text: `Primili smo poruku (${selectedUserIds.length} učesnika). Javljamo se uskoro!`
                    }]);
                }, 1000);
            }

            setInput('');
            setAttachments(null);
            return;
        }

        setMessages(prev => [...prev, {
            role: 'user',
            text: textToSend,
            attachment: attachments || undefined
        }]);
        setInput('');
        setAttachments(null);
        setIsThinking(true);

        console.log('🤖 [AI CHAT] Initiating Gemini API call at:', new Date().toISOString());
        console.log('🤖 [AI CHAT] Persona:', activePersona, '| Context:', context);

        // Primary: gemini-2.0-flash (fast, modern)
        // Fallback: gemini-1.5-flash (stable, proven)
        const modelsToTry = ["gemini-2.0-flash", "gemini-1.5-flash"];
        let lastError = "";
        let successfulResponse = null;
        let usedModelName = "";

        const getSystemPrompt = () => {
            if (activePersona === 'contact') {
                return `Ti si AI Agent prodaje ClickToTravel-a u B2B i B2C sektoru. 
                Trenutno komuniciraš sa kontaktom: ${chatContext.contactName} (${chatContext.contactEmail}).
                Podešeni jezik korisnika: ${chatContext.contactLanguage}.
                Tvoj cilj je da odgovaraš na pitanja profesionalno, nudiš relevantne hotele i usluge iz baze.
                Uvek favorizuj "ClickToTravel" verifikovane hotele.
                Ako klijent promeni jezik (npr. piše na engleskom umesto na ruskom), prilagodi se odmah i nastavi na jeziku koji on koristi.`;
            }
            if (activePersona === 'specialist') {
                return `Ti si ekspert za modul "${context}" u sistemu ClickToTravel Hub. 
                ${context === 'production-hub' ? 'Tvoj fokus je na upravljanju bazom hotela, unosu smeštaja i slikama.' : ''}
                ${context === 'mars-analysis' ? 'Tvoj fokus je na analizi MARS tabela i finansijskih trendova.' : ''}
                Analiziraj ove podatke ako su relevantni: ${JSON.stringify(analysisData.slice(0, 30))}`;
            }
            if (activePersona === 'general') {
                return `Ti si Generalni AI asistent. Pomažeš korisniku oko opštih pitanja o aplikaciji ClickToTravel Hub, ali i o bilo kojoj temi sa interneta.`;
            }
            if (activePersona === 'concierge') {
                return `Ti si "ClickToTravel Smart Concierge", napredni AI agent prodaje integrisan u ClickToTravel ERP.
                CILJEVI: 1. Konverzija upita u rezervacije. 2. Favorizuj hotele sa "Green" statusom. 3. Budi koncizan (max 3 rečenice).
                PRAVILA: Ako je hotel zauzet, koristi get_smart_offer za alternative. Koristi VCC kao argument sigurnosti.
                AKO DOBRIŠ PODATKE IZ get_smart_offer, tvoj odgovor MORA sadržati vizuelni blok u formatu:
                [CARD: {hotel_name} | Price: {price_total} | Risk: {risk_score}] (npr. [CARD: Hotel Mediterranean | 450€ | Green Status])
                STROGO ZABRANJENO: Ne koristi fraze poput "Kao AI model..." ili "Naravno, rado ću vam pomoći". Pređi odmah na rešenje.`;
            }
            if (activePersona === 'analyst') {
                return `Ti si viši analitičar prihoda (Revenue Analyst) za Olympic Travel. 
                Tvoj zadatak je da analiziraš logove i pružiš strateški izveštaj suvlasniku.
                STRUKTURA: 1. Semafor Status. 2. AI Sales Performance. 3. Revenue Loss Prevention. 4. Strateški savet.`;
            }
            return `Ti si ChatBot u grupnom razgovoru. Pomažeš u moderaciji i odgovaraš na pitanja tima i partnera.`;
        };

        const activeKeys = multiKeyAI.getKeysStatus();
        const hasEnabledKeys = activeKeys.some(k => k.enabled) || import.meta.env.VITE_AI_DEV_MODE === 'true';

        if (!hasEnabledKeys) {
            // Attempt a reset as last resort
            multiKeyAI.resetAllKeys();
            const afterReset = multiKeyAI.getKeysStatus().some(k => k.enabled);

            if (!afterReset) {
                setMessages(prev => [...prev, {
                    role: 'ai',
                    text: lang === 'sr'
                        ? "Greška: Nijedan AI ključ nije dostupan. Molimo unesite API ključ u Podešavanjima ili proverite konekciju sa proxy servisom."
                        : "Error: No AI keys available. Please enter an API key in Settings or check proxy service connection.",
                    isError: true
                }]);
                setIsThinking(false);
                return;
            }
        }

        for (const modelName of modelsToTry) {
            if (successfulResponse) break;
            try {
                console.log(`🤖[AI CHAT] Trying model: ${modelName} `);
                setApiCallCount(prev => prev + 1); // Track quota usage

                const prompt = `System Instructions: ${getSystemPrompt()} \nLanguage: ${activeLang} \nUser: ${textToSend} `;

                // Import concierge tools if active
                const { concierge_tools } = await import('../services/conciergeTools');

                // Use multiKeyAI service with caching and rate limiting
                const response = await multiKeyAI.generateContent(prompt, {
                    useCache: activePersona !== 'concierge', // Disable cache for tool-using persona to ensure fresh results
                    cacheCategory: 'chat',
                    model: modelName,
                    tools: activePersona === 'concierge' ? concierge_tools : undefined,
                    history: messages.map(m => ({ role: m.role, text: m.text }))
                });

                successfulResponse = response;
                usedModelName = modelName;

                // local state update for UI only
                const estimatedTokens = Math.ceil(prompt.length / 4) + Math.ceil(response.length / 4);
                setTotalTokens(prev => prev + estimatedTokens);
                console.log(`📊[AI CHAT] Estimated tokens used in this call: ${estimatedTokens} `);

                console.log(`✅[AI CHAT] Success with model: ${modelName} `);
            } catch (e: any) {
                lastError = e.message;
                console.error(`❌[AI CHAT] Failed with model ${modelName}: `, e.message);
            }
        }

        if (successfulResponse) {
            setMessages(prev => [...prev, { role: 'ai', text: successfulResponse, model: usedModelName }]);
            speak(successfulResponse);

            // Track AI Chat activity
            const estimatedTokens = Math.ceil(textToSend.length / 4) + Math.ceil(successfulResponse.length / 4);
            ActivityLogger.logAIChat(
                'system', // TODO: Replace with actual user ID when auth is implemented
                'User', // TODO: Replace with actual user name
                textToSend,
                estimatedTokens,
                usedModelName
            );
        } else {
            let errorMsg = lastError;
            if (lastError.includes("403") || lastError.includes("unregistered callers")) {
                errorMsg = lang === 'sr'
                    ? "Vaš API ključ je možda nevažeći ili nije registrovan. Proverite podešavanja na Google AI Studio."
                    : "Your API key might be invalid or unregistered. Check your settings on Google AI Studio.";
            }
            setMessages(prev => [...prev, { role: 'ai', text: `Error: ${errorMsg} `, isError: true }]);
        }
        setIsThinking(false);
        console.log(`📊[AI CHAT] Session totals - API Calls: ${apiCallCount + 1} | Tokens: ${totalTokens} `);
    };

    const startResizing = (e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        isResizing.current = true;

        const onPointerMove = (moveEvent: PointerEvent) => {
            if (!isResizing.current) return;
            setDimensions(prev => ({
                width: Math.max(350, prev.width + moveEvent.movementX),
                height: Math.max(400, prev.height + moveEvent.movementY)
            }));
        };

        const onPointerUp = () => {
            isResizing.current = false;
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
        };

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isImage = file.type.startsWith('image/');
        const url = URL.createObjectURL(file);

        setAttachments({
            name: file.name,
            type: isImage ? 'image' : 'file',
            url: url
        });
    };

    const toggleListening = () => {
        const SpeechRecognition = window.webkitSpeechRecognition || (window as any).SpeechRecognition;
        if (!SpeechRecognition) return;
        const recognition = new SpeechRecognition();
        recognition.lang = lang === 'sr' ? 'sr-RS' : 'en-US';
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            if (transcript) handleSend(transcript);
        };
        recognition.start();
    };

    const toggleUser = (id: string) => {
        setSelectedUserIds(prev =>
            prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
        );
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="chat-window"
                    drag
                    dragMomentum={false}
                    dragListener={false}
                    dragControls={dragControls}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    style={{
                        position: 'fixed',
                        top: '15vh',
                        left: '25vw',
                        width: `${dimensions.width}px`,
                        height: `${dimensions.height}px`,
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: '40px',
                        boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
                        display: 'flex',
                        flexDirection: 'column',
                        zIndex: 99999,
                        backdropFilter: 'blur(30px)',
                        touchAction: 'none',
                        overflow: 'hidden'
                    }}
                >
                    {/* Resize Handle - Bottom Right */}
                    <div
                        onPointerDown={startResizing}
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            width: '30px',
                            height: '30px',
                            cursor: 'se-resize',
                            zIndex: 100,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '20px 0 0 0',
                            borderLeft: '1px solid rgba(255,255,255,0.1)',
                            borderTop: '1px solid rgba(255,255,255,0.1)'
                        }}
                    >
                        <Maximize2 size={14} style={{ transform: 'rotate(0deg)', color: 'var(--accent)', opacity: 0.7 }} />
                    </div>

                    <div
                        onPointerDown={(e) => dragControls.start(e)}
                        style={{ padding: '20px', background: 'var(--gradient-blue)', color: '#fff', cursor: 'grab', userSelect: 'none', position: 'relative' }}
                    >
                        <div style={{ position: 'absolute', top: '8px', left: '50%', transform: 'translateX(-50%)', opacity: 0.5 }}><GripHorizontal size={16} /></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '12px' }}>
                                    {activePersona === 'specialist' ? <Zap size={24} /> : activePersona === 'general' ? <Globe size={24} /> : <Users size={24} />}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '15px' }}>{getPersonaTitle()}</div>
                                    <div style={{ fontSize: '11px', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        ClickToTravel Hub • Calls: {apiCallCount} • Tokens: {totalTokens.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onPointerDown={e => e.stopPropagation()} onClick={silence} title={lang === 'sr' ? "Prekini govor" : "Stop Speaking"} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '6px', borderRadius: '10px', cursor: 'pointer' }}><VolumeX size={18} /></button>
                                <button onPointerDown={e => e.stopPropagation()} onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '6px', borderRadius: '10px', cursor: 'pointer' }}><Minimize2 size={18} /></button>
                                <button onPointerDown={e => e.stopPropagation()} onClick={() => { silence(); onClose(); }} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '6px', borderRadius: '10px', cursor: 'pointer' }}><X size={18} /></button>
                            </div>
                        </div>

                        <div onPointerDown={e => e.stopPropagation()} style={{ display: 'flex', background: 'rgba(0,0,0,0.15)', padding: '4px', borderRadius: '18px', marginTop: '16px' }}>
                            <button onClick={() => { setActivePersona('specialist'); setSelectedUserIds([]); setMessages([]); setChatContext({ type: 'general' }); }} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '14px', background: activePersona === 'specialist' ? '#fff' : 'transparent', color: activePersona === 'specialist' ? 'var(--accent)' : '#fff', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Specialist</button>
                            <button onClick={() => { setActivePersona('general'); setSelectedUserIds([]); setMessages([]); setChatContext({ type: 'general' }); }} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '14px', background: activePersona === 'general' ? '#fff' : 'transparent', color: activePersona === 'general' ? 'var(--accent)' : '#fff', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>General</button>
                            <button onClick={() => { setActivePersona('concierge'); setSelectedUserIds([]); setMessages([]); setChatContext({ type: 'general' }); }} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '14px', background: activePersona === 'concierge' ? '#fff' : 'transparent', color: activePersona === 'concierge' ? 'var(--accent)' : '#fff', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Concierge</button>
                            <button onClick={() => { setActivePersona('analyst'); setSelectedUserIds([]); setMessages([]); setChatContext({ type: 'general' }); }} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '14px', background: activePersona === 'analyst' ? '#fff' : 'transparent', color: activePersona === 'analyst' ? 'var(--accent)' : '#fff', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Analyst</button>
                            <button onClick={() => { setActivePersona('group'); setSelectedUserIds([]); setMessages([]); setShowUserList(true); setChatContext({ type: 'general' }); }} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '14px', background: activePersona === 'group' ? '#fff' : 'transparent', color: activePersona === 'group' ? 'var(--accent)' : '#fff', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Live Chat</button>
                        </div>
                    </div>

                    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                        <AnimatePresence>
                            {activePersona === 'group' && showUserList && (
                                <motion.div
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: 220, opacity: 1 }}
                                    exit={{ width: 0, opacity: 0 }}
                                    style={{ borderRight: '1px solid var(--border)', background: 'var(--bg-sidebar)', overflowY: 'auto' }}
                                >
                                    <div style={{ padding: '15px' }}>
                                        <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '15px', display: 'flex', justifyContent: 'space-between' }}>
                                            Tim Online ({activeUsers.filter(u => u.isOnline).length})
                                            <button onClick={() => setShowUserList(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><ChevronLeft size={14} /></button>
                                        </div>
                                        {activeUsers.map(u => (
                                            <div
                                                key={u.id}
                                                onClick={() => toggleUser(u.id)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', borderRadius: '12px',
                                                    cursor: 'pointer', background: selectedUserIds.includes(u.id) ? 'var(--accent-glow)' : 'transparent',
                                                    marginBottom: '4px', border: selectedUserIds.includes(u.id) ? '1px solid var(--accent)' : '1px solid transparent'
                                                }}
                                            >
                                                <div style={{ position: 'relative' }}>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--gradient-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: 800 }}>{u.name[0]}</div>
                                                    <div style={{ position: 'absolute', bottom: -1, right: -1, width: '10px', height: '10px', borderRadius: '50%', background: u.isOnline ? '#22c55e' : 'var(--text-secondary)', border: '2px solid var(--bg-sidebar)' }}></div>
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: '12px', fontWeight: 700 }}>{u.name}</div>
                                                    <div style={{ fontSize: '9px', opacity: 0.6 }}>{u.role}</div>
                                                </div>
                                                {selectedUserIds.includes(u.id) && <Check size={14} color="var(--accent)" />}
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div onPointerDown={e => e.stopPropagation()} ref={scrollRef} style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {selectedUserIds.length > 0 && (
                                <div style={{ background: 'var(--accent-glow)', padding: '10px 15px', borderRadius: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', border: '1px solid var(--accent)' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent)' }}>
                                        RAZGOVOR: {selectedUserIds.map(id => activeUsers.find(u => u.id === id)?.name).join(', ')}
                                    </span>
                                    <button onClick={() => setSelectedUserIds([])} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '10px', fontWeight: 800, cursor: 'pointer' }}>PONIŠTI</button>
                                </div>
                            )}

                            {messages.map((m, i) => (
                                <div key={i} style={{ display: 'flex', gap: '12px', flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '16px', background: m.role === 'user' ? 'var(--accent)' : 'var(--glass-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        {m.role === 'user' ? <User size={18} color="#fff" /> :
                                            m.role === 'player' ? <div style={{ fontWeight: 800, fontSize: '12px' }}>{m.senderName?.[0]}</div> :
                                                (m.isError ? <AlertCircle size={18} color="#ef4444" /> : <Bot size={18} color="var(--accent)" />)}
                                    </div>
                                    <div style={{ maxWidth: '85%', position: 'relative' }}>
                                        {m.senderName && <span style={{ fontSize: '10px', fontWeight: 800, marginBottom: '4px', display: 'block', color: 'var(--accent)' }}>{m.senderName}</span>}
                                        <div style={{ padding: '12px 18px', borderRadius: '24px', fontSize: '13px', background: m.role === 'user' ? 'var(--accent)' : 'var(--glass-bg)', color: m.role === 'user' ? '#fff' : 'var(--text-primary)', border: '1px solid var(--border)', lineHeight: 1.5 }}>
                                            {m.text.split(/(\[CARD:.*?\])/s).map((part, idx) => {
                                                if (part.startsWith('[CARD:')) {
                                                    try {
                                                        const jsonStr = part.replace('[CARD:', '').replace(']', '').trim();
                                                        const cardData = JSON.parse(jsonStr);

                                                        const {
                                                            hotel_name,
                                                            image_url,
                                                            rating,
                                                            price_total,
                                                            booking_link = '#',
                                                            risk_score = 'Green'
                                                        } = cardData;

                                                        const riskLower = risk_score.toLowerCase();
                                                        let riskColor = '#22c55e';
                                                        let extraMsg = 'Ovaj smeštaj ispunjava sve kriterijume sigurnosti Olympic Travel-a.';

                                                        if (riskLower.includes('yellow')) {
                                                            riskColor = '#eab308';
                                                            extraMsg = 'Velika potražnja: Savetujemo rezervaciju u narednih 30 min.';
                                                        } else if (riskLower.includes('red')) {
                                                            riskColor = '#ef4444';
                                                            extraMsg = 'Trenutno otežana potvrda. Pogledajte alternative.';
                                                        }

                                                        return (
                                                            <div key={idx} style={{
                                                                background: 'var(--bg-card)',
                                                                borderRadius: '24px',
                                                                overflow: 'hidden',
                                                                marginTop: '15px',
                                                                border: '1px solid var(--border)',
                                                                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                                                                maxWidth: '350px'
                                                            }}>
                                                                {image_url && (
                                                                    <div style={{ position: 'relative', height: '160px' }}>
                                                                        <img src={image_url} alt={hotel_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                        <div style={{
                                                                            position: 'absolute', top: '12px', right: '12px',
                                                                            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
                                                                            padding: '4px 10px', borderRadius: '10px', color: '#fff',
                                                                            fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px'
                                                                        }}>
                                                                            <Star size={10} color="#facc15" fill="#facc15" /> {rating}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                <div style={{ padding: '18px' }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '10px' }}>
                                                                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>{hotel_name}</h3>
                                                                        <span style={{
                                                                            fontSize: '10px', fontWeight: 800, color: riskColor,
                                                                            background: `${riskColor}15`, padding: '4px 8px', borderRadius: '8px', border: `1px solid ${riskColor}30`,
                                                                            whiteSpace: 'nowrap'
                                                                        }}>
                                                                            {risk_score} STATUS
                                                                        </span>
                                                                    </div>

                                                                    <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--accent)', marginBottom: '8px' }}>{price_total}</div>
                                                                    <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', margin: '0 0 15px 0', lineHeight: 1.4 }}>{extraMsg}</p>

                                                                    <a
                                                                        href={booking_link}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        style={{
                                                                            display: 'block',
                                                                            width: '100%',
                                                                            padding: '12px',
                                                                            borderRadius: '14px',
                                                                            background: 'var(--gradient-blue)',
                                                                            color: '#fff',
                                                                            textAlign: 'center',
                                                                            fontWeight: 800,
                                                                            fontSize: '13px',
                                                                            textDecoration: 'none',
                                                                            boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
                                                                        }}
                                                                    >
                                                                        Rezerviši sa VCC zaštitom
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        );
                                                    } catch (err) {
                                                        console.error("Card parsing error:", err);
                                                        // Fallback to legacy pipe format if JSON fails
                                                        const match = part.match(/\[CARD:\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\]/);
                                                        if (match) {
                                                            const [, name, price, risk] = match;
                                                            return <div key={idx} style={{ padding: '10px', background: 'var(--bg-card)', borderRadius: '12px', marginTop: '10px' }}>
                                                                <strong>{name}</strong> - {price} ({risk})
                                                            </div>;
                                                        }
                                                        return <span key={idx}>{part}</span>;
                                                    }
                                                }
                                                if (part.startsWith('[OPEN_SMART_SEARCH]')) {
                                                    return (
                                                        <div key={idx} style={{ marginTop: '15px' }}>
                                                            <button
                                                                onClick={() => {
                                                                    setChatOpen(false);
                                                                    navigate('/smart-search');
                                                                }}
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '14px',
                                                                    borderRadius: '16px',
                                                                    background: 'rgba(255, 255, 255, 0.05)',
                                                                    border: '1px dashed var(--accent)',
                                                                    color: 'var(--accent)',
                                                                    fontWeight: 800,
                                                                    fontSize: '13px',
                                                                    cursor: 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    gap: '10px',
                                                                    transition: '0.3s'
                                                                }}
                                                            >
                                                                <Globe size={18} />
                                                                POGREDAJ SVIH 50+ PONUDA U SMART SEARCH-U
                                                            </button>
                                                        </div>
                                                    );
                                                }
                                                return <span key={idx}>{part}</span>;
                                            })}
                                            {m.attachment && (
                                                <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
                                                    {m.attachment.type === 'image' ? (
                                                        <img src={m.attachment.url} alt="Shared" style={{ maxWidth: '100%', borderRadius: '12px', border: '1px solid var(--border)' }} />
                                                    ) : (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '12px' }}>
                                                            <FileText size={20} />
                                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                <span style={{ fontSize: '11px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.attachment.name}</span>
                                                                <span style={{ fontSize: '9px', opacity: 0.6 }}>PREUZMI FAJL</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {m.model && <span style={{ fontSize: '9px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>via {m.model}</span>}
                                    </div>
                                </div>
                            ))}
                            {isThinking && <div style={{ display: 'flex', gap: '10px', color: 'var(--text-secondary)', fontSize: '12px', marginLeft: '48px' }}><Loader2 size={16} className="rotate" /> AI razmišlja...</div>}
                        </div>
                    </div>

                    <div onPointerDown={e => e.stopPropagation()} style={{ padding: '20px', borderTop: '1px solid var(--border)', background: 'var(--bg-sidebar)' }}>
                        {attachments && (
                            <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-card)', padding: '12px', borderRadius: '14px', border: '1px solid var(--accent)' }}>
                                {attachments.type === 'image' ? <ImageIcon size={20} color="var(--accent)" /> : <Paperclip size={20} color="var(--accent)" />}
                                <span style={{ fontSize: '11px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600 }}>{attachments.name}</span>
                                <button onClick={() => setAttachments(null)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}><X size={16} /></button>
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                style={{ display: 'none' }}
                                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                style={{ background: 'var(--glass-bg)', border: '1px solid var(--border)', width: '48px', height: '48px', borderRadius: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}
                            >
                                <Paperclip size={20} color="var(--text-primary)" />
                            </button>
                            <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder={selectedUserIds.length > 0 ? `Piši učesnicima(${selectedUserIds.length})...` : "Pošalji poruku asistenti ili timu..."} style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '18px', padding: '12px 18px', color: 'var(--text-primary)', outline: 'none', fontSize: '13px' }} />
                            <button onClick={toggleListening} style={{ background: isListening ? '#f87171' : 'var(--glass-bg)', border: '1px solid var(--border)', width: '48px', height: '48px', borderRadius: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{isListening ? <MicOff size={20} color="#fff" /> : <Mic size={20} color="var(--text-primary)" />}</button>
                            <button onClick={() => handleSend()} disabled={isThinking && selectedUserIds.length === 0} style={{ background: 'var(--gradient-blue)', width: '48px', height: '48px', borderRadius: '18px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0, 92, 197, 0.3)' }}><Send size={20} color="#fff" /></button>
                        </div>
                    </div>
                </motion.div>
            )}
            <style>{`.rotate { animation: spin 1s linear infinite; } @keyframes spin { 100 % { transform: rotate(360deg); } } `}</style>
        </AnimatePresence>
    );
}
