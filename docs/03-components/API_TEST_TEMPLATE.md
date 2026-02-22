# 🎨 Unified API Test Template - Documentation

**Created:** 2026-01-25  
**Purpose:** Consistent design for all API test pages

---

## 📋 Overview

The `APITestTemplate` component provides a unified, consistent design for all API test pages in Olympic Hub. It ensures:

- ✅ **Uniform layout** across all API test pages
- ✅ **Theme support** (dark/light mode using CSS variables)
- ✅ **Color indicators** (unique color square for each API)
- ✅ **Responsive design**
- ✅ **Consistent UX**

---

## 🎯 Features

### 1. **Header with Color Indicator**
- API name and subtitle
- Color square in top-right corner (unique per API)
- Provider, protocol, and auth type info

### 2. **Configuration Section**
- Display API configuration
- Boolean badges (YES/NO)
- Text values

### 3. **Test Sections**
- Organized by category (Auth, Content, Search, etc.)
- Grid layout for test buttons
- Icons for each section

### 4. **Results Display**
- Loading state with spinner
- Success state (green)
- Error state (red)
- Clear button

---

## 🚀 Usage

### Basic Example:

```typescript
import { APITestTemplate, APITestSection } from '../components/APITestTemplate';

const MyAPITest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const sections: APITestSection[] = [
    {
      id: 'auth',
      title: 'Authentication Tests',
      icon: '🔐',
      tests: [
        {
          id: 'test-connection',
          label: 'Test Connection',
          onClick: () => runTest('Test Connection', testConnectionFn),
        },
      ],
    },
  ];

  return (
    <APITestTemplate
      apiName="My API - Test Suite"
      provider="Provider Name"
      protocol="REST/JSON"
      authType="Bearer"
      accentColor="#667eea"  // Unique color for this API
      sections={sections}
      loading={loading}
      result={result}
      error={error}
      onClearResults={() => {
        setResult(null);
        setError(null);
      }}
    />
  );
};
```

---

## 🎨 API Colors

Each API has a unique accent color for the indicator square:

| API | Color | Hex Code |
|-----|-------|----------|
| **Solvex** | Pink | `#e91e63` |
| **OpenGreece** | Green | `#43a047` |
| **TCT** | Orange | `#fb8c00` |
| **ORS** | Purple | `#9c27b0` |
| **Mars** | Red | `#dc2626` |
| **Amadeus** | Blue | `#667eea` |

---

## 📦 Props

### `APITestTemplateProps`

```typescript
interface APITestTemplateProps {
  // Header
  apiName: string;           // e.g., "Mars API V1 - Test Suite"
  provider: string;          // e.g., "Neolab"
  protocol: string;          // e.g., "REST/JSON"
  authType: string;          // e.g., "Basic"
  accentColor: string;       // e.g., "#dc2626"
  
  // Configuration (optional)
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
```

### `APITestSection`

```typescript
interface APITestSection {
  id: string;              // Unique section ID
  title: string;           // Section title
  icon: ReactNode;         // Emoji or icon component
  tests: APITest[];        // Array of tests
}
```

### `APITest`

```typescript
interface APITest {
  id: string;              // Unique test ID
  label: string;           // Button label
  description?: string;    // Tooltip description
  onClick: () => void;     // Test function
  disabled?: boolean;      // Disable button
}
```

---

## 🎨 Theme Variables

The template uses CSS variables for theme support:

```css
--bg-main          /* Main background */
--bg-card          /* Card background */
--border           /* Border color */
--text-primary     /* Primary text */
--text-secondary   /* Secondary text */
--accent           /* Accent color (buttons) */
```

These variables automatically adapt to dark/light mode.

---

## 📁 Files

```
src/
├── components/
│   ├── APITestTemplate.tsx     ← Template component
│   └── APITestTemplate.css     ← Template styles
└── pages/
    ├── MarsTest.tsx            ← Example usage
    ├── OrsTest.tsx             ← To be refactored
    ├── SolvexTest.tsx          ← To be refactored
    ├── TCTTest.tsx             ← To be refactored
    └── AmadeusTest.tsx         ← To be refactored
```

---

## 🔄 Migration Guide

### Step 1: Import Template

```typescript
import { APITestTemplate, APITestSection } from '../components/APITestTemplate';
```

### Step 2: Define Sections

```typescript
const sections: APITestSection[] = [
  {
    id: 'auth',
    title: 'Authentication Tests',
    icon: '🔐',
    tests: [
      {
        id: 'test-1',
        label: 'Test Connection',
        onClick: () => runTest('Test', testFn),
      },
    ],
  },
];
```

### Step 3: Use Template

```typescript
return (
  <APITestTemplate
    apiName="Your API"
    provider="Provider"
    protocol="REST/JSON"
    authType="Bearer"
    accentColor="#your-color"
    sections={sections}
    loading={loading}
    result={result}
    error={error}
  />
);
```

---

## ✅ Benefits

1. **Consistency** - All test pages look the same
2. **Maintainability** - Update once, apply everywhere
3. **Theme Support** - Automatic dark/light mode
4. **Responsive** - Works on all screen sizes
5. **Accessible** - Proper ARIA labels and keyboard navigation

---

## 🎯 Next Steps

### Refactor Existing Test Pages:
- [ ] OrsTest.tsx
- [ ] SolvexTest.tsx
- [ ] TCTTest.tsx
- [ ] AmadeusTest.tsx
- [ ] OpenGreeceTest.tsx

### Each should use:
- APITestTemplate component
- Unique accent color
- Organized test sections
- Consistent configuration display

---

**Status:** ✅ Template created and Mars API migrated!  
**Next:** Refactor remaining test pages for consistency
