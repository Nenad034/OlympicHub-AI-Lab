import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Settings,
    Package,
    Database,
    Users,
    Building2,
    BarChart3,
    Home,
    Sword,
    Castle,
    ShieldAlert
} from 'lucide-react';
import { useVSCodeStore } from '../../stores/vscodeStore';
import './CommandPalette.css';

interface CommandItem {
    id: string;
    label: string;
    description?: string;
    icon: React.ReactNode;
    category: 'navigation' | 'action' | 'settings';
    path: string;
    title: string;
}

export const CommandPalette: React.FC = () => {
    const { isCommandPaletteOpen, toggleCommandPalette, addTab, setActiveTab } = useVSCodeStore();
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    const navigateTo = useCallback((path: string, title: string) => {
        navigate(path);
        const tabId = path.replace(/\//g, '-').slice(1) || 'dashboard';
        addTab({ id: tabId, title, path });
        setActiveTab(tabId);
        toggleCommandPalette();
    }, [navigate, addTab, setActiveTab, toggleCommandPalette]);

    const commands: CommandItem[] = [
        // Navigation
        { id: 'nav-dashboard', label: 'Go to Dashboard', description: 'Početna strana', icon: <Home size={16} />, category: 'navigation', path: '/', title: 'Dashboard' },
        { id: 'nav-production', label: 'Go to Production Hub', description: 'Upravljanje produkcijom', icon: <Package size={16} />, category: 'navigation', path: '/production', title: 'Production Hub' },
        { id: 'nav-hotels', label: 'Go to Hotels', description: 'Lista hotela', icon: <Building2 size={16} />, category: 'navigation', path: '/production/hotels', title: 'Hotels' },
        { id: 'nav-suppliers', label: 'Go to Suppliers', description: 'Dobavljači', icon: <Database size={16} />, category: 'navigation', path: '/suppliers', title: 'Suppliers' },
        { id: 'nav-customers', label: 'Go to Customers', description: 'Kupci', icon: <Users size={16} />, category: 'navigation', path: '/customers', title: 'Customers' },
        { id: 'nav-mars', label: 'Go to Mars ERP Analytics', description: 'Analitika', icon: <BarChart3 size={16} />, category: 'navigation', path: '/mars-analysis', title: 'Mars ERP' },
        { id: 'nav-pricing', label: 'Go to Pricing Intelligence', description: 'Generator cenovnika', icon: <BarChart3 size={16} />, category: 'navigation', path: '/pricing-intelligence', title: 'Pricing' },
        { id: 'nav-katana', label: 'Go to Katana (To-Do)', description: 'Task management', icon: <Sword size={16} />, category: 'navigation', path: '/katana', title: 'Katana' },
        { id: 'nav-fortress', label: 'Go to Fortress Security', description: 'Security center', icon: <Castle size={16} />, category: 'navigation', path: '/fortress', title: 'Fortress' },
        { id: 'nav-archive', label: 'Go to Deep Archive', description: 'Arhiva', icon: <ShieldAlert size={16} />, category: 'navigation', path: '/deep-archive', title: 'Archive' },
        { id: 'nav-settings', label: 'Go to Settings', description: 'Podešavanja', icon: <Settings size={16} />, category: 'navigation', path: '/settings', title: 'Settings' },
        
        // Actions
        { id: 'action-new-hotel', label: 'New Hotel', description: 'Kreiraj novi hotel', icon: <Building2 size={16} />, category: 'action', path: '/production/hotels/new', title: 'New Hotel' },
        { id: 'action-new-supplier', label: 'New Supplier', description: 'Dodaj dobavljača', icon: <Database size={16} />, category: 'action', path: '/suppliers/new', title: 'New Supplier' },
        { id: 'action-new-customer', label: 'New Customer', description: 'Dodaj kupca', icon: <Users size={16} />, category: 'action', path: '/customers/new', title: 'New Customer' },
    ];

    const filteredCommands = query 
        ? commands.filter(cmd => 
            cmd.label.toLowerCase().includes(query.toLowerCase()) ||
            cmd.description?.toLowerCase().includes(query.toLowerCase())
          )
        : commands;

    // Reset selection when query changes
    const handleQueryChange = (newQuery: string) => {
        setQuery(newQuery);
        setSelectedIndex(0);
    };

    useEffect(() => {
        if (isCommandPaletteOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isCommandPaletteOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Open command palette with Ctrl+P or Cmd+P
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                toggleCommandPalette();
                return;
            }

            if (!isCommandPaletteOpen) return;

            switch (e.key) {
                case 'Escape':
                    toggleCommandPalette();
                    setQuery('');
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex(prev => Math.max(prev - 1, 0));
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (filteredCommands[selectedIndex]) {
                        navigateTo(filteredCommands[selectedIndex].path, filteredCommands[selectedIndex].title);
                        setQuery('');
                    }
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isCommandPaletteOpen, filteredCommands, selectedIndex, toggleCommandPalette, navigateTo]);

    if (!isCommandPaletteOpen) return null;

    return (
        <div className="command-palette-overlay" onClick={() => { toggleCommandPalette(); setQuery(''); }}>
            <div className="command-palette" onClick={e => e.stopPropagation()}>
                <div className="command-palette-input-container">
                    <Search size={16} />
                    <input
                        ref={inputRef}
                        type="text"
                        className="command-palette-input"
                        placeholder="Type a command or search..."
                        value={query}
                        onChange={(e) => handleQueryChange(e.target.value)}
                    />
                </div>

                <div className="command-palette-results">
                    {filteredCommands.length === 0 ? (
                        <div className="command-palette-empty">
                            No commands found
                        </div>
                    ) : (
                        filteredCommands.map((cmd, index) => (
                            <div
                                key={cmd.id}
                                className={`command-palette-item ${index === selectedIndex ? 'selected' : ''}`}
                                onClick={() => {
                                    navigateTo(cmd.path, cmd.title);
                                    setQuery('');
                                }}
                                onMouseEnter={() => setSelectedIndex(index)}
                            >
                                <span className="command-icon">{cmd.icon}</span>
                                <div className="command-content">
                                    <span className="command-label">{cmd.label}</span>
                                    {cmd.description && (
                                        <span className="command-description">{cmd.description}</span>
                                    )}
                                </div>
                                <span className="command-category">{cmd.category}</span>
                            </div>
                        ))
                    )}
                </div>

                <div className="command-palette-footer">
                    <span><kbd>↑↓</kbd> to navigate</span>
                    <span><kbd>Enter</kbd> to select</span>
                    <span><kbd>Esc</kbd> to close</span>
                </div>
            </div>
        </div>
    );
};

export default CommandPalette;
