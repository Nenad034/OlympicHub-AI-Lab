import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Send, Loader2, X, VolumeX, Volume2, Bot, Maximize,
    Copy, Check, Paperclip, Image, FileText, Mic, MicOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../../stores';
import { ActivityLogger } from '../../../services/activityLogger';
import { multiKeyAI } from '../../../services/multiKeyAI';
import './MilicaChat.css';

interface Attachment {
    name: string;
    type: string;
    base64: string;
    mimeType: string;
    preview?: string; // for images
}

interface Message {
    role: 'user' | 'ai';
    text: string;
    isError?: boolean;
    attachment?: { name: string; type: string; preview?: string };
}

const MILICA_SYSTEM_PROMPT = `Ti si Milica, iskusna turistička savetnica u ClickToTravel.
TVOJA MISIJA: Pomozi korisniku da odabere savršeno putovanje koristeći suptilnu psihologiju prodaje baziranu na Sandler metodi, ali sa tonom vrhunskog hotela sa 5 zvezdica.
Pravila komunikacije:
1. NIKADA ne koristi reči: 'problem', 'bol', 'jeftino', 'budžet' (kao ograničenje), 'prodaja'.
2. Koristi: 'prioritet', 'idealni scenario', 'investicija u odmor', 'komfor', 'iskreni savet', 'autentično iskustvo'.
3. Uvek traži dozvolu da pomogneš (Up-Front Contract).
4. Ukazuj na izazove suptilno (npr. udaljenost od plaže, buka, gužva).
5. Ton je topao, profesionalan i pun poverenja. Budi koncizna (max 3-4 rečenice).
ZABRANJENO: "Kao AI model...", "Naravno, rado ću vam pomoći".`;

// Redundant helper removed since we now use multiKeyAI

function readFileAsBase64(file: File): Promise<{ base64: string; mimeType: string; preview?: string }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // result is like: "data:image/png;base64,xxxx"
            const parts = result.split(',');
            const base64 = parts[1];
            const mimeType = file.type;
            const preview = mimeType.startsWith('image/') ? result : undefined;
            resolve({ base64, mimeType, preview });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ─────────────────────────────────────────────────────────────────────────────

