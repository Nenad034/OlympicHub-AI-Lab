# Olympic Hub - Architecture Documentation

> **Version:** 1.0.0  
> **Last Updated:** 2025-12-29

---

## 📖 Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Directory Structure](#directory-structure)
4. [State Management](#state-management)
5. [Routing Architecture](#routing-architecture)
6. [Component Architecture](#component-architecture)
7. [Data Flow](#data-flow)
8. [Security Model](#security-model)
9. [Performance Optimizations](#performance-optimizations)
10. [Deployment](#deployment)

---

## System Overview

Olympic Hub is a modern ERP (Enterprise Resource Planning) system designed for tourism agencies. It provides comprehensive management of:

- 🏨 **Properties** - Hotels, apartments, villas
- 👥 **Customers** - Customer database and CRM
- 🤝 **Suppliers** - Partner management
- 📊 **Analytics** - Business intelligence
- 🤖 **AI Assistant** - Gemini-powered chat

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  Router  │  │  Stores  │  │   Hooks  │  │ Services │    │
│  │(React    │  │(Zustand) │  │ (Custom) │  │  (API)   │    │
│  │ Router)  │  │          │  │          │  │          │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    COMPONENTS                        │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌────────┐ │    │
│  │  │ Layout  │  │  Pages  │  │ Modules │  │   UI   │ │    │
│  │  └─────────┘  └─────────┘  └─────────┘  └────────┘ │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      SUPABASE                                │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Database │  │   Auth   │  │ Storage  │  │Realtime  │    │
│  │(Postgres)│  │  (JWT)   │  │ (Files)  │  │  (WS)    │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                         │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │ Gemini   │  │  Vercel  │  │  GitHub  │                   │
│  │   AI     │  │ (Deploy) │  │  (SCM)   │                   │
│  └──────────┘  └──────────┘  └──────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.x | UI Framework |
| TypeScript | 5.x | Type Safety |
| Vite | 7.x | Build Tool |
| React Router | 7.x | Routing |
| Zustand | 5.x | State Management |
| Framer Motion | 11.x | Animations |
| Lucide React | 0.x | Icons |

### Backend

| Technology | Purpose |
|------------|---------|
| Supabase | Database, Auth, Storage |
| PostgreSQL | Relational Database |
| Edge Functions | Serverless Functions |

### AI/ML

| Technology | Purpose |
|------------|---------|
| Google Gemini | AI Assistant |
| Vision API | Image Analysis |

### DevOps

| Technology | Purpose |
|------------|---------|
| Vercel | Deployment |
| GitHub Actions | CI/CD |
| ESLint | Code Quality |

---

## Directory Structure

```
olympichub034/
├── docs/                      # Documentation
│   ├── API.md                 # API documentation
│   └── ARCHITECTURE.md        # This file
│
├── public/                    # Static assets
│
├── src/
│   ├── components/            # Reusable components
│   │   ├── layout/            # Layout components
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopBar.tsx
│   │   │   └── HorizontalNav.tsx
│   │   ├── ui/                # UI primitives
│   │   │   ├── Skeleton.tsx
│   │   │   └── Toast.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── GeneralAIChat.tsx
│   │   └── PropertyWizard.tsx
│   │
│   ├── constants/             # App constants
│   │   └── index.ts
│   │
│   ├── context/               # React context
│   │   └── ConfigContext.tsx
│   │
│   ├── hooks/                 # Custom hooks
│   │   ├── useTheme.ts
│   │   ├── useNavigation.ts
│   │   └── useLocalStorage.ts
│   │
│   ├── modules/               # Feature modules
│   │   ├── production/        # Production management
│   │   │   ├── ProductionHub.tsx
│   │   │   ├── Suppliers.tsx
│   │   │   └── Customers.tsx
│   │   └── system/            # System modules
│   │       ├── Settings.tsx
│   │       ├── Katana.tsx
│   │       └── DeepArchive.tsx
│   │
│   ├── pages/                 # Route pages
│   │   ├── Dashboard.tsx
│   │   ├── HotelsList.tsx
│   │   ├── HotelDetail.tsx
│   │   ├── HotelEdit.tsx
│   │   └── SupplierDetail.tsx
│   │
│   ├── router/                # Router configuration
│   │   └── index.tsx
│   │
│   ├── services/              # API services
│   │   └── api.ts
│   │
│   ├── stores/                # Zustand stores
│   │   ├── authStore.ts
│   │   ├── themeStore.ts
│   │   └── appStore.ts
│   │
│   ├── types/                 # TypeScript types
│   │   └── property.types.ts
│   │
│   ├── utils/                 # Utility functions
│   │   ├── storageUtils.ts
│   │   ├── securityUtils.ts
│   │   └── exportUtils.ts
│   │
│   ├── App.tsx                # Root component
│   ├── main.tsx               # Entry point
│   └── index.css              # Global styles
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── TODO_LIST.md
```

---

## State Management

### Zustand Stores

We use Zustand for global state management with persistence.

#### Auth Store

```typescript
// src/stores/authStore.ts
interface AuthState {
  userLevel: number;
  userName: string;
  permissions: string[];
  setUserLevel: (level: number) => void;
  hasPermission: (permission: string) => boolean;
}
```

#### Theme Store

```typescript
// src/stores/themeStore.ts
interface ThemeState {
  theme: 'dark' | 'light' | 'cream' | 'navy';
  isPrism: boolean;
  lang: 'sr' | 'en';
  navMode: 'sidebar' | 'horizontal';
  isSidebarCollapsed: boolean;
  // Actions
  setTheme: (theme: Theme) => void;
  cycleTheme: () => void;
  togglePrism: () => void;
}
```

#### App Store

```typescript
// src/stores/appStore.ts
interface AppState {
  appStatus: { gitPushed: boolean; vercelLive: boolean };
  isChatOpen: boolean;
  searchQuery: string;
  // Actions
  toggleChat: () => void;
  setSearchQuery: (query: string) => void;
}
```

### State Flow

```
User Action → Zustand Store → React Re-render → UI Update
                    ↓
             localStorage (persist)
```

---

## Routing Architecture

### Route Structure

```typescript
// Flat routes
/                               → Dashboard
/mars-analysis                  → Mars Analysis

// Nested routes (Production)
/production                     → Production Hub
/production/hotels              → Hotels List
/production/hotels/:slug        → Hotel Detail
/production/hotels/:slug/edit   → Edit Hotel ✨ NEW
/production/hotels/new          → Create Hotel

// Nested routes (Suppliers)
/suppliers                      → Suppliers List
/suppliers/:supplierId          → Supplier Detail ✨ NEW

// Nested routes (Other)
/customers                      → Customers List
/settings                       → Settings
/katana                         → Task Manager

// Protected routes (Level 6+)
/deep-archive                   → Deep Archive
/fortress                       → Security Fortress
```

### Route Protection

```tsx
const ProtectedRoute = ({ children, minLevel }) => {
  const { userLevel } = useAuthStore();
  
  if (userLevel < minLevel) {
    return <AccessDenied />;
  }
  
  return children;
};
```

### Lazy Loading

All routes use React.lazy() for code splitting:

```tsx
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const HotelDetail = React.lazy(() => import('./pages/HotelDetail'));
```

---

## Component Architecture

### Component Hierarchy

```
App
├── ErrorBoundary
│   └── ToastProvider
│       └── ConfigProvider
│           └── RouterProvider
│               └── MainLayout
│                   ├── Sidebar / HorizontalNav
│                   ├── TopBar
│                   └── <Outlet /> (Page Content)
│                       ├── Dashboard
│                       ├── ProductionHub
│                       ├── HotelsList
│                       ├── HotelDetail
│                       └── ...
```

### Component Types

1. **Layout Components** - Structure (Sidebar, TopBar)
2. **Page Components** - Full pages (Dashboard, HotelDetail)
3. **Module Components** - Feature logic (ProductionHub)
4. **UI Components** - Reusable primitives (Skeleton, Toast)

---

## Data Flow

### API Request Flow

```
Component → Hook/Action → API Service → Supabase → PostgreSQL
                              ↓
                          Cache Layer
                              ↓
                          Response
```

### Caching Strategy

```typescript
// API responses are cached for 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

// Cache invalidation on mutations
await api.properties.create(newProperty);
clearCache('properties'); // Invalidate list cache
```

---

## Security Model

### User Levels

| Level | Access |
|-------|--------|
| 1-2 | Read only |
| 3-4 | CRUD operations |
| 5 | + Reports & Analytics |
| 6 | + System config, Delete |

### Security Measures

1. **Input Sanitization** - All inputs sanitized via `securityUtils.ts`
2. **Row Level Security** - PostgreSQL RLS policies
3. **API Key Encryption** - Sensitive keys encrypted in Supabase
4. **Protected Routes** - Frontend route guards
5. **Audit Logging** - Activity tracked in `activity_log` table

---

## Performance Optimizations

### Implemented

- ✅ Lazy loading for all routes
- ✅ Code splitting per module
- ✅ API response caching
- ✅ Zustand persist middleware
- ✅ Suspense boundaries

### Planned

- ⏳ Virtual scrolling for large lists
- ⏳ Image optimization (WebP)
- ⏳ Service Worker caching
- ⏳ React Query for data fetching

---

## Deployment

### Vercel Configuration

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Environment Variables

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GEMINI_API_KEY=your-gemini-key (⚠️ move to backend)
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build
      - run: npm run lint
```

---

## Further Reading

- [API Documentation](./API.md)
- [TODO List](../TODO_LIST.md)
- [Contributing Guide](./CONTRIBUTING.md)

---

*Olympic Hub - Built for Olympic Travel*
