import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    CheckCircle,
    ArrowRight,
    FileText,
    List,
    Home,
    Sparkles,
    Copy,
    Share2
} from 'lucide-react';
import { dynamicPackageService } from '../services/dynamicPackageService';
import type { PackageDraft } from '../services/dynamicPackageService';
import { ChevronRight } from 'lucide-react';
import './PackageSearch.css'; // Reuse some styles

const PackageCreated: React.FC = () => {
    const navigate = useNavigate();
    const [latestDraft, setLatestDraft] = useState<PackageDraft | null>(null);

    useEffect(() => {
        const fetchLatest = async () => {
            const drafts = await dynamicPackageService.getDrafts();
            if (drafts.length > 0) {
                setLatestDraft(drafts[0]);
            }
        };
        fetchLatest();
    }, []);

    return (
        <div className="package-success-page">
            <motion.div
                className="success-content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="success-icon-wrapper">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    >
                        <CheckCircle size={80} color="#3fb950" />
                    </motion.div>
                    <div className="confetti-placeholder">
                        <Sparkles className="sparkle s1" size={24} />
                        <Sparkles className="sparkle s2" size={24} />
                        <Sparkles className="sparkle s3" size={24} />
                    </div>
                </div>

                <h1>Paket je uspešno kreiran!</h1>
                <p className="subtitle">
                    Vaš plan putovanja je sačuvan kao nacrt i spreman je za dalju obradu ili slanje klijentu.
                </p>

                {latestDraft && (
                    <motion.div
                        className="created-package-card"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <div className="package-info">
                            <span className="status-badge">Nacrt</span>
                            <h2 className="draft-name">{latestDraft.name}</h2>
                            <div className="package-meta-mini">
                                <span>{latestDraft.totalPrice.toFixed(2)} €</span>
                                <span className="dot">•</span>
                                <span>{latestDraft.hotels.length} Hotela</span>
                                <span className="dot">•</span>
                                <span>{latestDraft.flights?.multiCityFlights?.length || 2} Leta</span>
                            </div>
                        </div>
                        <button className="view-package-btn" onClick={() => navigate('/packages')}>
                            Pogledaj Detalje
                            <ArrowRight size={18} />
                        </button>
                    </motion.div>
                )}

                <div className="success-actions">
                    <button className="action-card" onClick={() => navigate('/packages/search')}>
                        <div className="icon-box blue">
                            <Copy size={24} />
                        </div>
                        <div className="action-text">
                            <h3>Novi Paket</h3>
                            <p>Započni kreiranje nove ponude</p>
                        </div>
                        <ChevronRight size={20} />
                    </button>

                    <button className="action-card" onClick={() => navigate('/')}>
                        <div className="icon-box green">
                            <Home size={24} />
                        </div>
                        <div className="action-text">
                            <h3>Dashboard</h3>
                            <p>Povratak na glavnu kontrolnu tablu</p>
                        </div>
                        <ChevronRight size={20} />
                    </button>

                    <button className="action-card" onClick={() => alert('Funkcionalnost u pripremi')}>
                        <div className="icon-box purple">
                            <Share2 size={24} />
                        </div>
                        <div className="action-text">
                            <h3>Podeli</h3>
                            <p>Podelite link do ponude sa kolegama</p>
                        </div>
                        <ChevronRight size={20} />
                    </button>
                </div>
            </motion.div>

            <style>{`
                .package-success-page {
                    min-height: calc(100vh - 100px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 40px 20px;
                    background: transparent;
                }

                .success-content {
                    max-width: 600px;
                    width: 100%;
                    text-align: center;
                }

                .success-icon-wrapper {
                    position: relative;
                    margin-bottom: 24px;
                    display: inline-block;
                }

                .sparkle {
                    position: absolute;
                    color: var(--accent);
                    opacity: 0.6;
                }

                .s1 { top: -10px; right: -20px; color: #FFD700; }
                .s2 { bottom: 10px; left: -25px; color: #3b82f6; }
                .s3 { top: 20px; left: -30px; color: #ef4444; }

                .success-content h1 {
                    font-size: 32px;
                    margin-bottom: 12px;
                    background: linear-gradient(to right, #fff, #3fb950);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .subtitle {
                    color: var(--text-secondary);
                    font-size: 16px;
                    margin-bottom: 40px;
                }

                .created-package-card {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    padding: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 40px;
                    text-align: left;
                    backdrop-filter: blur(10px);
                }

                .status-badge {
                    display: inline-block;
                    padding: 2px 8px;
                    background: rgba(102, 126, 234, 0.2);
                    color: #667eea;
                    border-radius: 4px;
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                    margin-bottom: 8px;
                }

                .draft-name {
                    font-size: 18px;
                    margin: 0 0 4px 0;
                    color: white;
                }

                .package-meta-mini {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: var(--text-secondary);
                    font-size: 13px;
                }

                .view-package-btn {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 12px 20px;
                    background: #667eea;
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .view-package-btn:hover {
                    background: #5a67d8;
                    transform: translateX(3px);
                }

                .success-actions {
                    display: grid;
                    gap: 12px;
                }

                .action-card {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 16px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    width: 100%;
                    text-align: left;
                    cursor: Pointer;
                    transition: all 0.2s;
                    color: white;
                }

                .action-card:hover {
                    background: rgba(255, 255, 255, 0.07);
                    border-color: rgba(255, 255, 255, 0.1);
                    transform: scale(1.01);
                }

                .icon-box {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .icon-box.blue { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
                .icon-box.green { background: rgba(63, 185, 80, 0.15); color: #3fb950; }
                .icon-box.purple { background: rgba(168, 85, 247, 0.15); color: #a855f7; }

                .action-text {
                    flex: 1;
                }

                .action-text h3 {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 600;
                }

                .action-text p {
                    margin: 2px 0 0 0;
                    font-size: 13px;
                    color: var(--text-secondary);
                }
            `}</style>
        </div>
    );
};

export default PackageCreated;