export const MilicaChat: React.FC = () => {
    const { isMilicaChatOpen, setMilicaChatOpen, chatContext, setChatContext } = useAppStore();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [dimensions, setDimensions] = useState({ width: 440, height: 620 });
    const [attachment, setAttachment] = useState<Attachment | null>(null);
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
    const [isListening, setIsListening] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const windowRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const initialMsgSent = useRef(false);

    const speak = useCallback((text: string) => {
        if (isMuted) return;
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Try to find a Serbian voice
        const voices = window.speechSynthesis.getVoices();
        const serbianVoice = voices.find(v => v.lang.startsWith('sr') || v.lang.startsWith('hr') || v.lang.startsWith('bs'));
        
        if (serbianVoice) {
            utterance.voice = serbianVoice;
        } else {
            utterance.lang = 'sr-RS';
        }

        utterance.rate = 1.0;
        utterance.pitch = 1.1; // Slightly higher pitch for a female persona
        
        window.speechSynthesis.speak(utterance);
    }, [isMuted]);

    const copyMessage = useCallback((text: string, idx: number) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedIdx(idx);
            setTimeout(() => setCopiedIdx(null), 2000);
        });
    }, []);

    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Limit file size to 4MB
        if (file.size > 4 * 1024 * 1024) {
            alert('Fajl je prevelik. Maksimalna veličina je 4MB.');
            return;
        }

        try {
            const { base64, mimeType, preview } = await readFileAsBase64(file);
            setAttachment({ name: file.name, type: file.type, base64, mimeType, preview });
        } catch {
            alert('Nije moguće učitati fajl.');
        }
        // Reset input so same file can be selected again
        e.target.value = '';
    }, []);

    const handleSend = useCallback(async (overrideText?: string) => {
        const textToSend = overrideText || input;
        if (!textToSend.trim() && !attachment) return;
        if (isThinking) return;

        const userMsg: Message = {
            role: 'user',
            text: textToSend || `📎 ${attachment!.name}`,
            attachment: attachment ? { name: attachment.name, type: attachment.type, preview: attachment.preview } : undefined
        };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        const sentAttachment = attachment;
        setAttachment(null);
        setIsThinking(true);

        try {
            const response = await multiKeyAI.generateContent(textToSend, {
                history: messages.map(m => ({ role: m.role as any, text: m.text })),
                attachment: sentAttachment || undefined,
                systemPrompt: MILICA_SYSTEM_PROMPT,
                temperature: 0.8
            });
            setMessages(prev => [...prev, { role: 'ai', text: response }]);
            speak(response);
            const tokens = Math.ceil(textToSend.length / 4) + Math.ceil(response.length / 4);
            ActivityLogger.logAIChat('milica-session', 'User', textToSend, tokens, 'multi-model');
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            console.error('[MilicaChat] Error:', e);
            setMessages(prev => [...prev, { role: 'ai', text: `⚠️ ${msg}`, isError: true }]);
        }

        setIsThinking(false);
    }, [input, attachment, isThinking, messages, speak]);

    // Speech-to-Text (Voice Search)
    const toggleListening = useCallback(() => {
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

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event: any) => {
            const transcript = Array.from(event.results)
                .map((result: any) => result[0])
                .map((result: any) => result.transcript)
                .join('');
            setInput(transcript);
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    }, [isListening]);

    // Welcome message
    useEffect(() => {
        if (isMilicaChatOpen && messages.length === 0) {
            setMessages([{
                role: 'ai',
                text: 'Zdravo! Ja sam Milica. Želim da vam iskreno pomognem da odaberete najbolje putovanje, smem li da vam ukažem na par bitnih detalja?'
            }]);
        }
    }, [isMilicaChatOpen]);

    // Auto-send initial message from search
    useEffect(() => {
        if (isMilicaChatOpen && chatContext.initialMessage && !initialMsgSent.current) {
            initialMsgSent.current = true;
            const msg = chatContext.initialMessage;
            setChatContext({ ...chatContext, initialMessage: undefined });
            setTimeout(() => handleSend(msg), 500);
        }
        if (!isMilicaChatOpen) initialMsgSent.current = false;
    }, [isMilicaChatOpen, chatContext.initialMessage]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isThinking]);

    return (
        <AnimatePresence>
            {isMilicaChatOpen && (
                <motion.div
                    ref={windowRef}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    drag
                    dragMomentum={false}
                    dragElastic={0}
                    className="milica-chat-window"
                    style={{
                        width: dimensions.width,
                        height: dimensions.height,
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        marginTop: -(dimensions.height / 2),
                        marginLeft: -(dimensions.width / 2),
                    }}
                >
                    {/* HEADER */}
                    <div className="milica-chat-header drag-handle">
                        <div className="milica-chat-header-info">
                            <div className="milica-avatar-small">
                                <Bot size={20} color="#fff" />
                            </div>
                            <div>
                                <h3>Savetnica Milica</h3>
                                <span>AI Travel Advisor</span>
                            </div>
                        </div>
                        <div className="milica-header-actions">
                            <button onClick={() => setIsMuted(m => !m)} title={isMuted ? 'Uključi zvuk' : 'Isključi zvuk'}>
                                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                            </button>
                            <button onClick={() => setMilicaChatOpen(false)}><X size={20} /></button>
                        </div>
                    </div>

                    {/* MESSAGES */}
                    <div className="milica-messages-container" ref={scrollRef}>
                        {messages.map((m, i) => (
                            <div key={i} className={`milica-message-row ${m.role}`}>
                                <div className={`milica-message-bubble ${m.isError ? 'error' : ''}`}>
                                    {/* Attachment preview */}
                                    {m.attachment?.preview && (
                                        <img
                                            src={m.attachment.preview}
                                            alt={m.attachment.name}
                                            className="milica-attachment-preview"
                                        />
                                    )}
                                    {m.attachment && !m.attachment.preview && (
                                        <div className="milica-attachment-file">
                                            <FileText size={14} />
                                            <span>{m.attachment.name}</span>
                                        </div>
                                    )}
                                    {/* Message text */}
                                    <div className="milica-message-content">{m.text}</div>
                                    {/* Copy button */}
                                    <button
                                        className="milica-copy-btn"
                                        onClick={() => copyMessage(m.text, i)}
                                        title="Kopiraj poruku"
                                    >
                                        {copiedIdx === i
                                            ? <Check size={12} color="#22c55e" />
                                            : <Copy size={12} />
                                        }
                                    </button>
                                </div>
                            </div>
                        ))}
                        {isThinking && (
                            <div className="milica-thinking">
                                <Loader2 size={16} className="spin" />
                                <span>Milica razmišlja...</span>
                            </div>
                        )}
                    </div>

                    {/* ATTACHMENT PREVIEW STRIP */}
                    {attachment && (
                        <div className="milica-attachment-strip">
                            {attachment.preview
                                ? <img src={attachment.preview} alt={attachment.name} className="milica-strip-thumb" />
                                : <div className="milica-strip-file">
                                    <FileText size={16} />
                                    <span>{attachment.name}</span>
                                </div>
                            }
                            <button className="milica-strip-remove" onClick={() => setAttachment(null)}>
                                <X size={14} />
                            </button>
                        </div>
                    )}

                    {/* INPUT */}
                    <div className="milica-chat-input-area">
                        {/* Hidden file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,.pdf,.txt,.docx,.csv"
                            style={{ display: 'none' }}
                            onChange={handleFileSelect}
                        />
                        <button
                            className="milica-attach-btn"
                            onClick={() => fileInputRef.current?.click()}
                            title="Priloži fajl ili sliku"
                            disabled={isThinking}
                        >
                            <Paperclip size={18} />
                        </button>
                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            placeholder={attachment ? `Dodaj komentar uz ${attachment.name}...` : 'Pošalji poruku Milici...'}
                            disabled={isThinking}
                        />
                        <button
                            className={`milica-voice-btn ${isListening ? 'listening' : ''}`}
                            onClick={toggleListening}
                            title={isListening ? 'Prekini slušanje' : 'Govori sa Milicom'}
                            disabled={isThinking}
                        >
                            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                            {isListening && <motion.div 
                                className="milica-mic-pulse"
                                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                            />}
                        </button>
                        <button
                            onClick={() => handleSend()}
                            disabled={isThinking || (!input.trim() && !attachment)}
                        >
                            <Send size={18} />
                        </button>
                    </div>

                    {/* RESIZE HANDLE */}
                    <div
                        className="milica-resize-handle"
                        onMouseDown={e => {
                            e.preventDefault();
                            const startX = e.clientX, startY = e.clientY;
                            const startW = dimensions.width, startH = dimensions.height;
                            const onMove = (ev: MouseEvent) => setDimensions({
                                width: Math.max(340, startW + (ev.clientX - startX)),
                                height: Math.max(420, startH + (ev.clientY - startY))
                            });
                            const onUp = () => {
                                document.removeEventListener('mousemove', onMove);
                                document.removeEventListener('mouseup', onUp);
                            };
                            document.addEventListener('mousemove', onMove);
                            document.addEventListener('mouseup', onUp);
                        }}
                    >
                        <Maximize size={12} className="rotate-45" />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
