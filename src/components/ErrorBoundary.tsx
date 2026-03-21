import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallbackMessage?: string;
    onReset?: () => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error in component:', error, errorInfo);
    }

    public handleReset = () => {
        this.setState({ hasError: false, error: null });
        if (this.props.onReset) {
            this.props.onReset();
        }
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '2rem',
                    background: 'rgba(255, 0, 0, 0.05)',
                    border: '1px solid rgba(255, 0, 0, 0.2)',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1rem',
                    textAlign: 'center',
                    margin: '1rem 0'
                }}>
                    <AlertTriangle size={32} color="#f44336" />
                    <h3 style={{ margin: 0, color: '#f44336' }}>Došlo je do greške u ovom delu UI-ja</h3>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        {this.props.fallbackMessage || 'Kompajliranje komponente nije uspelo. Ne brinite, ostatak aplikacije radi.'}
                    </p>
                    <button
                        onClick={this.handleReset}
                        style={{
                            marginTop: '10px',
                            background: 'white',
                            color: '#f44336',
                            border: '1px solid #f44336',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontWeight: 'bold',
                            fontSize: '0.85rem'
                        }}
                    >
                        <RefreshCw size={14} /> Pokušaj ponovo
                    </button>
                    {import.meta.env.DEV && this.state.error && (
                        <pre style={{
                            marginTop: '1rem',
                            padding: '1rem',
                            background: 'rgba(0,0,0,0.8)',
                            color: '#ffcccb',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            textAlign: 'left',
                            maxWidth: '100%',
                            overflowX: 'auto'
                        }}>
                            {this.state.error.toString()}
                        </pre>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
