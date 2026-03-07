import React, { useState } from 'react';
import { Send, Sparkles, BrainCircuit } from 'lucide-react';
import { useAppStore } from '../../../stores';
import './MilicaStartSearch.css';

export const MilicaStartSearch: React.FC = () => {
    const [message, setMessage] = useState('');
    const { setMilicaChatOpen, setChatContext } = useAppStore();

    const handleStartConversation = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!message.trim()) return;

        // Configure chat context for Milica persona
        setChatContext({
            type: 'general',
            initialMessage: message
        });

        // Open the dedicated Milica chat window
        setMilicaChatOpen(true);

        // Clear local input
        setMessage('');
    };

    return (
        <div className="milica-start-search-container animate-fade-in">
            <div className="milica-start-header">
                <div className="milica-avatar-glow">
                    <BrainCircuit size={24} color="#8E24AC" />
                </div>
                <div className="milica-start-text">
                    <h3>Razgovarajte sa Milicom</h3>
                    <p>Opišite svoj idealan odmor i dozvolite Milici da pronađe najbolje za vas.</p>
                </div>
            </div>

            <form className="milica-input-wrapper" onSubmit={handleStartConversation}>
                <input
                    type="text"
                    placeholder="Milice, potraži mi luksuzan hotel u Grčkoj za porodicu..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="milica-search-field"
                />
                <button type="submit" className="milica-send-btn" disabled={!message.trim()}>
                    <Send size={20} />
                    <span>Započni</span>
                </button>
            </form>

            <div className="milica-suggestions-row">
                <span className="suggestion-label">Probajte:</span>
                <button className="suggestion-chip" onClick={() => setMessage('Pronađi mi miran hotel na Tasosu sa dobrom hranom')}>
                    "Miran hotel na Tasosu..."
                </button>
                <button className="suggestion-chip" onClick={() => setMessage('Šta preporučuješ za odmor sa dvoje male dece u Bugarskoj?')}>
                    "Odmor sa decom u Bugarskoj..."
                </button>
            </div>
        </div>
    );
};
