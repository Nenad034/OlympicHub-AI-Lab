import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Mail, 
  Instagram, 
  Facebook, 
  Linkedin, 
  Twitter as XIcon, 
  Smartphone, 
  AlertCircle, 
  TrendingUp, 
  Smile, 
  Frown, 
  Meh,
  Plus,
  User,
  Filter,
  CheckCircle2,
  Search,
  Calendar,
  Database,
  ChevronDown,
  MessageCircle,
  Hash
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { pimService, type PimCommunication } from '../../services/pimService';
import { useThemeStore } from '../../stores';
import './PimDashboard.css';

const PimDashboard: React.FC = () => {
  const [feed, setFeed] = useState<PimCommunication[]>([]);
  const [activeTab, setActiveTab] = useState<'All' | 'Urgent' | 'Opportunities'>('All');
  const [selectedUser, setSelectedUser] = useState<string>('All');
  const [expandedThreads, setExpandedThreads] = useState<string[]>([]);
  const { theme } = useThemeStore();
  const isLightMode = theme === 'light';
  
  // Search and Date Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Resizable Layout State
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [detailsWidth, setDetailsWidth] = useState(350);
  const [selectedItem, setSelectedItem] = useState<PimCommunication | null>(null);

  // Grouped Channel State
  const [selectedChannel, setSelectedChannel] = useState<string>('All');
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['Messenger', 'Social']);

  const channelGroups = {
    'Messenger': ['Viber', 'WhatsApp', 'Telegram'],
    'Social': ['Facebook', 'Instagram', 'X', 'LinkedIn', 'TikTok']
  };

  useEffect(() => {
    const loadFeed = async () => {
      const data = await pimService.getAggregatedFeed();
      setFeed(data);
      if (data.length > 0) setSelectedItem(data[0]);
    };
    loadFeed();
  }, []);

  const handleSidebarResize = (e: MouseEvent) => {
    const newWidth = e.clientX - 64; // adjust for app sidebar if needed
    if (newWidth > 150 && newWidth < 400) setSidebarWidth(newWidth);
  };

  const handleDetailsResize = (e: MouseEvent) => {
    const newWidth = window.innerWidth - e.clientX - 24;
    if (newWidth > 250 && newWidth < 600) setDetailsWidth(newWidth);
  };

  const startResizing = (handler: (e: MouseEvent) => void) => {
    const onMouseMove = (e: MouseEvent) => handler(e);
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('sr-RS', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    }).replace(',', '');
  };

  const toggleThread = (id: string) => {
    setExpandedThreads(prev => 
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    );
  };

  const handleSmartDateInput = (value: string, setter: (val: string) => void) => {
    // Remove all non-digits
    let cleaned = value.replace(/\D/g, '');
    
    // Limits to 8 digits (DDMMYYYY)
    if (cleaned.length > 8) cleaned = cleaned.substring(0, 8);
    
    // Auto-format as DD.MM.YYYY
    let formatted = cleaned;
    if (cleaned.length >= 2) {
      formatted = cleaned.substring(0, 2) + '.' + cleaned.substring(2);
    }
    if (cleaned.length >= 4) {
      formatted = formatted.substring(0, 5) + '.' + formatted.substring(5);
    }
    
    setter(formatted);
  };

  const parseDate = (dStr: string) => {
    if (!dStr || dStr.length < 10) return null;
    const parts = dStr.split('.');
    if (parts.length !== 3) return null;
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  };

  const getSourceIcon = (source: PimCommunication['source']) => {
    switch (source) {
      case 'Email': return <Mail size={16} />;
      case 'Instagram': return <Instagram size={16} />;
      case 'Facebook': return <Facebook size={16} />;
      case 'LinkedIn': return <Linkedin size={16} />;
      case 'X': return <XIcon size={16} />;
      case 'WhatsApp': return <MessageCircle size={16} />;
      case 'Viber': return <Smartphone size={16} />;
      case 'Telegram': return <MessageSquare size={16} />;
      case 'TikTok': return <Smartphone size={16} />;
      default: return <Smartphone size={16} />;
    }
  };

  const getSentimentIcon = (sentiment: PimCommunication['sentiment']) => {
    switch (sentiment) {
      case 'Positive': return <Smile color="#10b981" size={18} />;
      case 'Negative': return <Frown color="#ef4444" size={18} />;
      case 'Urgent': return <AlertCircle color="#f59e0b" size={18} />;
      default: return <Meh color="#94a3b8" size={18} />;
    }
  };

  // Extract unique users from feed for filter
  const systemUsers = ['All', ...new Set(feed.map(item => item.assigned_to))];

  const filteredFeed = feed.filter(item => {
    const userMatch = selectedUser === 'All' || item.assigned_to === selectedUser;
    const tabMatch = activeTab === 'All' || 
                    (activeTab === 'Urgent' && item.sentiment === 'Urgent') ||
                    (activeTab === 'Opportunities' && item.intent === 'Booking');
    
    // Channel/Source Filter
    let channelMatch = true;
    if (selectedChannel !== 'All') {
      if (channelGroups[selectedChannel as keyof typeof channelGroups]) {
        // Filter by group
        channelMatch = channelGroups[selectedChannel as keyof typeof channelGroups].includes(item.source);
      } else {
        // Filter by specific source
        channelMatch = item.source === selectedChannel;
      }
    }

    const searchLower = searchQuery.toLowerCase();
    const searchMatch = !searchQuery || 
                       item.sender_name.toLowerCase().includes(searchLower) ||
                       item.last_message.toLowerCase().includes(searchLower) ||
                       item.tags.some(t => t.toLowerCase().includes(searchLower)) ||
                       item.assigned_to.toLowerCase().includes(searchLower);

    // Date Range Match
    const itemDate = new Date(item.timestamp);
    const start = parseDate(dateFrom);
    const end = parseDate(dateTo);
    
    let dateMatch = true;
    if (start && itemDate < start) dateMatch = false;
    if (end) {
      // Set end date to end of day
      const endOfDay = new Date(end);
      endOfDay.setHours(23, 59, 59, 999);
      if (itemDate > endOfDay) dateMatch = false;
    }

    return userMatch && tabMatch && searchMatch && dateMatch && channelMatch;
  });

  return (
    <div className={`pim-container ${isLightMode ? 'light' : ''}`}>
      <header className="pim-header">
        <div className="pim-title-group">
          <h1>PIM <span className="title-prime">Prime Intelligence</span></h1>
          <p>Multi-channel Communication & Sentiment Hub</p>
        </div>
        <div className="pim-stats">
          <div className="stat-card urgent">
            <span className="stat-label">Urgent Alerts</span>
            <span className="stat-value">2</span>
          </div>
          <div className="stat-card positive">
            <span className="stat-label">Positive Sentiment</span>
            <span className="stat-value">84%</span>
          </div>
          <div className="stat-card opportunity">
            <span className="stat-label">Sales Hooks</span>
            <span className="stat-value">12</span>
          </div>

          {/* Integrated AI Insights */}
          <div className="stat-card insight-item market">
            <div className="insight-label">
              <TrendingUp size={14} /> <span>Market Growth</span>
            </div>
            <div className="insight-value">+15%</div>
          </div>
          <div className="stat-card insight-item risk">
            <div className="insight-label">
              <AlertCircle size={14} /> <span>SLA Risk</span>
            </div>
            <div className="insight-value">2h+</div>
          </div>
          <div className="stat-card insight-item efficiency">
            <div className="insight-label">
              <CheckCircle2 size={14} /> <span>Efficiency</span>
            </div>
            <div className="insight-value">+5</div>
          </div>
        </div>
      </header>

      <div className="pim-top-filters">
        <div className="filters-main-row">
          <div className="global-search-wrapper">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Pretraži poruke, tagove ili korisnike kroz ceo sistem..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="date-filters-row">
            <div className="date-input-group">
              <Calendar size={14} />
              <label>Od:</label>
              <input 
                type="text" 
                placeholder="01.01.2024"
                value={dateFrom}
                onChange={(e) => handleSmartDateInput(e.target.value, setDateFrom)}
              />
            </div>
            <div className="date-separator">—</div>
            <div className="date-input-group">
              <Calendar size={14} />
              <label>Do:</label>
              <input 
                type="text" 
                placeholder="31.12.2024"
                value={dateTo}
                onChange={(e) => handleSmartDateInput(e.target.value, setDateTo)}
              />
            </div>
            {(dateFrom || dateTo || searchQuery) && (
              <button className="clear-filters" onClick={() => { setDateFrom(''); setDateTo(''); setSearchQuery(''); }}>
                Poništi
              </button>
            )}
          </div>
        </div>


      </div>

      <div className="pim-main-layout">
        <aside className="pim-channels-sidebar" style={{ width: sidebarWidth }}>
          <div className="sidebar-section">
            <h3>Communication Channels</h3>
            <div className="channel-list">
              <div 
                className={`channel-item ${selectedChannel === 'All' ? 'active' : ''}`}
                onClick={() => setSelectedChannel('All')}
              >
                <Database size={16} /> All Channels
              </div>
              
              <div 
                className={`channel-item ${selectedChannel === 'Email' ? 'active' : ''}`}
                onClick={() => setSelectedChannel('Email')}
              >
                <Mail size={16} /> Email
              </div>

              {/* Messenger Group */}
              <div className="accordion-group">
                <div 
                  className={`channel-item has-sub ${selectedChannel === 'Messenger' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedChannel('Messenger');
                    if (!expandedGroups.includes('Messenger')) setExpandedGroups(prev => [...prev, 'Messenger']);
                  }}
                >
                  <MessageSquare size={16} /> 
                  <span>Messenger</span>
                  <Plus 
                    size={14} 
                    className={`chevron ${expandedGroups.includes('Messenger') ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedGroups(prev => 
                        prev.includes('Messenger') ? prev.filter(g => g !== 'Messenger') : [...prev, 'Messenger']
                      );
                    }}
                  />
                </div>
                <AnimatePresence>
                  {expandedGroups.includes('Messenger') && (
                    <motion.div 
                      className="sub-channels"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      {channelGroups['Messenger'].map(source => (
                        <div 
                          key={source}
                          className={`sub-channel-item ${selectedChannel === source ? 'active' : ''}`}
                          onClick={() => setSelectedChannel(source)}
                        >
                          {getSourceIcon(source as any)} {source}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Social Group */}
              <div className="accordion-group">
                <div 
                  className={`channel-item has-sub ${selectedChannel === 'Social' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedChannel('Social');
                    if (!expandedGroups.includes('Social')) setExpandedGroups(prev => [...prev, 'Social']);
                  }}
                >
                  <TrendingUp size={16} /> 
                  <span>Social</span>
                  <Plus 
                    size={14} 
                    className={`chevron ${expandedGroups.includes('Social') ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedGroups(prev => 
                        prev.includes('Social') ? prev.filter(g => g !== 'Social') : [...prev, 'Social']
                      );
                    }}
                  />
                </div>
                <AnimatePresence>
                  {expandedGroups.includes('Social') && (
                    <motion.div 
                      className="sub-channels"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      {channelGroups['Social'].map(source => (
                        <div 
                          key={source}
                          className={`sub-channel-item ${selectedChannel === source ? 'active' : ''}`}
                          onClick={() => setSelectedChannel(source)}
                        >
                          {getSourceIcon(source as any)} {source}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <h3><Filter size={14} /> Sort by User</h3>
            <div className="user-filter-list">
              {systemUsers.map(user => (
                <div 
                  key={user} 
                  className={`user-item ${selectedUser === user ? 'active' : ''}`}
                  onClick={() => setSelectedUser(user)}
                >
                  <User size={14} /> {user}
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div className="pim-resizer" onMouseDown={() => startResizing(handleSidebarResize)} />

        <section className="pim-intelligence-feed">
          <div className="tabs">
            <button className={activeTab === 'All' ? 'active' : ''} onClick={() => setActiveTab('All')}>All Activity</button>
            <button className={activeTab === 'Urgent' ? 'active' : ''} onClick={() => setActiveTab('Urgent')}>Urgent Arrivals</button>
            <button className={activeTab === 'Opportunities' ? 'active' : ''} onClick={() => setActiveTab('Opportunities')}>Sales Leads</button>
          </div>

          <div className="feed-list">
            {filteredFeed.map(item => (
              <div 
                key={item.id} 
                className={`feed-item ${item.sentiment.toLowerCase()} ${selectedItem?.id === item.id ? 'selected' : ''}`}
                onClick={() => setSelectedItem(item)}
              >
                <div className="item-main-row">
                  <div className="item-header">
                    <div className="sender-info">
                      <span className="source-icon-main">{getSourceIcon(item.source)}</span>
                      <span className="sender-name">{item.sender_name}</span>
                      <span className="timestamp">{formatDateTime(item.timestamp)}</span>
                    </div>
                  </div>
                  <div className="item-excerpt">
                    {item.last_message}
                  </div>
                  <div className="item-footer">
                    <div className="tag-list">
                      {item.tags.map(tag => <span key={tag} className="tag">#{tag}</span>)}
                    </div>
                    {item.sentiment === 'Urgent' && <AlertCircle size={14} color="#ef4444" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="pim-resizer" onMouseDown={() => startResizing(handleDetailsResize)} />

        <aside className="pim-details-sidebar" style={{ width: detailsWidth }}>
          {selectedItem ? (
            <div className="details-content">
              <div className="details-header">
                <div className="details-title">
                  <span className="source-icon-large">{getSourceIcon(selectedItem.source)}</span>
                  <h2>{selectedItem.sender_name}</h2>
                </div>
                <div className="details-badges">
                   <span className={`sentiment-badge ${selectedItem.sentiment.toLowerCase()}`}>{selectedItem.sentiment}</span>
                   <span className="assigned-badge">Assigned: {selectedItem.assigned_to}</span>
                </div>
              </div>

              <div className="conversation-history">
                {selectedItem.history.map(msg => (
                  <div key={msg.id} className={`msg-bubble ${msg.role}`}>
                    <div className="msg-text">{msg.content}</div>
                    <span className="msg-time">{formatDateTime(msg.timestamp)}</span>
                  </div>
                ))}
              </div>

              <div className="ai-actions-panel">
                <h3>AI Suggested Actions</h3>
                <div className="action-button primary">
                  <CheckCircle2 size={16} /> Potvrdi transfer
                </div>
                <div className="action-button secondary">
                  <Mail size={16} /> Pošalji ponudu
                </div>
              </div>
            </div>
          ) : (
            <div className="details-placeholder">
              <MessageSquare size={48} opacity={0.2} />
              <p>Izaberite konverzaciju za prikaz detalja</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default PimDashboard;
