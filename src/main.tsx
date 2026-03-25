import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './classic_index.css'
import './modern_index.css'
import 'leaflet/dist/leaflet.css'
import App from './App.tsx'
import { ConfigProvider } from './context/ConfigContext'
import ErrorBoundary from './components/ErrorBoundary'
import { ToastProvider } from './components/ui/Toast'
import { initializeAmadeus } from './integrations/amadeus/api/amadeusInit'

// Global Error Handler for "Black Screen" debugging
window.onerror = function (message, source, lineno, colno, error) {
  const errorContainer = document.getElementById('root') || document.body;
  errorContainer.innerHTML = `
    <div style="background: #1a0000; color: #ff3333; padding: 20px; font-family: monospace; height: 100vh;">
      <h1>CRITICAL SYSTEM FAIL</h1>
      <h2>Global Runtime Error</h2>
      <p style="color: white; font-size: 14px;">${message}</p>
      <p style="color: #999;">Source: ${source}:${lineno}:${colno}</p>
      <pre style="background: rgba(0,0,0,0.5); padding: 10px; border: 1px solid #333;">${error?.stack || 'No stack trace'}</pre>
    </div>
  `;
  return false;
};

window.addEventListener('unhandledrejection', function (event) {
  const errorContainer = document.getElementById('root') || document.body;
  errorContainer.innerHTML += `
    <div style="background: #1a0000; color: #ff9933; padding: 20px; font-family: monospace; margin-top: 10px;">
      <h2>Unhandled Promise Rejection</h2>
      <p style="color: white; font-size: 14px;">${event.reason?.message || event.reason}</p>
      <pre style="background: rgba(0,0,0,0.5); padding: 10px; border: 1px solid #333;">${event.reason?.stack || 'No stack trace'}</pre>
    </div>
  `;
});

// Increase cleanup limit to 10MB (2000+ hotels easily exceed 1MB)
try {
  const hotelCache = localStorage.getItem('olympic_hub_hotels');
  if (hotelCache && hotelCache.length > 10000000) { // Increased to 10MB
    console.warn("🛡️ Emergency cleanup: Local hotel cache exceeds 10MB, clearing to maintain performance...");
    localStorage.removeItem('olympic_hub_hotels');
  }
} catch (e) {
  console.error("Cleanup error:", e);
}

console.log("🚀 Booting ClickToTravel Hub...");

// Boot services in parallel for speed
const bootServices = async () => {
  try {
    // Start non-dependent initializations together
    const bootResults = await Promise.allSettled([
      initializeAmadeus(), // Amadeus init
      // We could add more global service inits here as they grow
    ]);
    
    bootResults.forEach((result, idx) => {
      if (result.status === 'rejected') {
        console.error(`❌ Service[${idx}] failed to boot:`, result.reason);
      }
    });

    const rootElement = document.getElementById('root');
    if (!rootElement) {
      throw new Error("Root element 'root' not found in document.");
    }

    createRoot(rootElement).render(
      <StrictMode>
        <ErrorBoundary>
          <ConfigProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </ConfigProvider>
        </ErrorBoundary>
      </StrictMode>,
    );
    console.log("✅ React Root rendered");
  } catch (e: any) {
    console.error("❌ BOOT STRAP ERROR:", e);
    document.body.innerHTML = `
      <div style="background: #1a0000; color: #ff3333; padding: 20px; font-family: monospace; height: 100vh;">
        <h1>BOOTSTRAP FATAL ERROR</h1>
        <p>${e.message}</p>
        <pre>${e.stack}</pre>
      </div>
    `;
  }
};

bootServices();

