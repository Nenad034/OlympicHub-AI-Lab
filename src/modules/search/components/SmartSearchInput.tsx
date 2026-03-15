import React from 'react';
import { Search, MapPin, Calendar, Users, Sparkles } from 'lucide-react';
import { useThemeStore } from '../../../stores';

interface SmartSearchInputProps {
  onSearch: () => void;
  destination: string;
  onDestinationChange: (val: string) => void;
  dates: string;
  guests: string;
  onPaxClick?: () => void;
  onDateClick?: () => void;
}

export const SMART_SECTION_STYLE = { cursor: 'pointer' };

export const SmartSearchInput: React.FC<SmartSearchInputProps> = ({ 
  onSearch, 
  destination, 
  onDestinationChange,
  dates, 
  guests,
  onPaxClick,
  onDateClick
}) => {
  const { theme } = useThemeStore();

  return (
    <div className="ms-smart-bar">
      {/* Destination */}
      <div className="ms-bar-section">
        <span className="ms-section-label">Lokacija</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapPin size={14} style={{ color: 'var(--ms-brand-purple)' }} />
          <input 
            type="text"
            className="ms-section-input"
            placeholder="Gde putujete?"
            value={destination}
            onChange={(e) => onDestinationChange(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              boxShadow: 'none',
              color: 'var(--ms-text)',
              fontSize: '13px',
              fontWeight: 700,
              width: '100%',
              padding: 0,
              margin: 0,
              appearance: 'none',
              WebkitAppearance: 'none'
            }}
          />
        </div>
      </div>

      {/* Dates */}
      <div className="ms-bar-section" onClick={onDateClick}>
        <span className="ms-section-label">Vreme</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={14} style={{ color: 'var(--ms-brand-purple)' }} />
          <span className="ms-section-value">{dates || 'Dodaj datume'}</span>
        </div>
      </div>

      {/* Guests */}
      <div className="ms-bar-section" onClick={onPaxClick}>
        <span className="ms-section-label">Putnici</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={14} style={{ color: 'var(--ms-brand-purple)' }} />
          <span className="ms-section-value">{guests || 'Dodaj goste'}</span>
        </div>
      </div>

      {/* AI Search Action */}
      <button className="ms-search-action" onClick={onSearch}>
        <Sparkles size={20} fill="white" />
      </button>
    </div>
  );
};
