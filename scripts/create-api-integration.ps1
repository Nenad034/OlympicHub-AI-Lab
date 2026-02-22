# 🚀 Create API Integration Script
# Automatski kreira strukturu za novu API integraciju

param(
    [Parameter(Mandatory=$true)]
    [string]$ApiName,
    
    [Parameter(Mandatory=$false)]
    [string]$BaseUrl = "",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("REST", "GraphQL", "SOAP", "WebSocket")]
    [string]$Protocol = "REST",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("Basic", "Bearer", "OAuth2", "APIKey")]
    [string]$AuthType = "Bearer"
)

# Colors
$ColorSuccess = "Green"
$ColorInfo = "Cyan"
$ColorWarning = "Yellow"
$ColorError = "Red"

Write-Host "`n🚀 Creating API Integration for: $ApiName" -ForegroundColor $ColorInfo
Write-Host "Protocol: $Protocol" -ForegroundColor $ColorInfo
Write-Host "Auth Type: $AuthType" -ForegroundColor $ColorInfo
Write-Host ""

# Convert API name to different formats
$apiNameLower = $ApiName.ToLower()
$apiNameUpper = $ApiName.ToUpper()
$apiNamePascal = (Get-Culture).TextInfo.ToTitleCase($apiNameLower)
$apiNameCamel = $apiNameLower.Substring(0,1).ToLower() + $apiNamePascal.Substring(1)

Write-Host "📝 Name formats:" -ForegroundColor $ColorInfo
Write-Host "  - Lower: $apiNameLower" -ForegroundColor Gray
Write-Host "  - Upper: $apiNameUpper" -ForegroundColor Gray
Write-Host "  - Pascal: $apiNamePascal" -ForegroundColor Gray
Write-Host "  - Camel: $apiNameCamel" -ForegroundColor Gray
Write-Host ""

# Base paths
$basePath = Get-Location
$srcPath = Join-Path $basePath "src"
$servicesPath = Join-Path $srcPath "services"
$componentsPath = Join-Path $srcPath "components"
$typesPath = Join-Path $srcPath "types"
$supabasePath = Join-Path $basePath "supabase"
$functionsPath = Join-Path $supabasePath "functions"
$docsPath = Join-Path $basePath "docs"

# ============================================
# STEP 1: Create Directory Structure
# ============================================

Write-Host "📁 Creating directory structure..." -ForegroundColor $ColorInfo

$directories = @(
    (Join-Path $componentsPath $apiNameLower),
    (Join-Path $functionsPath "$apiNameLower-proxy")
)

foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "  ✅ Created: $dir" -ForegroundColor $ColorSuccess
    } else {
        Write-Host "  ⚠️  Already exists: $dir" -ForegroundColor $ColorWarning
    }
}

# ============================================
# STEP 2: Create Real API Service
# ============================================

Write-Host "`n💻 Creating Real API Service..." -ForegroundColor $ColorInfo

$realApiContent = @"
/**
 * $apiNameUpper API Service - Real Implementation
 * 
 * VAŽNO: Ova verzija NE sadrži API kredencijale!
 * Svi pozivi idu kroz Edge Function koja ima kredencijale na serveru.
 */

import { supabase } from '../supabaseClient';

const EDGE_FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL
  ? ``${import.meta.env.VITE_SUPABASE_URL}/functions/v1``
  : 'http://localhost:54321/functions/v1';

/**
 * Helper funkcija za pozivanje Edge Function-a
 */
const callEdgeFunction = async (functionName: string, body: any) => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    throw new Error('Not authenticated. Please login first.');
  }

  const response = await fetch(``${EDGE_FUNCTIONS_URL}/${functionName}``, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': ``Bearer ${session.access_token}``,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }

  return response.json();
};

/**
 * Primer funkcije - Prilagodite za vaš API
 */
export const searchItems = async (params: {
  query: string;
  limit?: number;
}) => {
  try {
    const data = await callEdgeFunction('$apiNameLower-proxy', {
      action: 'search',
      params,
    });
    
    return {
      data,
      error: null,
      success: true,
    };
  } catch (error) {
    console.error('$apiNameUpper API Error:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false,
    };
  }
};

// Export API object
export const ${apiNameCamel}Api = {
  searchItems,
  // TODO: Dodajte ostale funkcije...
};

export default ${apiNameCamel}Api;
"@

$realApiPath = Join-Path $servicesPath "${apiNameCamel}ApiService.ts"
Set-Content -Path $realApiPath -Value $realApiContent -Encoding UTF8
Write-Host "  ✅ Created: ${apiNameCamel}ApiService.ts" -ForegroundColor $ColorSuccess

# ============================================
# STEP 3: Create Mock API Service
# ============================================

