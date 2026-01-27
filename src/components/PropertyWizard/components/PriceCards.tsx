import React, { useState } from 'react';
import { Plus, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PriceCard } from '../../../types/pricing.types';

interface PriceCardsProps {
    cards: PriceCard[];
    onChange: (cards: PriceCard[]) => void;
    placeholder?: string;
}

export default function PriceCards({ cards, onChange, placeholder = 'Dodaj stavku...' }: PriceCardsProps) {
    const [newCardText, setNewCardText] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const addCard = () => {
        if (!newCardText.trim()) return;

        const newCard: PriceCard = {
            id: `card_${Date.now()}`,
            text: newCardText.trim(),
            completed: false,
            order: cards.length
        };

        onChange([...cards, newCard]);
        setNewCardText('');
        setIsAdding(false);
    };

    const updateCard = (id: string, updates: Partial<PriceCard>) => {
        onChange(cards.map(card => card.id === id ? { ...card, ...updates } : card));
    };

    const deleteCard = (id: string) => {
        onChange(cards.filter(card => card.id !== id));
    };

    const toggleComplete = (id: string) => {
        const card = cards.find(c => c.id === id);
        if (card) {
            updateCard(id, { completed: !card.completed });
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <AnimatePresence>
                {cards.map(card => (
                    <motion.div
                        key={card.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="glass-card"
                        style={{
                            padding: '12px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            background: card.completed ? 'rgba(34, 197, 94, 0.05)' : 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            transition: 'all 0.2s'
                        }}
                    >
                        <button
                            onClick={() => toggleComplete(card.id)}
                            style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '4px',
                                border: '2px solid rgba(255,255,255,0.2)',
                                background: card.completed ? '#22c55e' : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {card.completed && <Check size={14} color="#fff" />}
                        </button>

                        <input
                            type="text"
                            value={card.text}
                            onChange={(e) => updateCard(card.id, { text: e.target.value })}
                            style={{
                                flex: 1,
                                background: 'transparent',
                                border: 'none',
                                color: card.completed ? 'rgba(255,255,255,0.5)' : '#fff',
                                fontSize: '14px',
                                textDecoration: card.completed ? 'line-through' : 'none',
                                outline: 'none'
                            }}
                        />

                        <button
                            onClick={() => deleteCard(card.id)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                opacity: 0.5,
                                transition: 'opacity 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
                        >
                            <X size={16} color="#ef4444" />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>

            {isAdding ? (
                <div className="glass-card" style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
                    <input
                        type="text"
                        value={newCardText}
                        onChange={(e) => setNewCardText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addCard()}
                        placeholder={placeholder}
                        autoFocus
                        style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            color: '#fff',
                            fontSize: '14px',
                            outline: 'none'
                        }}
                    />
                    <button
                        onClick={addCard}
                        className="glass-button"
                        style={{ padding: '4px 12px', fontSize: '12px' }}
                    >
                        Dodaj
                    </button>
                    <button
                        onClick={() => {
                            setIsAdding(false);
                            setNewCardText('');
                        }}
                        className="glass-button"
                        style={{ padding: '4px 12px', fontSize: '12px' }}
                    >
                        Otkaži
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => setIsAdding(true)}
                    className="glass-button"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        justifyContent: 'center',
                        padding: '12px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px dashed rgba(59, 130, 246, 0.3)'
                    }}
                >
                    <Plus size={16} />
                    Dodaj Stavku
                </button>
            )}
        </div>
    );
}
