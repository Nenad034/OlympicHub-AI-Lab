import React from 'react';
import { Star, Heart } from 'lucide-react';
import type { SearchResult } from '../types/search.types';

interface ResultCardProps {
  hotel: SearchResult;
  onSelect: (hotel: SearchResult) => void;
  isSelected?: boolean;
}

export const ResultCard: React.FC<ResultCardProps> = ({ hotel, onSelect, isSelected }) => {
  return (
    <div className={`ms-card ${isSelected ? 'selected' : ''}`} onClick={() => onSelect(hotel)}>
      <div className="ms-card-img-wrap">
        <img src={hotel.image} className="ms-card-img" alt={hotel.name} />
        <div className="ms-card-badge">
          {hotel.provider}
        </div>
        <button 
          style={{ 
            position: 'absolute', top: '12px', right: '12px', 
            background: 'none', border: 'none', color: 'white', cursor: 'pointer' 
          }}
          onClick={(e) => { e.stopPropagation(); }}
        >
          <Heart size={20} />
        </button>
      </div>

      <div className="ms-card-content">
        <div className="ms-card-title-row">
          <span className="ms-card-title">{hotel.name}</span>
          <div className="ms-card-rating">
            <Star size={12} fill="currentColor" />
            <span>{hotel.rating}</span>
          </div>
        </div>
        <span className="ms-card-sub">{hotel.location}</span>
        <span className="ms-card-sub">{hotel.category}</span>
        <div className="ms-card-price">
          Od €{hotel.price} <span>/ noć</span>
        </div>
      </div>
    </div>
  );
};
