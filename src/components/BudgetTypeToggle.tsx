import React from 'react';

interface BudgetTypeToggleProps {
    type: 'person' | 'room' | 'total';
    onChange: (type: 'person' | 'room' | 'total') => void;
}

export const BudgetTypeToggle: React.FC<BudgetTypeToggleProps> = ({ type, onChange }) => {
    const options: { id: 'person' | 'room' | 'total', label: string }[] = [
        { id: 'person', label: 'PO OSOBI' },
        { id: 'room', label: 'PO SOBI' },
        { id: 'total', label: 'UKUPNO' }
    ];

    return (
        <div style={{
            display: 'flex',
            gap: '6px',
            marginTop: '4px'
        }}>
            {options.map((opt) => {
                const isActive = type === opt.id;
                return (
                    <div
                        key={opt.id}
                        onClick={() => onChange(opt.id)}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            background: isActive ? '#8E24AC' : 'rgba(255, 255, 255, 0.05)',
                            color: isActive ? '#fff' : 'var(--text-secondary)',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '0.6rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            textTransform: 'uppercase',
                            userSelect: 'none',
                            border: isActive ? '1px solid #8E24AC' : '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: isActive ? '0 2px 8px rgba(142, 36, 172, 0.4)' : 'none'
                        }}
                        onMouseOver={(e) => {
                            if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        }}
                        onMouseOut={(e) => {
                            if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        }}
                    >
                        {opt.label}
                    </div>
                );
            })}
        </div>
    );
};
