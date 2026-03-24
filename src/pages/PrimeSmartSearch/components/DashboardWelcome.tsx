import React from 'react';

interface DashboardWelcomeProps {
    activeTab: string;
}

export const DashboardWelcome: React.FC<DashboardWelcomeProps> = ({ activeTab }) => {
    return (
        <div className="v6-dashboard-welcome v6-fade-in" style={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '400px',
            textAlign: 'center',
            padding: '40px',
            background: 'var(--v6-bg-section)',
            borderRadius: 'var(--v6-radius-lg)',
            border: '2px dashed var(--v6-border)',
            margin: '20px 0'
        }}>
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>🗺️</div>
            <h2 style={{ fontSize: '28px', color: 'var(--v6-text-primary)', marginBottom: '12px', fontWeight: 800 }}>
                Vaša potraga za idealnim putovanjem počinje ovde.
            </h2>
            <p style={{ maxWidth: '480px', margin: '0 auto', color: 'var(--v6-text-secondary)', fontSize: '16px', lineHeight: 1.6 }}>
                Pretraga za <strong style={{ color: 'var(--v6-accent)' }}>{activeTab}</strong> je spremna. 
                Izaberite destinaciju i datume iznad kako biste videli naše najnovije ponude iz Prime banke hotela.
            </p>
            
            <div style={{ marginTop: '32px', display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <div style={{ padding: '8px 16px', background: 'var(--v6-bg-main)', borderRadius: '20px', fontSize: '12px', border: '1px solid var(--v6-border)', color: 'var(--v6-text-muted)' }}>
                    ✨ Direktna konekcija
                </div>
                <div style={{ padding: '8px 16px', background: 'var(--v6-bg-main)', borderRadius: '20px', fontSize: '12px', border: '1px solid var(--v6-border)', color: 'var(--v6-text-muted)' }}>
                    ⚡ Instant potvrda
                </div>
                <div style={{ padding: '8px 16px', background: 'var(--v6-bg-main)', borderRadius: '20px', fontSize: '12px', border: '1px solid var(--v6-border)', color: 'var(--v6-text-muted)' }}>
                    🛡️ Prime zaštita
                </div>
            </div>
        </div>
    );
};
