import React, { useState } from 'react';
import {
    ChevronRight,
    ChevronDown,
    File,
    Folder,
    FolderOpen,
    Search,
    Plus,
    RefreshCw,
    MoreHorizontal,
    Package,
    Building2,
    Users,
    Database,
    BarChart3,
    Settings,
    Home,
    Hotel,
    Truck,
    FileText,
    Sword,
    Castle,
    ShieldAlert,
    Mail,
    Send,
    Trash2,
    Inbox,
    Bell,
    Brain,
    Cpu,
    Network
} from 'lucide-react';
import { useVSCodeStore, type ActivityType } from '../../stores/vscodeStore';
import { useNavigate } from 'react-router-dom';

// Route to tab mapping
const routeToTabMap: Record<string, { title: string; icon?: React.ReactNode }> = {
    '/': { title: 'Dashboard' },
    '/production': { title: 'Production Hub' },
    '/production/hotels': { title: 'Hotels List' },
    '/production/hotels/new': { title: 'New Hotel' },
    '/production/transport': { title: 'Transport' },
    '/suppliers': { title: 'Suppliers' },
    '/customers': { title: 'Customers' },
    '/mars-analysis': { title: 'Mars Analysis' },
    '/pricing-intelligence': { title: 'Pricing Intelligence' },
    '/katana': { title: 'Katana (To-Do)' },
    '/fortress': { title: 'Fortress Security' },
    '/deep-archive': { title: 'Deep Archive' },
    '/settings': { title: 'Settings' },
    '/notifications': { title: 'Centar za Notifikacije', icon: <Bell size={16} /> },
    '/mail': { title: 'Olympic Mail', icon: <Mail size={16} /> },
    '/orchestrator': { title: 'Master Orchestrator', icon: <Brain size={16} /> },
};

interface TreeItem {
    id: string;
    name: string;
    type: 'file' | 'folder';
    icon?: React.ReactNode;
    children?: TreeItem[];
    path?: string;
    badge?: string;
}

interface VSCodeSidebarProps {
    width: number;
}

// Explorer tree data
const explorerTree: TreeItem[] = [
    {
        id: 'dashboard',
        name: 'Dashboard',
        type: 'file',
        icon: <Home size={16} />,
        path: '/'
    },
    {
        id: 'production-folder',
        name: 'Produkcija',
        type: 'folder',
        icon: <Package size={16} />,
        children: [
            { id: 'production-hub', name: 'Production Hub', type: 'file', icon: <FileText size={16} />, path: '/production' },
            { id: 'hotels', name: 'Hoteli', type: 'file', icon: <Hotel size={16} />, path: '/production/hotels' },
            { id: 'transport', name: 'Transport', type: 'file', icon: <Truck size={16} />, path: '/production/transport' },
        ]
    },
    {
        id: 'partners-folder',
        name: 'Partneri',
        type: 'folder',
        icon: <Users size={16} />,
        children: [
            { id: 'suppliers', name: 'Dobavljači', type: 'file', icon: <Database size={16} />, path: '/suppliers' },
            { id: 'customers', name: 'Kupci', type: 'file', icon: <Users size={16} />, path: '/customers' },
        ]
    },
    {
        id: 'analytics-folder',
        name: 'Analitika',
        type: 'folder',
        icon: <BarChart3 size={16} />,
        children: [
            { id: 'mars-analysis', name: 'Mars ERP Analitika', type: 'file', icon: <BarChart3 size={16} />, path: '/mars-analysis' },
            { id: 'pricing', name: 'Generator Cenovnika', type: 'file', icon: <FileText size={16} />, path: '/pricing-intelligence', badge: 'Pro' },
        ]
    },
    {
        id: 'system-folder',
        name: 'Sistem',
        type: 'folder',
        icon: <Settings size={16} />,
        children: [
            { id: 'katana', name: 'Katana (To-Do)', type: 'file', icon: <Sword size={16} />, path: '/katana', badge: 'Musashi' },
            { id: 'fortress', name: 'Fortress Security', type: 'file', icon: <Castle size={16} />, path: '/fortress', badge: 'Master' },
            { id: 'deep-archive', name: 'Duboka Arhiva', type: 'file', icon: <ShieldAlert size={16} />, path: '/deep-archive' },
            { id: 'settings', name: 'Podešavanja', type: 'file', icon: <Settings size={16} />, path: '/settings' },
        ]
    },
];

