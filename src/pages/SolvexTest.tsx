import React, { useState } from 'react';
import { Database, Book, Search as SearchIcon } from 'lucide-react';
import * as SolvexAuth from '../services/solvex/solvexAuthService';
import * as SolvexDict from '../services/solvex/solvexDictionaryService';
import * as SolvexSearch from '../services/solvex/solvexSearchService';
import UnifiedAPITest from '../components/UnifiedAPITest';
import type { TestResult, APITestConfig } from '../components/UnifiedAPITest';

const SolvexTest: React.FC = () => {
    const [authToken, setAuthToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [testResults, setTestResults] = useState<TestResult[]>([]);
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');

    const config: APITestConfig = {
        name: 'Solvex (Master-Interlook)',
        provider: 'B&A e-Travel SA',
        description: 'Bulgarian hotel inventory - Ski resorts, beach destinations, city hotels',
        icon: <Database size={32} />,
        color: 'linear-gradient(135deg, #e91e63 0%, #c2185b 100%)',
        baseUrl: '/api/solvex/iservice/integrationservice.asmx',
        environment: 'Evaluation',
        credentials: {
            username: 'sol611s',
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
        updateTestResult(testId, 'Connect', 'pending', 'Connecting to Solvex API...');

        try {
            const response = await SolvexAuth.connect();
            if (response.success && response.data) {
                setAuthToken(response.data);
                setConnectionStatus('connected');
                updateTestResult(testId, 'Connect', 'success', `Token obtained: ${response.data.substring(0, 20)}...`);
            } else {
                setConnectionStatus('disconnected');
                updateTestResult(testId, 'Connect', 'error', response.error || 'Failed to connect');
            }
        } catch (error) {
            setConnectionStatus('disconnected');
            updateTestResult(testId, 'Connect', 'error', error instanceof Error ? error.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDisconnect = () => {
        SolvexAuth.clearToken();
        setAuthToken(null);
        setConnectionStatus('disconnected');
        updateTestResult('disconnect-' + Date.now(), 'Disconnect', 'success', 'Token cleared');
    };

    const handleRefreshToken = async () => {
        const testId = 'refresh-' + Date.now();
        setIsLoading(true);
        updateTestResult(testId, 'RefreshToken', 'pending', 'Refreshing token...');

        try {
            const response = await SolvexAuth.refreshToken();
            if (response.success && response.data) {
                setAuthToken(response.data);
                updateTestResult(testId, 'RefreshToken', 'success', `New token: ${response.data.substring(0, 20)}...`);
            } else {
                updateTestResult(testId, 'RefreshToken', 'error', response.error || 'Refresh failed');
            }
        } catch (error) {
            updateTestResult(testId, 'RefreshToken', 'error', error instanceof Error ? error.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGetCities = async () => {
        const testId = 'cities-' + Date.now();
        setIsLoading(true);
        updateTestResult(testId, 'GetCities', 'pending', 'Fetching cities for Bulgaria...');

        try {
            const response = await SolvexDict.getCities(4);
            if (response.success && response.data) {
                const bansko = response.data.find((c: any) => c.name.toLowerCase().includes('bansko'));
                const sunny = response.data.find((c: any) => c.name.toLowerCase().includes('sunny'));
                const debugInfo = `Found ${response.data.length} cities. | Bansko: ${bansko?.id} | Sunny Beach: ${sunny?.id}`;
                updateTestResult(testId, 'GetCities', 'success', debugInfo);
            } else {
                updateTestResult(testId, 'GetCities', 'error', response.error || 'Fetch failed');
            }
        } catch (error) {
            updateTestResult(testId, 'GetCities', 'error', error instanceof Error ? error.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearchTest = async () => {
        const testId = 'search-' + Date.now();
        setIsLoading(true);
        updateTestResult(testId, 'SearchHotels', 'pending', 'Searching hotels (Bansko, Feb 2026)...');

        try {
            const response = await SolvexSearch.searchHotels({
                dateFrom: '2026-02-15',
                dateTo: '2026-02-22',
                adults: 2,
                cityId: 9
            });

            if (response.success && response.data) {
                updateTestResult(testId, 'SearchHotels', 'success', `Found ${response.data.length} hotels. First: ${response.data[0]?.hotel?.name || 'N/A'}`);
            } else {
                updateTestResult(testId, 'SearchHotels', 'error', response.error || 'Search failed');
            }
        } catch (error) {
            updateTestResult(testId, 'SearchHotels', 'error', error instanceof Error ? error.message : 'Unknown error');
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
            onRefreshToken={handleRefreshToken}
        >
            {/* Custom Test Buttons */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                    className="action-btn primary"
                    onClick={handleGetCities}
                    disabled={isLoading}
                >
                    <Book size={18} />
                    Get Cities (Bulgaria)
                </button>
                <button
                    className="action-btn primary"
                    onClick={handleSearchTest}
                    disabled={isLoading}
                >
                    <SearchIcon size={18} />
                    Test Search (Bansko)
                </button>
            </div>
        </UnifiedAPITest>
    );
};

export default SolvexTest;
