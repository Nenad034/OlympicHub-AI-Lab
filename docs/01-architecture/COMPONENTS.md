# Olympic Hub - Component Documentation

> **Version:** 1.0.0  
> **Last Updated:** 2025-12-29

---

## 📚 Table of Contents

1. [Layout Components](#layout-components)
2. [UI Components](#ui-components)
3. [Pages](#pages)
4. [Hooks](#hooks)
5. [Stores](#stores)

---

## Layout Components

### Sidebar

**Location:** `src/components/layout/Sidebar.tsx`

Navigation sidebar with module links and user profile.

```tsx
import { Sidebar } from '@/components/layout';

// Automatically included in MainLayout when navMode === 'sidebar'
```

**Features:**
- Collapsible mode
- Active route highlighting
- User level badge
- Module icons with labels

---

### TopBar

**Location:** `src/components/layout/TopBar.tsx`

Header with search, theme controls, and status indicators.

```tsx
import { TopBar } from '@/components/layout';

// Automatically included in MainLayout
```

**Features:**
- Global search
- Theme switcher (4 themes)
- Language toggle (SR/EN)
- Navigation mode toggle
- Git/Vercel status indicators

---

### HorizontalNav

**Location:** `src/components/layout/HorizontalNav.tsx`

Alternative horizontal navigation bar.

```tsx
import { HorizontalNav } from '@/components/layout';

// Shown when navMode === 'horizontal'
```

---

## UI Components

### ErrorBoundary

**Location:** `src/components/ErrorBoundary.tsx`

Catches React errors and displays fallback UI.

```tsx
import ErrorBoundary from '@/components/ErrorBoundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>

// With custom fallback
<ErrorBoundary fallback={<CustomError />}>
  <YourComponent />
</ErrorBoundary>
```

**Features:**
- Retry button
- Go to home button
- Error details (dev mode only)

---

### Toast Notifications

**Location:** `src/components/ui/Toast.tsx`

Toast notification system.

```tsx
import { useToast } from '@/components/ui';

function MyComponent() {
  const { success, error, warning, info } = useToast();
  
  // Show success toast
  success('Uspešno sačuvano!', 'Podaci su ažurirani.');
  
  // Show error toast
  error('Greška', 'Nije moguće učitati podatke.');
  
  // Show warning toast
  warning('Upozorenje', 'Istekla vam je sesija.');
  
  // Show info toast
  info('Info', 'Nova verzija dostupna.');
}
```

**Props (addToast):**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| type | `'success' \| 'error' \| 'warning' \| 'info'` | required | Toast type |
| title | `string` | required | Toast title |
| message | `string` | - | Optional message |
| duration | `number` | 5000 | Auto-dismiss time (ms) |

---

### Skeleton Loaders

**Location:** `src/components/ui/Skeleton.tsx`

Loading placeholder components.

```tsx
import { 
  Skeleton, 
  CardSkeleton, 
  TableRowSkeleton,
  ProfileSkeleton,
  DashboardSkeleton,
  ListSkeleton,
  TextSkeleton 
} from '@/components/ui';

// Basic skeleton
<Skeleton width={200} height={20} />

// Card skeleton (for module cards)
<CardSkeleton />

// Dashboard grid skeleton
<DashboardSkeleton count={6} />

// List skeleton
<ListSkeleton rows={5} />

// Table row skeleton
<TableRowSkeleton columns={5} />

// Profile skeleton
<ProfileSkeleton />

// Text/paragraph skeleton
<TextSkeleton lines={3} />
```

**Skeleton Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| width | `string \| number` | '100%' | Width |
| height | `string \| number` | '20px' | Height |
| borderRadius | `string \| number` | '8px' | Border radius |

---

## Pages

### Dashboard

**Location:** `src/pages/Dashboard.tsx`  
**Route:** `/`

Main dashboard showing all modules.

**Features:**
- Module grid
- Quick actions
- Statistics widgets
- Draggable module ordering

---

### HotelsList

**Location:** `src/pages/HotelsList.tsx`  
**Route:** `/production/hotels`

Hotel inventory management.

**Features:**
- Grid/List view toggle
- Search filtering
- Status toggle
- Cloud sync status

---

### HotelDetail

**Location:** `src/pages/HotelDetail.tsx`  
**Route:** `/production/hotels/:hotelSlug`

Individual hotel management.

**Features:**
- Tabbed interface (Overview, Rooms, Prices, Photos, Settings)
- Breadcrumb navigation
- Quick stats
- Amenities display

---

## Hooks

### useTheme

**Location:** `src/hooks/useTheme.ts`

Theme management hook.

```tsx
import { useTheme } from '@/hooks';

function MyComponent() {
  const { theme, setTheme, cycleTheme, isPrism, togglePrism } = useTheme();
  
  // Change theme
  setTheme('dark');
  
  // Cycle to next theme
  cycleTheme();
  
  // Toggle prism mode
  togglePrism();
}
```

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| theme | `'dark' \| 'light' \| 'cream' \| 'navy'` | Current theme |
| setTheme | `(theme) => void` | Set specific theme |
| cycleTheme | `() => void` | Cycle to next theme |
| isPrism | `boolean` | Prism mode active |
| togglePrism | `() => void` | Toggle prism mode |

---

### useNavigation

**Location:** `src/hooks/useNavigation.ts`

Navigation utilities hook.

```tsx
import { useNavigation } from '@/hooks';

function MyComponent() {
  const { 
    goBack, 
    goHome, 
    goTo, 
    isActive, 
    getCurrentModule,
    currentPath 
  } = useNavigation();
  
  // Navigate back
  goBack();
  
  // Go to dashboard
  goHome();
  
  // Navigate to path
  goTo('/production/hotels');
  
  // Check if route is active
  if (isActive('/production')) {
    // ...
  }
  
  // Get current module
  const module = getCurrentModule(); // 'production', 'suppliers', etc.
}
```

---

### useLocalStorage

**Location:** `src/hooks/useLocalStorage.ts`

localStorage with React state and cross-tab sync.

```tsx
import { useLocalStorage } from '@/hooks';

function MyComponent() {
  const [value, setValue, removeValue] = useLocalStorage('my-key', 'default');
  
  // Update value
  setValue('new value');
  
  // Update with callback
  setValue(prev => prev + 1);
  
  // Remove from storage
  removeValue();
}
```

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| key | `string` | localStorage key |
| initialValue | `T` | Default value |

**Returns:** `[T, (value: T) => void, () => void]`

---

## Stores

### authStore

**Location:** `src/stores/authStore.ts`

User authentication state.

```tsx
import { useAuthStore } from '@/stores';

function MyComponent() {
  const { 
    userLevel, 
    userName, 
    setUserLevel, 
    hasPermission 
  } = useAuthStore();
  
  // Check user level
  if (userLevel >= 6) {
    // Master admin access
  }
  
  // Check specific permission
  if (hasPermission('delete_property')) {
    // Show delete button
  }
  
  // Update user level
  setUserLevel(5);
}
```

---

### themeStore

**Location:** `src/stores/themeStore.ts`

Theme and UI preferences.

```tsx
import { useThemeStore } from '@/stores';

function MyComponent() {
  const { 
    theme, 
    setTheme,
    isPrism,
    togglePrism,
    lang,
    setLang,
    navMode,
    setNavMode,
    isSidebarCollapsed,
    toggleSidebar
  } = useThemeStore();
}
```

---

### appStore

**Location:** `src/stores/appStore.ts`

Global application state.

```tsx
import { useAppStore } from '@/stores';

function MyComponent() {
  const { 
    appStatus, 
    isChatOpen, 
    toggleChat,
    searchQuery,
    setSearchQuery
  } = useAppStore();
  
  // Check deploy status
  if (appStatus.vercelLive) {
    // Show green indicator
  }
  
  // Toggle AI chat
  toggleChat();
}
```

---

## Component Best Practices

### 1. Import Patterns

```tsx
// ✅ Good - use index exports
import { Sidebar, TopBar } from '@/components/layout';
import { useTheme, useNavigation } from '@/hooks';
import { useAuthStore, useThemeStore } from '@/stores';

// ❌ Bad - direct file imports
import Sidebar from '@/components/layout/Sidebar';
```

### 2. Error Handling

```tsx
// Always wrap async operations
try {
  await api.properties.create(data);
  toast.success('Uspešno kreirano!');
} catch (error) {
  toast.error('Greška', error.message);
}
```

### 3. Loading States

```tsx
// Use skeletons for loading
if (loading) {
  return <DashboardSkeleton count={6} />;
}

return <Dashboard data={data} />;
```

### 4. Route Protection

```tsx
// Use ProtectedRoute for sensitive pages
<Route 
  path="/admin" 
  element={
    <ProtectedRoute minLevel={6}>
      <AdminPanel />
    </ProtectedRoute>
  } 
/>
```

---

## Further Reading

- [API Documentation](./API.md)
- [Architecture](./ARCHITECTURE.md)

---

*Olympic Hub Component Library*