const TreeItemComponent: React.FC<{
    item: TreeItem;
    level: number;
    onFileClick: (path: string) => void;
}> = ({ item, level, onFileClick }) => {
    const [isExpanded, setIsExpanded] = useState(level === 0);

    const handleClick = () => {
        if (item.type === 'folder') {
            setIsExpanded(!isExpanded);
        } else if (item.path) {
            onFileClick(item.path);
        }
    };

    return (
        <div className="tree-item-container">
            <div
                className={`tree-item ${item.type}`}
                style={{ paddingLeft: `${level * 16 + 8}px` }}
                onClick={handleClick}
            >
                {item.type === 'folder' && (
                    <span className="tree-chevron">
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </span>
                )}
                <span className="tree-icon">
                    {item.type === 'folder'
                        ? (isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />)
                        : item.icon || <File size={16} />
                    }
                </span>
                <span className="tree-name">{item.name}</span>
                {item.badge && <span className="tree-badge">{item.badge}</span>}
            </div>
            {item.type === 'folder' && isExpanded && item.children && (
                <div className="tree-children">
                    {item.children.map((child) => (
                        <TreeItemComponent
                            key={child.id}
                            item={child}
                            level={level + 1}
                            onFileClick={onFileClick}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// Search panel content
const SearchPanel: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <div className="sidebar-panel search-panel">
            <div className="search-input-container">
                <Search size={14} />
                <input
                    type="text"
                    placeholder="Pretraži..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="sidebar-search-input"
                />
            </div>
            <div className="search-options">
                <button className="search-option-btn" title="Match Case">Aa</button>
                <button className="search-option-btn" title="Match Whole Word">ab</button>
                <button className="search-option-btn" title="Use Regex">.*</button>
            </div>
            {searchQuery && (
                <div className="search-results">
                    <p className="search-info">Pretraživanje: "{searchQuery}"</p>
                </div>
            )}
        </div>
    );
};

// Source control panel
const SourceControlPanel: React.FC = () => {
    return (
        <div className="sidebar-panel source-control-panel">
            <div className="source-control-header">
                <span>SOURCE CONTROL</span>
                <div className="source-control-actions">
                    <button title="Refresh"><RefreshCw size={14} /></button>
                    <button title="More Actions"><MoreHorizontal size={14} /></button>
                </div>
            </div>
            <div className="source-control-changes">
                <div className="change-group">
                    <div className="change-group-header">
                        <ChevronDown size={14} />
                        <span>Changes</span>
                        <span className="change-count">3</span>
                    </div>
                    <div className="change-item">
                        <span className="change-icon modified">M</span>
                        <span>Dashboard.tsx</span>
                    </div>
                    <div className="change-item">
                        <span className="change-icon added">A</span>
                        <span>VSCodeLayout.tsx</span>
                    </div>
                    <div className="change-item">
                        <span className="change-icon deleted">D</span>
                        <span>OldSidebar.tsx</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Production panel with hotels list
const ProductionPanel: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
    return (
        <div className="sidebar-panel">
            <div className="sidebar-section">
                <div className="section-header">
                    <span>PRODUKCIJA</span>
                    <button className="section-action" title="Add"><Plus size={14} /></button>
                </div>
                <div className="section-items">
                    <div className="section-item" onClick={() => onNavigate('/production')}>
                        <Package size={16} />
                        <span>Production Hub</span>
                    </div>
                    <div className="section-item" onClick={() => onNavigate('/production/hotels')}>
                        <Hotel size={16} />
                        <span>Smeštaj (Hoteli)</span>
                    </div>
                    <div className="section-item" onClick={() => onNavigate('/production/transport')}>
                        <Truck size={16} />
                        <span>Transport</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Suppliers panel
const SuppliersPanel: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
    return (
        <div className="sidebar-panel">
            <div className="sidebar-section">
                <div className="section-header">
                    <span>DOBAVLJAČI</span>
                    <button className="section-action" title="Add"><Plus size={14} /></button>
                </div>
                <div className="section-items">
                    <div className="section-item" onClick={() => onNavigate('/suppliers')}>
                        <Database size={16} />
                        <span>Svi dobavljači</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Customers panel
const CustomersPanel: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
    return (
        <div className="sidebar-panel">
            <div className="sidebar-section">
                <div className="section-header">
                    <span>KUPCI</span>
                    <button className="section-action" title="Add"><Plus size={14} /></button>
                </div>
                <div className="section-items">
                    <div className="section-item" onClick={() => onNavigate('/customers')}>
                        <Users size={16} />
                        <span>Svi kupci</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Hotels panel
const HotelsPanel: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
    return (
        <div className="sidebar-panel">
            <div className="sidebar-section">
                <div className="section-header">
                    <span>HOTELI</span>
                    <button className="section-action" title="Add"><Plus size={14} /></button>
                </div>
                <div className="section-items">
                    <div className="section-item" onClick={() => onNavigate('/production/hotels')}>
                        <Building2 size={16} />
                        <span>Lista hotela</span>
                    </div>
                    <div className="section-item" onClick={() => onNavigate('/production/hotels/new')}>
                        <Plus size={16} />
                        <span>Novi hotel</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Analytics panel
const AnalyticsPanel: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
    return (
        <div className="sidebar-panel">
            <div className="sidebar-section">
                <div className="section-header">
                    <span>ANALITIKA</span>
                </div>
                <div className="section-items">
                    <div className="section-item" onClick={() => onNavigate('/mars-analysis')}>
                        <BarChart3 size={16} />
                        <span>Mars ERP Analitika</span>
                    </div>
                    <div className="section-item" onClick={() => onNavigate('/pricing-intelligence')}>
                        <FileText size={16} />
                        <span>Generator Cenovnika</span>
                        <span className="item-badge">Pro</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Settings panel
const SettingsPanel: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
    return (
        <div className="sidebar-panel">
            <div className="sidebar-section">
                <div className="section-header">
                    <span>PODEŠAVANJA</span>
                </div>
                <div className="section-items">
                    <div className="section-item" onClick={() => onNavigate('/settings')}>
                        <Settings size={16} />
                        <span>Opšta podešavanja</span>
                    </div>
                    <div className="section-item" onClick={() => onNavigate('/katana')}>
                        <Sword size={16} />
                        <span>Katana (To-Do)</span>
                    </div>
                    <div className="section-item" onClick={() => onNavigate('/fortress')}>
                        <Castle size={16} />
                        <span>Fortress Security</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Mail panel
const MailPanel: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
    return (
        <div className="sidebar-panel">
            <div className="sidebar-section">
                <div className="section-header">
                    <span>MAIL</span>
                    <button className="section-action" title="Compose"><Plus size={14} /></button>
                </div>
                <div className="section-items">
                    <div className="section-item" onClick={() => onNavigate('/mail')}>
                        <Inbox size={16} />
                        <span>Inbox</span>
                        <span className="item-badge">12</span>
                    </div>
                    <div className="section-item" onClick={() => onNavigate('/mail')}>
                        <Send size={16} />
                        <span>Sent</span>
                    </div>
                    <div className="section-item" onClick={() => onNavigate('/mail')}>
                        <FileText size={16} />
                        <span>Drafts</span>
                    </div>
                    <div className="section-item" onClick={() => onNavigate('/mail')}>
                        <Trash2 size={16} />
                        <span>Trash</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Notifications panel
const NotificationsPanel: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
    return (
        <div className="sidebar-panel">
            <div className="sidebar-section">
                <div className="section-header">
                    <span>OBAVEŠTENJA</span>
                </div>
                <div className="section-items">
                    <div className="section-item" onClick={() => onNavigate('/notifications')}>
                        <Bell size={16} />
                        <span>Centar za Notifikacije</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Master Orchestrator panel
const OrchestratorPanel: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
    return (
        <div className="sidebar-panel">
            <div className="sidebar-section">
                <div className="section-header">
                    <span>AI ORCHESTRATOR</span>
                </div>
                <div className="section-items">
                    <div className="section-item" onClick={() => onNavigate('/orchestrator')}>
                        <Brain size={16} />
                        <span>Master Orchestrator</span>
                        <span className="item-badge">Master</span>
                    </div>
                    <div className="section-item">
                        <Network size={16} />
                        <span>Agent Registry</span>
                        <span className="item-badge">6</span>
                    </div>
                    <div className="section-item">
                        <Cpu size={16} />
                        <span>Active Agents</span>
                        <span className="item-badge">0</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const VSCodeSidebar: React.FC<VSCodeSidebarProps> = ({ width }) => {
    const { activeActivity, addTab, setActiveTab } = useVSCodeStore();
    const navigate = useNavigate();

    const handleFileClick = (path: string) => {
        // Navigate to the path
        navigate(path);

        // Get tab info from mapping
        const tabInfo = routeToTabMap[path];
        const tabId = path === '/' ? 'dashboard' : path.replace(/\//g, '-').slice(1);

        if (tabInfo) {
            addTab({
                id: tabId,
                title: tabInfo.title,
                icon: tabInfo.icon,
                path: path,
                component: null // Will be handled by router
            });
            setActiveTab(tabId);
        }
    };

    const renderPanelContent = () => {
        switch (activeActivity) {
            case 'explorer':
                return (
                    <div className="sidebar-panel explorer-panel">
                        <div className="explorer-header">
                            <span>Olympic B2B</span>
                            <div className="explorer-actions">
                                <button title="New File"><Plus size={14} /></button>
                                <button title="Refresh"><RefreshCw size={14} /></button>
                            </div>
                        </div>
                        <div className="explorer-tree">
                            {explorerTree.map((item) => (
                                <TreeItemComponent
                                    key={item.id}
                                    item={item}
                                    level={0}
                                    onFileClick={handleFileClick}
                                />
                            ))}
                        </div>
                    </div>
                );
            case 'search':
                return <SearchPanel />;
            case 'source-control':
                return <SourceControlPanel />;
            case 'production':
                return <ProductionPanel onNavigate={handleFileClick} />;
            case 'suppliers':
                return <SuppliersPanel onNavigate={handleFileClick} />;
            case 'customers':
                return <CustomersPanel onNavigate={handleFileClick} />;
            case 'hotels':
                return <HotelsPanel onNavigate={handleFileClick} />;
            case 'analytics':
                return <AnalyticsPanel onNavigate={handleFileClick} />;
            case 'settings':
                return <SettingsPanel onNavigate={handleFileClick} />;
            case 'mail':
                return <MailPanel onNavigate={handleFileClick} />;
            case 'notifications':
                return <NotificationsPanel onNavigate={handleFileClick} />;
            case 'orchestrator':
                return <OrchestratorPanel onNavigate={handleFileClick} />;
            default:
                return (
                    <div className="sidebar-panel">
                        <p style={{ padding: '16px', color: 'var(--vscode-foreground-muted)' }}>
                            Panel not implemented
                        </p>
                    </div>
                );
        }
    };

    const getActivityTitle = (): string => {
        const titles: Record<ActivityType, string> = {
            'explorer': 'EXPLORER',
            'search': 'SEARCH',
            'source-control': 'SOURCE CONTROL',
            'debug': 'DEBUG',
            'extensions': 'EXTENSIONS',
            'production': 'PRODUKCIJA',
            'suppliers': 'DOBAVLJAČI',
            'customers': 'KUPCI',
            'hotels': 'HOTELI',
            'analytics': 'ANALITIKA',
            'settings': 'PODEŠAVANJA',
            'notifications': 'OBAVEŠTENJA',
            'mail': 'MAIL',
            'orchestrator': 'MASTER ORCHESTRATOR'
        };
        return titles[activeActivity] || 'EXPLORER';
    };

    return (
        <div className="vscode-sidebar" style={{ width }}>
            <div className="sidebar-title">{getActivityTitle()}</div>
            <div className="sidebar-content">
                {renderPanelContent()}
            </div>
        </div>
    );
};

export default VSCodeSidebar;
