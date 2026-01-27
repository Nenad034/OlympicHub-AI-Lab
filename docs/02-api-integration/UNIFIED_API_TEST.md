# Unified API Test Template

## Overview
Sve API test stranice koriste **UnifiedAPITest** komponentu za konzistentan UI/UX.

## Struktura

```
UnifiedAPITest Component
├── Header (API name, provider, description)
├── Connection Status Card
│   ├── Status Badge (Connected/Disconnected)
│   ├── Token Display
│   └── Quick Actions (Connect/Disconnect/Refresh)
├── Tabs
│   ├── 🧪 API Tests (custom test buttons)
│   ├── ⚙️ Configuration (endpoints, credentials)
│   └── 🛡️ Rate Limiting (live monitoring)
└── Test Results Feed
```

## Kako Kreirati Novu API Test Stranicu

### 1. Kreiraj Novu Stranicu

```typescript
import React, { useState } from 'react';
import { YourIcon } from 'lucide-react';
import UnifiedAPITest from '../components/UnifiedAPITest';
import type { TestResult, APITestConfig } from '../components/UnifiedAPITest';

const YourAPITest: React.FC = () => {
    const [authToken, setAuthToken] = useState<string | null>(null);
    const [testResults, setTestResults] = useState<TestResult[]>([]);
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');

    // Konfiguracija
    const config: APITestConfig = {
        name: 'Your API Name',
        provider: 'Provider Company',
        description: 'What this API does',
        icon: <YourIcon size={32} />,
        color: 'linear-gradient(135deg, #color1 0%, #color2 100%)',
        baseUrl: 'https://api.example.com',
        environment: 'Production',
        credentials: {
            username: 'your_username',
            apiKey: 'your_key'
        }
    };

    // Helper za test rezultate
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

    // Handler za konekciju
    const handleConnect = async () => {
        setConnectionStatus('connecting');
        // ... your API call
        setConnectionStatus('connected');
    };

    const handleDisconnect = () => {
        setAuthToken(null);
        setConnectionStatus('disconnected');
    };

    // Custom test funkcije
    const handleYourTest = async () => {
        const testId = 'test-' + Date.now();
        updateTestResult(testId, 'Your Test', 'pending', 'Running test...');
        
        try {
            // ... your test logic
            updateTestResult(testId, 'Your Test', 'success', 'Test passed!');
        } catch (error) {
            updateTestResult(testId, 'Your Test', 'error', error.message);
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
            {/* Custom Test Buttons */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button className="action-btn primary" onClick={handleYourTest}>
                    Your Test
                </button>
            </div>
        </UnifiedAPITest>
    );
};

export default YourAPITest;
```

### 2. Dodaj Rutu

U `src/router/index.tsx`:

```typescript
const YourAPITest = React.lazy(() => import('../pages/YourAPITest'));

// U routes array:
{
    path: 'your-api-test',
    element: <YourAPITest />,
}
```

### 3. Dodaj u API Connections Hub

U `src/pages/APIConnectionsHub.tsx`:

```typescript
{
    id: 'your-api',
    name: 'Your API Name',
    provider: 'Provider',
    description: 'Description',
    icon: <YourIcon size={32} />,
    status: 'active',
    color: '#yourcolor',
    testPath: '/your-api-test',
    features: ['Feature 1', 'Feature 2']
}
```

## Postojeće Implementacije

### Solvex
- **Fajl**: `src/pages/SolvexTestUnified.tsx`
- **Ruta**: `/solvex-test`
- **Features**: Connect, Get Cities, Search Hotels

### OpenGreece
- **Fajl**: `src/pages/OpenGreeceTest.tsx`
- **Ruta**: `/opengreece-test`
- **Features**: Test Push, Hotel Search

## Stilizovanje

### Dostupne CSS Klase

```css
.action-btn.primary   /* Plavi dugmad */
.action-btn.secondary /* Sivi dugmad */
.action-btn.danger    /* Crveni dugmad */
```

### Custom Sekcije

Možete dodati custom sekcije unutar `children`:

```typescript
<UnifiedAPITest {...props}>
    {/* Test Buttons */}
    <div className="test-actions">
        <button className="action-btn primary">Test 1</button>
    </div>

    {/* Custom Info Box */}
    <div style={{
        marginTop: '20px',
        padding: '16px',
        background: 'rgba(67, 160, 71, 0.1)',
        borderRadius: '12px'
    }}>
        ℹ️ Custom information here
    </div>
</UnifiedAPITest>
```

## Props Reference

### APITestConfig
```typescript
{
    name: string;           // API naziv
    provider: string;       // Kompanija provajdera
    description: string;    // Opis funkcionalnosti
    icon: ReactNode;        // Lucide ikona
    color: string;          // Gradient boja
    baseUrl: string;        // API endpoint
    environment: string;    // 'Production' | 'Evaluation' | 'Test'
    credentials?: {
        username?: string;
        password?: string;
        apiKey?: string;
    };
}
```

### UnifiedAPITestProps
```typescript
{
    config: APITestConfig;
    connectionStatus: 'connected' | 'disconnected' | 'connecting';
    authToken?: string | null;
    testResults: TestResult[];
    onConnect: () => void;
    onDisconnect: () => void;
    onRefreshToken?: () => void;  // Opciono
    children: ReactNode;           // Custom test buttons
}
```

## Best Practices

1. **Konzistentni Nazivi**: Koristite isti naziv u `config.name`, kartici na Hub-u, i ruti
2. **Error Handling**: Uvek catch-ujte greške i prikazujte ih u test results
3. **Loading States**: Koristite `isLoading` state za disable dugmadi tokom testova
4. **Timestamp**: Test rezultati automatski dobijaju timestamp
5. **Rate Limiting**: Monitoring tab automatski prikazuje rate limit status

## Troubleshooting

### Problem: Test rezultati se ne prikazuju
**Rešenje**: Proverite da li pozivate `updateTestResult` sa ispravnim parametrima

### Problem: Connection status ne menja boju
**Rešenje**: Proverite da li state `connectionStatus` ima ispravne vrednosti: 'connected', 'disconnected', ili 'connecting'

### Problem: Rate Limiting tab je prazan
**Rešenje**: Proverite da li je API registrovan u `src/utils/rateLimiter.ts`
