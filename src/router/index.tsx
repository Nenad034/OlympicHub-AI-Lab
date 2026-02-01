import React from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';

// Layout Components
import { Sidebar, TopBar, HorizontalNav } from '../components/layout';

// Page Components - Lazy loaded for performance
const Dashboard = React.lazy(() => import('../pages/Dashboard'));
const HotelsList = React.lazy(() => import('../pages/HotelsList'));
const HotelDetail = React.lazy(() => import('../pages/HotelDetail'));
const HotelEdit = React.lazy(() => import('../pages/HotelEdit'));
const HotelNew = React.lazy(() => import('../pages/HotelNew'));
const HotelRooms = React.lazy(() => import('../pages/HotelRooms'));
const HotelPrices = React.lazy(() => import('../pages/HotelPrices'));
const SupplierDetail = React.lazy(() => import('../pages/SupplierDetail'));
const CustomerDetail = React.lazy(() => import('../pages/CustomerDetail'));


const MarsAnalysis = React.lazy(() => import('../modules/production/MarsAnalysis'));
const ProductionHub = React.lazy(() => import('../modules/production/ProductionHub'));
const SuppliersModule = React.lazy(() => import('../modules/production/Suppliers'));
const CustomersModule = React.lazy(() => import('../modules/production/Customers'));
const SettingsModule = React.lazy(() => import('../modules/system/Settings'));
const DeepArchive = React.lazy(() => import('../modules/system/DeepArchive'));
const Katana = React.lazy(() => import('../modules/system/Katana'));
const Fortress = React.lazy(() => import('../modules/system/Fortress'));
const PricingIntelligence = React.lazy(() => import('../modules/pricing/PricingIntelligence'));
const TotalTripSearch = React.lazy(() => import('../modules/pricing/TotalTripSearch'));
const OlympicMail = React.lazy(() => import('../modules/mail/OlympicMail'));
const NotificationCenter = React.lazy(() => import('../modules/system/NotificationCenter'));
const MasterOrchestrator = React.lazy(() => import('../modules/ai/MasterOrchestrator'));
const TCTConnectionTest = React.lazy(() => import('../components/tct/TCTConnectionTest'));
const TCTDashboard = React.lazy(() => import('../components/tct/TCTDashboard'));
const AIWatchdogDashboard = React.lazy(() => import('../components/watchdog/AIWatchdogDashboard'));
const OpenGreeceTest = React.lazy(() => import('../pages/OpenGreeceTest'));
const OpenGreeceSearch = React.lazy(() => import('../pages/OpenGreeceSearch'));
const OpenGreeceDetail = React.lazy(() => import('../pages/OpenGreeceDetail'));
const GlobalHubSearch = React.lazy(() => import('../pages/GlobalHubSearch'));
const FlightSearch = React.lazy(() => import('../pages/FlightSearch'));
const FlightBooking = React.lazy(() => import('../pages/FlightBooking'));
const PackageBuilder = React.lazy(() => import('../pages/PackageBuilder'));
const PackageSearch = React.lazy(() => import('../pages/PackageSearch'));
const PackageCreated = React.lazy(() => import('../pages/PackageCreated'));
const Login = React.lazy(() => import('../pages/Login'));
const BookingForm = React.lazy(() => import('../pages/BookingForm'));
const SolvexTest = React.lazy(() => import('../pages/SolvexTestUnified'));
const SolvexHotelDetail = React.lazy(() => import('../pages/SolvexHotelDetail'));
const OrsTest = React.lazy(() => import('../pages/OrsTest'));
const MarsTest = React.lazy(() => import('../pages/MarsTest'));
const SoftZoneDashboard = React.lazy(() => import('../components/SoftZoneDashboard'));
const SmartSearch = React.lazy(() => import('../pages/SmartSearch'));
const ReservationArchitect = React.lazy(() => import('../pages/ReservationArchitect'));
const ReservationsDashboard = React.lazy(() => import('../pages/ReservationsDashboard'));
const AdminHotelImport = React.lazy(() => import('../pages/AdminHotelImport'));
const APIConnectionsHub = React.lazy(() => import('../pages/APIConnectionsHub'));
const AmadeusTest = React.lazy(() => import('../pages/AmadeusTest'));
const TCTTest = React.lazy(() => import('../pages/TCTTest'));
const MasterSearch = React.lazy(() => import('../pages/MasterSearch'));
const SubagentAdmin = React.lazy(() => import('../pages/SubagentAdmin'));
const B2BSearch = React.lazy(() => import('../pages/B2BSearch'));
const HotelView = React.lazy(() => import('../pages/HotelView'));


// Stores
import { useThemeStore, useAuthStore } from '../stores';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

