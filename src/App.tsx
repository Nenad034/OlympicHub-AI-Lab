import React, { useEffect } from 'react';
import { Zap } from 'lucide-react';

// Router
import { AppRouter } from './router';

// Stores
import { useThemeStore, useAppStore } from './stores';

// Components
// ToastProvider removed here (provided in main.tsx)
import SentinelPopup from './components/common/SentinelPopup';
import { SolvexNotificationHub } from './components/SolvexNotificationHub';
import { SolvexSyncWorker } from './components/SolvexSyncWorker';

// Context
import { useConfig } from './context/ConfigContext';
import { startNetworkMonitoring } from './utils/networkHealth';

// Activity Tracker Test Data (Development only)
if (import.meta.env.DEV) {
  import('./utils/generateTestActivityData').catch(() => {
    console.log('📝 Activity test data generator not available');
  });
}

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
      <div style={{ fontSize: '14px', letterSpacing: '2px', color: 'white' }}>CLICKTOTRAVEL HUB...</div>
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


          {/* Real-time Sentinel Alerts */}
          <SentinelPopup />

          {/* Solvex Status Sync & Notifications */}
          <SolvexSyncWorker />
          <SolvexNotificationHub />
        </>
      )}
    </>
  );
};

export default App;
