import React, { useState } from 'react';
import {
    Sparkles, Send, Edit3, Check, Loader2, Calendar, Users, Home,
    Hotel, Plane, Bus, Compass, Ticket, CarFront, Ship, TrainFront,
    Castle, Waves, Utensils
} from 'lucide-react';
import './AIOfferModal.css';

interface AIOfferModalProps {
    proposal: {
        inquiry: any;
        hotelMatches: any[];
        serviceMatches: any[];
        suggestedResponse: string;
    };
    onClose: () => void;
    onSend: (text: string) => void;
}

const getServiceIcon = (category: string) => {
    switch (category) {
        case 'flight': return <Plane size={14} />;
        case 'bus': return <Bus size={14} />;
        case 'transport': return <Bus size={14} />;
        case 'transfer': return <CarFront size={14} />;
        case 'excursion': return <Compass size={14} />;
        case 'ticket': return <Ticket size={14} />;
        case 'disney': return <Castle size={14} />;
        case 'waterpark': return <Waves size={14} />;
        case 'food': return <Utensils size={14} />;
        default: return <Compass size={14} />;
    }
};

const isPromoted = (item: any) => {
    return (
        item.description?.toLowerCase().includes('verified') ||
        item.description?.toLowerCase().includes('ekskluzivno') ||
        (item.stars && item.stars >= 5) ||
        item.category === 'transfer'
    );
};

export const AIOfferModal: React.FC<AIOfferModalProps> = ({ proposal, onClose, onSend }) => {
    const [editableText, setEditableText] = useState(proposal.suggestedResponse);
    const [isEditing, setIsEditing] = useState(false);

    return (
        <div className="ai-offer-modal-overlay" onClick={onClose}>
            <div className="ai-offer-modal" onClick={e => e.stopPropagation()}>
                <div className="ai-modal-header">
                    <div className="ai-modal-title">
                        <Sparkles size={20} className="ai-icon-sparkle" />
                        <h2>AI Predlog Ponude</h2>
                    </div>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="ai-modal-body">
                    {/* Summary of Extraction */}
                    <div className="ai-extraction-summary">
                        <div className="summary-item">
                            <Home size={16} />
                            <span><strong>Hotel:</strong> {proposal.inquiry.hotelName || 'Nije detektovano'}</span>
                        </div>
                        <div className="summary-item">
                            <Calendar size={16} />
                            <span><strong>Period:</strong> {proposal.inquiry.checkIn || '??'} - {proposal.inquiry.checkOut || '??'}</span>
                        </div>
                        <div className="summary-item">
                            <Users size={16} />
                            <span><strong>Putnici:</strong> {proposal.inquiry.adults} odr, {proposal.inquiry.children} dece</span>
                        </div>
                    </div>

                    {/* DB Matches Section */}
                    <div className="ai-db-matches">
                        <div className="match-sections-grid">
                            <div className="match-section">
                                <h3><Hotel size={18} /> Hoteli ({proposal.hotelMatches.length})</h3>
                                {proposal.hotelMatches.length > 0 ? (
                                    <div className="matches-list">
                                        {proposal.hotelMatches.slice(0, 3).map((match, idx) => (
                                            <div key={idx} className={`match-card hotel ${isPromoted(match) ? 'promoted' : ''}`}>
                                                <div className="match-card-header">
                                                    <Hotel size={14} />
                                                    <h4>{match.title}</h4>
                                                    {isPromoted(match) && <span className="promoted-badge"><Sparkles size={10} /> Olympic Preporuka</span>}
                                                </div>
                                                <p><span className="status-badge-active">Dostupno</span></p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="no-matches">Nema smeštaja u bazi.</p>
                                )}
                            </div>

                            <div className="match-section">
                                <h3><Compass size={18} /> Usluge ({proposal.serviceMatches.length})</h3>
                                {proposal.serviceMatches.length > 0 ? (
                                    <div className="matches-list">
                                        {proposal.serviceMatches.slice(0, 3).map((match, idx) => (
                                            <div key={idx} className={`match-card service ${isPromoted(match) ? 'promoted' : ''}`}>
                                                <div className="match-card-header">
                                                    {getServiceIcon(match.category)}
                                                    <h4>{match.title}</h4>
                                                    {isPromoted(match) && <span className="promoted-badge"><Sparkles size={10} /> Top Izbor</span>}
                                                </div>
                                                <p className="service-cat">{match.category}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="no-matches">Nema dodatnih usluga.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Response Preview */}
                    <div className="ai-response-preview">
                        <div className="preview-header">
                            <h3>✍️ Predlog odgovora</h3>
                            <button className="edit-toggle-btn" onClick={() => setIsEditing(!isEditing)}>
                                {isEditing ? <><Check size={14} /> Završi</> : <><Edit3 size={14} /> Izmeni</>}
                            </button>
                        </div>

                        {isEditing ? (
                            <textarea
                                className="ai-response-textarea"
                                value={editableText}
                                onChange={(e) => setEditableText(e.target.value)}
                            />
                        ) : (
                            <div className="ai-response-content">
                                {editableText.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                            </div>
                        )}
                    </div>
                </div>

                <div className="ai-modal-footer">
                    <button className="btn-cancel" onClick={onClose}>Odustani</button>
                    <button className="btn-ai-send" onClick={() => onSend(editableText)}>
                        <Send size={16} />
                        <span>Pošalji ponudu</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIOfferModal;