// Loading fallback
const LoadingFallback = () => (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg-main)',
        color: 'var(--text-secondary)'
    }}>
        <div className="loading-spinner">Učitavanje...</div>
    </div>
);

// Auth Guard for global protection
const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { userLevel } = useAuthStore();
    const location = useLocation();

    if (userLevel === 0) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

// Main Layout Component - Switches between Modern and Classic
const MainLayout: React.FC = () => {
    // HARD OVERRIDE: Uvek ClassicLayout, cak i ako je u store-u 'modern'
    return (
        <React.Suspense fallback={<LoadingFallback />}>
            <ClassicLayout />
        </React.Suspense>
    );
};

// Classic Layout Component (Fallback)
const ClassicLayout: React.FC = () => {
    const { navMode } = useThemeStore();

    return (
        <div className={`hub-container ${navMode}-mode`}>
            {/* If horizontal mode, show menu at the very top, outside main-content */}
            {navMode === 'horizontal' && <HorizontalNav />}

            {/* Sidebar - only if navMode is sidebar */}
            {navMode === 'sidebar' && <Sidebar />}

            {/* Main Content Area */}
            <main className="main-content">
                <TopBar />

                <section className="fade-in">
                    <React.Suspense fallback={<LoadingFallback />}>
                        <Outlet />
                    </React.Suspense>
                </section>
            </main>
        </div>
    );
};

// Protected Route wrapper for level-based access
interface ProtectedRouteProps {
    children: React.ReactNode;
    minLevel: number;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, minLevel }) => {
    const { userLevel } = useAuthStore();

    if (userLevel < minLevel) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '50vh',
                gap: '20px',
                color: 'var(--text-secondary)'
            }}>
                <h2 style={{ color: 'var(--accent)' }}>🔒 Pristup Odbijen</h2>
                <p>Potreban je nivo {minLevel} za pristup ovom modulu.</p>
                <p>Vaš trenutni nivo: {userLevel}</p>
            </div>
        );
    }

    return <>{children}</>;
};

// Helper component to use hooks for MasterOrchestrator
const OrchestratorPage: React.FC = () => {
    const navigate = useNavigate();
    const { userLevel } = useAuthStore();
    return <MasterOrchestrator onBack={() => navigate('/')} userLevel={userLevel} />;
};

