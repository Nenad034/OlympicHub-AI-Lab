import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

// Check if in development mode
const isDevelopment = import.meta.env.DEV;

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component to catch and handle React errors gracefully
 * Prevents the entire app from crashing when a component throws an error
 */
class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({ errorInfo });

        // Log to external service in production
        // logErrorToService(error, errorInfo);
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    private handleGoHome = () => {
        window.location.href = '/';
    };

    public render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '50vh',
                    padding: '40px',
                    textAlign: 'center',
                    background: 'var(--bg-main)',
                    color: 'var(--text-primary)'
                }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '20px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '24px'
                    }}>
                        <AlertTriangle size={40} color="#ef4444" />
                    </div>

                    <h2 style={{
                        fontSize: '24px',
                        fontWeight: '700',
                        marginBottom: '12px',
                        color: 'var(--text-primary)'
                    }}>
                        Došlo je do greške
                    </h2>

                    <p style={{
                        color: 'var(--text-secondary)',
                        marginBottom: '24px',
                        maxWidth: '400px',
                        lineHeight: '1.6'
                    }}>
                        Nešto je pošlo naopako. Tim ima uvid u grešku i radimo na rešenju.
                    </p>

                    {/* Error details (only in development) */}
                    {isDevelopment && this.state.error && (
                        <details style={{
                            marginBottom: '24px',
                            padding: '16px',
                            background: 'var(--bg-card)',
                            borderRadius: '12px',
                            border: '1px solid var(--border)',
                            textAlign: 'left',
                            maxWidth: '600px',
                            width: '100%'
                        }}>
                            <summary style={{
                                cursor: 'pointer',
                                fontWeight: '600',
                                marginBottom: '12px'
                            }}>
                                Tehnički detalji
                            </summary>
                            <pre style={{
                                fontSize: '12px',
                                overflow: 'auto',
                                padding: '12px',
                                background: 'rgba(0,0,0,0.2)',
                                borderRadius: '8px',
                                color: '#ef4444'
                            }}>
                                {this.state.error.toString()}
                                {this.state.errorInfo?.componentStack}
                            </pre>
                        </details>
                    )}

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={this.handleRetry}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 24px',
                                borderRadius: '12px',
                                border: 'none',
                                background: 'var(--accent)',
                                color: '#fff',
                                fontWeight: '600',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            <RefreshCw size={18} /> Pokušaj ponovo
                        </button>
                        <button
                            onClick={this.handleGoHome}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 24px',
                                borderRadius: '12px',
                                border: '1px solid var(--border)',
                                background: 'var(--bg-card)',
                                color: 'var(--text-primary)',
                                fontWeight: '600',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            <Home size={18} /> Idi na početnu
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
