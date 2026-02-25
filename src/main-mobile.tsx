import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css' // Base styles
import './mobile.css' // Mobile-only overrides
import AppMobile from './AppMobile.tsx'
import { ConfigProvider } from './context/ConfigContext'
import ErrorBoundary from './components/ErrorBoundary'
import { ToastProvider } from './components/ui/Toast'

console.log("📱 Booting ClickToTravel MOBILE Suite...");

try {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
        throw new Error("Root element 'root' not found in document.");
    }

    createRoot(rootElement).render(
        <StrictMode>
            <ErrorBoundary>
                <ConfigProvider>
                    <ToastProvider>
                        <AppMobile />
                    </ToastProvider>
                </ConfigProvider>
            </ErrorBoundary>
        </StrictMode>,
    )
} catch (e: any) {
    console.error("❌ MOBILE BOOT STRAP ERROR:", e);
}
