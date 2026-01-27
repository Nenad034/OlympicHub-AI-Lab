import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, User, Cpu, Code, Zap, Shield, Moon, Sun, Coffee, Sparkles } from 'lucide-react';
import { useAuthStore, useThemeStore } from '../stores';

const CircuitBackground = ({ theme }: { theme: 'circuit' | 'code' | 'minimal' }) => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Base Moving Mesh */}
            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, 0],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 opacity-10"
                style={{
                    background: 'radial-gradient(circle at 50% 50%, var(--accent) 0%, transparent 70%)',
                    filter: 'blur(100px)'
                }}
            />

            {theme === 'circuit' && (
                <div className="absolute inset-0 opacity-20">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="circuit-pattern" width="100" height="100" patternUnits="userSpaceOnUse">
                                <path d="M 10 10 L 90 10 L 90 90 L 10 90 Z" fill="none" stroke="var(--accent)" strokeWidth="0.5" />
                                <circle cx="10" cy="10" r="2" fill="var(--accent)" />
                                <circle cx="90" cy="10" r="2" fill="var(--accent)" />
                                <path d="M 50 10 L 50 30 M 10 50 L 30 50" stroke="var(--accent)" strokeWidth="0.5" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#circuit-pattern)" />

                        {/* Moving Pulses */}
                        {Array.from({ length: 15 }).map((_, i) => (
                            <motion.circle
                                key={i}
                                r="2"
                                fill="var(--accent)"
                                initial={{ cx: Math.random() * 1000, cy: Math.random() * 1000, opacity: 0 }}
                                animate={{
                                    cx: [null, Math.random() * 1000],
                                    cy: [null, Math.random() * 1000],
                                    opacity: [0, 1, 0]
                                }}
                                transition={{
                                    duration: 5 + Math.random() * 10,
                                    repeat: Infinity,
                                    delay: Math.random() * 5
                                }}
                            />
                        ))}
                    </svg>
                </div>
            )}

            {theme === 'code' && (
                <div className="absolute inset-0 opacity-30 select-none overflow-hidden">
                    <motion.div
                        animate={{ y: [0, -1000] }}
                        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                        className="p-10 font-mono text-[11px] leading-relaxed"
                    >
                        {Array.from({ length: 100 }).map((_, i) => (
                            <div key={i} className="mb-1">
                                <span style={{ color: '#569cd6' }}>const</span> <span style={{ color: '#4fc1ff' }}>route_{i}</span> = {'{'}
                                <div className="pl-4">
                                    <span style={{ color: '#9cdcfe' }}>path:</span> <span style={{ color: '#ce9178' }}>"/system/node_{i}"</span>,
                                    <br />
                                    <span style={{ color: '#9cdcfe' }}>element:</span> <span style={{ color: '#4ec9b0' }}>{'<MainLayout />'}</span>,
                                    <br />
                                    <span style={{ color: '#9cdcfe' }}>status:</span> <span style={{ color: '#b5cea8' }}>200</span>,
                                    <br />
                                    <span style={{ color: '#9cdcfe' }}>protected:</span> <span style={{ color: '#569cd6' }}>true</span>
                                </div>
                                {'}'};
                            </div>
                        ))}
                    </motion.div>
                </div>
            )}

            {/* Floating Particles for all themes */}
            <div className="absolute inset-0">
                {Array.from({ length: 20 }).map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-accent rounded-full opacity-20"
                        animate={{
                            x: [Math.random() * window.innerWidth, Math.random() * window.innerWidth],
                            y: [Math.random() * window.innerHeight, Math.random() * window.innerHeight],
                            scale: [0, 1.5, 0],
                        }}
                        transition={{
                            duration: 10 + Math.random() * 20,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [bgTheme, setBgTheme] = useState<'circuit' | 'code' | 'minimal'>('circuit');

    // Theme store integration
    const { theme, isPrism, cycleTheme, togglePrism } = useThemeStore();

    const login = useAuthStore(state => state.login);
    const navigate = useNavigate();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        const success = login(username, password);
        if (success) {
            navigate('/');
        } else {
            setError('Pogrešni akreditivi. Pokušajte ponovo.');
        }
    };

    // Determine theme class for the wrapper
    const themeClass = theme === 'light' ? 'light-theme' :
        theme === 'navy' ? 'navy-theme' :
            theme === 'tokyo-light' ? 'tokyo-light-theme' : '';

    const getThemeIcon = () => {
        switch (theme) {
            case 'navy': return <Zap size={16} color="#38bdf8" />;
            case 'light': return <Sun size={16} />;
            case 'tokyo-light': return <Moon size={16} color="#3d59a1" />;
            default: return <Moon size={16} />;
        }
    };

    return (
        <div className={`login-page ${themeClass} ${isPrism ? 'prism-mode' : ''}`}>
            <CircuitBackground theme={bgTheme} />

            <div className="theme-switcher">
                {/* Background Pattern Switchers */}
                <div className="switcher-group">
                    <button onClick={() => setBgTheme('circuit')} className={bgTheme === 'circuit' ? 'active' : ''} title="Circuit"><Cpu size={16} /></button>
                    <button onClick={() => setBgTheme('code')} className={bgTheme === 'code' ? 'active' : ''} title="Code"><Code size={16} /></button>
                    <button onClick={() => setBgTheme('minimal')} className={bgTheme === 'minimal' ? 'active' : ''} title="Minimal"><Zap size={16} /></button>
                </div>

                <div className="divider"></div>

                {/* System Theme Switchers */}
                <div className="switcher-group">
                    <button onClick={cycleTheme} title={`Theme: ${theme}`}>
                        {getThemeIcon()}
                    </button>
                    <button onClick={togglePrism} className={isPrism ? 'active-prism' : ''} title="Prism Mode">
                        <Sparkles size={16} color={isPrism ? '#bb9af7' : 'currentColor'} />
                    </button>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", damping: 20 }}
                className="login-card"
            >
                <div className="login-header">
                    <div className="logo-box">
                        <img
                            src="/logo.jpg"
                            alt="Olympic Eagle Logo"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                borderRadius: '12px',
                                filter: isPrism ? 'drop-shadow(0 0 8px var(--accent))' : 'none'
                            }}
                        />
                    </div>
                    <h2 className="brand-title">OlympicHub <span>034</span></h2>
                    <p className="subtitle">Advanced Management System</p>
                </div>

                <form onSubmit={handleLogin} className="login-form">
                    <div className="input-group">
                        <label><User size={14} /> Korisničko Ime</label>
                        <input
                            type="text"
                            placeholder="Vaše ime"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label><Lock size={14} /> Lozinka</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, scale: 0.95 }}
                                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                                exit={{ opacity: 0, height: 0, scale: 0.95 }}
                                className="login-error"
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button type="submit" className="login-submit">
                        Pristupi Sistemu <Shield size={18} />
                    </button>

                    <div className="login-footer">
                        <span>v2.4.0 Authorized Access Only</span>
                    </div>
                </form>
            </motion.div>

            <style>{`
                .login-page {
                    height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--bg-dark, #050608);
                    color: var(--text-primary, white);
                    position: relative;
                    font-family: 'Inter', sans-serif;
                    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                    overflow: hidden;
                }
                .theme-switcher {
                    position: absolute;
                    top: 24px;
                    right: 24px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: var(--bg-card, rgba(23, 28, 36, 0.8));
                    padding: 6px;
                    border-radius: 18px;
                    border: 1px solid var(--border, rgba(255,255,255,0.1));
                    z-index: 100;
                    backdrop-filter: blur(15px);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                }
                .switcher-group {
                    display: flex;
                    gap: 4px;
                }
                .divider {
                    width: 1px;
                    height: 20px;
                    background: var(--border);
                    opacity: 0.5;
                }
                .theme-switcher button {
                    width: 38px;
                    height: 38px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: transparent;
                    border: none;
                    color: var(--text-secondary, rgba(255,255,255,0.5));
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .theme-switcher button:hover {
                    color: var(--text-primary, white);
                    background: var(--glass-bg, rgba(255,255,255,0.1));
                    transform: translateY(-2px);
                }
                .theme-switcher button.active {
                    color: var(--accent, #3fb950);
                    background: var(--accent-glow, rgba(63, 185, 80, 0.1));
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                }
                .theme-switcher button.active-prism {
                    background: rgba(187, 154, 247, 0.15);
                    color: #bb9af7;
                    box-shadow: 0 0 15px rgba(187, 154, 247, 0.3);
                }
                .login-card {
                    width: 420px;
                    background: var(--bg-card, rgba(13, 17, 23, 0.85));
                    backdrop-filter: blur(40px);
                    border: 1px solid var(--border, rgba(255,255,255,0.1));
                    border-radius: 32px;
                    padding: 48px;
                    box-shadow: 0 40px 100px -20px rgba(0,0,0,0.6);
                    z-index: 10;
                    position: relative;
                }
                .login-card::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border-radius: 32px;
                    padding: 1px;
                    background: linear-gradient(135deg, var(--border), transparent, var(--border));
                    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor;
                    mask-composite: exclude;
                    pointer-events: none;
                }
                .login-header {
                    text-align: center;
                    margin-bottom: 32px;
                }
                .logo-box {
                    width: 80px;
                    height: 80px;
                    background: var(--accent-glow, rgba(63, 185, 80, 0.1));
                    padding: 2px;
                    border-radius: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 20px;
                    transition: transform 0.3s ease;
                }
                .logo-box:hover {
                    transform: scale(1.05) rotate(2deg);
                }
                .brand-title {
                    font-size: 28px;
                    font-weight: 800;
                    margin-bottom: 4px;
                    letter-spacing: -0.5px;
                }
                .brand-title span {
                    color: var(--accent, #3fb950);
                    text-shadow: 0 0 20px var(--accent-glow);
                }
                .subtitle {
                    color: var(--text-secondary, rgba(255,255,255,0.4));
                    font-size: 14px;
                    font-weight: 500;
                }
                .input-group {
                    margin-bottom: 24px;
                }
                .input-group label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--text-secondary, rgba(255,255,255,0.5));
                    margin-bottom: 8px;
                    transition: color 0.3s ease;
                }
                .input-group:focus-within label {
                    color: var(--accent);
                }
                .input-group input {
                    width: 100%;
                    height: 52px;
                    background: var(--glass-bg, rgba(0,0,0,0.2));
                    border: 1px solid var(--border, rgba(255,255,255,0.1));
                    border-radius: 14px;
                    padding: 0 18px;
                    color: var(--text-primary, white);
                    font-size: 15px;
                    outline: none;
                    transition: all 0.3s ease;
                }
                .input-group input:focus {
                    border-color: var(--accent, #3fb950);
                    background: var(--accent-glow);
                    box-shadow: 0 0 20px rgba(63, 185, 80, 0.1);
                }
                .login-submit {
                    width: 100%;
                    height: 56px;
                    background: var(--accent, #3fb950);
                    color: white;
                    border: none;
                    border-radius: 16px;
                    font-weight: 700;
                    font-size: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    margin-top: 32px;
                    box-shadow: 0 8px 16px -4px var(--accent-glow);
                }
                .login-submit:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 15px 30px -5px var(--accent-glow);
                    filter: brightness(1.1);
                }
                .login-submit:active {
                    transform: translateY(0);
                }
                .login-error {
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    color: #ef4444;
                    padding: 14px;
                    border-radius: 12px;
                    font-size: 13px;
                    text-align: center;
                    margin-bottom: 16px;
                }
                .login-footer {
                    text-align: center;
                    margin-top: 28px;
                    font-size: 11px;
                    color: var(--text-secondary);
                    opacity: 0.6;
                    letter-spacing: 1.5px;
                    text-transform: uppercase;
                }
                
                /* Prism Mode Overrides for Login */
                .prism-mode .brand-title {
                    background: linear-gradient(to right, #3b82f6, #a855f7);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .prism-mode .brand-title span {
                    background: none;
                    color: #ec4899;
                    -webkit-text-fill-color: initial;
                }
                .prism-mode .subtitle {
                    color: #10b981 !important;
                }
                .prism-mode .login-submit {
                    background: linear-gradient(135deg, #3b82f6, #a855f7) !important;
                    box-shadow: 0 8px 16px -4px rgba(59, 130, 246, 0.4) !important;
                }

                @keyframes pulse {
                    0% { transform: scale(1); opacity: 0.5; }
                    50% { transform: scale(1.1); opacity: 1; }
                    100% { transform: scale(1); opacity: 0.5; }
                }

                /* Mobile Optimization */
                @media (max-width: 480px) {
                    .login-card {
                        width: 90%;
                        padding: 32px;
                    }
                    .theme-switcher {
                        top: 12px;
                        right: 12px;
                    }
                }
            `}</style>
        </div>
    );
};

export default Login;
