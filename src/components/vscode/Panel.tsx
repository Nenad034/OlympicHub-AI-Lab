import React, { useState } from 'react';
import {
    Terminal as TerminalIcon,
    X,
    Plus,
    Trash2,
    Maximize2,
    AlertCircle,
    FileText,
    Bug
} from 'lucide-react';
import { useVSCodeStore } from '../../stores/vscodeStore';

type PanelTab = 'problems' | 'output' | 'terminal' | 'debug';

interface PanelProps {
    height: number;
}

export const Panel: React.FC<PanelProps> = ({ height }) => {
    const [activeTab, setActiveTab] = useState<PanelTab>('terminal');
    const [terminalLines, setTerminalLines] = useState<string[]>([
        '> Olympic Hub v1.0.0',
        '> Supabase connected ✓',
        '> Gemini AI ready ✓',
        '> System initialized successfully',
        '',
        'olympic@hub:~$'
    ]);
    const [inputValue, setInputValue] = useState('');
    const { togglePanel } = useVSCodeStore();

    const handleTerminalInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            const newLines = [...terminalLines];
            newLines[newLines.length - 1] = `olympic@hub:~$ ${inputValue}`;
            
            // Simulate some commands
            if (inputValue === 'clear') {
                setTerminalLines(['olympic@hub:~$']);
            } else if (inputValue === 'help') {
                newLines.push('Available commands: help, clear, status, version');
                newLines.push('olympic@hub:~$');
                setTerminalLines(newLines);
            } else if (inputValue === 'status') {
                newLines.push('System Status: Online');
                newLines.push('Database: Connected');
                newLines.push('AI: Active');
                newLines.push('olympic@hub:~$');
                setTerminalLines(newLines);
            } else if (inputValue === 'version') {
                newLines.push('Olympic Hub v1.0.0');
                newLines.push('React v19.x | TypeScript v5.x | Vite v7.x');
                newLines.push('olympic@hub:~$');
                setTerminalLines(newLines);
            } else {
                newLines.push(`Command not found: ${inputValue}`);
                newLines.push('olympic@hub:~$');
                setTerminalLines(newLines);
            }
            setInputValue('');
        }
    };

    const problemsContent = (
        <div className="panel-content problems-content">
            <div className="problems-list">
                <div className="problem-item warning">
                    <AlertCircle size={14} />
                    <span className="problem-text">Nedostaje cena za Hotel Bellevue (mart 2026)</span>
                    <span className="problem-source">pricing.ts</span>
                </div>
                <div className="problem-item error">
                    <AlertCircle size={14} />
                    <span className="problem-text">API ključ ističe za 7 dana</span>
                    <span className="problem-source">config</span>
                </div>
                <div className="problem-item info">
                    <AlertCircle size={14} />
                    <span className="problem-text">Nova verzija dostupna (1.1.0)</span>
                    <span className="problem-source">system</span>
                </div>
            </div>
        </div>
    );

    const outputContent = (
        <div className="panel-content output-content">
            <div className="output-lines">
                <div className="output-line">[Info] Application started</div>
                <div className="output-line">[Info] Loading modules...</div>
                <div className="output-line success">[Success] All modules loaded</div>
                <div className="output-line">[Info] Fetching data from Supabase...</div>
                <div className="output-line success">[Success] Data synchronized</div>
                <div className="output-line">[Info] AI Assistant initialized</div>
            </div>
        </div>
    );

    const terminalContent = (
        <div className="panel-content terminal-content">
            <div className="terminal-lines">
                {terminalLines.map((line, index) => (
                    <div key={index} className="terminal-line">{line}</div>
                ))}
            </div>
            <div className="terminal-input-line">
                <input
                    type="text"
                    className="terminal-input"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleTerminalInput}
                    placeholder=""
                    autoFocus
                />
            </div>
        </div>
    );

    const debugContent = (
        <div className="panel-content debug-content">
            <div className="debug-section">
                <h4>Variables</h4>
                <div className="debug-item">
                    <span className="debug-name">userLevel</span>
                    <span className="debug-value">6</span>
                </div>
                <div className="debug-item">
                    <span className="debug-name">theme</span>
                    <span className="debug-value">"dark"</span>
                </div>
                <div className="debug-item">
                    <span className="debug-name">isConnected</span>
                    <span className="debug-value">true</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="vscode-panel" style={{ height }}>
            <div className="panel-header">
                <div className="panel-tabs">
                    <button
                        className={`panel-tab ${activeTab === 'problems' ? 'active' : ''}`}
                        onClick={() => setActiveTab('problems')}
                    >
                        <AlertCircle size={14} />
                        Problems
                        <span className="panel-tab-badge">3</span>
                    </button>
                    <button
                        className={`panel-tab ${activeTab === 'output' ? 'active' : ''}`}
                        onClick={() => setActiveTab('output')}
                    >
                        <FileText size={14} />
                        Output
                    </button>
                    <button
                        className={`panel-tab ${activeTab === 'terminal' ? 'active' : ''}`}
                        onClick={() => setActiveTab('terminal')}
                    >
                        <TerminalIcon size={14} />
                        Terminal
                    </button>
                    <button
                        className={`panel-tab ${activeTab === 'debug' ? 'active' : ''}`}
                        onClick={() => setActiveTab('debug')}
                    >
                        <Bug size={14} />
                        Debug Console
                    </button>
                </div>
                <div className="panel-actions">
                    <button title="New Terminal"><Plus size={14} /></button>
                    <button title="Kill Terminal"><Trash2 size={14} /></button>
                    <button title="Maximize Panel"><Maximize2 size={14} /></button>
                    <button title="Close Panel" onClick={togglePanel}><X size={14} /></button>
                </div>
            </div>

            {activeTab === 'problems' && problemsContent}
            {activeTab === 'output' && outputContent}
            {activeTab === 'terminal' && terminalContent}
            {activeTab === 'debug' && debugContent}
        </div>
    );
};

export default Panel;
