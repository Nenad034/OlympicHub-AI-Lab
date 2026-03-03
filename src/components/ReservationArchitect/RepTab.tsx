import React, { useState } from 'react';
import { Shield, ShieldAlert, MessageCircle, Send, User, MapPin, Phone, History, Clock } from 'lucide-react';
import type { Dossier } from '../../types/reservationArchitect';

interface RepTabProps {
    dossier: Dossier;
}

export const RepTab: React.FC<RepTabProps> = ({ dossier }) => {
    const [message, setMessage] = useState('');

    // Mock messages for display
    const mockMessages = [
        { id: 1, role: 'rep', sender: 'Miloš (Hurgada)', text: 'Putnici su smešteni, sve je u redu.', timestamp: '2026-03-02 14:20' },
        { id: 2, role: 'agent', sender: 'Agent Nenad', text: 'Hvala Miloše, javi ako bude bilo kakvih promena.', timestamp: '2026-03-02 14:25' }
    ];

    return (
        <div className="rep-tab-v2">
            <div className="tab-header-v2">
                <div className="title-group">
                    <div className="icon-box">
                        <Shield size={20} />
                    </div>
                    <div>
                        <h2>KOMUNIKACIJA SA PREDSTAVNIKOM</h2>
                        <p>Direktna veza sa predstavnicima na destinaciji</p>
                    </div>
                </div>
            </div>

            <div className="rep-grid">
                <div className="chat-section">
                    <div className="fil-card chat-card">
                        <div className="chat-header">
                            <div className="status-indicator online"></div>
                            <span>Destinacijski Chat (Region: Hurgada)</span>
                        </div>
                        <div className="chat-messages">
                            {mockMessages.map((msg) => (
                                <div key={msg.id} className={`message-bubble ${msg.role}`}>
                                    <div className="msg-meta">{msg.sender} • {msg.timestamp}</div>
                                    <div className="msg-text">{msg.text}</div>
                                </div>
                            ))}
                        </div>
                        <div className="chat-input-wrapper">
                            <input
                                type="text"
                                placeholder="Pošaljite poruku predstavniku..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                            <button className="send-btn">
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="info-section">
                    <div className="fil-card status-card">
                        <h3>Status Provere</h3>
                        <div className={`check-badge ${dossier.repChecked ? 'checked' : 'pending'}`}>
                            {dossier.repChecked ? (
                                <><Shield size={16} /> PROVERENO (CHECKED)</>
                            ) : (
                                <><ShieldAlert size={16} /> NIJE PROVERENO</>
                            )}
                        </div>
                        {dossier.repChecked && (
                            <div className="check-meta">
                                <Clock size={12} /> {dossier.repCheckedAt} by {dossier.repCheckedBy}
                            </div>
                        )}
                    </div>

                    <div className="fil-card rep-info-card">
                        <h3>Dodeljeni Predstavnik</h3>
                        <div className="rep-profile">
                            <div className="avatar">MP</div>
                            <div className="details">
                                <div className="name">Miloš Predstavnik</div>
                                <div className="meta"><MapPin size={10} /> Hurghada, Egypt</div>
                                <div className="meta"><Phone size={10} /> +20 123 456 789</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .rep-tab-v2 { display: flex; flex-direction: column; gap: 25px; }
                .rep-grid { display: grid; grid-template-columns: 1fr 350px; gap: 25px; height: 600px; }
                
                .chat-card { display: flex; flex-direction: column; height: 100%; padding: 0; overflow: hidden; }
                .chat-header { padding: 15px 25px; background: rgba(255,255,255,0.03); border-bottom: 1px solid var(--fil-border); display: flex; align-items: center; gap: 10px; font-size: 12px; font-weight: 800; color: var(--fil-text-dim); }
                .status-indicator { width: 8px; height: 8px; border-radius: 50%; }
                .status-indicator.online { background: #10b981; box-shadow: 0 0 10px #10b981; }

                .chat-messages { flex: 1; padding: 25px; display: flex; flex-direction: column; gap: 15px; overflow-y: auto; background: rgba(0,0,0,0.1); }
                .message-bubble { max-width: 80%; padding: 12px 18px; border-radius: 16px; position: relative; }
                .message-bubble.rep { align-self: flex-start; background: var(--fil-bg-card); border: 1px solid var(--fil-border); }
                .message-bubble.agent { align-self: flex-end; background: var(--fil-accent); color: var(--fil-bg); }
                
                .msg-meta { font-size: 9px; font-weight: 800; margin-bottom: 5px; opacity: 0.7; }
                .msg-text { font-size: 14px; line-height: 1.5; }

                .chat-input-wrapper { padding: 20px; background: var(--fil-bg-card); border-top: 1px solid var(--fil-border); display: flex; gap: 15px; }
                .chat-input-wrapper input { flex: 1; background: var(--fil-bg); border: 1px solid var(--fil-border); border-radius: 12px; padding: 12px 18px; color: var(--fil-text); }
                .send-btn { width: 44px; height: 44px; border-radius: 12px; border: none; background: var(--fil-accent); color: var(--fil-bg); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform 0.2s; }
                .send-btn:hover { transform: scale(1.05); }

                .info-section { display: flex; flex-direction: column; gap: 20px; }
                .info-section h3 { font-size: 11px; font-weight: 900; color: var(--fil-text-dim); text-transform: uppercase; letter-spacing: 1px; margin: 0 0 15px 0; }
                .status-card, .rep-info-card { padding: 20px; }

                .check-badge { padding: 12px; border-radius: 10px; font-size: 12px; font-weight: 900; display: flex; align-items: center; gap: 10px; justify-content: center; }
                .check-badge.checked { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }
                .check-badge.pending { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); }
                .check-meta { font-size: 10px; color: var(--fil-text-dim); margin-top: 10px; text-align: center; display: flex; align-items: center; gap: 5px; justify-content: center; }

                .rep-profile { display: flex; gap: 15px; align-items: center; }
                .rep-profile .avatar { width: 44px; height: 44px; border-radius: 12px; background: var(--fil-accent); color: var(--fil-bg); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; }
                .rep-profile .name { font-weight: 700; font-size: 14px; margin-bottom: 4px; }
                .rep-profile .meta { font-size: 11px; color: var(--fil-text-dim); display: flex; align-items: center; gap: 5px; margin-bottom: 2px; }
            `}</style>
        </div>
    );
};
