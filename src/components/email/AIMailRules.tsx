import React, { useState } from 'react';
import { Sparkles, X, Plus, Trash2, Wand2, Loader2 } from 'lucide-react';

interface MailRule {
    id: string;
    name: string;
    condition: {
        field: 'from' | 'subject' | 'body';
        operator: 'contains' | 'equals' | 'startsWith';
        value: string;
    };
    action: {
        type: 'move' | 'label' | 'star' | 'delete';
        value: string;
    };
    enabled: boolean;
}

interface AIMailRulesProps {
    onClose: () => void;
}

export const AIMailRules: React.FC<AIMailRulesProps> = ({ onClose }) => {
    const [rules, setRules] = useState<MailRule[]>([
        {
            id: 'rule-1',
            name: 'Upiti za Grčku',
            condition: { field: 'subject', operator: 'contains', value: 'Grčka' },
            action: { type: 'label', value: 'Ponude' },
            enabled: true
        },
        {
            id: 'rule-2',
            name: 'B2B Agencije',
            condition: { field: 'subject', operator: 'contains', value: 'B2B' },
            action: { type: 'star', value: '' },
            enabled: true
        }
    ]);

    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [showNewRuleForm, setShowNewRuleForm] = useState(false);

    const handleGenerateRule = async () => {
        if (!aiPrompt.trim()) return;

        setIsGenerating(true);

        // Simulate AI processing
        await new Promise(resolve => setTimeout(resolve, 1500));

        // AI-generated rule based on prompt
        const newRule: MailRule = {
            id: `rule-${Date.now()}`,
            name: `AI: ${aiPrompt.substring(0, 30)}...`,
            condition: {
                field: 'subject',
                operator: 'contains',
                value: aiPrompt.includes('rezervacija') ? 'rezervacija' : 'upit'
            },
            action: { type: 'label', value: 'Ponude' },
            enabled: true
        };

        setRules([...rules, newRule]);
        setAiPrompt('');
        setIsGenerating(false);
    };

    const deleteRule = (id: string) => {
        setRules(rules.filter(r => r.id !== id));
    };

    const toggleRule = (id: string) => {
        setRules(rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
    };

    return (
        <div className="ai-mail-rules-overlay" onClick={onClose}>
            <div className="ai-mail-rules-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="ai-rules-header">
                    <div className="ai-rules-title">
                        <Sparkles size={24} color="#3b82f6" />
                        <div>
                            <h2>AI Mail Rules</h2>
                            <p>Automatski organizuj mejlove pomoću AI asistenta</p>
                        </div>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* AI Prompt Section */}
                <div className="ai-prompt-section">
                    <div className="ai-prompt-header">
                        <Wand2 size={18} color="#3fb950" />
                        <span>Kreiraj pravilo pomoću AI-a</span>
                    </div>
                    <textarea
                        className="ai-prompt-input"
                        placeholder="Npr: 'Svi mejlovi sa rečju rezervacija u naslovu treba da budu označeni zvezdicom i prebačeni u folder Ponude'"
                        value={aiPrompt}
                        onChange={e => setAiPrompt(e.target.value)}
                        rows={3}
                    />
                    <button
                        className="ai-generate-btn"
                        onClick={handleGenerateRule}
                        disabled={isGenerating || !aiPrompt.trim()}
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 size={16} className="spin" />
                                Generišem pravilo...
                            </>
                        ) : (
                            <>
                                <Sparkles size={16} />
                                Generiši pravilo
                            </>
                        )}
                    </button>
                </div>

                {/* Rules List */}
                <div className="rules-list-section">
                    <div className="rules-list-header">
                        <h3>Aktivna pravila ({rules.filter(r => r.enabled).length})</h3>
                        <button className="add-rule-btn" onClick={() => setShowNewRuleForm(!showNewRuleForm)}>
                            <Plus size={16} />
                            Novo pravilo
                        </button>
                    </div>

                    <div className="rules-list">
                        {rules.map(rule => (
                            <div key={rule.id} className={`rule-item ${!rule.enabled ? 'disabled' : ''}`}>
                                <div className="rule-info">
                                    <div className="rule-name">
                                        <input
                                            type="checkbox"
                                            checked={rule.enabled}
                                            onChange={() => toggleRule(rule.id)}
                                        />
                                        <span>{rule.name}</span>
                                    </div>
                                    <div className="rule-description">
                                        Ako <strong>{rule.condition.field}</strong> {rule.condition.operator} "<em>{rule.condition.value}</em>"
                                        → {rule.action.type} {rule.action.value && `"${rule.action.value}"`}
                                    </div>
                                </div>
                                <button className="delete-rule-btn" onClick={() => deleteRule(rule.id)}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}

                        {rules.length === 0 && (
                            <div className="empty-rules">
                                <Sparkles size={32} opacity={0.3} />
                                <p>Nema kreiranih pravila</p>
                                <span>Koristi AI asistenta da kreiraš prvo pravilo</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="ai-rules-footer">
                    <button className="btn-secondary" onClick={onClose}>Zatvori</button>
                    <button className="btn-primary">Sačuvaj pravila</button>
                </div>
            </div>
        </div>
    );
};
