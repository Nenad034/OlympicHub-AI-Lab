import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';

// Router
import { AppRouter } from './router';

// Stores
import { useThemeStore, useAppStore } from './stores';

// Components
import GeneralAIChat from './components/GeneralAIChat';
import { GeometricBrain } from './components/icons/GeometricBrain';
// ToastProvider removed here (provided in main.tsx)
import SentinelPopup from './components/common/SentinelPopup';

// Context
import { useConfig } from './context/ConfigContext';
import { startNetworkMonitoring } from './utils/networkHealth';

const App: React.FC = () => {
  const { theme, isPrism, lang } = useThemeStore();
  const { isChatOpen, setChatOpen } = useAppStore();
  const getThemeLabel = () => {
    return theme === 'navy' ? 'Dark' : 'Light';
  };
  const { isLoading } = useConfig();

  // Apply theme and layout classes to body
  useEffect(() => {
    // Refresh session on mount to ensure production stability
    import('./supabaseClient').then(({ supabase }) => {
      supabase.auth.refreshSession();
    });

    // Start Sentinel Network Monitoring
    startNetworkMonitoring();

    let themeClass = theme === 'light' ? 'light-theme' : 'navy-theme';

    if (isPrism) {
      themeClass += ' prism-mode';
    }

    // HARD OVERRIDE: Uvek koristi layout-classic
    document.body.className = `${themeClass.trim()} layout-classic`;
  }, [theme, isPrism]);

  // Loading state
  const loadingContent = (
    <div style={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#1a1a2e', // CHANGED TO DARK BLUE TO IDENTIFY IF THIS IS RENDERING
      color: '#3fb950',
      fontFamily: 'sans-serif'
    }}>
      <div className="spinner-simple" style={{
        width: '40px',
        height: '40px',
        border: '3px solid rgba(63, 185, 80, 0.3)',
        borderTop: '3px solid #3fb950',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '20px'
      }} />
      <div style={{ fontSize: '14px', letterSpacing: '2px', color: 'white' }}>OLYMPIC HUB LOADING...</div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  return (
    <>
      {isLoading ? loadingContent : (
        <>
          {/* Main App Router */}
          <AppRouter />

          {/* Persistent AI Assistant - Outside Main Scroll */}
          <AnimatePresence>
            {!isChatOpen && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.1, translateY: -5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setChatOpen(true)}
                style={{
                  position: 'fixed',
                  bottom: '32px',
                  right: '32px',
                  width: '64px',
                  height: '64px',
                  borderRadius: '22px',
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 12px 36px rgba(37, 99, 235, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 9999,
                  backdropFilter: 'blur(10px)'
                }}
              >
                <GeometricBrain size={34} color="#FFD700" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* AI Chat Component */}
          <GeneralAIChat
            isOpen={isChatOpen}
            onOpen={() => setChatOpen(true)}
            onClose={() => setChatOpen(false)}
            lang={lang}
            userLevel={6}
            context="Dashboard"
            analysisData={[]}
          />

          {/* Real-time Sentinel Alerts */}
          <SentinelPopup />
        </>
      )}
    </>
  );
};

export default App;
