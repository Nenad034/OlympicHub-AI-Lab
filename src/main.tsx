import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './classic_index.css'
import App from './App.tsx'
import { ConfigProvider } from './context/ConfigContext'
import ErrorBoundary from './components/ErrorBoundary'
import { ToastProvider } from './components/ui/Toast'
import { initializeAmadeus } from './services/flight/amadeusInit'

// Initialize Amadeus on app startup
initializeAmadeus();


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ConfigProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </ConfigProvider>
    </ErrorBoundary>
  </StrictMode>,
)