Write-Host "`n🎭 Creating Mock API Service..." -ForegroundColor $ColorInfo

$mockApiContent = @"
/**
 * $apiNameUpper Mock API Service
 * Simulira API odgovore za development
 */

const mockDelay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

const mockResponse = <T>(data: T) => ({
  data,
  error: null,
  success: true,
});

/**
 * Mock podaci
 */
const mockItems = [
  { id: '1', name: 'Item 1', description: 'Description 1', price: 100 },
  { id: '2', name: 'Item 2', description: 'Description 2', price: 200 },
  { id: '3', name: 'Item 3', description: 'Description 3', price: 300 },
];

/**
 * Mock search funkcija
 */
export const searchItems = async (params: {
  query: string;
  limit?: number;
}) => {
  await mockDelay();

  const filtered = mockItems.filter(item =>
    item.name.toLowerCase().includes(params.query.toLowerCase())
  );

  const limited = params.limit ? filtered.slice(0, params.limit) : filtered;

  return mockResponse(limited);
};

// Export Mock API object
export const ${apiNameCamel}MockApi = {
  searchItems,
  // TODO: Dodajte ostale funkcije...
};

export default ${apiNameCamel}MockApi;
"@

$mockApiPath = Join-Path $servicesPath "${apiNameCamel}MockService.ts"
Set-Content -Path $mockApiPath -Value $mockApiContent -Encoding UTF8
Write-Host "  ✅ Created: ${apiNameCamel}MockService.ts" -ForegroundColor $ColorSuccess

# ============================================
# STEP 4: Create Unified API
# ============================================

Write-Host "`n🔄 Creating Unified API..." -ForegroundColor $ColorInfo

$unifiedApiContent = @"
/**
 * Unified $apiNameUpper API
 * Automatski bira između Mock i Real API-ja
 */

import ${apiNameCamel}ApiService from './${apiNameCamel}ApiService';
import ${apiNameCamel}MockService from './${apiNameCamel}MockService';

const useMock = import.meta.env.VITE_${apiNameUpper}_USE_MOCK === 'true';

console.log(``🔌 $apiNameUpper API: Using ${useMock ? 'MOCK' : 'REAL'} service``);

export const ${apiNameCamel}Api = useMock ? ${apiNameCamel}MockService : ${apiNameCamel}ApiService;

export default ${apiNameCamel}Api;
"@

$unifiedApiPath = Join-Path $servicesPath "${apiNameCamel}Api.ts"
Set-Content -Path $unifiedApiPath -Value $unifiedApiContent -Encoding UTF8
Write-Host "  ✅ Created: ${apiNameCamel}Api.ts" -ForegroundColor $ColorSuccess

# ============================================
# STEP 5: Create TypeScript Types
# ============================================

Write-Host "`n📝 Creating TypeScript Types..." -ForegroundColor $ColorInfo

$typesContent = @"
/**
 * $apiNameUpper API Types
 */

export interface ${apiNamePascal}Item {
  id: string;
  name: string;
  description: string;
  price: number;
}

export interface ${apiNamePascal}SearchParams {
  query: string;
  limit?: number;
}

export interface ${apiNamePascal}SearchResponse {
  items: ${apiNamePascal}Item[];
  total: number;
}

export interface ${apiNamePascal}ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}
"@

$typesFilePath = Join-Path $typesPath "${apiNameLower}.ts"
Set-Content -Path $typesFilePath -Value $typesContent -Encoding UTF8
Write-Host "  ✅ Created: ${apiNameLower}.ts (types)" -ForegroundColor $ColorSuccess

# ============================================
# STEP 6: Create Edge Function
# ============================================

Write-Host "`n🛡️ Creating Edge Function..." -ForegroundColor $ColorInfo

