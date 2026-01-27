import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, XCircle, Loader2, Key, Database, Book, Search as SearchIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as SolvexAuth from '../services/solvex/solvexAuthService';
import * as SolvexDict from '../services/solvex/solvexDictionaryService';
import * as SolvexSearch from '../services/solvex/solvexSearchService';
import RateLimitMonitor from '../components/RateLimitMonitor';
import './SolvexTest.css';

interface TestResult {
    id: string;
    test: string;
    status: 'success' | 'error' | 'pending';
    message: string;
    timestamp: string;
}

const SolvexTest: React.FC = () => {
    const navigate = useNavigate();

    const [authToken, setAuthToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [testResults, setTestResults] = useState<TestResult[]>([]);
    const [countries, setCountries] = useState<any[]>([]);

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
        setIsLoading(true);
        updateTestResult(testId, 'Connect', 'pending', 'Connecting to Solvex API...');

        try {
            const response = await SolvexAuth.connect();
            if (response.success && response.data) {
                setAuthToken(response.data);
                updateTestResult(testId, 'Connect', 'success', `Token obtained: ${response.data.substring(0, 20)}...`);
            } else {
                updateTestResult(testId, 'Connect', 'error', response.error || 'Failed to connect');
            }
        } catch (error) {
            updateTestResult(testId, 'Connect', 'error', error instanceof Error ? error.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGetCountries = async () => {
        const testId = 'countries-' + Date.now();
        setIsLoading(true);
        updateTestResult(testId, 'GetCountries', 'pending', 'Fetching countries...');

        try {
            const response = await SolvexDict.getCountries();
            if (response.success && response.data) {
                setCountries(response.data);
                updateTestResult(testId, 'GetCountries', 'success', `Found ${response.data.length} countries. First: ${response.data[0]?.name}`);
            } else {
                updateTestResult(testId, 'GetCountries', 'error', response.error || 'Fetch failed');
            }
        } catch (error) {
            updateTestResult(testId, 'GetCountries', 'error', error instanceof Error ? error.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGetCities = async () => {
        const testId = 'cities-' + Date.now();
        setIsLoading(true);
        updateTestResult(testId, 'GetCities', 'pending', 'Fetching cities for Bulgaria (ID: 4)...');

        try {
            const response = await SolvexDict.getCities(4);
            if (response.success && response.data) {
                const bansko = response.data.find((c: any) => c.name.toLowerCase().includes('bansko'));
                const borovets = response.data.find((c: any) => c.name.toLowerCase().includes('borovets'));
                const sunny = response.data.find((c: any) => c.name.toLowerCase().includes('sunny'));
                const golden = response.data.find((c: any) => c.name.toLowerCase().includes('golden'));

                const debugInfo = `
                | Bansko: ${bansko?.id}
                | Borovets: ${borovets?.id}
                | Sunny Beach: ${sunny?.id}
                | Golden Sands: ${golden?.id}`;

                updateTestResult(testId, 'GetCities', 'success', `Found ${response.data.length} cities. ${debugInfo}`);
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
        updateTestResult(testId, 'SearchHotels', 'pending', 'Searching for hotels (Raw XML Test - Bansko Feb 2026)...');

        if (!authToken) {
            updateTestResult(testId, 'SearchHotels', 'error', 'Error: No token. Click CONNECT first.');
            setIsLoading(false);
            return;
        }

        try {
            // RAW REQUEST FOR DEBUGGING (Bypassing default builder)
            const rawXml = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <SearchHotelServices xmlns="http://www.megatec.ru/">
      <guid>${authToken}</guid>
      <request>
        <PageSize>1000</PageSize>
        <RowIndexFrom>0</RowIndexFrom>
        <DateFrom>2026-02-15</DateFrom>
        <DateTo>2026-02-22</DateTo>
        <CityKeys><int>9</int></CityKeys>
        <Pax>2</Pax>
        <Mode>0</Mode>
      </request>
    </SearchHotelServices>
  </soap:Body>
</soap:Envelope>`;

            console.log('Sending Raw XML:', rawXml);

            const res = await fetch('/api/solvex/iservice/integrationservice.asmx', {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/xml; charset=utf-8',
                    'SOAPAction': '"http://www.megatec.ru/SearchHotelServices"'
                },
                body: rawXml
            });

            const text = await res.text();
            console.log('Raw Response:', text);

            if (text.includes("SearchHotelServicesResult") && !text.includes("<SearchHotelServicesResult />")) {
                // Hacky parser to count hotels
                const count = (text.match(/<Hotel>/g) || []).length;
                updateTestResult(testId, 'SearchHotels', 'success', `RAW XML SUCCESS! Found approx ${count} hotels. Check console for full XML.`);
            } else {
                updateTestResult(testId, 'SearchHotels', 'error', `Raw XML returned empty/error. Response length: ${text.length}`);
            }

        } catch (error) {
            updateTestResult(testId, 'SearchHotels', 'error', error instanceof Error ? error.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCheckConnect = async () => {
        if (!authToken) {
            updateTestResult('check-' + Date.now(), 'CheckConnect', 'error', 'No token available. Connect first.');
            return;
        }

        const testId = 'check-' + Date.now();
        setIsLoading(true);
        updateTestResult(testId, 'CheckConnect', 'pending', 'Checking connection status...');

        try {
            const response = await SolvexAuth.checkConnect(authToken);
            if (response.success) {
                const isActive = response.data;
                updateTestResult(testId, 'CheckConnect', isActive ? 'success' : 'error', isActive ? 'Connection is active' : 'Connection is not active');
            } else {
                updateTestResult(testId, 'CheckConnect', 'error', response.error || 'Check failed');
            }
        } catch (error) {
            updateTestResult(testId, 'CheckConnect', 'error', error instanceof Error ? error.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
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

    const handleClearToken = () => {
        SolvexAuth.clearToken();
        setAuthToken(null);
        updateTestResult('clear-' + Date.now(), 'ClearToken', 'success', 'Token cache cleared');
    };

    return (
        <div className="solvex-test-container">
            <header className="test-header">
                <button className="back-btn" onClick={() => navigate('/dashboard')}>
                    <ArrowLeft size={20} />
                    Back to Dashboard
                </button>
                <div className="header-content">
                    <h1><Database size={32} /> Solvex API Test</h1>
                    <p>Testing SOAP integration with Solvex (Master-Interlook)</p>
                </div>
            </header>

            <div className="test-content">
                <div className="test-section">
                    <div className="section-header">
                        <Key size={24} />
                        <h2>Authentication</h2>
                    </div>
                    <div className="token-display">
                        <label>Current Token:</label>
                        <div className="token-value">
                            {authToken ? (
                                <>
                                    <CheckCircle2 size={16} className="success-icon" />
                                    <code>{authToken}</code>
                                </>
                            ) : (
                                <>
                                    <XCircle size={16} className="error-icon" />
                                    <span>No token</span>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="button-group">
                        <button className="test-btn primary" onClick={handleConnect} disabled={isLoading}>
                            {isLoading ? <Loader2 className="spin" size={18} /> : <Key size={18} />}
                            Connect
                        </button>
                        <button className="test-btn secondary" onClick={handleCheckConnect} disabled={isLoading || !authToken}>
                            Check Connection
                        </button>
                        <button className="test-btn secondary" onClick={handleRefreshToken} disabled={isLoading}>
                            Refresh Token
                        </button>
                        <button className="test-btn danger" onClick={handleClearToken} disabled={!authToken}>
                            Clear Token
                        </button>
                    </div>
                </div>

                <div className="test-section">
                    <div className="section-header">
                        <Book size={24} />
                        <h2>Data & Search</h2>
                    </div>
                    <div className="button-group">
                        <button className="test-btn primary" onClick={handleGetCountries} disabled={isLoading}>
                            <Book size={18} />
                            Get Countries
                        </button>
                        <button className="test-btn primary" onClick={handleGetCities} disabled={isLoading}>
                            <Book size={18} />
                            Get Cities (Bulgaria)
                        </button>
                        <button className="test-btn primary" onClick={handleSearchTest} disabled={isLoading}>
                            <SearchIcon size={18} />
                            Test Search (Bansko)
                        </button>
                    </div>
                    <div className="data-preview">
                        <label>Countries Found: {countries.length}</label>
                        {countries.length > 0 && (
                            <div className="mini-list" style={{ marginTop: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                                {countries.slice(0, 10).map(c => (
                                    <div key={c.id} className="mini-item" style={{ fontSize: '12px', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                                        {c.name} ({c.code}) - ID: {c.id}
                                    </div>
                                ))}
                                {countries.length > 10 && <div className="mini-item">... and {countries.length - 10} more</div>}
                            </div>
                        )}
                    </div>
                </div>

                <div className="test-section">
                    <div className="section-header">
                        <h2>Test Results</h2>
                        <button className="clear-results-btn" onClick={() => setTestResults([])}>Clear</button>
                    </div>
                    <div className="results-list">
                        {testResults.length === 0 ? (
                            <div className="no-results">
                                <p>No tests run yet. Click a button above to start testing.</p>
                            </div>
                        ) : (
                            testResults.map((result) => (
                                <div key={result.id} className={`result-item ${result.status}`}>
                                    <div className="result-header">
                                        {result.status === 'success' && <CheckCircle2 size={20} />}
                                        {result.status === 'error' && <XCircle size={20} />}
                                        {result.status === 'pending' && <Loader2 className="spin" size={20} />}
                                        <span className="result-test">{result.test}</span>
                                        <button
                                            className="inspect-btn"
                                            onClick={() => {
                                                const debugOut = document.querySelector('.debug-output');
                                                if (debugOut) debugOut.textContent = result.message;
                                            }}
                                            style={{ marginLeft: 'auto', marginRight: '10px', fontSize: '10px', padding: '2px 5px', cursor: 'pointer' }}
                                        >
                                            Inspect
                                        </button>
                                        <span className="result-time">{result.timestamp}</span>
                                    </div>
                                    <div className="result-message">{result.message}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="test-section info-section">
                    <h3>API Configuration</h3>
                    <div className="info-grid">
                        <div className="info-item">
                            <label>Base URL (Local Proxy):</label>
                            <code>{import.meta.env.VITE_SOLVEX_API_URL || '/api/solvex/iservice/integrationservice.asmx'}</code>
                        </div>
                        <div className="info-item">
                            <label>Login:</label>
                            <code>{import.meta.env.VITE_SOLVEX_LOGIN || 'sol611s'}</code>
                        </div>
                        <div className="info-item">
                            <label>Environment:</label>
                            <code>Test</code>
                        </div>
                    </div>
                </div>
                {/* Debug Info */}
                <div className="test-section debug-section" style={{ marginTop: '20px' }}>
                    <div className="section-header">
                        <h2>Raw Debug Output</h2>
                    </div>
                    <div className="debug-output" style={{
                        background: '#000',
                        color: '#0f0',
                        padding: '15px',
                        borderRadius: '8px',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        maxHeight: '300px',
                        overflow: 'auto',
                        border: '1px solid #333'
                    }}>
                        {testResults.length > 0 ? (
                            testResults.map((r, i) => (
                                <div key={i} style={{ marginBottom: '10px', borderBottom: '1px solid #222', paddingBottom: '5px' }}>
                                    <strong>[{r.timestamp}] {r.test}:</strong>
                                    <pre style={{ whiteSpace: 'pre-wrap', margin: '5px 0' }}>{r.message}</pre>
                                </div>
                            ))
                        ) : (
                            <div style={{ color: '#666' }}>No debug data yet...</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Rate Limit Monitor */}
            <RateLimitMonitor />
        </div>
    );
};

export default SolvexTest;
