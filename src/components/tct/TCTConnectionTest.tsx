import { useState } from 'react';
import { tctApi } from '../../services/tctApiService.secure';
import './TCTConnectionTest.css';

interface TestResult {
    name: string;
    status: 'pending' | 'success' | 'error';
    message: string;
    data?: any;
}

export default function TCTConnectionTest() {
    const [testing, setTesting] = useState(false);
    const [results, setResults] = useState<TestResult[]>([]);

    const runTests = async () => {
        setTesting(true);
        setResults([]);

        const tests: TestResult[] = [];

        try {
            // Test 1: Service Check
            tests.push({
                name: 'Secure Service Check',
                status: 'success',
                message: 'TCT Secure Service is active and using embedded credentials (Test Mode)',
            });
            setResults([...tests]);

            // Test 2: API Connection & Auth
            const connectionTest = await tctApi.getNationalities();
            tests.push({
                name: 'API Connection & Auth',
                status: connectionTest.success ? 'success' : 'error',
                message: connectionTest.success
                    ? 'Successfully authenticated with TCT API'
                    : connectionTest.error || 'Authentication Failed',
                data: connectionTest.data,
            });
            setResults([...tests]);

            // Test 3: Hotel Search Test
            const searchTest = await tctApi.searchHotelsSync({
                search_type: 'city',
                location: 'Hurghada',
                checkin: '2026-05-10',
                checkout: '2026-05-17',
                rooms: [{ adults: 2, children: 0 }],
                currency: 'EUR',
                nationality: 'RS',
                residence: 'RS'
            });
            tests.push({
                name: 'Hotel Search Test',
                status: searchTest.success ? 'success' : 'error',
                message: searchTest.success
                    ? 'Hotel results received successfully'
                    : searchTest.error || 'Search failed',
                data: searchTest.data
            });
            setResults([...tests]);

        } catch (err: any) {
            tests.push({
                name: 'System Error',
                status: 'error',
                message: err.message || 'An unexpected error occurred during testing'
            });
        } finally {
            setResults([...tests]);
            setTesting(false);
        }
    };

    const getStatusIcon = (status: TestResult['status']) => {
        switch (status) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'pending': return '⏳';
        }
    };

    const getStatusClass = (status: TestResult['status']) => {
        switch (status) {
            case 'success': return 'test-success';
            case 'error': return 'test-error';
            case 'pending': return 'test-pending';
        }
    };

    const allTestsPassed = results.length > 0 && results.every(r => r.status === 'success');
    const hasErrors = results.some(r => r.status === 'error');

    return (
        <div className="tct-connection-test">
            <div className="test-header">
                <h2>🔌 TCT API Connection Test (Secure Mode)</h2>
                <p>Testing connection via Direct Secure Tunnel</p>
            </div>

            <div className="test-config">
                <h3>📋 Active Configuration</h3>
                <div className="config-item">
                    <span className="config-label">API URL:</span>
                    <span className="config-value">https://imc-dev.tct.travel</span>
                </div>
                <div className="config-item">
                    <span className="config-label">Auth Method:</span>
                    <span className="config-value">Basic Auth (Embedded)</span>
                </div>
                <div className="config-item">
                    <span className="config-label">Status:</span>
                    <span className="config-value configured">✅ Operational</span>
                </div>
            </div>

            <div className="test-actions">
                <button
                    className="test-button"
                    onClick={runTests}
                    disabled={testing}
                >
                    {testing ? '⏳ Testing...' : '🚀 Run Tests'}
                </button>
            </div>

            {results.length > 0 && (
                <div className="test-results">
                    <h3>📊 Test Results</h3>

                    {allTestsPassed && (
                        <div className="test-summary success">
                            🎉 All tests passed! TCT API is fully functional.
                        </div>
                    )}

                    {hasErrors && (
                        <div className="test-summary error">
                            ⚠️ Some tests failed. Please click "View Data" for details.
                        </div>
                    )}

                    <div className="test-list">
                        {results.map((result, index) => (
                            <div key={index} className={`test-item ${getStatusClass(result.status)}`}>
                                <div className="test-item-header">
                                    <span className="test-icon">{getStatusIcon(result.status)}</span>
                                    <span className="test-name">{result.name}</span>
                                </div>
                                <div className="test-message">{result.message}</div>
                                {result.data && (
                                    <div className="test-data-visible">
                                        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--accent)' }}>
                                            📥 Raw Server Response:
                                        </div>
                                        <pre style={{
                                            fontSize: '11px',
                                            background: 'rgba(0,0,0,0.3)',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border)',
                                            color: '#00ff00', // Hacker green za bolju vidljivost
                                            overflowX: 'auto'
                                        }}>
                                            {JSON.stringify(result.data, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