$edgeFunctionContent = @"
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Verify user authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Verify Supabase token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Get API credentials from environment (SERVER-SIDE ONLY!)
    const API_KEY = Deno.env.get('${apiNameUpper}_API_KEY')
    const API_SECRET = Deno.env.get('${apiNameUpper}_API_SECRET')

    if (!API_KEY) {
      return new Response(
        JSON.stringify({ error: 'API credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. Parse request
    const requestBody = await req.json()

    // 5. Call real API with server-side credentials
    // TODO: Prilagodite URL i headers za vaš API
    const apiResponse = await fetch('$BaseUrl/endpoint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': ``Bearer ${API_KEY}``,
      },
      body: JSON.stringify(requestBody),
    })

    const apiData = await apiResponse.json()

    // 6. Return response
    return new Response(
      JSON.stringify(apiData),
      {
        status: apiResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
"@

$edgeFunctionPath = Join-Path (Join-Path $functionsPath "$apiNameLower-proxy") "index.ts"
Set-Content -Path $edgeFunctionPath -Value $edgeFunctionContent -Encoding UTF8
Write-Host "  ✅ Created: $apiNameLower-proxy/index.ts" -ForegroundColor $ColorSuccess

# ============================================
# STEP 7: Create Test UI Component
# ============================================

Write-Host "`n🎨 Creating Test UI Component..." -ForegroundColor $ColorInfo

$testComponentContent = @"
import React, { useState } from 'react';
import ${apiNameCamel}Api from '../../services/${apiNameCamel}Api';
import './${apiNamePascal}ConnectionTest.css';

export const ${apiNamePascal}ConnectionTest: React.FC = () => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const testResults: any[] = [];

    // Test 1: Search
    try {
      const result = await ${apiNameCamel}Api.searchItems({ query: 'test', limit: 10 });
      testResults.push({
        name: 'Search Items',
        status: result.success ? 'success' : 'error',
        data: result.data,
        error: result.error,
      });
    } catch (error) {
      testResults.push({
        name: 'Search Items',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    setResults(testResults);
    setLoading(false);
  };

  return (
    <div className="${apiNameLower}-connection-test">
      <h2>$apiNameUpper Connection Test</h2>
      
      <button onClick={runTests} disabled={loading}>
        {loading ? 'Testing...' : 'Run Tests'}
      </button>

      <div className="results">
        {results.map((result, index) => (
          <div key={index} className={``result ${result.status}``}>
            <h3>{result.name}</h3>
            <p>Status: {result.status}</p>
            {result.data && <pre>{JSON.stringify(result.data, null, 2)}</pre>}
            {result.error && <p className="error">{result.error}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ${apiNamePascal}ConnectionTest;
"@

$testComponentPath = Join-Path (Join-Path $componentsPath $apiNameLower) "${apiNamePascal}ConnectionTest.tsx"
Set-Content -Path $testComponentPath -Value $testComponentContent -Encoding UTF8
Write-Host "  ✅ Created: ${apiNamePascal}ConnectionTest.tsx" -ForegroundColor $ColorSuccess

# Create CSS
$testCssContent = @"
.${apiNameLower}-connection-test {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.${apiNameLower}-connection-test h2 {
  margin-bottom: 20px;
}

.${apiNameLower}-connection-test button {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  margin-bottom: 20px;
}

.${apiNameLower}-connection-test button:hover {
  background-color: #0056b3;
}

.${apiNameLower}-connection-test button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.results {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.result {
  padding: 15px;
  border-radius: 8px;
  border: 2px solid #ddd;
}

.result.success {
  border-color: #28a745;
  background-color: #d4edda;
}

.result.error {
  border-color: #dc3545;
  background-color: #f8d7da;
}

.result h3 {
  margin-top: 0;
}

.result pre {
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
}

.result .error {
  color: #dc3545;
  font-weight: bold;
}
"@

$testCssPath = Join-Path (Join-Path $componentsPath $apiNameLower) "${apiNamePascal}ConnectionTest.css"
Set-Content -Path $testCssPath -Value $testCssContent -Encoding UTF8
Write-Host "  ✅ Created: ${apiNamePascal}ConnectionTest.css" -ForegroundColor $ColorSuccess

# ============================================
# STEP 8: Update .env.example
# ============================================

Write-Host "`n⚙️  Updating .env.example..." -ForegroundColor $ColorInfo

$envExamplePath = Join-Path $basePath ".env.example"
$envContent = Get-Content $envExamplePath -Raw

if ($envContent -notmatch "VITE_${apiNameUpper}_USE_MOCK") {
    $newEnvContent = @"

# $apiNameUpper API Configuration
VITE_${apiNameUpper}_USE_MOCK=true
VITE_${apiNameUpper}_BASE_URL=https://api.$apiNameLower.com
"@
    Add-Content -Path $envExamplePath -Value $newEnvContent
    Write-Host "  ✅ Updated .env.example" -ForegroundColor $ColorSuccess
} else {
    Write-Host "  ⚠️  .env.example already contains $apiNameUpper configuration" -ForegroundColor $ColorWarning
}

# ============================================
# STEP 9: Create Documentation
# ============================================

Write-Host "`n📚 Creating Documentation..." -ForegroundColor $ColorInfo

$docContent = @"
# $apiNameUpper API Integration

## 📋 Pregled

Integracija sa $apiNameUpper API-jem.

## 🔑 Kredencijali

### Development:
``````bash
VITE_${apiNameUpper}_USE_MOCK=true
VITE_${apiNameUpper}_BASE_URL=$BaseUrl
``````

### Production (Supabase Secrets):
``````bash
${apiNameUpper}_API_KEY=your-api-key
${apiNameUpper}_API_SECRET=your-api-secret
``````

## 🚀 Korišćenje

``````typescript
import ${apiNameCamel}Api from './services/${apiNameCamel}Api';

const result = await ${apiNameCamel}Api.searchItems({
  query: 'test',
  limit: 10
});
``````

## 📝 TODO

- [ ] Implementirati sve endpointe
- [ ] Dodati validaciju
- [ ] Dodati error handling
- [ ] Kreirati dokumentaciju
- [ ] Deploy Edge Function
- [ ] Testirati sa pravim API-jem

## 📚 Dokumentacija

- API Dokumentacija: $BaseUrl/docs
- Support: support@$apiNameLower.com

---

**Kreirano:** $(Get-Date -Format "yyyy-MM-dd")  
**Status:** U razvoju
"@

$docPath = Join-Path $docsPath "${apiNameUpper}_INTEGRATION.md"
Set-Content -Path $docPath -Value $docContent -Encoding UTF8
Write-Host "  ✅ Created: ${apiNameUpper}_INTEGRATION.md" -ForegroundColor $ColorSuccess

# ============================================
# SUMMARY
# ============================================

Write-Host "`n" -NoNewline
Write-Host "=" -NoNewline -ForegroundColor $ColorSuccess
Write-Host "=".PadRight(60, '=') -ForegroundColor $ColorSuccess
Write-Host "✅ API Integration Created Successfully!" -ForegroundColor $ColorSuccess
Write-Host "=" -NoNewline -ForegroundColor $ColorSuccess
Write-Host "=".PadRight(60, '=') -ForegroundColor $ColorSuccess

Write-Host "`n📁 Created Files:" -ForegroundColor $ColorInfo
Write-Host "  Services:" -ForegroundColor Gray
Write-Host "    - ${apiNameCamel}ApiService.ts (Real API)" -ForegroundColor White
Write-Host "    - ${apiNameCamel}MockService.ts (Mock API)" -ForegroundColor White
Write-Host "    - ${apiNameCamel}Api.ts (Unified API)" -ForegroundColor White
Write-Host "  Types:" -ForegroundColor Gray
Write-Host "    - ${apiNameLower}.ts" -ForegroundColor White
Write-Host "  Components:" -ForegroundColor Gray
Write-Host "    - ${apiNamePascal}ConnectionTest.tsx" -ForegroundColor White
Write-Host "    - ${apiNamePascal}ConnectionTest.css" -ForegroundColor White
Write-Host "  Edge Function:" -ForegroundColor Gray
Write-Host "    - $apiNameLower-proxy/index.ts" -ForegroundColor White
Write-Host "  Documentation:" -ForegroundColor Gray
Write-Host "    - ${apiNameUpper}_INTEGRATION.md" -ForegroundColor White

Write-Host "`n🎯 Next Steps:" -ForegroundColor $ColorInfo
Write-Host "  1. Update .env file:" -ForegroundColor White
Write-Host "     VITE_${apiNameUpper}_USE_MOCK=true" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Implement API functions in:" -ForegroundColor White
Write-Host "     src/services/${apiNameCamel}ApiService.ts" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Add mock data in:" -ForegroundColor White
Write-Host "     src/services/${apiNameCamel}MockService.ts" -ForegroundColor Gray
Write-Host ""
Write-Host "  4. Deploy Edge Function:" -ForegroundColor White
Write-Host "     cd supabase/functions" -ForegroundColor Gray
Write-Host "     supabase functions deploy $apiNameLower-proxy" -ForegroundColor Gray
Write-Host ""
Write-Host "  5. Set Supabase secrets:" -ForegroundColor White
Write-Host "     supabase secrets set ${apiNameUpper}_API_KEY=your-key" -ForegroundColor Gray
Write-Host "     supabase secrets set ${apiNameUpper}_API_SECRET=your-secret" -ForegroundColor Gray
Write-Host ""
Write-Host "  6. Add route in router/index.tsx:" -ForegroundColor White
Write-Host "     /$apiNameLower-test -> ${apiNamePascal}ConnectionTest" -ForegroundColor Gray

Write-Host "`n✅ Done!" -ForegroundColor $ColorSuccess
Write-Host ""
"@

$scriptPath = Join-Path $basePath "scripts\create-api-integration.ps1"

# Create scripts directory if it doesn't exist
$scriptsDir = Join-Path $basePath "scripts"
if (!(Test-Path $scriptsDir)) {
    New-Item -ItemType Directory -Path $scriptsDir -Force | Out-Null
}

Set-Content -Path $scriptPath -Value $scriptContent -Encoding UTF8
Write-Host "✅ Created: scripts/create-api-integration.ps1" -ForegroundColor Green
