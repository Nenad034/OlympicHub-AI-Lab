import React, { useState } from 'react';
import { Plane, Search as SearchIcon } from 'lucide-react';
import { getKyteApi } from '../services/flight/providers/kyte/kyteApiService';
import UnifiedAPITest from '../components/UnifiedAPITest';
import type { TestResult, APITestConfig } from '../components/UnifiedAPITest';

const KyteTest: React.FC = () => {
    const [authToken, setAuthToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [testResults, setTestResults] = useState<TestResult[]>([]);
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');

    const config: APITestConfig = {
        name: 'Kyte Flight API',
        provider: 'Kyte (GoKyte)',
        description: 'Modern NDC flight distribution API - REST/JSON',
        icon: <Plane size={32} />,
        color: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        baseUrl: 'https://api.sandbox.gokyte.com',
        environment: 'Sandbox',
        credentials: {
            username: 'x-api-key',
            password: '••••••••'
        }
    };

    const updateTestResult = (id: string, test: string, status: 'success' | 'error' | 'pending', message: string) => {
        setTestResults(prev => {
            const exists = prev.find(r => r.id === id);
            if (exists) {
                return prev.map(r => r.id === id ? { ...r, status, message, timestamp: new Date().toLocaleTimeString() } : r);
            }
            return [{
                id,
                test,
                status,
                message,
                timestamp: new Date().toLocaleTimeString()
            }, ...prev];
        });
    };

    const handleConnect = async () => {
        const testId = 'connect-' + Date.now();
        setConnectionStatus('connecting');
        setIsLoading(true);
        updateTestResult(testId, 'Check Configuration', 'pending', 'Checking Kyte API configuration...');

        try {
            const api = getKyteApi();
            if (api) {
                setConnectionStatus('connected');
                setAuthToken('API_KEY_PRESENT');
                updateTestResult(testId, 'Check Configuration', 'success', 'Kyte API Service initialized successfully.');
            }
        } catch (error) {
            setConnectionStatus('disconnected');
            updateTestResult(testId, 'Check Configuration', 'error', error instanceof Error ? error.message : 'Missing VITE_KYTE_API_KEY');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDisconnect = () => {
        setAuthToken(null);
        setConnectionStatus('disconnected');
        updateTestResult('disconnect-' + Date.now(), 'Disconnect', 'success', 'Connection cleared locally');
    };

    const handleSearchTest = async () => {
        const testId = 'search-' + Date.now();
        setIsLoading(true);
        updateTestResult(testId, 'SearchFlights', 'pending', 'Searching flights (LHR to JFK)...');

        try {
            const api = getKyteApi();
            const results = await api.searchFlights({
                origin: 'LHR',
                destination: 'JFK',
                departureDate: '2025-10-20',
                adults: 1,
                children: 0,
                childrenAges: [],
                currency: 'EUR'
            });

            if (results && results.length > 0) {
                updateTestResult(testId, 'SearchFlights', 'success', `Found ${results.length} offers. Best price: ${results[0].price.total} ${results[0].price.currency}`);
            } else {
                updateTestResult(testId, 'SearchFlights', 'success', 'Search returned successfully but found 0 offers (Check dates).');
            }
        } catch (error) {
            updateTestResult(testId, 'SearchFlights', 'error', error instanceof Error ? error.message : 'Search failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <UnifiedAPITest
            config={config}
            connectionStatus={connectionStatus}
            authToken={authToken}
            testResults={testResults}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
        >
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                    className="action-btn primary"
                    onClick={handleSearchTest}
                    disabled={isLoading || connectionStatus !== 'connected'}
                >
                    <SearchIcon size={18} />
                    Test Search (LHR ➔ JFK)
                </button>
            </div>
        </UnifiedAPITest>
    );
};

export default KyteTest;