// Create router configuration with nested routes
export const router = createBrowserRouter([
    {
        path: '/login',
        element: (
            <React.Suspense fallback={<LoadingFallback />}>
                <Login />
            </React.Suspense>
        ),
    },
    {
        path: '/reservation-architect',
        element: (
            <AuthGuard>
                <React.Suspense fallback={<LoadingFallback />}>
                    <ReservationArchitect />
                </React.Suspense>
            </AuthGuard>
        ),
        errorElement: (
            <div style={{ padding: '20px', color: 'white', background: '#1a1a2e', height: '100vh' }}>
                <h1>Greška u učitavanju forme za rezervaciju</h1>
                <p>Molimo osvežite stranicu ili kontaktirajte podršku.</p>
                <button onClick={() => window.location.reload()}>Osveži</button>
            </div>
        )
    },
    {
        path: '/',
        element: (
            <AuthGuard>
                <MainLayout />
            </AuthGuard>
        ),
        children: [
            // Dashboard
            {
                index: true,
                element: <Dashboard />,
            },
            {
                path: 'mars-analysis',
                element: <MarsAnalysis onBack={() => window.history.back()} lang="sr" userLevel={6} onOpenChat={() => { }} onDataUpdate={() => { }} />,
            },
            {
                path: 'production',
                children: [
                    {
                        index: true,
                        element: <ProductionHub onBack={() => window.history.back()} />,
                    },
                    {
                        path: 'hotels',
                        element: <HotelsList />,
                    },
                    {
                        path: 'hotels/new',
                        element: <HotelNew />,
                    },
                    {
                        path: 'hotels/:hotelSlug',
                        element: <HotelDetail />,
                    },
                    {
                        path: 'hotels/:hotelSlug/edit',
                        element: <HotelEdit />,
                    },
                    {
                        path: 'hotels/:hotelSlug/rooms',
                        element: <HotelRooms />,
                    },
                    {
                        path: 'hotels/:hotelSlug/prices',
                        element: <HotelPrices />,
                    },
                ],
            },
            {
                path: 'suppliers',
                children: [
                    {
                        index: true,
                        element: <SuppliersModule onBack={() => window.history.back()} />,
                    },
                    {
                        path: ':supplierId',
                        element: <SupplierDetail />,
                    },
                ],
            },
            {
                path: 'customers',
                children: [
                    {
                        index: true,
                        element: <CustomersModule onBack={() => window.history.back()} />,
                    },
                    {
                        path: ':customerId',
                        element: <CustomerDetail />,
                    },
                ],
            },
            {
                path: 'settings',
                element: <SettingsModule onBack={() => window.history.back()} lang="sr" userLevel={6} setUserLevel={() => { }} />,
            },
            {
                path: 'katana',
                element: <Katana onBack={() => window.history.back()} />,
            },
            {
                path: 'deep-archive',
                element: (
                    <ProtectedRoute minLevel={6}>
                        <DeepArchive onBack={() => window.history.back()} lang="sr" />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'fortress',
                element: (
                    <ProtectedRoute minLevel={6}>
                        <Fortress onBack={() => window.history.back()} />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'pricing-intelligence',
                element: <PricingIntelligence />,
            },
            {
                path: 'total-trip',
                element: <TotalTripSearch />,
            },
            {
                path: 'mail',
                element: <OlympicMail />,
            },
            {
                path: 'notifications',
                element: <NotificationCenter />,
            },
            {
                path: 'orchestrator',
                element: (
                    <ProtectedRoute minLevel={6}>
                        <OrchestratorPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'tct',
                element: <TCTDashboard />,
            },
            {
                path: 'watchdog',
                element: <AIWatchdogDashboard />,
            },
            {
                path: 'hub',
                element: <GlobalHubSearch />,
            },
            {
                path: 'b2b-search',
                element: <B2BSearch />,
            },
            {
                path: 'smart-search',
                element: <SmartSearch />,
            },
            {
                path: 'my-reservations',
                element: <ReservationsDashboard />,
            },
            {
                path: 'flights',
                element: <FlightSearch />,
            },
            {
                path: 'booking',
                element: <FlightBooking />,
            },
            {
                path: 'packages',
                element: <PackageBuilder />,
            },
            {
                path: 'packages/search',
                element: <PackageSearch />,
            },
            {
                path: 'packages/created',
                element: <PackageCreated />,
            },
            {
                path: 'opengreece-test',
                element: <OpenGreeceTest />,
            },
            {
                path: 'opengreece-search',
                element: <OpenGreeceSearch />,
            },
            {
                path: 'opengreece-hotel/:hotelCode',
                element: <OpenGreeceDetail />,
            },
            {
                path: 'solvex-test',
                element: <SolvexTest />,
            },
            {
                path: 'ors-test',
                element: <OrsTest />,
            },
            {
                path: 'mars-test',
                element: <MarsTest />,
            },
            {
                path: 'solvex-hotel/:id',
                element: <SolvexHotelDetail />,
            },
            {
                path: 'booking/:source/:hotelCode',
                element: <BookingForm />,
            },
            {
                path: 'soft-zone',
                element: <SoftZoneDashboard />,
            },
            {
                path: 'smart-search',
                element: <SmartSearch />,
            },
            {
                path: 'reservations',
                element: <ReservationsDashboard />,
            },
            {
                path: 'admin/import',
                element: <AdminHotelImport />,
            },
            {
                path: 'api-connections',
                element: <APIConnectionsHub />,
            },
            {
                path: 'amadeus-test',
                element: <AmadeusTest />,
            },
            {
                path: 'tct-test',
                element: <TCTTest />,
            },
            {
                path: 'master-search',
                element: <MasterSearch />,
            },
            {
                path: 'subagent-admin',
                element: (
                    <ProtectedRoute minLevel={6}>
                        <SubagentAdmin />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'hotel-view/:hotelId',
                element: <HotelView />,
            },
            {
                path: '*',
                element: <Navigate to="/" replace />,
            },
        ],
        errorElement: (
            <div style={{
                padding: '40px',
                textAlign: 'center',
                background: '#1a1a2e',
                color: 'white',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'sans-serif'
            }}>
                <h1 style={{ fontSize: '4rem', margin: '0', color: '#ff9800' }}>404 / Greška</h1>
                <p style={{ fontSize: '1.5rem', opacity: 0.8 }}>Došlo je do neočekivane greške ili stranica ne postoji.</p>
                <div style={{ marginTop: '20px', display: 'flex', gap: '15px' }}>
                    <button
                        onClick={() => window.location.href = '/'}
                        style={{
                            padding: '12px 24px',
                            background: '#ff9800',
                            border: 'none',
                            borderRadius: '5px',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        Vrati se na Početnu
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '12px 24px',
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '5px',
                            color: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        Osveži stranicu
                    </button>
                </div>
            </div>
        )
    },
]);

// Router Provider Component
export const AppRouter: React.FC = () => {
    return <RouterProvider router={router} />;
};

export default AppRouter;

