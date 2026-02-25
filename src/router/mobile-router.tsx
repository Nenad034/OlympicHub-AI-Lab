import React, { Suspense } from 'react';
import { createHashRouter, RouterProvider, Outlet, Navigate } from 'react-router-dom';
import { MobileHeader, MobileBottomNav } from '../components/layout/MobileLayoutComponents';
import { useAuthStore } from '../stores';

// Lazy loaded mobile-aware pages
const Dashboard = React.lazy(() => import('../pages/Dashboard'));
const SmartSearch = React.lazy(() => import('../pages/SmartSearch'));
const ReservationsDashboard = React.lazy(() => import('../pages/ReservationsDashboard'));
const B2BFinance = React.lazy(() => import('../pages/B2BFinance'));
const Settings = React.lazy(() => import('../modules/system/Settings'));
const Login = React.lazy(() => import('../pages/Login'));

const MobileLayout: React.FC = () => {
    return (
        <div className="mobile-app-container">
            <MobileHeader />
            <main className="mobile-main-content" style={{ paddingBottom: '90px' }}>
                <Suspense fallback={<div className="loading">Učitavanje...</div>}>
                    <Outlet />
                </Suspense>
            </main>
            <MobileBottomNav />
        </div>
    );
};

const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { userLevel } = useAuthStore();
    if (userLevel === 0) return <Navigate to="/login" replace />;
    return <>{children}</>;
};

const router = createHashRouter([
    {
        path: '/login',
        element: <Suspense><Login /></Suspense>
    },
    {
        path: '/',
        element: <AuthGuard><MobileLayout /></AuthGuard>,
        children: [
            {
                index: true,
                element: <Dashboard />
            },
            {
                path: 'smart-search',
                element: <SmartSearch />
            },
            {
                path: 'reservations',
                element: <ReservationsDashboard />
            },
            {
                path: 'finance',
                element: <B2BFinance />
            },
            {
                path: 'settings',
                element: <Settings onBack={() => { }} lang="sr" userLevel={6} setUserLevel={() => { }} />
            }
        ]
    }
]);

export const MobileRouter: React.FC = () => {
    return <RouterProvider router={router} />;
};
