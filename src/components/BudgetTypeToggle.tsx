import React from 'react';

interface BudgetTypeToggleProps {
    type: 'person' | 'total';
    onChange: (type: 'person' | 'total') => void;
}

export const BudgetTypeToggle: React.FC<BudgetTypeToggleProps> = ({ type, onChange }) => {
    return (
        <div
            onClick={() => onChange(type === 'person' ? 'total' : 'person')}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: '#8E24AC',
                color: '#fff',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.65rem',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.2s',
                textTransform: 'uppercase',
                userSelect: 'none',
                boxShadow: '0 2px 8px rgba(142, 36, 172, 0.3)'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
            {type === 'person' ? 'PO OSOBI' : 'UKUPNO'}
        </div>
    );
};
