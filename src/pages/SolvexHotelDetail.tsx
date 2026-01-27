import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Calendar, Users, Euro, Info } from 'lucide-react';
import { useThemeStore } from '../stores';

const SolvexHotelDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { lang } = useThemeStore();

    // Mock data based on ID since we don't have a direct "GetHotelDetails" call yet
    const hotelId = id?.replace('solvex-', '') || id;

    return (
        <div className="hotel-detail-container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', color: 'var(--text-primary)' }}>
            <button
                onClick={() => navigate(-1)}
                className="back-btn"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    marginBottom: '20px',
                    fontSize: '16px'
                }}
            >
                <ArrowLeft size={20} />
                {lang === 'sr' ? 'Nazad na pretragu' : 'Back to search'}
            </button>

            <div className="detail-card" style={{
                background: 'var(--card-bg)',
                borderRadius: '16px',
                padding: '30px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                border: '1px solid var(--card-border)'
            }}>
                <div className="header-section" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                        <span style={{
                            background: 'linear-gradient(135deg, #e91e63 0%, #c2185b 100%)',
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 'bold'
                        }}>
                            SOLVEX API
                        </span>
                        <div style={{ display: 'flex', gap: '2px' }}>
                            {'⭐'.repeat(3)}
                        </div>
                    </div>
                    <h1 style={{ fontSize: '28px', margin: '0 0 10px 0' }}>Hotel ID: {hotelId}</h1>
                    <p style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                        <Building2 size={16} /> Bulgaria
                    </p>
                </div>

                <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                    <div className="info-item" style={{ background: 'var(--bg-secondary)', padding: '15px', borderRadius: '12px' }}>
                        <Info size={24} style={{ color: '#3b82f6', marginBottom: '10px' }} />
                        <h3 style={{ margin: '0 0 5px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>Status</h3>
                        <p style={{ margin: 0, fontWeight: '600' }}>Available via Solvex</p>
                    </div>
                    <div className="info-item" style={{ background: 'var(--bg-secondary)', padding: '15px', borderRadius: '12px' }}>
                        <Euro size={24} style={{ color: '#10b981', marginBottom: '10px' }} />
                        <h3 style={{ margin: '0 0 5px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>Live Price</h3>
                        <p style={{ margin: 0, fontWeight: '600' }}>Check Search Results</p>
                    </div>
                </div>

                <div className="placeholder-content" style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    background: 'rgba(59, 130, 246, 0.05)',
                    borderRadius: '12px',
                    border: '1px dashed #3b82f6'
                }}>
                    <Building2 size={48} style={{ color: '#3b82f6', marginBottom: '20px', opacity: 0.5 }} />
                    <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>
                        {lang === 'sr' ? 'Detaljni podaci uskoro' : 'Detailed Information Coming Soon'}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
                        {lang === 'sr'
                            ? 'Trenutno Solvex API integracija podržava samo pretragu cena i raspoloživosti. Detaljni opisi, slike i lista soba su u fazi razvoja.'
                            : 'Currently Solvex API integration supports price and availability search only. Detailed descriptions, images, and room lists are under development.'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SolvexHotelDetail;
