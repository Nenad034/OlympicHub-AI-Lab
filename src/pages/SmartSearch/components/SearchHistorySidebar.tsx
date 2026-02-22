import React from 'react';
import { createPortal } from 'react-dom';
import { Clock, X, MapPin, Hotel, Calendar, Users, UtensilsCrossed, Zap, Search, RefreshCw, Trash2 } from 'lucide-react';
import type { SearchHistoryItem } from '../types';
import { formatPrice, getMealPlanDisplayName } from '../helpers';
import { formatDate } from '../../../utils/dateUtils';

interface SearchHistorySidebarProps {
    searchHistory: SearchHistoryItem[];
    onClose: () => void;
    onLoad: (item: SearchHistoryItem) => void;
    onRefresh: (item: SearchHistoryItem) => void;
    onRemove: (id: string) => void;
    onClearAll: () => void;
}

export const SearchHistorySidebar: React.FC<SearchHistorySidebarProps> = ({
    searchHistory, onClose, onLoad, onRefresh, onRemove, onClearAll
}) => {
    return createPortal(
        <div className="history-sidebar-overlay" onClick={onClose}>
            <div className="history-sidebar" onClick={e => e.stopPropagation()}>
                <div className="history-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Clock size={20} />
                        <h2>ISTORIJA PRETRAGE</h2>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {searchHistory.length > 0 && (
                            <button className="clear-all-history-btn" onClick={onClearAll} title="Obriši sve">
                                <Trash2 size={18} />
                            </button>
                        )}
                        <button className="close-history-btn" onClick={onClose}><X size={20} /></button>
                    </div>
                </div>

                <div className="history-list">
                    {searchHistory.length === 0 ? (
                        <div className="empty-history">
                            <Clock size={48} />
                            <p>Vaša istorija pretrage je prazna.<br />Pokrenite pretragu da biste je sačuvali ovde.</p>
                        </div>
                    ) : (
                        searchHistory.map(item => (
                            <div key={item.id} className="history-item-card" onClick={() => onLoad(item)}>
                                <div className="history-item-header">
                                    <div className="history-destinations">
                                        {item.query.destinations.map(d => (
                                            <div key={d.id} className="history-dest-chip">
                                                {d.type === 'hotel' ? <Hotel size={10} /> : <MapPin size={10} />}
                                                {d.name}
                                            </div>
                                        ))}
                                    </div>
                                    <span className="history-time">
                                        {new Date(item.timestamp).toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>

                                <div className="history-details">
                                    <div className="history-detail-item">
                                        <Calendar size={12} />
                                        {formatDate(item.query.checkIn).split('.')[0]}.{formatDate(item.query.checkIn).split('.')[1]}
                                        {' - '}
                                        {formatDate(item.query.checkOut).split('.')[0]}.{formatDate(item.query.checkOut).split('.')[1]}
                                    </div>
                                    <div className="history-detail-item">
                                        <Users size={12} />
                                        {item.query.roomAllocations.reduce((sum, r) => sum + r.adults + r.children, 0)} putnika
                                    </div>
                                    <div className="history-detail-item">
                                        <UtensilsCrossed size={12} />
                                        {getMealPlanDisplayName(item.query.mealPlan)}
                                    </div>
                                    <div className="history-detail-item">
                                        <Zap size={12} />
                                        {item.query.searchMode.toUpperCase()}
                                    </div>
                                </div>

                                <div className="history-summary">
                                    {item.resultsSummary && (
                                        <>
                                            <div className="history-results-count">
                                                <Search size={12} /> {item.resultsSummary.count} rezultata
                                            </div>
                                            {item.resultsSummary.minPrice && (
                                                <div className="history-min-price">
                                                    od {formatPrice(item.resultsSummary.minPrice)} €
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div className="history-item-actions">
                                    <button
                                        className="action-btn-mini"
                                        title="Osveži rezultate"
                                        onClick={(e) => { e.stopPropagation(); onRefresh(item); }}
                                    >
                                        <RefreshCw size={14} />
                                    </button>
                                    <button
                                        className="action-btn-mini delete"
                                        title="Ukloni iz istorije"
                                        onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>,
        document.getElementById('portal-root') || document.body
    );
};

export default SearchHistorySidebar;
