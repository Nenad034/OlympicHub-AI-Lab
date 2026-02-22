/**
 * Unified API Test Template
 * 
 * Consistent design for all API test pages
 */

import React, { type ReactNode } from 'react';
import './APITestTemplate.css';

export interface APITestSection {
    id: string;
    title: string;
    icon: ReactNode;
    tests: APITest[];
}

export interface APITest {
    id: string;
    label: string;
    description?: string;
    onClick: () => void;
    disabled?: boolean;
}

export interface APITestTemplateProps {
    // Header
    apiName: string;
    provider: string;
    protocol: string;
    authType: string;
    accentColor: string; // Boja za API (za kvadrat u ćošku)

    // Configuration section (optional)
    configItems?: {
        label: string;
        value: string | boolean;
        type?: 'text' | 'boolean';
    }[];

    // Test sections
    sections: APITestSection[];

    // Results
    loading?: boolean;
    result?: any;
    error?: string | null;

    // Actions
    onClearResults?: () => void;
}

export const APITestTemplate: React.FC<APITestTemplateProps> = ({
    apiName,
    provider,
    protocol,
    authType,
    accentColor,
    configItems,
    sections,
    loading,
    result,
    error,
    onClearResults,
}) => {
    return (
        <div className="api-test-template">
            {/* Header with color indicator */}
            <div className="api-test-header">
                <div className="header-content">
                    <div className="header-text">
                        <h1>{apiName}</h1>
                        <p className="header-subtitle">
                            Provider: {provider} | Protocol: {protocol} | Auth: {authType}
                        </p>
                    </div>
                    {/* Color indicator square */}
                    <div
                        className="api-color-indicator"
                        style={{ backgroundColor: accentColor }}
                        title={`${apiName} - ${accentColor}`}
                    />
                </div>
            </div>

            {/* Configuration Section */}
            {configItems && configItems.length > 0 && (
                <div className="api-test-section">
                    <h2 className="section-title">
                        <span className="section-icon">⚙️</span>
                        Configuration
                    </h2>
                    <div className="config-grid">
                        {configItems.map((item, idx) => (
                            <div key={idx} className="config-item">
                                <span className="config-label">{item.label}:</span>
                                {item.type === 'boolean' ? (
                                    <span className={`config-badge ${item.value ? 'active' : 'inactive'}`}>
                                        {item.value ? 'YES' : 'NO'}
                                    </span>
                                ) : (
                                    <span className="config-value">{item.value}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Test Sections */}
            {sections.map((section) => (
                <div key={section.id} className="api-test-section">
                    <h2 className="section-title">
                        <span className="section-icon">{section.icon}</span>
                        {section.title}
                    </h2>
                    <div className="test-buttons-grid">
                        {section.tests.map((test) => (
                            <button
                                key={test.id}
                                className="test-button"
                                onClick={test.onClick}
                                disabled={test.disabled || loading}
                                title={test.description}
                            >
                                {test.label}
                            </button>
                        ))}
                    </div>
                </div>
            ))}

            {/* Results Section */}
            {(loading || result || error) && (
                <div className="api-test-section">
                    <div className="section-header">
                        <h2 className="section-title">
                            <span className="section-icon">📊</span>
                            Results
                        </h2>
                        {onClearResults && (
                            <button className="clear-button" onClick={onClearResults}>
                                Clear
                            </button>
                        )}
                    </div>

                    {loading && (
                        <div className="result-loading">
                            <div className="spinner" />
                            <p>Running test...</p>
                        </div>
                    )}

                    {error && !loading && (
                        <div className="result-error">
                            <h3>❌ Error</h3>
                            <pre>{error}</pre>
                        </div>
                    )}

                    {result && !loading && !error && (
                        <div className="result-success">
                            <h3>✅ Success</h3>
                            <pre>{JSON.stringify(result, null, 2)}</pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default APITestTemplate;
